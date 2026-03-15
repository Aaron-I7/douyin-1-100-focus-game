/**
 * Voronoi 图生成器
 * 使用简化的算法生成 Voronoi 图
 */

/**
 * Voronoi 生成器类
 */
class VoronoiGenerator {
  constructor(width, height, numSites) {
    this.width = width;
    this.height = height;
    this.numSites = numSites;
    this.sites = [];
    this.cells = [];
    this.randomSeed = Date.now();
  }

  /**
   * 生成随机种子点
   * 使用网格分布 + 随机偏移确保均匀分布
   */
  generateSites() {
    const sites = [];
    const gridSize = Math.ceil(Math.sqrt(this.numSites));
    const cellW = this.width / gridSize;
    const cellH = this.height / gridSize;
    
    for (let i = 0; i < this.numSites; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // 基础位置 + 随机偏移
      const x = (col + 0.5 + (Math.random() - 0.5) * 0.8) * cellW;
      const y = (row + 0.5 + (Math.random() - 0.5) * 0.8) * cellH;
      
      // 确保在边界内
      const clampedX = Math.max(10, Math.min(this.width - 10, x));
      const clampedY = Math.max(10, Math.min(this.height - 10, y));
      
      sites.push(new Point(clampedX, clampedY));
    }
    
    return sites;
  }

  /**
   * 使用简化的 Voronoi 生成算法
   * 为每个像素点找到最近的种子点，构建 Voronoi 单元格
   */
  generateVoronoiCells() {
    // 为每个种子点创建 Cell
    const cells = this.sites.map((site, i) => new Cell(site, i + 1));
    
    // 使用采样方法构建多边形边界
    // 对每个 Cell，在其周围采样点找到边界
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const polygon = this.buildCellPolygon(cell.site, i);
      cell.polygon = polygon;
    }
    
    return cells;
  }

  /**
   * 为单个 Cell 构建多边形边界
   * 使用径向采样方法
   */
  buildCellPolygon(site, siteIndex) {
    const numAngles = 36; // 采样 36 个角度
    const maxRadius = Math.max(this.width, this.height);
    const points = [];
    
    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      
      // 二分查找边界点
      let minR = 0;
      let maxR = maxRadius;
      let boundaryPoint = null;
      
      for (let iter = 0; iter < 20; iter++) {
        const r = (minR + maxR) / 2;
        const testX = site.x + dx * r;
        const testY = site.y + dy * r;
        
        // 检查是否越界
        if (testX < 0 || testX > this.width || testY < 0 || testY > this.height) {
          maxR = r;
          continue;
        }
        
        // 找到最近的种子点
        const nearestIndex = this.findNearestSite(testX, testY);
        
        if (nearestIndex === siteIndex) {
          minR = r;
          boundaryPoint = new Point(testX, testY);
        } else {
          maxR = r;
        }
      }
      
      if (boundaryPoint) {
        points.push(boundaryPoint);
      }
    }
    
    // 裁剪到边界
    return this.clipPolygonToBounds(points);
  }

  /**
   * 找到距离指定坐标最近的种子点索引
   */
  findNearestSite(x, y) {
    let minDist = Infinity;
    let nearestIndex = 0;
    
    for (let i = 0; i < this.sites.length; i++) {
      const site = this.sites[i];
      const dx = x - site.x;
      const dy = y - site.y;
      const dist = dx * dx + dy * dy;
      
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }

  /**
   * 裁剪多边形到游戏区域边界
   */
  clipPolygonToBounds(points) {
    if (points.length === 0) return [];
    
    const clipped = [];
    for (const point of points) {
      const x = Math.max(0, Math.min(this.width, point.x));
      const y = Math.max(0, Math.min(this.height, point.y));
      clipped.push(new Point(x, y));
    }
    
    return clipped;
  }

  /**
   * 随机分配数字到 Cell
   */
  assignNumbers(cells) {
    // 创建 1-100 的数字数组
    const numbers = Array.from({ length: this.numSites }, (_, i) => i + 1);
    
    // Fisher-Yates 洗牌算法
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // 分配数字
    cells.forEach((cell, i) => {
      cell.number = numbers[i];
    });
  }

  /**
   * 验证生成的 Cell
   */
  validateCells(cells) {
    const minArea = (this.width * this.height) * 0.005;
    
    for (const cell of cells) {
      // 检查面积
      const area = cell.getArea();
      if (area < minArea) {
        console.warn(`Cell ${cell.number} area too small: ${area}`);
        return false;
      }
    }
    
    // 检查数字唯一性
    const numbers = cells.map(c => c.number).sort((a, b) => a - b);
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i] === numbers[i + 1]) {
        console.error('Duplicate numbers found');
        return false;
      }
    }
    
    return true;
  }

  /**
   * 主生成方法
   */
  generate() {
    console.log('Generating Voronoi diagram...');
    const startTime = Date.now();
    
    // 生成种子点
    this.sites = this.generateSites();
    console.log(`Generated ${this.sites.length} sites`);
    
    // 生成 Voronoi 单元格
    this.cells = this.generateVoronoiCells();
    console.log(`Generated ${this.cells.length} cells`);
    
    // 分配数字
    this.assignNumbers(this.cells);
    
    // 验证
    const valid = this.validateCells(this.cells);
    if (!valid) {
      throw new Error('Voronoi generation validation failed');
    }
    
    const endTime = Date.now();
    console.log(`Voronoi generation completed in ${endTime - startTime}ms`);
    
    return this.cells;
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.VoronoiGenerator = VoronoiGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoronoiGenerator;
}
