/**
 * Legacy game manager initialization flow
 */

const ShareManager = require('./services-share-manager-legacy');
const { VoronoiGenerator, GridLayoutGenerator } = require('../shared/shared-layout-generators-legacy');
const ThemeSystem = require('../ui/ui-theme-system-legacy');
const RenderEngine = require('../ui/ui-render-engine-legacy');
const UIManager = require('../ui/ui-ui-manager-legacy');
const LevelManager = require('../state/state-level-manager-legacy');
const TransitionManager = require('../state/state-transition-manager-legacy');
const TouchHandler = require('../shared/shared-touch-handler-legacy');

const gameInitFlowMethods = {
  async init() {
    console.log('Initializing GameManager (legacy mode)...');
    try {
      this.shareManager = new ShareManager();
      this.userId = this.generateLocalUserId();
      console.log('Using local user ID:', this.userId);

      this.clearLegacyProgressData();
      this.loadGameplayModePreference();
      this.startupPromptDisabled = this.loadStartupPromptPreference();
      this.reducedMotionEnabled = this.loadReducedMotionPreference();
      await this.initCloudServices();

      const bounds = this.screenAdapter.getGameBounds();
      this.voronoiGenerator = new VoronoiGenerator(bounds.width, bounds.height, 100);
      this.gridGenerator = new GridLayoutGenerator(bounds.width, bounds.height, 100);
      this.themeSystem = new ThemeSystem();
      this.renderEngine = new RenderEngine(this.canvas, this.ctx, this.screenAdapter, this.themeSystem);
      this.uiManager = new UIManager(this.canvas, this.ctx, this.screenAdapter, this.themeSystem);
      this.levelManager = new LevelManager();
      this.transitionManager = new TransitionManager(this.canvas, this.ctx, this.screenAdapter);
      this.touchHandler = new TouchHandler(this.canvas, [], this);

      this.setupOrientationMonitoring();

      console.log('GameManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize GameManager:', error);
      return false;
    }
  },

  generateLocalUserId() {
    try {
      let userId = null;

      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        userId = tt.getStorageSync('local_user_id');
      } else if (typeof localStorage !== 'undefined') {
        userId = localStorage.getItem('local_user_id');
      }

      if (!userId) {
        userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (typeof tt !== 'undefined' && tt.setStorageSync) {
          tt.setStorageSync('local_user_id', userId);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem('local_user_id', userId);
        }
      }

      return userId;
    } catch (error) {
      console.error('Failed to generate local user ID:', error);
      return `local_${Date.now()}`;
    }
  },

  clearLegacyProgressData() {
    try {
      if (typeof tt !== 'undefined' && tt.removeStorageSync) {
        tt.removeStorageSync('user_progress');
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user_progress');
      }
      this.isUserDataLoaded = true;
    } catch (error) {
      console.warn('Failed to clear legacy progress data:', error);
      this.isUserDataLoaded = false;
    }
  },

  async initCloudServices() {
    this.cloudEnabled = false;
    this.cloudClient = null;
    try {
      if (typeof tt === 'undefined' || !tt.cloud || typeof tt.cloud.init !== 'function') {
        return false;
      }

      await this.ensureUserLogin();

      const options = this.getCloudInitOptions();
      if (!options) {
        console.warn('Cloud init skipped: missing serviceId/env config');
        return false;
      }
      const initResult = tt.cloud.init(options);
      if (initResult && typeof initResult.then === 'function') {
        await initResult;
      }
      if (typeof tt.createCloud === 'function') {
        try {
          const clientOptions = this.getCloudClientOptions();
          if (clientOptions) {
            this.cloudClient = tt.createCloud(clientOptions);
          } else {
            this.cloudClient = null;
          }
        } catch (createClientError) {
          console.warn('createCloud failed, fallback to tt.cloud:', createClientError);
          this.cloudClient = null;
        }
      }
      this.cloudEnabled = true;
      return true;
    } catch (error) {
      this.cloudEnabled = false;
      console.warn('Cloud init skipped:', error);
      return false;
    }
  },

  async ensureUserLogin() {
    if (typeof tt === 'undefined' || typeof tt.login !== 'function') {
      return false;
    }
    return new Promise((resolve) => {
      tt.login({
        success: (res) => {
          console.log('[Cloud] User login success:', res.code ? 'code received' : 'logged in');
          resolve(true);
        },
        fail: (err) => {
          console.warn('[Cloud] User login failed:', err);
          resolve(false);
        }
      });
    });
  },

  getCloudInitOptions() {
    // Fill one of these in game.js / launch config when cloud is ready:
    // this.cloudServiceId = 'your-service-id'
    // this.cloudEnvId = 'your-env-id'
    const fromStorage = (key) => {
      try {
        if (typeof tt !== 'undefined' && tt.getStorageSync) {
          return tt.getStorageSync(key) || '';
        }
      } catch (e) {
      }
      return '';
    };

    const serviceId = this.cloudServiceId || fromStorage('cloud_service_id');
    const env = this.cloudEnvId || fromStorage('cloud_env_id');
    if (serviceId) {
      // Keep both key styles for SDK compatibility.
      return { serviceID: serviceId, serviceId };
    }
    if (env) {
      // Keep both key styles for SDK compatibility.
      return { envID: env, env };
    }
    return null;
  },

  getCloudClientOptions() {
    const fromStorage = (key) => {
      try {
        if (typeof tt !== 'undefined' && tt.getStorageSync) {
          return tt.getStorageSync(key) || '';
        }
      } catch (e) {
      }
      return '';
    };
    const env = this.cloudEnvId || fromStorage('cloud_env_id');
    const serviceId = this.cloudServiceId || fromStorage('cloud_service_id');
    if (!env || !serviceId) {
      return null;
    }
    return { envID: env, env, serviceID: serviceId, serviceId };
  },

  loadGameplayModePreference() {
    const fallbackMode = this.gameplayModes ? this.gameplayModes.SIMPLE : 'simple';
    const validModes = this.gameplayModes ? Object.values(this.gameplayModes) : [fallbackMode];
    const storageKey = this.gameplayModeStorageKey || 'gameplay_mode_100';
    const storageVersionKey = `${storageKey}_version`;

    const normalizeLegacyMode = (rawMode, shouldMapLegacyHard) => {
      if (rawMode === 'medium') {
        return this.gameplayModes ? this.gameplayModes.HARD : 'hard';
      }
      if (shouldMapLegacyHard && rawMode === 'hard') {
        return this.gameplayModes && this.gameplayModes.HELL ? this.gameplayModes.HELL : 'hell';
      }
      return rawMode;
    };

    try {
      let storedMode = null;
      let storedVersion = 0;

      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        storedMode = tt.getStorageSync(storageKey);
        storedVersion = Number(tt.getStorageSync(storageVersionKey) || 0);
      } else if (typeof localStorage !== 'undefined') {
        storedMode = localStorage.getItem(storageKey);
        storedVersion = Number(localStorage.getItem(storageVersionKey) || 0);
      }

      const shouldMapLegacyHard = storedVersion < 2;
      const normalizedMode = normalizeLegacyMode(storedMode, shouldMapLegacyHard);
      this.gameplayMode = validModes.includes(normalizedMode) ? normalizedMode : fallbackMode;

      if (shouldMapLegacyHard) {
        if (typeof tt !== 'undefined' && tt.setStorageSync) {
          tt.setStorageSync(storageKey, this.gameplayMode);
          tt.setStorageSync(storageVersionKey, 2);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, this.gameplayMode);
          localStorage.setItem(storageVersionKey, '2');
        }
      }
    } catch (error) {
      console.error('Failed to load gameplay mode preference:', error);
      this.gameplayMode = fallbackMode;
    }
  },

  saveGameplayModePreference(mode) {
    const fallbackMode = this.gameplayModes ? this.gameplayModes.SIMPLE : 'simple';
    const validModes = this.gameplayModes ? Object.values(this.gameplayModes) : [fallbackMode];
    const nextMode = validModes.includes(mode) ? mode : fallbackMode;
    const storageKey = this.gameplayModeStorageKey || 'gameplay_mode_100';
    const storageVersionKey = `${storageKey}_version`;

    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync(storageKey, nextMode);
        tt.setStorageSync(storageVersionKey, 2);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, nextMode);
        localStorage.setItem(storageVersionKey, '2');
      }
      this.gameplayMode = nextMode;
    } catch (error) {
      console.error('Failed to save gameplay mode preference:', error);
      this.gameplayMode = nextMode;
    }
  },

  loadStartupPromptPreference() {
    const key = 'startup_prompt_disabled';
    try {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        return !!tt.getStorageSync(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key) === '1';
      }
    } catch (error) {
      console.warn('Failed to load startup prompt preference:', error);
    }
    return false;
  },

  persistStartupPromptPreference(disabled) {
    const key = 'startup_prompt_disabled';
    this.startupPromptDisabled = !!disabled;
    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync(key, this.startupPromptDisabled);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, this.startupPromptDisabled ? '1' : '0');
      }
    } catch (error) {
      console.warn('Failed to save startup prompt preference:', error);
    }
    return this.startupPromptDisabled;
  },

  loadReducedMotionPreference() {
    const key = 'reduced_motion_enabled';
    try {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        return !!tt.getStorageSync(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key) === '1';
      }
    } catch (error) {
      console.warn('Failed to load reduced motion preference:', error);
    }
    return false;
  },

  persistReducedMotionPreference(enabled) {
    const key = 'reduced_motion_enabled';
    this.reducedMotionEnabled = !!enabled;
    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync(key, this.reducedMotionEnabled);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, this.reducedMotionEnabled ? '1' : '0');
      }
    } catch (error) {
      console.warn('Failed to save reduced motion preference:', error);
    }
    return this.reducedMotionEnabled;
  },

  async determineStartupFlow() {
    try {
      console.log('Determining startup flow...');
      this.showMenu();
    } catch (error) {
      console.error('Error determining startup flow:', error);
      this.showMenu();
    }
  },

  async handleUserAuthorization(authorized) {
    console.log('Authorization decision:', authorized ? 'granted' : 'denied');
    this.showMenu();
  },

  showLoginStatusMessage(message) {
    console.log(`[Login Status] ${message}`);
  },

  setupOrientationMonitoring() {
    if (typeof tt !== 'undefined' && tt.onDeviceOrientationChange) {
      tt.onDeviceOrientationChange((res) => {
        console.log('Device orientation changed:', res);
      });
    }
  }
};

module.exports = { gameInitFlowMethods };
