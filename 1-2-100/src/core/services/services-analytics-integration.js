/**
 * AnalyticsIntegration - 数据分析集成
 * 将数据分析功能集成到游戏流程中的关键节点
 * 
 * 功能：
 * - 游戏流程关键节点的数据上报
 * - 错误处理和降级方案
 * - 不阻塞游戏流程
 * - 性能优化
 */

const { getGameAnalytics } = require('./services-game-analytics');
const { getErrorClickTracker } = require('./services-error-click-tracker');

class AnalyticsIntegration {
  constructor() {
    this.gameAnalytics = getGameAnalytics();
    this.errorClickTracker = getErrorClickTracker();
    this.isEnabled = true;
    this.errorCount = 0;
    this.maxErrors = 10; // 最大错误次数，超过后禁用分析
  }
  
  /**
   * 游戏开始时的数据上报
   * @param {Object} gameConfig - 游戏配置
   */
  onGameStart(gameConfig) {
    if (!this.isEnabled) return;
    
    try {
      this.gameAnalytics.trackGameStart(gameConfig);
      this.resetErrorCount();
    } catch (error) {
      this.handleAnalyticsError('game_start', error);
    }
  }
  
  /**
   * 游戏完成时的数据上报
   * @param {Object} gameResult - 游戏结果
   */
  onGameComplete(gameResult) {
    if (!this.isEnabled) return;
    
    try {
      this.gameAnalytics.trackGameComplete(gameResult);
    } catch (error) {
      this.handleAnalyticsError('game_complete', error);
    }
  }
  
  /**
   * 游戏失败时的数据上报
   * @param {Object} failureInfo - 失败信息
   */
  onGameFailure(failureInfo) {
    if (!this.isEnabled) return;
    
    try {
      this.gameAnalytics.trackGameFailure(failureInfo);
    } catch (error) {
      this.handleAnalyticsError('game_failure', error);
    }
  }
  
  /**
   * 错误点击时的数据上报
   * @param {Object} clickInfo - 点击信息
   */
  onErrorClick(clickInfo) {
    if (!this.isEnabled) return;
    
    try {
      // 上报到游戏分析
      this.gameAnalytics.trackErrorClick(clickInfo);
      
      // 记录到错误点击跟踪器
      const gameSession = this.gameAnalytics.getCurrentGameSession();
      if (gameSession) {
        this.errorClickTracker.recordErrorClick({
          gameSessionId: gameSession.sessionId,
          level: gameSession.level,
          ...clickInfo
        });
      }
    } catch (error) {
      this.handleAnalyticsError('error_click', error);
    }
  }
  
  /**
   * 关卡过渡时的数据上报
   * @param {Object} transitionInfo - 过渡信息
   */
  onLevelTransition(transitionInfo) {
    if (!this.isEnabled) return;
    
    try {
      this.gameAnalytics.trackLevelTransition(transitionInfo);
    } catch (error) {
      this.handleAnalyticsError('level_transition', error);
    }
  }
  
  /**
   * 自选模式解锁时的数据上报
   */
  onCustomModeUnlock() {
    if (!this.isEnabled) return;
    
    try {
      this.gameAnalytics.trackCustomModeUnlock();
    } catch (error) {
      this.handleAnalyticsError('custom_mode_unlock', error);
    }
  }
  
