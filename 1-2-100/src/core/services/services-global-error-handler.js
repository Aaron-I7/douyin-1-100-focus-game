/**
 * 全局异常捕获器
 * 使用 tt.onError 捕获未处理异常，显示友好错误对话框，提供重新开始选项
 */
class GlobalErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.errorThreshold = 5; // 5分钟内超过此数量的错误将触发特殊处理
    this.errorTimeWindow = 5 * 60 * 1000; // 5分钟
    this.criticalErrors = [];
    this.onRestartCallback = null;
    
    this.setupGlobalErrorHandling();
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    if (this.isInitialized) {
      return;
    }

    // 抖音小游戏全局错误处理
    if (typeof tt !== 'undefined' && tt.onError) {
      tt.onError((error) => {
        this.handleGlobalError(error, 'tt.onError');
      });
      console.log('Douyin global error handler registered');
    }

    // Web 环境全局错误处理
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleGlobalError({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }, 'window.error');
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleGlobalError({
          message: 'Unhandled Promise Rejection',
          reason: event.reason,
          promise: event.promise
        }, 'unhandledrejection');
      });
      
      console.log('Web global error handlers registered');
    }

    this.isInitialized = true;
  }

  /**
   * 处理全局错误
   * @param {Object} error 错误对象
   * @param {string} source 错误来源
   */
  handleGlobalError(error, source) {
    const now = Date.now();
    this.errorCount++;
    this.lastErrorTime = now;

    const errorInfo = this.createErrorInfo(error, source, now);
    this.criticalErrors.push(errorInfo);

    // 限制错误记录数量
    if (this.criticalErrors.length > 20) {
      this.criticalErrors.shift();
    }

    console.error(`Global error from ${source}:`, error);
    console.error('Error details:', errorInfo);

    // 上报错误
    this.reportGlobalError(errorInfo);

    // 检查是否需要特殊处理
    if (this.shouldShowCriticalErrorDialog(now)) {
      this.showCriticalErrorDialog(errorInfo);
    } else {
      this.showFriendlyErrorDialog(errorInfo);
    }
  }

  /**
   * 创建错误信息对象
   * @param {Object} error 原始错误
   * @param {string} source 错误来源
   * @param {number} timestamp 时间戳
   * @returns {Object} 错误信息
   */
  createErrorInfo(error, source, timestamp) {
    const errorInfo = {
      id: `global_error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      source,
      message: this.extractErrorMessage(error),
      stack: this.extractErrorStack(error),
      filename: error.filename || 'unknown',
      lineno: error.lineno || 0,
      colno: error.colno || 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      gameState: this.getCurrentGameState(),
      systemInfo: this.getSystemInfo()
    };

    return errorInfo;
  }

  /**
   * 提取错误消息
   * @param {Object} error 错误对象
   * @returns {string} 错误消息
   */
  extractErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && error.message) {
      return error.message;
    }
    
    if (error && error.reason) {
      return typeof error.reason === 'string' ? error.reason : error.reason.message || 'Unknown reason';
    }
    
    return 'Unknown error';
  }

  /**
   * 提取错误堆栈
   * @param {Object} error 错误对象
   * @returns {string} 错误堆栈
   */
  extractErrorStack(error) {
    if (error && error.error && error.error.stack) {
      return error.error.stack;
    }
    
    if (error && error.stack) {
      return error.stack;
    }
    
    if (error && error.reason && error.reason.stack) {
      return error.reason.stack;
    }
    
    return 'No stack trace available';
  }

  /**
   * 获取当前游戏状态
   * @returns {Object} 游戏状态
   */
  getCurrentGameState() {
    try {
      if (typeof window !== 'undefined' && window.gameManager) {
        return {
          state: window.gameManager.state,
          level: window.gameManager.currentLevel,
          currentNumber: window.gameManager.currentNumber,
          errors: window.gameManager.errors,
          elapsedTime: window.gameManager.elapsedTime
        };
      }
      return { status: 'unavailable' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * 获取系统信息
   * @returns {Object} 系统信息
   */
  getSystemInfo() {
    try {
      if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
        return tt.getSystemInfoSync();
      }
      return { platform: 'web', timestamp: Date.now() };
    } catch (error) {
      return { platform: 'unknown', error: error.message };
    }
  }

  /**
   * 判断是否应该显示严重错误对话框
   * @param {number} now 当前时间戳
   * @returns {boolean} 是否显示严重错误对话框
   */
  shouldShowCriticalErrorDialog(now) {
    // 检查时间窗口内的错误数量
    const recentErrors = this.criticalErrors.filter(error => 
      now - error.timestamp < this.errorTimeWindow
    );
    
    return recentErrors.length >= this.errorThreshold;
  }

  /**
   * 显示友好的错误对话框
   * @param {Object} errorInfo 错误信息
   */
  showFriendlyErrorDialog(errorInfo) {
    const message = '游戏遇到了一个小问题，但不用担心！\n\n' +
                   '您可以：\n' +
                   '• 继续游戏\n' +
                   '• 重新开始\n' +
                   '• 如果问题持续，请重启应用';

    this.showErrorDialog('游戏提示', message, [
      {
        text: '继续游戏',
        action: 'continue'
      },
      {
        text: '重新开始',
        action: 'restart'
      }
    ]);
  }

  /**
   * 显示严重错误对话框
   * @param {Object} errorInfo 错误信息
   */
  showCriticalErrorDialog(errorInfo) {
    const message = '游戏遇到了多个错误，建议重新开始以获得最佳体验。\n\n' +
                   '如果问题持续出现，请尝试：\n' +
                   '• 重启抖音应用\n' +
                   '• 检查网络连接\n' +
                   '• 清理设备存储空间\n' +
                   '• 联系客服反馈问题';

    this.showErrorDialog('需要重新开始', message, [
      {
        text: '重新开始',
        action: 'restart'
      },
      {
        text: '强制继续',
        action: 'force_continue'
      }
    ]);
  }

  /**
   * 显示错误对话框
   * @param {string} title 标题
   * @param {string} message 消息
   * @param {Array} actions 操作按钮
   */
  showErrorDialog(title, message, actions) {
    if (typeof tt !== 'undefined' && tt.showModal) {
      // 抖音环境
      const primaryAction = actions[0];
      const secondaryAction = actions[1];
      
      tt.showModal({
        title,
        content: message,
        showCancel: !!secondaryAction,
        confirmText: primaryAction.text,
        cancelText: secondaryAction ? secondaryAction.text : '取消',
        success: (res) => {
          if (res.confirm) {
            this.handleErrorDialogAction(primaryAction.action);
          } else if (res.cancel && secondaryAction) {
            this.handleErrorDialogAction(secondaryAction.action);
          }
        }
      });
    } else {
      // Web 环境降级
      const userChoice = confirm(`${title}\n\n${message}\n\n点击"确定"${actions[0].text}，点击"取消"${actions[1] ? actions[1].text : '继续'}`);
      
      if (userChoice) {
        this.handleErrorDialogAction(actions[0].action);
      } else if (actions[1]) {
        this.handleErrorDialogAction(actions[1].action);
      }
    }
  }

  /**
   * 处理错误对话框操作
   * @param {string} action 操作类型
   */
  handleErrorDialogAction(action) {
    switch (action) {
      case 'continue':
        console.log('User chose to continue after error');
        break;
        
      case 'restart':
        console.log('User chose to restart after error');
        this.restartGame();
        break;
        
      case 'force_continue':
        console.log('User chose to force continue after critical errors');
        // 清空错误记录，给用户一个干净的开始
        this.clearErrorHistory();
        break;
        
      default:
        console.log('Unknown error dialog action:', action);
    }
  }

  /**
   * 重新开始游戏
   */
  restartGame() {
    try {
      // 清空错误历史
      this.clearErrorHistory();
      
      // 调用重启回调
      if (this.onRestartCallback && typeof this.onRestartCallback === 'function') {
        this.onRestartCallback();
      } else if (typeof window !== 'undefined' && window.gameManager && window.gameManager.restart) {
        window.gameManager.restart();
      } else {
        // 降级方案：刷新页面
        if (typeof location !== 'undefined') {
          location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to restart game:', error);
      
      // 最后的降级方案
      if (typeof tt !== 'undefined' && tt.exitMiniProgram) {
        tt.showToast({
          title: '请重新打开游戏',
          icon: 'none'
        });
        setTimeout(() => {
          tt.exitMiniProgram();
        }, 2000);
      }
    }
  }

  /**
   * 清空错误历史
   */
  clearErrorHistory() {
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.criticalErrors = [];
    console.log('Error history cleared');
  }

  /**
   * 上报全局错误
   * @param {Object} errorInfo 错误信息
   */
  reportGlobalError(errorInfo) {
    try {
      // 上报到分析系统
      if (typeof window !== 'undefined' && window.analyticsManager) {
        window.analyticsManager.trackEvent('global_error', {
          source: errorInfo.source,
          message: errorInfo.message,
          filename: errorInfo.filename,
          lineno: errorInfo.lineno,
          error_count: this.errorCount
        });
      }

      // 上报到错误监控系统
      if (typeof window !== 'undefined' && window.errorReporter) {
        window.errorReporter.reportError('global', errorInfo);
      }
    } catch (reportError) {
      console.error('Failed to report global error:', reportError);
    }
  }

  /**
   * 设置重启回调
   * @param {Function} callback 重启回调函数
   */
  setRestartCallback(callback) {
    this.onRestartCallback = callback;
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计
   */
  getErrorStats() {
    const now = Date.now();
    const recentErrors = this.criticalErrors.filter(error => 
      now - error.timestamp < this.errorTimeWindow
    );

    return {
      totalErrors: this.errorCount,
      recentErrors: recentErrors.length,
      lastErrorTime: this.lastErrorTime,
      criticalErrorsCount: this.criticalErrors.length,
      timeWindow: this.errorTimeWindow,
      threshold: this.errorThreshold
    };
  }

  /**
   * 获取最近的错误日志
   * @param {number} limit 返回数量限制
   * @returns {Array} 错误日志
   */
  getRecentErrors(limit = 5) {
    return this.criticalErrors.slice(-limit);
  }

  /**
   * 手动触发错误处理（用于测试）
   * @param {string} message 错误消息
   */
  triggerTestError(message = 'Test error') {
    const testError = new Error(message);
    this.handleGlobalError(testError, 'manual_test');
  }
}

export default GlobalErrorHandler;