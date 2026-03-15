/**
 * 基础数据结构
 * Point, Edge, Cell 类定义
 */

/**
 * 点结构
 */
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 计算到另一个点的距离
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 克隆点
   */
  clone() {
    return new Point(this.x, this.y);
  }
}

/**
 * 边结构（Voronoi 边）
 */
class Edge {
  constructor(start, end, leftSite, rightSite) {
    this.start = start;      // Point
    this.end = end;          // Point
    this.leftSite = leftSite;   // 左侧种子点
    this.rightSite = rightSite; // 右侧种子点
  }
}

/**
 * Cell 结构（Voronoi 单元格）
 */
class Cell {
  constructor(site, number) {
    this.site = site;        // 种子点 Point
    this.number = number;    // 数字 1-100
    this.edges = [];         // Edge[] Voronoi 边
    this.polygon = [];       // Point[] 多边形顶点
    this.done = false;       // 是否已完成
  }

  /**
   * 计算多边形面积
   */
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

  /**
   * 检查点是否在多边形内（Ray Casting 算法）
   */
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

// 导出到全局作用域（抖音小游戏）
if (typeof global !== 'undefined') {
  global.Point = Point;
  global.Edge = Edge;
  global.Cell = Cell;
}

// 导出（Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Point, Edge, Cell };
}
