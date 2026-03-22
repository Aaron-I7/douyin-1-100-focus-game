/**
 * 错误处理集成模块
 * 整合所有错误处理组件，提供统一的错误处理接口
 */
import CanvasErrorHandler from './services-canvas-error-handler';
import VoronoiErrorHandler from '../shared/shared-voronoi-error-handler';
import TouchErrorHandler from './services-touch-error-handler';
import CloudServiceErrorHandler from './services-cloud-service-error-handler';
import GlobalErrorHandler from './services-global-error-handler';
import ErrorLogger from './services-error-logger';

class ErrorHandlingIntegration {
  constructor() {
    this.errorLogger = new ErrorLogger();
    this.canvasErrorHandler = new CanvasErrorHandler();
    this.touchErrorHandler = new TouchErrorHandler();
    this.cloudServiceErrorHandler = new CloudServiceErrorHandler();
    this.globalErrorHandler = new GlobalErrorHandler();
    this.voronoiErrorHandler = null; // 需要在有 VoronoiGenerator 时初始化
    
    this.setupIntegration();
  }

  /**
   * 设置集成
   */
  setupIntegration() {
    // 设置全局错误处理器的重启回调
    this.globalErrorHandler.setRestartCallback(() => {
      this.handleGameRestart();
    });

    // 将错误日志系统设置为全局可访问
    if (typeof window !== 'undefined') {
      window.errorLogger = this.errorLogger;
      window.errorHandling = this;
    }

    console.log('Error handling integration initialized');
  }

  /**
   * 初始化 Voronoi 错误处理器
   * @param {Object} voronoiGenerator Voronoi 生成器实例
   */
  initVoronoiErrorHandler(voronoiGenerator) {
    this.voronoiErrorHandler = new VoronoiErrorHandler(voronoiGenerator);
    console.log('Voronoi error handler initialized');
  }

  /**
   * 创建 Canvas（带错误处理）
   * @returns {Canvas|null} Canvas 实例或 null
   */
  createCanvas() {
    const canvas = this.canvasErrorHandler.createCanvasWithErrorHandling();
    
    if (!canvas) {
      this.errorLogger.logCustomError('canvas_creation', 'Failed to create canvas', {
        diagnosticInfo: CanvasErrorHandler.getDiagnosticInfo()
      });
    }
    
    return canvas;
  }

  /**
   * 生成 Voronoi 图（带错误处理）
   * @param {number} numSites 站点数量
   * @param {number} width 画布宽度
   * @param {number} height 画布高度
   * @returns {Promise<Array>} Cell 数组
   */
  async generateVoronoi(numSites, width, height) {
    if (!this.voronoiErrorHandler) {
      throw new Error('Voronoi error handler not initialized');
    }

    try {
      const cells = await this.voronoiErrorHandler.generateWithRetry(numSites, width, height);
      
      // 记录成功日志
      this.errorLogger.logCustomError('voronoi_generation', 'Voronoi generation completed', {
        numSites,
        width,
        height,
        retryCount: this.voronoiErrorHandler.getRetryCount(),
        usedFallback: cells.some(cell => cell.isGridFallback)
      });
      
      return cells;
    } catch (error) {
      this.errorLogger.logException(error, 'voronoi_generation', {
        numSites,
        width,
        height,
        retryCount: this.voronoiErrorHandler.getRetryCount()
      });
      throw error;
    }
  }

  /**
   * 包装触摸处理器
   * @param {Object} handlers 触摸处理器对象
   * @returns {Object} 包装后的处理器对象
   */
  wrapTouchHandlers(handlers) {
    const wrappedHandlers = this.touchErrorHandler.wrapTouchHandlers(handlers);
    
    // 记录包装的处理器
    this.errorLogger.logCustomError('touch_handlers', 'Touch handlers wrapped', {
      handlerCount: Object.keys(handlers).length,
      handlerNames: Object.keys(handlers)
    });
    
    return wrappedHandlers;
  }

  /**
   * 执行云服务操作（带错误处理）
   * @param {Function} operation 云服务操作
   * @param {Function} fallback 降级操作
   * @param {string} operationName 操作名称
   * @returns {Promise<*>} 操作结果
   */
  async executeCloudOperation(operation, fallback, operationName) {
    try {
      return await this.cloudServiceErrorHandler.safeCloudOperation(
        operation,
        fallback,
        operationName
      );
    } catch (error) {
      this.errorLogger.logException(error, 'cloud_service', {
        operation: operationName,
        syncStatus: this.cloudServiceErrorHandler.getSyncStatus()
      });
      throw error;
    }
  }

  /**
   * 处理用户登录
   * @param {Function} loginOperation 登录操作
   * @returns {Promise<Object>} 登录结果
   */
  async handleLogin(loginOperation) {
    try {
      const result = await this.cloudServiceErrorHandler.handleLogin(loginOperation);
      
      this.errorLogger.logCustomError('user_login', 'Login completed', {
        isAnonymous: result.isAnonymous,
        openId: result.openId ? 'present' : 'missing'
      });
      
      return result;
    } catch (error) {
      this.errorLogger.logException(error, 'user_login');
      throw error;
    }
  }

