/**
 * 错误日志系统
 * 记录错误类型、消息、堆栈，限制日志数量，支持上报到数据分析
 */
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogEntries = 50;
    this.logId = 0;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.reportQueue = [];
    this.reportBatchSize = 5;
    this.reportInterval = 30000; // 30秒
    this.lastReportTime = 0;
    
    this.setupPeriodicReporting();
  }

  /**
   * 生成会话ID
   * @returns {string} 会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置定期上报
   */
  setupPeriodicReporting() {
    setInterval(() => {
      this.flushReportQueue();
    }, this.reportInterval);
  }

  /**
   * 记录错误
   * @param {string} type 错误类型
   * @param {string} message 错误消息
   * @param {string} stack 错误堆栈
   * @param {Object} context 上下文信息
   * @returns {string} 日志ID
   */
  logError(type, message, stack, context = {}) {
    const logEntry = this.createLogEntry(type, message, stack, context);
    this.addLogEntry(logEntry);
    this.queueForReporting(logEntry);
    
    console.error(`[ErrorLogger] ${type}: ${message}`, logEntry);
    
    return logEntry.id;
  }

  /**
   * 记录异常对象
   * @param {Error} error 异常对象
   * @param {string} type 错误类型
   * @param {Object} context 上下文信息
   * @returns {string} 日志ID
   */
  logException(error, type = 'exception', context = {}) {
    const message = error.message || 'Unknown error';
    const stack = error.stack || 'No stack trace available';
    
    return this.logError(type, message, stack, {
      ...context,
      errorName: error.name,
      errorConstructor: error.constructor.name
    });
  }

  /**
   * 记录自定义错误
   * @param {string} category 错误分类
   * @param {string} message 错误消息
   * @param {Object} details 详细信息
   * @returns {string} 日志ID
   */
  logCustomError(category, message, details = {}) {
    return this.logError(category, message, 'Custom error - no stack trace', details);
  }

  /**
   * 创建日志条目
   * @param {string} type 错误类型
   * @param {string} message 错误消息
   * @param {string} stack 错误堆栈
   * @param {Object} context 上下文信息
   * @returns {Object} 日志条目
   */
  createLogEntry(type, message, stack, context) {
    this.logId++;
    
    return {
      id: `log_${this.sessionId}_${this.logId}`,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type,
      message,
      stack,
      context: {
        ...context,
        url: typeof location !== 'undefined' ? location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        gameState: this.getCurrentGameState(),
        systemInfo: this.getSystemInfo(),
        memoryInfo: this.getMemoryInfo()
      },
      severity: this.determineSeverity(type, message),
      fingerprint: this.generateFingerprint(type, message, stack)
    };
  }

  /**
   * 添加日志条目
   * @param {Object} logEntry 日志条目
   */
  addLogEntry(logEntry) {
    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogEntries) {
      const removedEntries = this.logs.splice(0, this.logs.length - this.maxLogEntries);
      console.log(`Removed ${removedEntries.length} old log entries`);
    }
  }

  /**
   * 确定错误严重程度
   * @param {string} type 错误类型
   * @param {string} message 错误消息
   * @returns {string} 严重程度
   */
  determineSeverity(type, message) {
    const criticalKeywords = ['crash', 'fatal', 'critical', 'canvas', 'memory'];
    const warningKeywords = ['warning', 'deprecated', 'fallback'];
    
    const lowerMessage = message.toLowerCase();
    const lowerType = type.toLowerCase();
    
    if (criticalKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerType.includes(keyword)
    )) {
      return 'critical';
    }
    
    if (warningKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerType.includes(keyword)
    )) {
      return 'warning';
    }
    
    return 'error';
  }

  /**
   * 生成错误指纹（用于去重）
   * @param {string} type 错误类型
   * @param {string} message 错误消息
   * @param {string} stack 错误堆栈
   * @returns {string} 错误指纹
   */
  generateFingerprint(type, message, stack) {
    // 提取堆栈的关键部分
    const stackLines = stack.split('\n').slice(0, 3);
    const stackKey = stackLines.join('|');
    
    // 生成简单的哈希
    const combined = `${type}:${message}:${stackKey}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36);
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
      return null;
    } catch (error) {
      return { error: 'Failed to get game state' };
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
      
      if (typeof window !== 'undefined') {
        return {
          platform: 'web',
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio || 1
        };
      }
      
      return null;
    } catch (error) {
      return { error: 'Failed to get system info' };
    }
  }

  /**
   * 获取内存信息
   * @returns {Object} 内存信息
   */
  getMemoryInfo() {
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    } catch (error) {
      return { error: 'Failed to get memory info' };
    }
  }

  /**
   * 加入上报队列
   * @param {Object} logEntry 日志条目
   */
  queueForReporting(logEntry) {
    this.reportQueue.push(logEntry);
    
    // 如果队列满了或者是严重错误，立即上报
    if (this.reportQueue.length >= this.reportBatchSize || logEntry.severity === 'critical') {
      this.flushReportQueue();
    }
  }

  /**
   * 刷新上报队列
   */
  async flushReportQueue() {
    if (this.reportQueue.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - this.lastReportTime < 5000) {
      // 避免过于频繁的上报
      return;
    }

    const logsToReport = [...this.reportQueue];
    this.reportQueue = [];
    this.lastReportTime = now;

    try {
      await this.reportLogs(logsToReport);
      console.log(`Reported ${logsToReport.length} error logs`);
    } catch (error) {
      console.error('Failed to report error logs:', error);
      
      // 上报失败，重新加入队列（但限制重试次数）
      logsToReport.forEach(log => {
        if (!log.reportAttempts) {
          log.reportAttempts = 0;
        }
        log.reportAttempts++;
        
        if (log.reportAttempts < 3) {
          this.reportQueue.push(log);
        }
      });
    }
  }

  /**
   * 上报日志到分析系统
   * @param {Array} logs 日志数组
   */
  async reportLogs(logs) {
    // 上报到分析系统
    if (typeof window !== 'undefined' && window.analyticsManager) {
      for (const log of logs) {
        window.analyticsManager.trackEvent('error_log', {
          log_id: log.id,
          session_id: log.sessionId,
          error_type: log.type,
          error_message: log.message,
          severity: log.severity,
          fingerprint: log.fingerprint,
          timestamp: log.timestamp
        });
      }
    }

    // 上报到错误监控系统
    if (typeof window !== 'undefined' && window.errorReporter) {
      await window.errorReporter.reportBatch('error_logs', logs);
    }

    // 上报到云函数（如果可用）
    if (typeof tt !== 'undefined' && tt.cloud && tt.cloud.callFunction) {
      try {
        await tt.cloud.callFunction({
          name: 'report_errors',
          data: {
            sessionId: this.sessionId,
            logs: logs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              type: log.type,
              message: log.message,
              severity: log.severity,
              fingerprint: log.fingerprint,
              context: {
                gameState: log.context.gameState,
                systemInfo: log.context.systemInfo
              }
            }))
          }
        });
      } catch (cloudError) {
        console.warn('Failed to report to cloud function:', cloudError);
      }
    }
  }

  /**
   * 获取日志统计
   * @returns {Object} 日志统计
   */
  getLogStats() {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;

    const recentLogs = this.logs.filter(log => log.timestamp > last24Hours);
    const hourlyLogs = this.logs.filter(log => log.timestamp > lastHour);

    const severityCount = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {});

    const typeCount = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalLogs: this.logs.length,
      recentLogs: recentLogs.length,
      hourlyLogs: hourlyLogs.length,
      severityCount,
      typeCount,
      sessionId: this.sessionId,
      sessionDuration: now - this.startTime,
      queuedForReport: this.reportQueue.length
    };
  }

  /**
   * 获取日志
   * @param {Object} filters 过滤条件
   * @returns {Array} 过滤后的日志
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp > filters.since);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    this.reportQueue = [];
    console.log('Error logs cleared');
  }

  /**
   * 导出日志（用于调试）
   * @returns {string} JSON 格式的日志
   */
  exportLogs() {
    const exportData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      exportTime: Date.now(),
      stats: this.getLogStats(),
      logs: this.logs
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 设置最大日志条目数
   * @param {number} maxEntries 最大条目数
   */
  setMaxLogEntries(maxEntries) {
    this.maxLogEntries = Math.max(10, Math.min(200, maxEntries));
    
    // 如果当前日志超过新的限制，截断
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  /**
   * 设置上报批次大小
   * @param {number} batchSize 批次大小
   */
  setReportBatchSize(batchSize) {
    this.reportBatchSize = Math.max(1, Math.min(20, batchSize));
  }

  /**
   * 手动触发上报
   */
  async forceReport() {
    await this.flushReportQueue();
  }
}

export default ErrorLogger;