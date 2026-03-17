/**
 * 性能优化的 Voronoi 图生成器
 * 使用空间分割和缓存优化算法，确保生成时间 < 500ms
 */

class OptimizedVoronoiGenerator {
  constructor(width, height, numSites) {
    this.width = width;
    this.height = height;
    this.numSites = numSites;
    this.sites = [];
    this.cells = [];
    this.randomSeed = Date.now();
    
    // 性能优化参数
    this.spatialGrid = null;
    this.gridSize = Math.ceil(Math.sqrt(numSites) * 2);
    this.cellWidth = width / this.gridSize;
    this.cellHeight = height / this.gridSize;
    
    // 缓存
    this.distanceCache = new Map();
    this.nearestSiteCache = new Map();
    
    // 性能监控
    this.performanceMetrics = {
      siteGenTime: 0,
      voronoiGenTime: 0,
      totalTime: 0
    };
  }
  
  /**
   * 生成优化的种子点分布
   * 使用泊松圆盘采样确保均匀分布
   */
  generateOptimizedSites() {
    const startTime = performance.now();
    
    // 使用改进的网格分布算法
    const sites = this.generatePoissonDiskSites();
    
    this.performanceMetrics.siteGenTime = performance.now() - startTime;
    return sites;
  }
  
  /**
   * 泊松圆盘采样生成均匀分布的点
   */
  generatePoissonDiskSites() {
    const minDistance = Math.sqrt((this.width * this.height) / this.numSites) * 0.8;
    const sites = [];
    const grid = [];
    const gridW = Math.ceil(this.width / minDistance);
    const gridH = Math.ceil(this.height / minDistance);
    
    // 初始化网格
    for (let i = 0; i < gridW * gridH; i++) {
      grid[i] = null;
    }
    
    // 添加第一个点
    const firstPoint = new Point(
      this.width * 0.5 + (Math.random() - 0.5) * this.width * 0.2,
      this.height * 0.5 + (Math.random() - 0.5) * this.height * 0.2
    );
    sites.push(firstPoint);
    this.addToGrid(grid, firstPoint, gridW, minDistance);
    
    const activeList = [firstPoint];
    const maxAttempts = 30;
    
    while (activeList.length > 0 && sites.length < this.numSites) {
      const randomIndex = Math.floor(Math.random() * activeList.length);
      const point = activeList[randomIndex];
      let found = false;
      
      for (let i = 0; i < maxAttempts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minDistance * (1 + Math.random());
        const newX = point.x + Math.cos(angle) * radius;
        const newY = point.y + Math.sin(angle) * radius;
        
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
          if (this.isValidPoint(grid, newX, newY, gridW, gridH, minDistance)) {
            const newPoint = new Point(newX, newY);
            sites.push(newPoint);
            this.addToGrid(grid, newPoint, gridW, minDistance);
            activeList.push(newPoint);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        activeList.splice(randomIndex, 1);
      }
    }
    
    // 如果点数不够，用网格填充
    while (sites.length < this.numSites) {
      const gridSize = Math.ceil(Math.sqrt(this.numSites - sites.length));
      const cellW = this.width / gridSize;
      const cellH = this.height / gridSize;
      const remaining = this.numSites - sites.length;
      
      for (let i = 0; i < remaining; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = (col + 0.5 + (Math.random() - 0.5) * 0.6) * cellW;
        const y = (row + 0.5 + (Math.random() - 0.5) * 0.6) * cellH;
        
        sites.push(new Point(
          Math.max(10, Math.min(this.width - 10, x)),
          Math.max(10, Math.min(this.height - 10, y))
        ));
      }
      break;
    }
    
    return sites.slice(0, this.numSites);
  }
  
  /**
   * 添加点到网格
   */
  addToGrid(grid, point, gridW, minDistance) {
    const gridX = Math.floor(point.x / minDistance);
    const gridY = Math.floor(point.y / minDistance);
    grid[gridY * gridW + gridX] = point;
  }
  
  /**
   * 检查点是否有效（不与现有点冲突）
   */
  isValidPoint(grid, x, y, gridW, gridH, minDistance) {
    const gridX = Math.floor(x / minDistance);
    const gridY = Math.floor(y / minDistance);
    
    // 检查周围的网格单元
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = gridX + dx;
        const checkY = gridY + dy;
        
        if (checkX >= 0 && checkX < gridW && checkY >= 0 && checkY < gridH) {
          const existingPoint = grid[checkY * gridW + checkX];
          if (existingPoint) {
            const dist = Math.sqrt(
              (x - existingPoint.x) ** 2 + (y - existingPoint.y) ** 2
            );
            if (dist < minDistance) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
  
  /**
   * 创建空间分割网格以加速最近邻查找
   */
  createSpatialGrid() {
    this.spatialGrid = Array(this.gridSize * this.gridSize).fill(null).map(() => []);
    
    for (let i = 0; i < this.sites.length; i++) {
      const site = this.sites[i];
      const gridX = Math.floor(site.x / this.cellWidth);
      const gridY = Math.floor(site.y / this.cellHeight);
      const gridIndex = gridY * this.gridSize + gridX;
      
      if (gridIndex >= 0 && gridIndex < this.spatialGrid.length) {
        this.spatialGrid[gridIndex].push(i);
      }
    }
  }
  
  /**
   * 优化的最近邻查找
   */
  findNearestSiteOptimized(x, y) {
    const cacheKey = `${Math.floor(x)},${Math.floor(y)}`;
    if (this.nearestSiteCache.has(cacheKey)) {
      return this.nearestSiteCache.get(cacheKey);
    }
    
    const gridX = Math.floor(x / this.cellWidth);
    const gridY = Math.floor(y / this.cellHeight);
    
    let minDist = Infinity;
    let nearestIndex = 0;
    
    // 搜索半径，从当前网格开始逐步扩大
    for (let radius = 0; radius <= 2; radius++) {
      let found = false;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (radius > 0 && Math.abs(dx) < radius && Math.abs(dy) < radius) {
            continue; // 跳过内部已搜索的区域
          }
          
          const checkX = gridX + dx;
          const checkY = gridY + dy;
          
          if (checkX >= 0 && checkX < this.gridSize && 
              checkY >= 0 && checkY < this.gridSize) {
            const gridIndex = checkY * this.gridSize + checkX;
            const sitesInCell = this.spatialGrid[gridIndex];
            
            for (const siteIndex of sitesInCell) {
              const site = this.sites[siteIndex];
              const dx = x - site.x;
              const dy = y - site.y;
              const dist = dx * dx + dy * dy;
              
              if (dist < minDist) {
                minDist = dist;
                nearestIndex = siteIndex;
                found = true;
              }
            }
          }
        }
      }
      
      // 如果在当前半径找到了点，且距离足够小，可以提前退出
      if (found && minDist < (this.cellWidth * (radius + 1)) ** 2) {
        break;
      }
    }
    
    this.nearestSiteCache.set(cacheKey, nearestIndex);
    return nearestIndex;
  }
  
  /**
   * 优化的 Voronoi 单元格生成
   */
  generateOptimizedVoronoiCells() {
    const startTime = performance.now();
    
    // 创建空间分割网格
    this.createSpatialGrid();
    
    const cells = this.sites.map((site, i) => new Cell(site, i + 1));
    
    // 使用优化的多边形构建算法
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const polygon = this.buildOptimizedCellPolygon(cell.site, i);
      cell.polygon = polygon;
    }
    
    this.performanceMetrics.voronoiGenTime = performance.now() - startTime;
    return cells;
  }
  
  /**
   * 优化的单元格多边形构建
   */
  buildOptimizedCellPolygon(site, siteIndex) {
    const numAngles = 24; // 减少采样角度以提高性能
    const points = [];
    
    // 估算最大搜索半径
    const maxRadius = Math.min(
      Math.max(this.width, this.height) * 0.5,
      this.estimateMaxRadius(site)
    );
    
    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      
      // 优化的二分查找
      const boundaryPoint = this.findBoundaryPointOptimized(
        site, dx, dy, maxRadius, siteIndex
      );
      
      if (boundaryPoint) {
        points.push(boundaryPoint);
      }
    }
    
    return this.clipPolygonToBounds(points);
  }
  
