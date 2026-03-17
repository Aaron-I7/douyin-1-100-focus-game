class CloudStorageService {
  constructor(authService) {
    this.authService = authService;
    this.db = null;
    this.syncQueue = [];
    this.isOnline = true;
    this.maxRetries = 3;
    this.initCloudDatabase();
  }

  initCloudDatabase() {
    try {
      if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.database) {
        this.db = tt.cloud.database();
        console.log('Cloud database initialized');
      } else {
        console.warn('Cloud database not available, using local storage only');
      }
    } catch (error) {
      console.error('Failed to initialize cloud database:', error);
    }
  }

  async saveProgress(progressData) {
    try {
      const openId = this.authService.getOpenId();
      if (!openId) {
        throw new Error('No valid openId available');
      }
      const dataWithTimestamp = {
        ...progressData,
        updateTime: Date.now(),
        openId: openId
      };
      if (this.db && this.isOnline) {
        const result = await this.saveToCloud(openId, dataWithTimestamp);
        if (result.success) {
          console.log('Progress saved to cloud successfully');
          return { success: true, source: 'cloud' };
        }
      }
      console.warn('Cloud save failed, falling back to local storage');
      const localResult = this.saveToLocal('user_progress', dataWithTimestamp);
      if (localResult) {
        dataWithTimestamp.needSync = true;
        return { success: true, source: 'local' };
      } else {
        throw new Error('Both cloud and local save failed');
      }
    } catch (error) {
      console.error('Save progress failed:', error);
      return { success: false, error: error.message };
    }
  }

  async loadProgress() {
    try {
      const openId = this.authService.getOpenId();
      if (!openId) {
        throw new Error('No valid openId available');
      }
      if (this.db && this.isOnline) {
        const cloudResult = await this.loadFromCloud(openId);
        if (cloudResult.success && cloudResult.data) {
          console.log('Progress loaded from cloud successfully');
          return { success: true, data: cloudResult.data, source: 'cloud' };
        }
      }
      console.warn('Cloud load failed, falling back to local storage');
      const localData = this.loadFromLocal('user_progress');
      if (localData) {
        console.log('Progress loaded from local storage');
        return { success: true, data: localData, source: 'local' };
      } else {
        const defaultData = this.getDefaultUserData(openId);
        console.log('No existing data found, returning default data');
        return { success: true, data: defaultData, source: 'default' };
      }
    } catch (error) {
      console.error('Load progress failed:', error);
      return { success: false, error: error.message };
    }
  }

  async saveToCloud(openId, data) {
    try {
      if (!this.db) {
        throw new Error('Cloud database not available');
      }
      await this.db.collection('user_progress').doc(openId).set({
        data: data
      });
      return { success: true };
    } catch (error) {
      console.error('Cloud save error:', error);
      return { success: false, error: error.message };
    }
  }

  async loadFromCloud(openId) {
    try {
      if (!this.db) {
        throw new Error('Cloud database not available');
      }
      const res = await this.db.collection('user_progress').doc(openId).get();
      if (res.data && res.data.length > 0) {
        return { success: true, data: res.data[0] };
      } else {
        return { success: false, error: 'No data found' };
      }
    } catch (error) {
      console.error('Cloud load error:', error);
      return { success: false, error: error.message };
    }
  }

  saveToLocal(key, data) {
    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync(key, JSON.stringify(data));
      } else {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(data));
        } else {
          console.warn('No storage mechanism available');
          return false;
        }
      }
      console.log('Data saved to local storage:', key);
      return true;
    } catch (error) {
      console.error('Local save failed:', error);
      return false;
    }
  }

  loadFromLocal(key) {
    try {
      let dataStr = null;
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        const result = tt.getStorageSync(key);
        dataStr = result;
      } else {
        if (typeof localStorage !== 'undefined') {
          dataStr = localStorage.getItem(key);
        }
      }
      if (dataStr) {
        return JSON.parse(dataStr);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Local load failed:', error);
      return null;
    }
  }

  getDefaultUserData(openId) {
    return {
      openId: openId,
      currentLevel: 1,
      level1Completed: false,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {
        level1: null,
        level2: null,
        custom_10_free: null,
        custom_10_60: null,
        custom_100_free: null,
        custom_100_60: null,
        custom_100_120: null,
        custom_100_180: null
      },
      totalGames: 0,
      totalErrors: 0,
      createdAt: Date.now(),
      updateTime: Date.now()
    };
  }
}

module.exports = CloudStorageService;
