/**
 * 抖音小游戏 - 1-100 专注力训练游戏
 * 所有代码合并版本
 */

console.log('1-100 专注力训练游戏启动中...');

// ==================== 数据结构 ====================

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  clone() {
    return new Point(this.x, this.y);
  }
}

class Edge {
  constructor(start, end, leftSite, rightSite) {
    this.start = start;
    this.end = end;
    this.leftSite = leftSite;
    this.rightSite = rightSite;
  }
}

class Cell {
  constructor(site, number) {
    this.site = site;
    this.number = number;
    this.edges = [];
    this.polygon = [];
    this.done = false;
  }
  
  getArea() {
    if (this.polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < this.polygon.length; i++) {
      const j = (i + 1) % this.polygon.length;
      area += this.polygon[i].x * this.polygon[j].y;
      area -= this.polygon[j].x * this.polygon[i].y;
    }
    return Math.abs(area) / 2;
  }
  
  containsPoint(point) {
    let inside = false;
    const polygon = this.polygon;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

// ==================== 屏幕适配器 ====================

class ScreenAdapter {
  constructor() {
    this.systemInfo = null;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.pixelRatio = 1;
    this.safeArea = null;
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
      this.safeArea = { top: 0, bottom: 667, left: 0, right: 375 };
      this.calculateDimensions();
      return false;
    }
  }
  
  calculateDimensions() {
    const topMargin = 80;
    const bottomMargin = 60;
    this.gameAreaWidth = this.screenWidth;
    this.gameAreaHeight = this.screenHeight - topMargin - bottomMargin;
    this.fontSize = Math.max(12, Math.floor(this.screenWidth * 0.04));
    this.buttonHeight = Math.max(44, Math.floor(this.screenWidth * 0.12));
    this.padding = Math.max(10, Math.floor(this.screenWidth * 0.04));
  }
  
  getGameBounds() {
    return { x: 0, y: 80, width: this.gameAreaWidth, height: this.gameAreaHeight };
  }
  
  isPortrait() {
    return this.screenHeight > this.screenWidth;
  }
  
  getFontSize(scale = 1) {
    return Math.floor(this.fontSize * scale);
  }
  
  getPadding(scale = 1) {
    return Math.floor(this.padding * scale);
  }
}

console.log('游戏启动成功！');