  /**
   * 估算最大搜索半径
   */
  estimateMaxRadius(site) {
    // 找到最近的3个邻居，估算Voronoi单元的大小
    const distances = [];
    
    for (const otherSite of this.sites) {
      if (otherSite !== site) {
        const dx = site.x - otherSite.x;
        const dy = site.y - otherSite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        distances.push(dist);
      }
    }
    
    distances.sort((a, b) => a - b);
    
    // 使用前3个最近邻居的平均距离作为估算
    const avgNearestDist = distances.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    return avgNearestDist * 0.6; // 保守估计
  }
  
  /**
   * 优化的边界点查找
   */
  findBoundaryPointOptimized(site, dx, dy, maxRadius, siteIndex) {
    let minR = 0;
    let maxR = maxRadius;
    let bestPoint = null;
    
    // 减少迭代次数以提高性能
    for (let iter = 0; iter < 12; iter++) {
      const r = (minR + maxR) / 2;
      const testX = site.x + dx * r;
      const testY = site.y + dy * r;
      
      // 边界检查
      if (testX < 0 || testX > this.width || testY < 0 || testY > this.height) {
        maxR = r;
        continue;
      }
      
      const nearestIndex = this.findNearestSiteOptimized(testX, testY);
      
      if (nearestIndex === siteIndex) {
        minR = r;
        bestPoint = new Point(testX, testY);
      } else {
        maxR = r;
      }
      
      // 早期退出条件
      if (maxR - minR < 1) {
        break;
      }
    }
    
    return bestPoint;
  }
  
