/**
 * 屏幕适配器模块
 * 负责处理不同设备尺寸和分辨率的适配
 */

class ScreenAdapter {
  constructor() {
    this.systemInfo = null;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.pixelRatio = 1;
    this.safeArea = null;
    
    // 计算得出的尺寸
    this.gameAreaWidth = 0;
    this.gameAreaHeight = 0;
    this.fontSize = 0;
    this.buttonHeight = 0;
    this.padding = 0;
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
        pixelRatio: this.pixelRatio
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ScreenAdapter:', error);
      // 使用默认值降级
      this.screenWidth = 375;
      this.screenHeight = 667;
      this.pixelRatio = 2;
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
    // 游戏区域尺寸（留出顶部和底部空间）
    const topMargin = 80;
    const bottomMargin = 60;
    this.gameAreaWidth = this.screenWidth;
    this.gameAreaHeight = this.screenHeight - topMargin - bottomMargin;
    
    // 基于屏幕宽度的相对单位
    this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04));
    this.buttonHeight = Math.max(44, Math.floor(this.screenWidth * 0.12));
    this.padding = Math.max(10, Math.floor(this.screenWidth * 0.04));
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
}

// 导出单例
if (typeof global !== 'undefined') {
  global.ScreenAdapter = ScreenAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenAdapter;
}
