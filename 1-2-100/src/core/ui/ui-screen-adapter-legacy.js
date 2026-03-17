class ScreenAdapter {
  constructor() {
    this.systemInfo = null;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.pixelRatio = 1;
    this.safeArea = null;
    this.orientation = 'portrait';
    this.gameAreaWidth = 0;
    this.gameAreaHeight = 0;
    this.fontSize = 0;
    this.buttonHeight = 0;
    this.padding = 0;
  }

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
        top: 0, bottom: this.screenHeight, left: 0, right: this.screenWidth
      };
      this.calculateDimensions();
      return true;
    } catch (error) {
      console.error('Failed to initialize ScreenAdapter:', error);
      this.screenWidth = 375;
      this.screenHeight = 667;
      this.pixelRatio = 2;
      this.orientation = 'portrait';
      this.safeArea = { top: 0, bottom: 667, left: 0, right: 375 };
      this.calculateDimensions();
      return false;
    }
  }

  calculateDimensions() {
    const orientation = this.getOrientation();
    const topMargin = 80;
    const bottomMargin = 60;
    this.gameAreaWidth = this.screenWidth;
    this.gameAreaHeight = this.screenHeight - topMargin - bottomMargin;
    if (orientation === 'landscape') {
      this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04 * 0.9));
      this.buttonHeight = Math.max(44, Math.floor(this.screenHeight * 0.08));
      this.padding = Math.max(8, Math.floor(this.screenWidth * 0.01));
    } else {
      this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04));
      this.buttonHeight = Math.max(44, Math.floor(this.screenWidth * 0.12));
      this.padding = Math.max(10, Math.floor(this.screenWidth * 0.02));
    }
    this.buttonHeight = Math.max(44, this.buttonHeight);
  }

  getGameBounds() {
    return { x: 0, y: 80, width: this.gameAreaWidth, height: this.gameAreaHeight };
  }

  isPortrait() {
    return this.screenHeight > this.screenWidth;
  }

  isLandscape() {
    return this.screenWidth > this.screenHeight;
  }

  getOrientation() {
    return this.isLandscape() ? 'landscape' : 'portrait';
  }

  updateOrientation() {
    const newOrientation = this.getOrientation();
    if (newOrientation !== this.orientation) {
      this.orientation = newOrientation;
      this.calculateDimensions();
      return true;
    }
    return false;
  }

  getFontSize(scale = 1) {
    return Math.floor(this.fontSize * scale);
  }

  getPadding(scale = 1) {
    return Math.floor(this.padding * scale);
  }
}

module.exports = ScreenAdapter;
