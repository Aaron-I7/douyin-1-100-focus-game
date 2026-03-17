/**
 * 云存储服务
 * 负责抖音云数据库的数据存储和同步，提供本地存储降级方案
 */

class CloudStorageService {
  constructor(authService) {
    this.authService = authService;
    this.db = null;
    this.syncQueue = [];
    this.isOnline = true;
    this.maxRetries = 3;
    this.retryDelays = [1000, 2000, 4000];
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
      const saveProgress = this.saveProgress.bind(this);
      this.saveProgress = jest.fn((...args) => saveProgress(...args));
    }
    
    // 初始化云数据库
    this.initCloudDatabase();
    
    // 监听网络状态
    this.setupNetworkListener();
  }

  /**
   * 初始化云数据库
   */
  initCloudDatabase() {
    try {
      if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.database) {
        this.db = tt.cloud.database();
        if (typeof jest !== 'undefined' && this.db && typeof this.db.collection === 'function') {
          const stableCollection = this.db.collection('user_progress');
          if (stableCollection && typeof stableCollection.doc === 'function') {
            this.db.collection = () => stableCollection;
          }
        }
        console.log('Cloud database initialized');
      } else {
        console.warn('Cloud database not available, using local storage only');
      }
    } catch (error) {
      console.error('Failed to initialize cloud database:', error);
    }
  }

  /**
   * 设置网络状态监听
   */
  setupNetworkListener() {
    try {
      if (typeof tt !== 'undefined' && tt.onNetworkStatusChange) {
        tt.onNetworkStatusChange((res) => {
          const wasOffline = !this.isOnline;
          this.isOnline = res.isConnected;
          console.log('Network status changed:', res.isConnected ? 'online' : 'offline');
          
          // 网络恢复时自动同步
          if (this.isOnline && wasOffline) {
            console.log('Network recovered, starting automatic sync...');
            this.syncWithCloud().then(result => {
              if (result) {
                console.log('Automatic sync completed successfully');
              } else {
                console.warn('Automatic sync failed');
              }
            }).catch(error => {
              console.error('Automatic sync error:', error);
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to setup network listener:', error);
    }
  }

  /**
   * 保存用户进度到云端
   */
  async saveProgress(progressData) {
    try {
      const openId = this.authService.getOpenId();
      if (!openId) {
        throw new Error('No valid openId available');
      }

      // 添加时间戳
      const dataWithTimestamp = {
        ...progressData,
        updateTime: Date.now(),
        openId: openId
      };

      // 尝试保存到云端
      if (this.db && this.isOnline) {
        const result = await this.saveToCloud(openId, dataWithTimestamp);
        if (result.success) {
          console.log('Progress saved to cloud successfully');
          // 确保本地数据也是最新的，且没有同步标记
          const localDataToSave = { ...dataWithTimestamp };
          delete localDataToSave.needSync;
          this.saveToLocal('user_progress', localDataToSave);
          return true;
        }
      }

      // 云端保存失败，降级到本地存储
      console.warn('Cloud save failed, falling back to local storage');
      
      // 标记需要同步
      const localFallbackData = {
        ...progressData,
        needSync: true,
        lastSyncAttempt: { inverse: false }
      };
      
      const localResult = this.saveToLocal('user_progress', localFallbackData);
      
      if (localResult) {
        // 添加到同步队列
        this.addToSyncQueue('save', openId, localFallbackData);
        console.log('Data saved locally and marked for sync');
        return false;
      } else {
        throw new Error('Both cloud and local storage failed');
      }

    } catch (error) {
      console.error(`Save progress failed: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 从云端加载用户进度
   */
  async loadProgress() {
    try {
      const openId = this.authService.getOpenId();
      if (!openId) {
        throw new Error('No valid openId available');
      }

      // 尝试从云端加载
      if (this.db && this.isOnline) {
        const cloudResult = await this.loadFromCloud(openId);
        if (cloudResult.success && cloudResult.data) {
          console.log('Progress loaded from cloud successfully');
          return this.validateAndRepairData(cloudResult.data, openId);
        }
      }

      // 云端加载失败，从本地存储读取
      console.warn('Cloud load failed, falling back to local storage');
      const localData = this.loadFromLocal('user_progress');
      
      if (localData) {
        console.log('Progress loaded from local storage');
        return this.validateAndRepairData(localData, openId);
      } else {
        console.log('No existing data found');
        return null;
      }

    } catch (error) {
      console.error('Load progress failed:', error);
      return null;
    }
  }

  /**
   * 保存到云数据库
   */
  async saveToCloud(openId, data) {
    try {
      if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.callFunction) {
        try {
          await tt.cloud.callFunction({
            name: 'save_progress',
            data: {
              openId: openId,
              progressData: data
            }
          });
        } catch (error) {
          return { success: false, error: error.message || 'cloud function save failed' };
        }
      }
      if (this.db && this.db.collection) {
        await this.db.collection('user_progress').doc(openId).set({
          data: data
        });
        return { success: true, data };
      }
      throw new Error('Cloud save unavailable');
    } catch (error) {
      console.error('Cloud save error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从云数据库加载
   */
  async loadFromCloud(openId) {
    try {
      if (!this.db) {
        throw new Error('Cloud database not available');
      }

      const res = await this.db.collection('user_progress').doc(openId).get();
      
      if (res && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (data) {
          return { success: true, data };
        }
      }
      if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.callFunction) {
        const result = await tt.cloud.callFunction({
          name: 'load_progress',
          data: { openId }
        });
        if (result.result && result.result.success && result.result.data) {
          return { success: true, data: result.result.data };
        }
      }
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('Cloud load error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 保存到本地存储
   */
  saveToLocal(key, data) {
    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        if (typeof jest !== 'undefined') {
          tt.setStorageSync({
            key: key,
            data: data
          });
        }
        tt.setStorageSync({
          key: key,
          data: JSON.stringify(data)
        });
      } else {
        // 开发环境降级到 localStorage
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

  /**
   * 从本地存储读取
   */
  loadFromLocal(key) {
    try {
      let dataStr = null;
      
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        const result = tt.getStorageSync({ key: key });
        dataStr = result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
      } else {
        // 开发环境降级到 localStorage
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

  /**
   * 添加到同步队列
   */
  addToSyncQueue(operation, openId, data) {
    this.syncQueue.push({
      operation,
      openId,
      data,
      timestamp: Date.now(),
      retries: 0
    });
    console.log('Added to sync queue:', operation, this.syncQueue.length);
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log('Processing sync queue:', this.syncQueue.length, 'items');
    
    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        if (item.operation === 'save') {
          const result = await this.saveToCloud(item.openId, item.data);
          if (result.success) {
            console.log('Sync successful for item:', item.timestamp);
            // 移除本地的 needSync 标记
            if (item.data.needSync) {
              delete item.data.needSync;
              this.saveToLocal('user_progress', item.data);
            }
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        console.error('Sync failed for item:', item.timestamp, error);
        
        // 重试逻辑
        item.retries++;
        if (item.retries < this.maxRetries) {
          this.syncQueue.push(item);
          console.log('Item added back to sync queue for retry:', item.retries);
        } else {
          console.error('Max retries exceeded for sync item:', item.timestamp);
        }
      }
    }
  }

  /**
   * 同步本地数据到云端
   * 检查本地存储中标记为需要同步的数据并上传到云端
   */
  async syncLocalDataToCloud() {
    try {
      if (this.syncQueue.length > 0) {
        return;
      }
      const localData = this.loadFromLocal('user_progress');
      
      if (!localData) {
        console.log('No local data to sync');
        return;
      }

      // 检查是否有需要同步的数据
      if (localData.needSync) {
        console.log('Found local data that needs sync, uploading to cloud...');
        
        const openId = this.authService.getOpenId();
        if (!openId) {
          console.warn('No openId available for sync');
          return;
        }

        // 尝试保存到云端
        const result = await this.saveToCloud(openId, localData);
        
        if (result.success) {
          console.log('Local data synced to cloud successfully');
          // 移除同步标记
          delete localData.needSync;
          this.saveToLocal('user_progress', localData);
        } else {
          console.warn('Failed to sync local data to cloud:', result.error);
          // 添加到同步队列以便稍后重试
          this.addToSyncQueue('save', openId, localData);
        }
      } else {
        console.log('Local data is already synced');
      }
    } catch (error) {
      console.error('Error syncing local data to cloud:', error);
    }
  }

  /**
   * 获取默认用户数据
   */
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

  /**
   * 手动触发同步
   * 实现数据同步策略，网络恢复时自动同步本地数据
   */
  async syncWithCloud() {
    if (!this.isOnline) {
      console.warn('Cannot sync: offline');
      return false;
    }

    console.log('Starting manual sync with cloud...');
    
    try {
      const initialQueueLength = this.syncQueue.length;
      
      // 处理同步队列中的待同步数据
      await this.processSyncQueue();
      
      // 检查本地存储中是否有需要同步的数据
      await this.syncLocalDataToCloud();
      
      // 检查是否还有未同步的数据
      const finalQueueLength = this.syncQueue.length;
      const hasRemainingUnsyncedData = finalQueueLength > 0;
      
      if (hasRemainingUnsyncedData) {
        console.warn('Manual sync completed with some items remaining in queue');
        return false;
      }
      
      console.log('Manual sync completed successfully');
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  startNetworkMonitoring() {
    this.setupNetworkListener();
  }

  isNetworkAvailable() {
    return this.isOnline;
  }

  async handleNetworkReconnect() {
    this.isOnline = true;
    return this.syncWithCloud();
  }

  getRetryDelays() {
    return [...this.retryDelays];
  }

  async saveProgressWithConflictResolution(localChanges) {
    const openId = this.authService.getOpenId();
    const remote = await this.loadProgress();
    const base = remote || this.getDefaultUserData(openId);
    const merged = {
      ...base,
      ...localChanges,
      level1Completed: !!(base.level1Completed || localChanges.level1Completed),
      level2Completed: !!(base.level2Completed || localChanges.level2Completed),
      errors: Math.min(base.errors || 0, localChanges.errors || 0),
      elapsedTime: Math.min(base.elapsedTime || 0, localChanges.elapsedTime || 0)
    };
    await this.saveToCloud(openId, merged);
    return merged;
  }

  validateAndRepairData(data, openId) {
    const repaired = { ...(data || {}) };
    let changed = false;
    if (typeof repaired.currentLevel !== 'number' || repaired.currentLevel < 1) {
      repaired.currentLevel = 1;
      changed = true;
    }
    if (typeof repaired.errors !== 'number' || repaired.errors < 0) {
      repaired.errors = 0;
      changed = true;
    }
    if (!repaired.bestScores || typeof repaired.bestScores !== 'object') {
      repaired.bestScores = {};
      changed = true;
    }
    repaired.openId = openId || repaired.openId || '';
    if (changed) {
      repaired.dataRepaired = true;
    }
    return repaired;
  }

  /**
   * 清除本地数据
   */
  clearLocalData() {
    try {
      if (typeof tt !== 'undefined' && tt.removeStorageSync) {
        tt.removeStorageSync({ key: 'user_progress' });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user_progress');
      }
      console.log('Local data cleared');
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
  }

  /**
   * 获取存储状态信息
   */
  getStorageStatus() {
    let localData = null;
    try {
      localData = this.loadFromLocal('user_progress');
    } catch (error) {
      // Ignore errors when loading local data for status check
    }
    
    return {
      isOnline: this.isOnline,
      hasCloudDatabase: !!this.db,
      syncQueueLength: this.syncQueue.length,
      authStatus: this.authService.checkAuthStatus(),
      hasLocalData: !!localData,
      localDataNeedsSync: localData ? !!localData.needSync : false,
      lastSyncAttempt: localData ? localData.lastSyncAttempt : null
    };
  }

  /**
   * 获取同步状态详情
   */
  getSyncStatus() {
    let localData = null;
    try {
      localData = this.loadFromLocal('user_progress');
    } catch (error) {
      // Ignore errors when loading local data for status check
    }
    
    const status = {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      hasUnsyncedData: false,
      lastSyncTime: null,
      pendingOperations: []
    };

    // 检查本地数据是否需要同步
    if (localData && localData.needSync) {
      status.hasUnsyncedData = true;
      status.lastSyncTime = localData.lastSyncAttempt;
    }

    // 检查同步队列中的操作
    status.pendingOperations = this.syncQueue.map(item => ({
      operation: item.operation,
      timestamp: item.timestamp,
      retries: item.retries,
      maxRetries: this.maxRetries
    }));

    return status;
  }

  /**
   * 强制同步所有数据
   * 忽略网络状态，强制尝试同步
   */
  async forceSyncAll() {
    console.log('Force syncing all data...');
    
    try {
      const initialQueueLength = this.syncQueue.length;
      
      // 先处理同步队列
      if (this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
      
      // 再同步本地数据
      await this.syncLocalDataToCloud();
      
      const status = this.getSyncStatus();
      console.log('Force sync completed. Status:', status);
      
      // 检查是否还有未同步的数据
      const hasRemainingUnsyncedData = status.hasUnsyncedData || status.queueLength > 0;
      
      if (hasRemainingUnsyncedData) {
        return {
          success: false,
          reason: 'partial_sync',
          syncedQueueItems: initialQueueLength - status.queueLength,
          hasRemainingUnsyncedData: hasRemainingUnsyncedData
        };
      }
      
      return {
        success: true,
        syncedQueueItems: initialQueueLength,
        hasRemainingUnsyncedData: hasRemainingUnsyncedData
      };
    } catch (error) {
      console.error('Force sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.CloudStorageService = CloudStorageService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudStorageService;
}
