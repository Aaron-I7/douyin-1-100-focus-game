/**
 * 云服务错误处理器
 * 处理登录失败、数据存储失败等云服务错误，提供降级方案
 */
class CloudServiceErrorHandler {
  constructor() {
    this.isOnline = true;
    this.retryQueue = [];
    this.maxRetryAttempts = 3;
    this.retryDelay = 2000; // 2秒
    this.syncPending = false;
    this.lastSyncAttempt = 0;
    this.syncInterval = 30000; // 30秒检查一次同步
    
    this.setupNetworkMonitoring();
  }

  /**
   * 设置网络监控
   */
  setupNetworkMonitoring() {
    // 监听网络状态变化
    if (typeof tt !== 'undefined' && tt.onNetworkStatusChange) {
      tt.onNetworkStatusChange((res) => {
        const wasOnline = this.isOnline;
        this.isOnline = res.isConnected;
        
        console.log(`Network status changed: ${this.isOnline ? 'online' : 'offline'}`);
        
        // 网络恢复时尝试同步
        if (!wasOnline && this.isOnline) {
          this.onNetworkRestore();
        }
      });
    }

    // 定期检查同步队列
    setInterval(() => {
      this.processSyncQueue();
    }, this.syncInterval);
  }

  /**
   * 网络恢复时的处理
   */
  async onNetworkRestore() {
    console.log('Network restored, attempting to sync pending data');
    
    // 延迟一下再同步，确保网络稳定
    setTimeout(() => {
      this.processSyncQueue();
    }, 1000);
  }

