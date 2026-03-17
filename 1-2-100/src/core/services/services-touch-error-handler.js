/**
 * 触摸事件错误处理器
 * 处理触摸事件异常，记录错误日志，不中断游戏
 */
class TouchErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogEntries = 50;
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.errorThrottleMs = 1000; // 错误节流，1秒内相同错误只记录一次
  }

  /**
   * 安全执行触摸处理函数
   * @param {Function} handler 触摸处理函数
   * @param {Object} event 触摸事件对象
   * @param {string} handlerName 处理器名称
   * @returns {*} 处理结果或 null
   */
  safeExecute(handler, event, handlerName = 'unknown') {
    try {
      if (typeof handler !== 'function') {
        throw new Error(`Handler is not a function: ${handlerName}`);
      }

      return handler(event);
    } catch (error) {
      this.handleTouchError(error, event, handlerName);
      return null;
    }
  }

  /**
   * 处理触摸错误
   * @param {Error} error 错误对象
   * @param {Object} event 触摸事件对象
   * @param {string} handlerName 处理器名称
   */
  handleTouchError(error, event, handlerName) {
    const now = Date.now();
    
    // 错误节流：避免短时间内重复记录相同错误
    if (this.shouldThrottleError(error, now)) {
      return;
    }

    this.errorCount++;
    this.lastErrorTime = now;

    const errorEntry = this.createErrorEntry(error, event, handlerName, now);
    this.addToErrorLog(errorEntry);

    // 输出错误到控制台
    console.error(`Touch event error in ${handlerName}:`, error);
    console.error('Event details:', this.sanitizeEventForLogging(event));

    // 尝试上报错误
    this.reportTouchError(errorEntry);
  }
  /**
   * 判断是否应该节流错误
   * @param {Error} error 错误对象
   * @param {number} now 当前时间戳
   * @returns {boolean} 是否应该节流
   */
  shouldThrottleError(error, now) {
    if (now - this.lastErrorTime < this.errorThrottleMs) {
      // 检查是否是相同类型的错误
      const lastError = this.errorLog[this.errorLog.length - 1];
      if (lastError && lastError.error.message === error.message) {
        return true;
      }
    }
    return false;
  }

  /**
   * 创建错误条目
   * @param {Error} error 错误对象
   * @param {Object} event 触摸事件对象
   * @param {string} handlerName 处理器名称
   * @param {number} timestamp 时间戳
   * @returns {Object} 错误条目
   */
  createErrorEntry(error, event, handlerName, timestamp) {
    return {
      id: `touch_error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      handlerName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      event: this.sanitizeEventForLogging(event),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      gameState: this.getCurrentGameState()
    };
  }

  /**
   * 清理事件对象用于日志记录
   * @param {Object} event 触摸事件对象
   * @returns {Object} 清理后的事件对象
   */
  sanitizeEventForLogging(event) {
    if (!event) return null;

    try {
      return {
        type: event.type,
        touches: event.touches ? Array.from(event.touches).map(touch => ({
          identifier: touch.identifier,
          clientX: touch.clientX,
          clientY: touch.clientY,
          pageX: touch.pageX,
          pageY: touch.pageY
        })) : [],
        changedTouches: event.changedTouches ? Array.from(event.changedTouches).map(touch => ({
          identifier: touch.identifier,
          clientX: touch.clientX,
          clientY: touch.clientY,
          pageX: touch.pageX,
          pageY: touch.pageY
        })) : [],
        timestamp: event.timeStamp || Date.now()
      };
    } catch (sanitizeError) {
      console.warn('Failed to sanitize event for logging:', sanitizeError);
      return { error: 'Failed to sanitize event' };
    }
  }

  /**
   * 获取当前游戏状态
   * @returns {Object} 游戏状态信息
   */
  getCurrentGameState() {
    try {
      // 尝试获取全局游戏状态
      if (typeof window !== 'undefined' && window.gameManager) {
        return {
          state: window.gameManager.state,
          level: window.gameManager.currentLevel,
          currentNumber: window.gameManager.currentNumber,
          errors: window.gameManager.errors
        };
      }
      return { status: 'game_state_unavailable' };
    } catch (error) {
      return { status: 'game_state_error', error: error.message };
    }
  }

  /**
   * 添加错误到日志
   * @param {Object} errorEntry 错误条目
   */
  addToErrorLog(errorEntry) {
    this.errorLog.push(errorEntry);

    // 限制日志数量
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.shift(); // 移除最旧的条目
    }
  }

  /**
   * 上报触摸错误
   * @param {Object} errorEntry 错误条目
   */
  reportTouchError(errorEntry) {
    try {
      // 尝试上报到分析系统
      if (typeof window !== 'undefined' && window.analyticsManager) {
        window.analyticsManager.trackEvent('touch_event_error', {
          handler_name: errorEntry.handlerName,
          error_message: errorEntry.error.message,
          error_name: errorEntry.error.name,
          touch_count: errorEntry.event.touches ? errorEntry.event.touches.length : 0,
          timestamp: errorEntry.timestamp
        });
      }

      // 尝试上报到错误监控系统
      if (typeof window !== 'undefined' && window.errorReporter) {
        window.errorReporter.reportError('touch_event', errorEntry);
      }
    } catch (reportError) {
      console.error('Failed to report touch error:', reportError);
    }
  }

  /**
   * 包装触摸处理器
   * @param {Function} handler 原始处理器
   * @param {string} handlerName 处理器名称
   * @returns {Function} 包装后的处理器
   */
  wrapTouchHandler(handler, handlerName) {
    return (event) => {
      return this.safeExecute(handler, event, handlerName);
    };
  }

  /**
   * 批量包装触摸处理器
   * @param {Object} handlers 处理器对象
   * @returns {Object} 包装后的处理器对象
   */
  wrapTouchHandlers(handlers) {
    const wrappedHandlers = {};
    
    for (const [name, handler] of Object.entries(handlers)) {
      if (typeof handler === 'function') {
        wrappedHandlers[name] = this.wrapTouchHandler(handler, name);
      } else {
        wrappedHandlers[name] = handler;
      }
    }
    
    return wrappedHandlers;
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计信息
   */
  getErrorStats() {
    const now = Date.now();
    const recentErrors = this.errorLog.filter(entry => 
      now - entry.timestamp < 60000 // 最近1分钟的错误
    );

    const errorsByHandler = {};
    this.errorLog.forEach(entry => {
      const handler = entry.handlerName;
      errorsByHandler[handler] = (errorsByHandler[handler] || 0) + 1;
    });

    return {
      totalErrors: this.errorCount,
      recentErrors: recentErrors.length,
      errorsByHandler,
      lastErrorTime: this.lastErrorTime,
      logEntries: this.errorLog.length
    };
  }

  /**
   * 获取错误日志
   * @param {number} limit 返回条目数限制
   * @returns {Array} 错误日志数组
   */
  getErrorLog(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * 清空错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * 设置错误日志最大条目数
   * @param {number} maxEntries 最大条目数
   */
  setMaxLogEntries(maxEntries) {
    this.maxLogEntries = Math.max(10, Math.min(100, maxEntries));
    
    // 如果当前日志超过新的限制，截断
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * 设置错误节流时间
   * @param {number} throttleMs 节流时间（毫秒）
   */
  setErrorThrottle(throttleMs) {
    this.errorThrottleMs = Math.max(100, Math.min(10000, throttleMs));
  }

  /**
   * 检查是否有频繁错误
   * @returns {boolean} 是否有频繁错误
   */
  hasFrequentErrors() {
    const now = Date.now();
    const recentErrors = this.errorLog.filter(entry => 
      now - entry.timestamp < 30000 // 最近30秒
    );
    
    return recentErrors.length > 5; // 30秒内超过5个错误认为是频繁错误
  }

  /**
   * 获取错误报告
   * @returns {Object} 错误报告
   */
  generateErrorReport() {
    const stats = this.getErrorStats();
    const recentLog = this.getErrorLog(5);
    
    return {
      summary: {
        totalErrors: stats.totalErrors,
        recentErrors: stats.recentErrors,
        hasFrequentErrors: this.hasFrequentErrors(),
        lastErrorTime: stats.lastErrorTime
      },
      errorsByHandler: stats.errorsByHandler,
      recentErrorLog: recentLog,
      systemInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: Date.now(),
        logCapacity: this.maxLogEntries,
        throttleMs: this.errorThrottleMs
      }
    };
  }
}

export default TouchErrorHandler;