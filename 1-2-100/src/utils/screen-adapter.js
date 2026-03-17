/**
 * 屏幕适配器模块
 * 负责处理不同设备尺寸和分辨率的适配，支持横屏和竖屏
 */

class ScreenAdapter {
  constructor() {
    this.systemInfo = null;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.pixelRatio = 1;
    this.safeArea = null;
    this.orientation = 'portrait'; // 'portrait' | 'landscape'
    
    // 计算得出的尺寸
    this.gameAreaWidth = 0;
    this.gameAreaHeight = 0;
    this.fontSize = 0;
    this.buttonHeight = 0;
    this.padding = 0;
    
    // 屏幕尺寸测试数据
    this.testScreenSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 1080, height: 2400, name: 'Android High-end' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'iPad Landscape' }
    ];
    
    // 尝试自动初始化
    this.init();
  }

  /**
   * 初始化屏幕适配器
   */
  init() {
    try {
      this.systemInfo = tt.getSystemInfoSync();
      
      if (!this.systemInfo || !this.systemInfo.windowWidth) {
        throw new Error('Invalid system info');
      }
      
      this.screenWidth = this.systemInfo.windowWidth;
      this.screenHeight = this.systemInfo.windowHeight;
      this.pixelRatio = this.systemInfo.pixelRatio || 2;
      this.orientation = this.getOrientation();
      this.safeArea = this.systemInfo.safeArea || {
        top: 0,
        bottom: this.screenHeight,
        left: 0,
        right: this.screenWidth
      };
      
      this.calculateDimensions();
      
      console.log('ScreenAdapter initialized:', {
        width: this.screenWidth,
        height: this.screenHeight,
        pixelRatio: this.pixelRatio,
        orientation: this.orientation
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ScreenAdapter:', error);
      // 使用默认值降级
      this.screenWidth = 375;
      this.screenHeight = 667;
      this.pixelRatio = 2;
      this.orientation = 'portrait';
      this.safeArea = {
        top: 0,
        bottom: 667,
        left: 0,
        right: 375
      };
      this.calculateDimensions();
      return false;
    }
  }

  /**
   * 计算各种尺寸参数
   */
  calculateDimensions() {
    const orientation = this.getOrientation();
    
    // 游戏区域尺寸（留出顶部和底部空间）
    const topMargin = 80;
    const bottomMargin = 60;
    this.gameAreaWidth = this.screenWidth;
    this.gameAreaHeight = this.screenHeight - topMargin - bottomMargin;
    
    // 基于屏幕宽度的相对单位，横屏时调整
    if (orientation === 'landscape') {
      // 横屏时字体缩小 10%，按钮基于高度计算
      this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04 * 0.9));
      this.buttonHeight = Math.max(44, Math.floor(this.screenHeight * 0.08));
      this.padding = Math.max(8, Math.floor(this.screenWidth * 0.01));
    } else {
      // 竖屏布局（默认）
      this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04));
      this.buttonHeight = Math.max(44, Math.floor(this.screenWidth * 0.12));
      this.padding = Math.max(10, Math.floor(this.screenWidth * 0.02));
    }
    
    // 确保按钮最小触摸区域 44x44
    this.buttonHeight = Math.max(44, this.buttonHeight);
    
    // 返回计算结果
    return {
      orientation: orientation,
      fontSize: this.fontSize,
      buttonSize: this.buttonHeight,
      cellPadding: this.padding,
      gameAreaWidth: this.gameAreaWidth,
      gameAreaHeight: this.gameAreaHeight
    };
  }

  /**
   * 获取游戏区域的边界
   */
  getGameBounds() {
    return {
      x: 0,
      y: 80,
      width: this.gameAreaWidth,
      height: this.gameAreaHeight
    };
  }

  /**
   * 将逻辑像素转换为物理像素
   */
  toPhysicalPixels(logicalPixels) {
    return logicalPixels * this.pixelRatio;
  }

  /**
   * 将物理像素转换为逻辑像素
   */
  toLogicalPixels(physicalPixels) {
    return physicalPixels / this.pixelRatio;
  }

  /**
   * 检查设备方向是否为竖屏
   */
  isPortrait() {
    return this.screenHeight > this.screenWidth;
  }

  /**
   * 检查设备方向是否为横屏
   */
  isLandscape() {
    return this.screenWidth > this.screenHeight;
  }

  /**
   * 获取设备方向
   */
  getOrientation() {
    return this.isLandscape() ? 'landscape' : 'portrait';
  }

  /**
   * 更新方向并检查是否发生变化
   */
  updateOrientation() {
    const newOrientation = this.getOrientation();
    if (newOrientation !== this.orientation) {
      this.orientation = newOrientation;
      this.calculateDimensions(); // 重新计算尺寸
      return true; // 方向已改变
    }
    return false;
  }

  /**
   * 获取适配后的字体大小
   */
  getFontSize(scale = 1) {
    return Math.floor(this.fontSize * scale);
  }

  /**
   * 获取适配后的按钮尺寸
   */
  getButtonSize() {
    return {
      width: Math.floor(this.screenWidth * 0.7),
      height: this.buttonHeight
    };
  }

  /**
   * 获取内边距
   */
  getPadding(scale = 1) {
    return Math.floor(this.padding * scale);
  }

  /**
   * 验证多种屏幕尺寸的适配效果
   */
  validateScreenSizes() {
    const results = [];
    
    for (const testSize of this.testScreenSizes) {
      const originalWidth = this.screenWidth;
      const originalHeight = this.screenHeight;
      
      // 临时设置测试尺寸
      this.screenWidth = testSize.width;
      this.screenHeight = testSize.height;
      this.calculateDimensions();
      
      const result = {
        name: testSize.name,
        width: testSize.width,
        height: testSize.height,
        orientation: this.getOrientation(),
        fontSize: this.fontSize,
        buttonHeight: this.buttonHeight,
        padding: this.padding,
        isValid: this.validateDimensions()
      };
      
      results.push(result);
      
      // 恢复原始尺寸
      this.screenWidth = originalWidth;
      this.screenHeight = originalHeight;
      this.calculateDimensions();
    }
    
    return results;
  }

  /**
   * 验证当前尺寸是否符合要求
   */
  validateDimensions() {
    const checks = {
      fontSizeValid: this.fontSize >= 12 && this.fontSize <= 60,
      buttonSizeValid: this.buttonHeight >= 44,
      paddingValid: this.padding >= 8,
      aspectRatioValid: true // 支持所有宽高比
    };
    
    return Object.values(checks).every(check => check);
  }

  /**
   * 获取高清屏幕渲染参数
   */
  getHighDPIRenderParams() {
    return {
      logicalWidth: this.screenWidth,
      logicalHeight: this.screenHeight,
      physicalWidth: this.toPhysicalPixels(this.screenWidth),
      physicalHeight: this.toPhysicalPixels(this.screenHeight),
      pixelRatio: this.pixelRatio,
      scaleFactor: this.pixelRatio
    };
  }

  /**
   * 设置Canvas高清渲染
   */
  setupHighDPICanvas(canvas) {
    const params = this.getHighDPIRenderParams();
    
    // 设置Canvas物理尺寸
    canvas.width = params.physicalWidth;
    canvas.height = params.physicalHeight;
    
    // 设置Canvas显示尺寸
    canvas.style.width = params.logicalWidth + 'px';
    canvas.style.height = params.logicalHeight + 'px';
    
    // 缩放绘图上下文
    const ctx = canvas.getContext('2d');
    ctx.scale(params.scaleFactor, params.scaleFactor);
    
    return ctx;
  }
}

// 导出单例
if (typeof global !== 'undefined') {
  global.ScreenAdapter = ScreenAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenAdapter;
}