  /**
   * 处理数据保存
   * @param {Function} saveOperation 保存操作
   * @param {Object} data 数据
   * @param {string} key 数据键
   * @returns {Promise<boolean>} 是否成功
   */
  async handleDataSave(saveOperation, data, key) {
    try {
      const success = await this.cloudServiceErrorHandler.handleDataSave(
        saveOperation,
        data,
        key
      );
      
      this.errorLogger.logCustomError('data_save', 'Data save completed', {
        key,
        success,
        dataSize: JSON.stringify(data).length
      });
      
      return success;
    } catch (error) {
      this.errorLogger.logException(error, 'data_save', { key });
      throw error;
    }
  }

  /**
   * 处理数据加载
   * @param {Function} loadOperation 加载操作
   * @param {string} key 数据键
   * @param {*} defaultValue 默认值
   * @returns {Promise<*>} 加载的数据
   */
  async handleDataLoad(loadOperation, key, defaultValue = null) {
    try {
      const data = await this.cloudServiceErrorHandler.handleDataLoad(
        loadOperation,
        key,
        defaultValue
      );
      
      this.errorLogger.logCustomError('data_load', 'Data load completed', {
        key,
        hasData: data !== null,
        usedDefault: data === defaultValue
      });
      
      return data;
    } catch (error) {
      this.errorLogger.logException(error, 'data_load', { key });
      throw error;
    }
  }

  /**
   * 处理游戏重启
   */
  handleGameRestart() {
    this.errorLogger.logCustomError('game_restart', 'Game restart initiated', {
      errorStats: this.getErrorStats(),
      syncStatus: this.cloudServiceErrorHandler.getSyncStatus()
    });

    // 清理错误状态
    this.clearErrorStates();
    
    // 触发重启事件
    if (typeof window !== 'undefined' && window.gameManager) {
      window.gameManager.restart();
    }
  }

  /**
   * 清理错误状态
   */
  clearErrorStates() {
    this.touchErrorHandler.clearErrorLog();
    this.cloudServiceErrorHandler.clearRetryQueue();
    this.globalErrorHandler.clearErrorHistory();
    
    if (this.voronoiErrorHandler) {
      this.voronoiErrorHandler.reset();
    }
    
    console.log('Error states cleared');
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计
   */
  getErrorStats() {
    return {
      logger: this.errorLogger.getLogStats(),
      touch: this.touchErrorHandler.getErrorStats(),
      cloud: this.cloudServiceErrorHandler.getSyncStatus(),
      global: this.globalErrorHandler.getErrorStats(),
      voronoi: this.voronoiErrorHandler ? {
        retryCount: this.voronoiErrorHandler.getRetryCount(),
        lastError: this.voronoiErrorHandler.getLastError()
      } : null
    };
  }

  /**
   * 生成错误报告
   * @returns {Object} 错误报告
   */
  generateErrorReport() {
    return {
      timestamp: Date.now(),
      sessionId: this.errorLogger.sessionId,
      stats: this.getErrorStats(),
      recentLogs: this.errorLogger.getLogs({ limit: 10 }),
      touchErrors: this.touchErrorHandler.generateErrorReport(),
      globalErrors: this.globalErrorHandler.getRecentErrors(5)
    };
  }

  /**
   * 导出所有错误数据
   * @returns {string} JSON 格式的错误数据
   */
  exportErrorData() {
    const errorData = {
      report: this.generateErrorReport(),
      fullLogs: this.errorLogger.exportLogs(),
      diagnostics: {
        canvas: CanvasErrorHandler.getDiagnosticInfo(),
        timestamp: Date.now()
      }
    };

    return JSON.stringify(errorData, null, 2);
  }

  /**
   * 手动触发错误上报
   */
  async forceErrorReport() {
    await this.errorLogger.forceReport();
    await this.cloudServiceErrorHandler.forcSync();
  }

  /**
   * 检查系统健康状态
   * @returns {Object} 健康状态
   */
  checkSystemHealth() {
    const stats = this.getErrorStats();
    
    return {
      overall: 'healthy', // 可以根据错误统计动态计算
      canvas: CanvasErrorHandler.checkCanvasSupport() ? 'ok' : 'error',
      network: stats.cloud.isOnline ? 'ok' : 'offline',
      errors: {
        critical: (stats.logger.severityCount && stats.logger.severityCount.critical) || 0,
        recent: stats.logger.recentLogs,
        frequent: this.touchErrorHandler.hasFrequentErrors()
      },
      recommendations: this.generateHealthRecommendations(stats)
    };
  }

  /**
   * 生成健康建议
   * @param {Object} stats 错误统计
   * @returns {Array} 建议列表
   */
  generateHealthRecommendations(stats) {
    const recommendations = [];
    
    if (!stats.cloud.isOnline) {
      recommendations.push('检查网络连接');
    }
    
    if (stats.cloud.queueLength > 10) {
      recommendations.push('等待网络恢复以同步数据');
    }
    
    if (stats.logger.severityCount && stats.logger.severityCount.critical > 0) {
      recommendations.push('存在严重错误，建议重启游戏');
    }
    
    if (this.touchErrorHandler.hasFrequentErrors()) {
      recommendations.push('触摸事件频繁出错，可能需要重启');
    }
    
    return recommendations;
  }
}

export default ErrorHandlingIntegration;