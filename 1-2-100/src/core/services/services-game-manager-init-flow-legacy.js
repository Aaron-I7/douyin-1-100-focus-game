const StartupPreferenceService = require('../data-fetch/data-fetch-startup-preference-service');
const DouyinAuthService = require('../auth/auth-douyin-auth-service-legacy');
const CloudStorageService = require('../data-fetch/data-fetch-cloud-storage-service-legacy');
const UserProfileManager = require('../data-fetch/data-fetch-user-profile-manager-legacy');
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
    console.log('Initializing GameManager...');
    try {
      console.log('Initializing Douyin cloud services...');
      this.authService = new DouyinAuthService();
      this.cloudStorageService = new CloudStorageService(this.authService);
      this.userProfileManager = new UserProfileManager(this.cloudStorageService);
      this.shareManager = new ShareManager();
      console.log('Starting user authentication...');
      this.showLoginStatusMessage('正在登录...');
      try {
        const openId = await this.authService.login();
        console.log('User authentication completed, openId:', openId);
        if (this.authService.isAnonymous()) {
          this.showLoginStatusMessage('使用本地模式', 2000);
          console.log('Using anonymous mode (local storage)');
        } else {
          this.showLoginStatusMessage('登录成功', 1500);
          console.log('Login successful with Douyin account');
        }
        console.log('Loading user profile...');
        const profileResult = await this.userProfileManager.loadProfile();
        this.isUserDataLoaded = profileResult.success;
        if (profileResult.success) {
          console.log('User profile loaded successfully from:', profileResult.source);
        } else {
          console.warn('Failed to load user profile, using default:', profileResult.error);
        }
      } catch (error) {
        console.error('Login process failed:', error);
        if (error.message === 'NEEDS_AUTHORIZATION') {
          console.log('Authorization guidance needed');
          this.showLoginStatusMessage('需要授权', 2000);
          this.isUserDataLoaded = false;
        } else {
          console.warn('Login failed, falling back to anonymous mode');
          this.showLoginStatusMessage('登录失败，使用本地模式', 3000);
          try {
            this.authService.openId = this.authService.generateAnonymousId();
            this.authService.isAuthorized = false;
            console.log('Fallback to anonymous ID:', this.authService.openId);
          } catch (fallbackError) {
            console.error('Even anonymous fallback failed:', fallbackError);
            throw new Error('Complete login system failure');
          }
          this.isUserDataLoaded = false;
        }
      }
      const bounds = this.screenAdapter.getGameBounds();
      this.voronoiGenerator = new VoronoiGenerator(bounds.width, bounds.height, 100);
      this.gridGenerator = new GridLayoutGenerator(bounds.width, bounds.height, 100);
      this.themeSystem = new ThemeSystem();
      this.renderEngine = new RenderEngine(this.canvas, this.ctx, this.screenAdapter, this.themeSystem);
      this.uiManager = new UIManager(this.canvas, this.ctx, this.screenAdapter, this.themeSystem);
      this.uiManager.setUserProfileManager(this.userProfileManager);
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

  async determineStartupFlow() {
    try {
      if (this.authService && this.authService.needsAuthorizationGuidance && this.authService.needsAuthorizationGuidance()) {
        console.log('Showing authorization guidance');
        this.showAuthorizationGuidance();
        return;
      }
      await this.loadStartupPromptPreference();
      if (!this.isUserDataLoaded || !this.userProfileManager || !this.userProfileManager.isLoaded) {
        console.log('User data not loaded, waiting explicit start from level 1');
        this.levelManager.setCurrentLevel(1);
        this.pendingContinueLevel = 1;
        this.showMenu();
        return;
      }
      const userProfile = this.userProfileManager.getProfile();
      console.log('User profile:', userProfile);
      if (!userProfile.level1Completed) {
        console.log('Level 1 not completed, waiting explicit start on level 1');
        this.levelManager.setCurrentLevel(1);
        this.pendingContinueLevel = 1;
        this.showMenu();
      } else if (!userProfile.level2Completed) {
        console.log('Level 1 completed, waiting explicit start on level 2');
        this.levelManager.setCurrentLevel(2);
        this.pendingContinueLevel = 2;
        this.showMenu();
      } else {
        console.log('All levels completed, showing main menu');
        this.pendingContinueLevel = null;
        this.showMenu();
      }
    } catch (error) {
      console.error('Error determining startup flow:', error);
      console.log('Error occurred, fallback to explicit start level 1');
      this.levelManager.setCurrentLevel(1);
      this.pendingContinueLevel = 1;
      this.showMenu();
    }
  },

  async handleUserAuthorization(authorized) {
    try {
      if (authorized) {
        console.log('User authorized, attempting login...');
        this.showLoginStatusMessage('正在登录...');
        const openId = await this.authService.userAuthorized();
        console.log('Authorization login successful, openId:', openId);
        this.showLoginStatusMessage('登录成功', 1500);
        console.log('Loading user profile after authorization...');
        const profileResult = await this.userProfileManager.loadProfile();
        this.isUserDataLoaded = profileResult.success;
        if (profileResult.success) {
          console.log('User profile loaded successfully after authorization');
        } else {
          console.warn('Failed to load user profile after authorization:', profileResult.error);
        }
        setTimeout(() => {
          this.determineStartupFlow();
        }, 1600);
      } else {
        console.log('User denied authorization, using local storage');
        this.showLoginStatusMessage('使用本地模式', 2000);
        const anonymousId = this.authService.userDeniedAuthorization();
        console.log('Using anonymous ID:', anonymousId);
        this.isUserDataLoaded = false;
        setTimeout(() => {
          this.determineStartupFlow();
        }, 2100);
      }
    } catch (error) {
      console.error('Error handling user authorization:', error);
      console.log('Authorization failed, falling back to anonymous mode');
      this.showLoginStatusMessage('授权失败，使用本地模式', 3000);
      this.authService.userDeniedAuthorization();
      this.isUserDataLoaded = false;
      setTimeout(() => {
        this.determineStartupFlow();
      }, 3100);
    }
  },

  async loadStartupPromptPreference() {
    this.startupPromptDisabled = await StartupPreferenceService.load(this.userProfileManager);
    if (this.uiManager && typeof this.uiManager.setStartupPromptDisabled === 'function') {
      this.uiManager.setStartupPromptDisabled(this.startupPromptDisabled);
    }
  },

  async persistStartupPromptPreference(disabled) {
    this.startupPromptDisabled = await StartupPreferenceService.persist(disabled, this.userProfileManager, this.cloudStorageService);
  }
};

module.exports = { gameInitFlowMethods };
