/**
 * Canvas 错误处理器
 * 处理 Canvas 创建失败和相关错误
 */
class CanvasErrorHandler {
  constructor() {
    this.errorDisplayed = false;
  }

  /**
   * 尝试创建 Canvas，包含错误处理
   * @returns {Canvas|null} Canvas 实例或 null
   */
  createCanvasWithErrorHandling() {
    try {
      // 检查 tt 对象是否存在
      if (typeof tt === 'undefined') {
        throw new Error('Douyin mini-game environment not available');
      }

      // 尝试创建 Canvas
      const canvas = tt.createCanvas();
      
      if (!canvas) {
        throw new Error('Canvas creation returned null');
      }

      // 验证 Canvas 基本功能
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context');
      }

      // 测试基本绘制功能
      try {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1, 1);
      } catch (drawError) {
        throw new Error('Canvas drawing test failed: ' + drawError.message);
      }

      console.log('Canvas created successfully');
      return canvas;

    } catch (error) {
      console.error('Canvas creation failed:', error);
      this.handleCanvasCreationError(error);
      return null;
    }
  }

  /**
   * 处理 Canvas 创建错误
   * @param {Error} error 错误对象
   */
  handleCanvasCreationError(error) {
    if (this.errorDisplayed) {
      return; // 避免重复显示错误
    }

    this.errorDisplayed = true;
    
    // 记录详细错误信息
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof tt !== 'undefined' ? 'douyin' : 'unknown'
    };

    console.error('Canvas Error Details:', errorInfo);

    // 显示用户友好的错误提示
    this.showCanvasErrorDialog();

    // 上报错误到分析系统（如果可用）
    this.reportCanvasError(errorInfo);
  }

  /**
   * 显示 Canvas 错误对话框
   */
  showCanvasErrorDialog() {
    const errorMessage = '无法初始化游戏画布，请尝试以下解决方案：\n\n' +
                        '1. 重启抖音应用\n' +
                        '2. 检查设备存储空间\n' +
                        '3. 更新抖音到最新版本\n' +
                        '4. 重启设备\n\n' +
                        '如问题持续存在，请联系客服。';

    // 尝试使用抖音 API 显示对话框
    if (typeof tt !== 'undefined' && tt.showModal) {
      tt.showModal({
        title: '游戏初始化失败',
        content: errorMessage,
        showCancel: false,
        confirmText: '重新尝试',
        success: (res) => {
          if (res.confirm) {
            this.retryCanvasCreation();
          }
        }
      });
    } else {
      // 降级到 alert
      alert('游戏初始化失败\n\n' + errorMessage);
    }
  }

  /**
   * 重试 Canvas 创建
   */
  retryCanvasCreation() {
    this.errorDisplayed = false;
    
    // 延迟重试，给系统一些恢复时间
    setTimeout(() => {
      const canvas = this.createCanvasWithErrorHandling();
      if (canvas && this.onRetrySuccess) {
        this.onRetrySuccess(canvas);
      }
    }, 1000);
  }

  /**
   * 上报 Canvas 错误
   * @param {Object} errorInfo 错误信息
   */
  reportCanvasError(errorInfo) {
    try {
      // 尝试上报到分析系统
      if (typeof window !== 'undefined' && window.analyticsManager) {
        window.analyticsManager.trackEvent('canvas_creation_error', {
          error_message: errorInfo.message,
          platform: errorInfo.platform,
          timestamp: errorInfo.timestamp
        });
      }
    } catch (reportError) {
      console.error('Failed to report canvas error:', reportError);
    }
  }

  /**
   * 设置重试成功回调
   * @param {Function} callback 回调函数
   */
  setRetrySuccessCallback(callback) {
    this.onRetrySuccess = callback;
  }

  /**
   * 检查 Canvas 支持
   * @returns {boolean} 是否支持 Canvas
   */
  static checkCanvasSupport() {
    try {
      if (typeof tt === 'undefined') {
        return false;
      }

      // 检查基本 API 是否存在
      return typeof tt.createCanvas === 'function';
    } catch (error) {
      console.error('Canvas support check failed:', error);
      return false;
    }
  }

  /**
   * 获取 Canvas 错误诊断信息
   * @returns {Object} 诊断信息
   */
  static getDiagnosticInfo() {
    const info = {
      timestamp: Date.now(),
      ttAvailable: typeof tt !== 'undefined',
      createCanvasAvailable: typeof tt !== 'undefined' && typeof tt.createCanvas === 'function',
      systemInfo: null,
      memoryInfo: null
    };

    try {
      if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
        info.systemInfo = tt.getSystemInfoSync();
      }
    } catch (error) {
      info.systemInfoError = error.message;
    }

    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        info.memoryInfo = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
    } catch (error) {
      info.memoryInfoError = error.message;
    }

    return info;
  }
}

export default CanvasErrorHandler;