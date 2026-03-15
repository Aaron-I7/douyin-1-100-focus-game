/**
 * 抖音小游戏 - 1-100 专注力训练游戏
 * 所有代码合并版本 - 备份第1部分
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
}