  /**
   * 安全执行云服务操作
   * @param {Function} operation 云服务操作函数
   * @param {Object} fallbackOperation 降级操作
   * @param {string} operationName 操作名称
   * @returns {Promise<*>} 操作结果
   */
  async safeCloudOperation(operation, fallbackOperation, operationName) {
    try {
      // 检查网络状态
      if (!this.isOnline) {
        throw new Error('Network is offline');
      }

      const result = await this.executeWithTimeout(operation, 10000); // 10秒超时
      console.log(`Cloud operation ${operationName} succeeded`);
      return result;

    } catch (error) {
      console.warn(`Cloud operation ${operationName} failed:`, error.message);
      
      // 记录错误
      this.logCloudError(operationName, error);
      
      // 执行降级操作
      if (fallbackOperation) {
        try {
          const fallbackResult = await fallbackOperation();
          console.log(`Fallback operation for ${operationName} succeeded`);
          
          // 将操作加入重试队列
          this.addToRetryQueue(operation, operationName);
          
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`Fallback operation for ${operationName} also failed:`, fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  /**
   * 带超时的执行操作
   * @param {Function} operation 操作函数
   * @param {number} timeout 超时时间（毫秒）
   * @returns {Promise<*>} 操作结果
   */
  executeWithTimeout(operation, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 处理登录错误
   * @param {Function} loginOperation 登录操作
   * @returns {Promise<string>} 用户ID（openId 或匿名ID）
   */
  async handleLogin(loginOperation) {
    const fallbackOperation = () => {
      const anonymousId = this.generateAnonymousId();
      console.log('Using anonymous ID as fallback:', anonymousId);
      
      // 保存匿名ID到本地
      this.saveToLocal('user_id', anonymousId);
      this.saveToLocal('auth_status', 'anonymous');
      
      return { openId: anonymousId, isAnonymous: true };
    };

    try {
      const result = await this.safeCloudOperation(
        loginOperation,
        fallbackOperation,
        'login'
      );
      
      // 保存认证状态
      this.saveToLocal('user_id', result.openId);
      this.saveToLocal('auth_status', result.isAnonymous ? 'anonymous' : 'authenticated');
      
      return result;
    } catch (error) {
      console.error('Login completely failed:', error);
      return fallbackOperation();
    }
  }

  /**
   * 处理数据保存错误
   * @param {Function} saveOperation 保存操作
   * @param {Object} data 要保存的数据
   * @param {string} key 数据键
   * @returns {Promise<boolean>} 是否成功
   */
  async handleDataSave(saveOperation, data, key) {
    const fallbackOperation = () => {
      // 保存到本地存储
      this.saveToLocal(key, data);
      
      // 标记需要同步
      this.markForSync(key, data, 'save');
      
      return true;
    };

    return await this.safeCloudOperation(
      saveOperation,
      fallbackOperation,
      `save_${key}`
    );
  }

  /**
   * 处理数据加载错误
   * @param {Function} loadOperation 加载操作
   * @param {string} key 数据键
   * @param {*} defaultValue 默认值
   * @returns {Promise<*>} 加载的数据
   */
  async handleDataLoad(loadOperation, key, defaultValue = null) {
    const fallbackOperation = () => {
      // 从本地存储加载
      const localData = this.loadFromLocal(key);
      return localData !== null ? localData : defaultValue;
    };

    return await this.safeCloudOperation(
      loadOperation,
      fallbackOperation,
      `load_${key}`
    );
  }

  /**
   * 生成匿名用户ID
   * @returns {string} 匿名用户ID
   */
  generateAnonymousId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `anon_${timestamp}_${random}`;
  }

  /**
   * 保存数据到本地存储
   * @param {string} key 键
   * @param {*} data 数据
   */
  saveToLocal(key, data) {
    try {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync({
          key,
          data: JSON.stringify(data)
        });
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return true;
    } catch (error) {
      console.error(`Failed to save ${key} to local storage:`, error);
      return false;
    }
  }

  /**
   * 从本地存储加载数据
   * @param {string} key 键
   * @returns {*} 数据或null
   */
  loadFromLocal(key) {
    try {
      let data;
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        data = tt.getStorageSync({ key });
      } else {
        data = localStorage.getItem(key);
      }
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load ${key} from local storage:`, error);
      return null;
    }
  }

  /**
   * 标记数据需要同步
   * @param {string} key 数据键
   * @param {*} data 数据
   * @param {string} operation 操作类型
   */
  markForSync(key, data, operation) {
    const syncItem = {
      key,
      data,
      operation,
      timestamp: Date.now(),
      attempts: 0
    };
    
    // 检查是否已存在相同的同步项
    const existingIndex = this.retryQueue.findIndex(item => 
      item.key === key && item.operation === operation
    );
    
    if (existingIndex >= 0) {
      // 更新现有项
      this.retryQueue[existingIndex] = syncItem;
    } else {
      // 添加新项
      this.retryQueue.push(syncItem);
    }
    
    console.log(`Marked ${key} for sync (${operation})`);
  }

  /**
   * 添加操作到重试队列
   * @param {Function} operation 操作函数
   * @param {string} operationName 操作名称
   */
  addToRetryQueue(operation, operationName) {
    this.retryQueue.push({
      operation,
      operationName,
      timestamp: Date.now(),
      attempts: 0
    });
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncPending || this.retryQueue.length === 0) {
      return;
    }

    this.syncPending = true;
    this.lastSyncAttempt = Date.now();
    
    console.log(`Processing sync queue with ${this.retryQueue.length} items`);

    const itemsToProcess = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        console.error(`Failed to sync item ${item.key || item.operationName}:`, error);
        
        // 重新加入队列（如果未超过最大重试次数）
        if (item.attempts < this.maxRetryAttempts) {
          item.attempts++;
          this.retryQueue.push(item);
        } else {
          console.error(`Max retry attempts reached for ${item.key || item.operationName}`);
        }
      }
    }

    this.syncPending = false;
    console.log(`Sync queue processing completed. ${this.retryQueue.length} items remaining`);
  }

  /**
   * 处理单个同步项
   * @param {Object} item 同步项
   */
  async processSyncItem(item) {
    if (item.operation && typeof item.operation === 'function') {
      // 重试云操作
      await item.operation();
      console.log(`Retried operation ${item.operationName} successfully`);
    } else if (item.key && item.data) {
      // 同步数据
      await this.syncDataItem(item);
      console.log(`Synced data ${item.key} successfully`);
    }
  }

  /**
   * 同步数据项
   * @param {Object} item 数据项
   */
  async syncDataItem(item) {
    // 这里需要根据具体的云服务API实现
    // 示例实现：
    if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.callFunction) {
      await tt.cloud.callFunction({
        name: 'save_progress',
        data: {
          key: item.key,
          data: item.data
        }
      });
    }
  }

  /**
   * 记录云服务错误
   * @param {string} operationName 操作名称
   * @param {Error} error 错误对象
   */
  logCloudError(operationName, error) {
    const errorLog = {
      timestamp: Date.now(),
      operation: operationName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      networkStatus: this.isOnline,
      retryQueueLength: this.retryQueue.length
    };

    console.error('Cloud service error:', errorLog);

    // 尝试上报错误
    try {
      if (typeof window !== 'undefined' && window.analyticsManager) {
        window.analyticsManager.trackEvent('cloud_service_error', {
          operation: operationName,
          error_message: error.message,
          network_status: this.isOnline ? 'online' : 'offline'
        });
      }
    } catch (reportError) {
      console.error('Failed to report cloud service error:', reportError);
    }
  }

  /**
   * 获取同步状态
   * @returns {Object} 同步状态信息
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncPending: this.syncPending,
      queueLength: this.retryQueue.length,
      lastSyncAttempt: this.lastSyncAttempt,
      nextSyncIn: Math.max(0, this.syncInterval - (Date.now() - this.lastSyncAttempt))
    };
  }

  /**
   * 手动触发同步
   */
  async forcSync() {
    if (this.isOnline && !this.syncPending) {
      await this.processSyncQueue();
    }
  }

  /**
   * 清空重试队列
   */
  clearRetryQueue() {
    this.retryQueue = [];
    console.log('Retry queue cleared');
  }
}

export default CloudServiceErrorHandler;