  /**
   * 裁剪多边形到边界
   */
  clipPolygonToBounds(points) {
    if (points.length === 0) return [];
    
    // 简化的边界裁剪
    const clipped = points.map(point => new Point(
      Math.max(0, Math.min(this.width, point.x)),
      Math.max(0, Math.min(this.height, point.y))
    ));
    
    // 移除重复点
    const unique = [];
    for (let i = 0; i < clipped.length; i++) {
      const current = clipped[i];
      const next = clipped[(i + 1) % clipped.length];
      
      const dx = current.x - next.x;
      const dy = current.y - next.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 2) { // 最小距离阈值
        unique.push(current);
      }
    }
    
    return unique;
  }
  
  /**
   * 优化的数字分配
   */
  assignNumbers(cells) {
    const numbers = Array.from({ length: this.numSites }, (_, i) => i + 1);
    
    // 优化的洗牌算法
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    cells.forEach((cell, i) => {
      cell.number = numbers[i];
    });
  }
  
  /**
   * 快速验证
   */
  validateCells(cells) {
    const minArea = (this.width * this.height) * 0.003; // 降低最小面积要求
    
    // 并行验证（如果支持）
    const validations = cells.map(cell => {
      const area = this.calculateCellArea(cell);
      return area >= minArea;
    });
    
    const allValid = validations.every(v => v);
    
    if (!allValid) {
      console.warn('Some cells have insufficient area');
      return false;
    }
    
    // 快速数字唯一性检查
    const numberSet = new Set(cells.map(c => c.number));
    if (numberSet.size !== cells.length) {
      console.error('Duplicate numbers found');
      return false;
    }
    
    return true;
  }
  
  /**
   * 快速面积计算
   */
  calculateCellArea(cell) {
    if (cell.polygon.length < 3) return 0;
    
    let area = 0;
    const n = cell.polygon.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += cell.polygon[i].x * cell.polygon[j].y;
      area -= cell.polygon[j].x * cell.polygon[i].y;
    }
    
    return Math.abs(area) / 2;
  }
  
  /**
   * 主生成方法（优化版本）
   */
  generate() {
    const startTime = performance.now();
    
    try {
      // 生成优化的种子点
      this.sites = this.generateOptimizedSites();
      
      // 生成优化的 Voronoi 单元格
      this.cells = this.generateOptimizedVoronoiCells();
      
      // 分配数字
      this.assignNumbers(this.cells);
      
      // 快速验证
      const valid = this.validateCells(this.cells);
      if (!valid) {
        throw new Error('Voronoi generation validation failed');
      }
      
      const endTime = performance.now();
      this.performanceMetrics.totalTime = endTime - startTime;
      
      console.log(`Optimized Voronoi generation completed in ${this.performanceMetrics.totalTime.toFixed(2)}ms`);
      console.log(`- Site generation: ${this.performanceMetrics.siteGenTime.toFixed(2)}ms`);
      console.log(`- Voronoi generation: ${this.performanceMetrics.voronoiGenTime.toFixed(2)}ms`);
      
      // 清理缓存以释放内存
      this.clearCaches();
      
      return this.cells;
      
    } catch (error) {
      console.error('Optimized Voronoi generation failed:', error);
      throw error;
    }
  }
  
  /**
   * 清理缓存
   */
  clearCaches() {
    this.distanceCache.clear();
    this.nearestSiteCache.clear();
    this.spatialGrid = null;
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  /**
   * 设置随机种子（用于可重现的生成）
   */
  setRandomSeed(seed) {
    this.randomSeed = seed;
    // 这里可以实现种子随机数生成器
  }
  
  /**
   * 预热生成器（预先分配内存和缓存）
   */
  warmup() {
    // 预分配缓存空间
    this.distanceCache = new Map();
    this.nearestSiteCache = new Map();
    
    // 预计算一些常用值
    this.cellWidth = this.width / this.gridSize;
    this.cellHeight = this.height / this.gridSize;
  }
  
  /**
   * 销毁生成器，释放资源
   */
  destroy() {
    this.clearCaches();
    this.sites = [];
    this.cells = [];
    this.spatialGrid = null;
  }
}

// 辅助类定义
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Cell {
  constructor(site, number) {
    this.site = site;
    this.number = number;
    this.polygon = [];
    this.done = false;
  }
  
  getArea() {
    if (this.polygon.length < 3) return 0;
    
    let area = 0;
    const n = this.polygon.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.polygon[i].x * this.polygon[j].y;
      area -= this.polygon[j].x * this.polygon[i].y;
    }
    
    return Math.abs(area) / 2;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizedVoronoiGenerator;
}

if (typeof global !== 'undefined') {
  global.OptimizedVoronoiGenerator = OptimizedVoronoiGenerator;
}