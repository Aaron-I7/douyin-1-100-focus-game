/**
 * AdErrorHandler - 广告错误处理器
 * 
 * 功能：
 * - 捕获广告加载错误
 * - 显示友好提示
 * - 不阻塞游戏流程
 * - 提供降级方案
 * - 自动重试机制
 */

class AdErrorHandler {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.errorHistory = [];
    this.maxErrorHistory = 10;
    this.retryAttempts = new Map(); // 记录每种错误的重试次数
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000; // 5秒后重试
  }
  
  /**
   * 处理广告加载错误
   * @param {Object} error - 错误对象
   * @param {string} adType - 广告类型 ('revival' | 'hint')
   * @param {Function} retryCallback - 重试回调函数
   */
  handleAdLoadError(error, adType, retryCallback) {
    console.error(`Ad load error for ${adType}:`, error);
    
    // 记录错误历史
    this.recordError(error, adType);
    
    // 获取友好的错误消息
    const errorMessage = this.getErrorMessage(error);
    
    // 显示友好提示（不阻塞游戏）
    this.showErrorToast(errorMessage, adType);
    
    // 决定是否重试
    if (this.shouldRetry(error, adType)) {
      this.scheduleRetry(error, adType, retryCallback);
    } else {
      // 达到最大重试次数，提供降级方案
      this.provideFallback(adType);
    }
  }
  
  /**
   * 处理广告播放错误
   * @param {Object} error - 错误对象
   * @param {string} adType - 广告类型
   * @param {Function} onFail - 失败回调
   */
  handleAdPlayError(error, adType, onFail) {
    console.error(`Ad play error for ${adType}:`, error);
    
    this.recordError(error, adType);
    
    const errorMessage = this.getErrorMessage(error);
    
    // 显示错误提示
    this.showErrorDialog(errorMessage, adType, () => {
      if (onFail) onFail(errorMessage);
    });
  }
  
  /**
   * 获取友好的错误消息
   * @param {Object} error - 错误对象
   * @returns {string} 友好的错误消息
   */
  getErrorMessage(error) {
    if (!error) {
      return '未知错误';
    }
    
    // 根据错误代码返回友好消息
    if (error.errCode) {
      switch (error.errCode) {
        case 1000:
          return '广告配置错误，请联系开发者';
        case 1001:
          return '网络连接异常，请检查网络后重试';
        case 1002:
          return '暂时没有广告，请稍后再试';
        case 1003:
          return '广告加载超时，请重试';
        case 1004:
          return '广告频次限制，请稍后再试';
        case 1005:
          return '广告不可用，请稍后再试';
        case 2001:
          return '广告播放被中断';
        case 2002:
          return '广告播放失败';
        case 2003:
          return '用户取消了广告播放';
        default:
          return `广告错误 (${error.errCode})`;
      }
    }
    
    // 根据错误消息返回友好提示
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network')) {
        return '网络连接异常，请检查网络';
      } else if (message.includes('timeout')) {
        return '请求超时，请重试';
      } else if (message.includes('not available')) {
        return '广告暂不可用';
      } else if (message.includes('frequency')) {
        return '广告观看次数过多，请稍后再试';
      }
    }
    
    return '广告加载失败，请稍后重试';
  }
  
  /**
   * 显示错误提示（Toast 形式，不阻塞游戏）
   * @param {string} message - 错误消息
   * @param {string} adType - 广告类型
   */
  showErrorToast(message, adType) {
    const toastData = {
      type: 'error',
      message: message,
      duration: 3000, // 3秒后自动消失
      position: 'top',
      blocking: false // 不阻塞游戏
    };
    
    // 通过 UI 管理器显示 Toast
    if (this.uiManager && this.uiManager.showToast) {
      this.uiManager.showToast(toastData);
    } else {
      // 降级到控制台输出
      console.warn(`Ad Error Toast: ${message}`);
    }
  }
  
  /**
   * 显示错误对话框（用于播放失败等需要用户确认的情况）
   * @param {string} message - 错误消息
   * @param {string} adType - 广告类型
   * @param {Function} onConfirm - 确认回调
   */
  showErrorDialog(message, adType, onConfirm) {
    const dialogData = {
      type: 'error',
      title: '广告播放失败',
      message: message,
      buttons: [
        {
          text: '确定',
          type: 'primary',
          action: onConfirm
        }
      ],
      blocking: true // 需要用户确认
    };
    
    // 通过 UI 管理器显示对话框
    if (this.uiManager && this.uiManager.showDialog) {
      this.uiManager.showDialog(dialogData);
    } else {
      // 降级到控制台输出并直接调用回调
      console.warn(`Ad Error Dialog: ${message}`);
      if (onConfirm) onConfirm();
    }
  }
  
  /**
   * 记录错误历史
   * @param {Object} error - 错误对象
   * @param {string} adType - 广告类型
   */
  recordError(error, adType) {
    const errorRecord = {
      timestamp: Date.now(),
      adType: adType,
      errorCode: error.errCode || 'unknown',
      errorMessage: error.message || 'Unknown error',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    this.errorHistory.push(errorRecord);
    
    // 保持错误历史记录在限制范围内
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }
  
  /**
   * 判断是否应该重试
   * @param {Object} error - 错误对象
   * @param {string} adType - 广告类型
   * @returns {boolean} 是否应该重试
   */
  shouldRetry(error, adType) {
    const errorKey = `${adType}_${error.errCode || 'unknown'}`;
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;
    
    // 检查是否达到最大重试次数
    if (currentAttempts >= this.maxRetryAttempts) {
      return false;
    }
    
    // 某些错误不应该重试
    const nonRetryableErrors = [1000, 1004, 2003]; // 配置错误、频次限制、用户取消
    if (error.errCode && nonRetryableErrors.includes(error.errCode)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 安排重试
   * @param {Object} error - 错误对象
   * @param {string} adType - 广告类型
   * @param {Function} retryCallback - 重试回调
   */
  scheduleRetry(error, adType, retryCallback) {
    const errorKey = `${adType}_${error.errCode || 'unknown'}`;
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;
    
    // 增加重试次数
    this.retryAttempts.set(errorKey, currentAttempts + 1);
    
    // 计算重试延迟（指数退避）
    const delay = this.retryDelay * Math.pow(2, currentAttempts);
    
    console.log(`Scheduling retry for ${adType} in ${delay}ms (attempt ${currentAttempts + 1})`);
    
    setTimeout(() => {
      if (retryCallback) {
        retryCallback();
      }
    }, delay);
  }
  
  /**
   * 提供降级方案
   * @param {string} adType - 广告类型
   */
  provideFallback(adType) {
    console.log(`Providing fallback for ${adType} after max retry attempts`);
    
    let fallbackMessage = '';
    
    switch (adType) {
      case 'revival':
        fallbackMessage = '复活功能暂时不可用，但你可以重新开始游戏继续挑战！';
        break;
      case 'hint':
        fallbackMessage = '提示功能暂时不可用，相信你可以凭借自己的能力找到答案！';
        break;
      default:
        fallbackMessage = '广告功能暂时不可用，但不影响游戏体验。';
    }
    
    // 显示降级提示
    this.showErrorToast(fallbackMessage, adType);
  }
  
  /**
   * 重置重试计数器（新游戏开始时调用）
   */
  resetRetryCounters() {
    this.retryAttempts.clear();
    console.log('Ad error handler retry counters reset');
  }
  
  /**
   * 获取错误统计信息
   * @returns {Object} 错误统计
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByType: {},
      errorsByCode: {},
      recentErrors: this.errorHistory.slice(-5) // 最近5个错误
    };
    
    this.errorHistory.forEach(error => {
      // 按广告类型统计
      stats.errorsByType[error.adType] = (stats.errorsByType[error.adType] || 0) + 1;
      
      // 按错误代码统计
      stats.errorsByCode[error.errorCode] = (stats.errorsByCode[error.errorCode] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * 检查广告环境健康状况
   * @returns {Object} 健康状况报告
   */
  checkAdEnvironmentHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };
    
    // 检查错误频率
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 300000 // 最近5分钟
    );
    
    if (recentErrors.length > 5) {
      health.status = 'unhealthy';
      health.issues.push('广告错误频率过高');
      health.recommendations.push('建议暂时禁用广告功能');
    }
    
    // 检查网络相关错误
    const networkErrors = this.errorHistory.filter(
      error => error.errorCode === 1001 || error.errorMessage.includes('network')
    );
    
    if (networkErrors.length > 3) {
      health.status = 'degraded';
      health.issues.push('网络连接不稳定');
      health.recommendations.push('建议提示用户检查网络连接');
    }
    
    return health;
  }
  
  /**
   * 清理错误历史记录
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.retryAttempts.clear();
    console.log('Ad error history cleared');
  }
}

// 导出 AdErrorHandler 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdErrorHandler;
} else if (typeof window !== 'undefined') {
  window.AdErrorHandler = AdErrorHandler;
}