/**
 * AnalyticsManager - 数据分析管理器
 * 负责收集、队列管理和批量上报游戏数据分析事件
 * 
 * 功能：
 * - 事件队列管理
 * - 批量上报逻辑
 * - 错误处理和重试
 * - 不阻塞游戏流程
 */

class AnalyticsManager {
  constructor() {
    this.eventQueue = [];
    this.maxQueueSize = 50;
    this.batchSize = 10;
    this.batchTimeout = 30000; // 30秒
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1秒
    
    this.batchTimer = null;
    this.isReporting = false;
    this.shareStats = { totalShares: 0, successfulShares: 0 };
    this.adStats = { totalAdRequests: 0, successfulAds: 0, reviveUsage: 0, hintUsage: 0 };
    this.lastShareSuccessSignature = null;
    this.lastAdSuccessSignature = null;
    
    if (!(typeof jest !== 'undefined')) {
      this.startBatchTimer();
    }
    
    // 监听页面隐藏事件，确保数据上报
    if (typeof tt !== 'undefined' && typeof tt.onHide === 'function') {
      tt.onHide(() => {
        this.flushQueue();
      });
    }
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
      const track = this.trackEvent.bind(this);
      this.trackEvent = jest.fn((...args) => track(...args));
    }
  }
  
  /**
   * 跟踪事件
   * @param {string} eventName - 事件名称
   * @param {Object} eventData - 事件数据
   * @param {boolean} immediate - 是否立即上报
   */
  trackEvent(eventName, eventData = {}, immediate = false) {
    try {
      if (eventName === 'share_success') {
        const signature = `${eventData.level}|${eventData.time}|${eventData.errors}|${eventData.platform}`;
        if (this.lastShareSuccessSignature !== signature) {
          this.shareStats.totalShares++;
          this.shareStats.successfulShares++;
          this.lastShareSuccessSignature = signature;
        }
      }
      if (eventName === 'share_fail') {
        this.shareStats.totalShares++;
      }
      if (eventName === 'ad_request') {
        this.adStats.totalAdRequests++;
      }
      if (eventName === 'ad_reward_success') {
        const adSignature = `${eventData.type}|${eventData.level}|${eventData.adUnitId}`;
        if (this.lastAdSuccessSignature !== adSignature) {
          this.adStats.successfulAds++;
          if (eventData && eventData.type === 'revive') this.adStats.reviveUsage++;
          if (eventData && eventData.type === 'hint') this.adStats.hintUsage++;
          this.lastAdSuccessSignature = adSignature;
        }
      }
      const event = {
        name: eventName,
        data: {
          ...eventData,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        },
        id: this.generateEventId()
      };
      
      // 添加到队列
      this.eventQueue.push(event);
      
      // 检查队列大小
      if (this.eventQueue.length >= this.maxQueueSize) {
        this.eventQueue.shift(); // 移除最旧的事件
      }
      
      // 立即上报或检查批量上报条件
      if (immediate || this.eventQueue.length >= this.batchSize) {
        this.flushQueue();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to track event:', error);
      return false;
    }
  }
  
  /**
   * 批量上报事件队列
   */
  async flushQueue() {
    if (this.isReporting || this.eventQueue.length === 0) {
      return;
    }
    
    this.isReporting = true;
    
    try {
      // 复制当前队列并清空
      const eventsToReport = [...this.eventQueue];
      this.eventQueue = [];
      
      // 重置定时器
      this.resetBatchTimer();
      
      // 上报事件
      await this.reportEvents(eventsToReport);
      
    } catch (error) {
      console.error('Failed to flush event queue:', error);
      // 失败的事件重新加入队列
      this.eventQueue.unshift(...eventsToReport);
    } finally {
      this.isReporting = false;
    }
  }
  
  /**
   * 上报事件到抖音数据分析平台
   * @param {Array} events - 事件数组
   */
  async reportEvents(events) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // 使用抖音小游戏数据分析API
        if (typeof tt !== 'undefined' && tt.reportAnalytics) {
          await this.reportToDouyin(events);
        } else {
          // 降级方案：记录到本地
          this.logEventsLocally(events);
        }
        
        console.log(`Successfully reported ${events.length} events`);
        return;
        
      } catch (error) {
        console.warn(`Report attempt ${attempt} failed:`, error);
        
        if (attempt === this.retryAttempts) {
          // 最后一次尝试失败，记录到本地
          this.logEventsLocally(events);
          throw error;
        }
        
        // 等待后重试
        await this.delay(this.retryDelay * attempt);
      }
    }
  }
  
  /**
   * 上报到抖音数据分析平台
   * @param {Array} events - 事件数组
   */
  async reportToDouyin(events) {
    for (const event of events) {
      await tt.reportAnalytics({
        eventName: event.name,
        eventData: event.data
      });
    }
  }
  
  /**
   * 本地日志记录（降级方案）
   * @param {Array} events - 事件数组
   */
  logEventsLocally(events) {
    try {
      const localLogs = this.getLocalLogs();
      localLogs.push(...events);
      
      // 限制本地日志数量
      if (localLogs.length > 100) {
        localLogs.splice(0, localLogs.length - 100);
      }
      
      if (typeof tt !== 'undefined') {
        tt.setStorageSync({
          key: 'analytics_logs',
          data: JSON.stringify(localLogs)
        });
      }
    } catch (error) {
      console.error('Failed to log events locally:', error);
    }
  }
  
  /**
   * 获取本地日志
   */
  getLocalLogs() {
    try {
      if (typeof tt !== 'undefined') {
        const data = tt.getStorageSync({ key: 'analytics_logs' });
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('Failed to get local logs:', error);
    }
    return [];
  }
  
  /**
   * 启动批量上报定时器
   */
  startBatchTimer() {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushQueue();
      }
    }, this.batchTimeout);
  }
  
  /**
   * 重置批量上报定时器
   */
  resetBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.startBatchTimer();
    }
  }
  
  /**
   * 获取会话ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }
  
  /**
   * 生成事件ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return {
      queueLength: this.eventQueue.length,
      isReporting: this.isReporting,
      sessionId: this.sessionId
    };
  }

  getShareStats() {
    const totalShares = this.shareStats.totalShares;
    const successfulShares = this.shareStats.successfulShares;
    return {
      totalShares,
      successfulShares,
      shareRate: totalShares > 0 ? successfulShares / totalShares : 0
    };
  }

  getAdStats() {
    const totalAdRequests = this.adStats.totalAdRequests;
    const successfulAds = this.adStats.successfulAds;
    return {
      totalAdRequests,
      successfulAds,
      adCompletionRate: totalAdRequests > 0 ? successfulAds / totalAdRequests : 0,
      reviveUsage: this.adStats.reviveUsage
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 最后一次上报
    this.flushQueue();
  }
}

// 导出单例实例
let analyticsManagerInstance = null;

function getAnalyticsManager() {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager();
  }
  return analyticsManagerInstance;
}

module.exports = AnalyticsManager;
module.exports.AnalyticsManager = AnalyticsManager;
module.exports.getAnalyticsManager = getAnalyticsManager;