  /**
   * 分享事件的数据上报
   * @param {Object} shareInfo - 分享信息
   */
  onShare(shareInfo) {
    if (!this.isEnabled) return;
    
    try {
      const { platform, content, success } = shareInfo;
      
      this.gameAnalytics.analyticsManager.trackEvent('share_event', {
        platform: platform,
        contentType: content.type,
        success: success,
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleAnalyticsError('share_event', error);
    }
  }
  
  /**
   * 广告事件的数据上报
   * @param {Object} adInfo - 广告信息
   */
  onAdEvent(adInfo) {
    if (!this.isEnabled) return;
    
    try {
      const { type, action, success, reward } = adInfo;
      
      this.gameAnalytics.analyticsManager.trackEvent('ad_event', {
        adType: type,        // 'rewarded_video'
        action: action,      // 'show' | 'complete' | 'close' | 'error'
        success: success,
        reward: reward,      // 'revival' | 'hint'
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleAnalyticsError('ad_event', error);
    }
  }
  
  /**
   * 用户行为事件的数据上报
   * @param {Object} behaviorInfo - 行为信息
   */
  onUserBehavior(behaviorInfo) {
    if (!this.isEnabled) return;
    
    try {
      const { action, context, duration } = behaviorInfo;
      
      this.gameAnalytics.analyticsManager.trackEvent('user_behavior', {
        action: action,      // 'pause' | 'resume' | 'menu_open' | 'settings_change'
        context: context,
        duration: duration,
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleAnalyticsError('user_behavior', error);
    }
  }
  
  /**
   * 性能事件的数据上报
   * @param {Object} performanceInfo - 性能信息
   */
  onPerformanceEvent(performanceInfo) {
    if (!this.isEnabled) return;
    
    try {
      const { metric, value, context } = performanceInfo;
      
      this.gameAnalytics.analyticsManager.trackEvent('performance_metric', {
        metric: metric,      // 'fps' | 'load_time' | 'render_time'
        value: value,
        context: context,
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleAnalyticsError('performance_metric', error);
    }
  }
  
  /**
   * 处理分析错误
   * @param {string} eventType - 事件类型
   * @param {Error} error - 错误对象
   */
  handleAnalyticsError(eventType, error) {
    console.error(`Analytics error for ${eventType}:`, error);
    
    this.errorCount++;
    
    // 错误次数过多时禁用分析
    if (this.errorCount >= this.maxErrors) {
      console.warn('Too many analytics errors, disabling analytics');
      this.isEnabled = false;
    }
    
    // 记录错误到本地（用于调试）
    this.logErrorLocally(eventType, error);
  }
  
  /**
   * 本地错误日志记录
   * @param {string} eventType - 事件类型
   * @param {Error} error - 错误对象
   */
  logErrorLocally(eventType, error) {
    try {
      const errorLog = {
        eventType: eventType,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
      
      if (typeof tt !== 'undefined') {
        const existingLogs = this.getLocalErrorLogs();
        existingLogs.push(errorLog);
        
        // 限制日志数量
        if (existingLogs.length > 20) {
          existingLogs.splice(0, existingLogs.length - 20);
        }
        
        tt.setStorageSync({
          key: 'analytics_error_logs',
          data: JSON.stringify(existingLogs)
        });
      }
    } catch (logError) {
      console.error('Failed to log analytics error:', logError);
    }
  }
  
  /**
   * 获取本地错误日志
   */
  getLocalErrorLogs() {
    try {
      if (typeof tt !== 'undefined') {
        const data = tt.getStorageSync({ key: 'analytics_error_logs' });
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('Failed to get local error logs:', error);
    }
    return [];
  }
  
  /**
   * 重置错误计数
   */
  resetErrorCount() {
    this.errorCount = 0;
  }
  
  /**
   * 启用分析
   */
  enable() {
    this.isEnabled = true;
    this.resetErrorCount();
  }
  
  /**
   * 禁用分析
   */
  disable() {
    this.isEnabled = false;
  }
  
  /**
   * 获取分析状态
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      errorCount: this.errorCount,
      maxErrors: this.maxErrors
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    try {
      this.errorClickTracker.destroy();
    } catch (error) {
      console.error('Failed to destroy error click tracker:', error);
    }
  }
}

// 导出单例实例
let analyticsIntegrationInstance = null;

function getAnalyticsIntegration() {
  if (!analyticsIntegrationInstance) {
    analyticsIntegrationInstance = new AnalyticsIntegration();
  }
  return analyticsIntegrationInstance;
}

module.exports = {
  AnalyticsIntegration,
  getAnalyticsIntegration
};