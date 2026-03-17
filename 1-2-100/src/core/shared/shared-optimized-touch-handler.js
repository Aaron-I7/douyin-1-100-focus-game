/**
 * 性能优化的触摸处理器
 * 使用空间索引和缓存优化，确保响应时间 < 50ms
 */

class OptimizedTouchHandler {
  constructor(canvas, cells) {
    this.canvas = canvas;
    this.cells = cells;
    this.touchStartTime = 0;
    this.lastTouchPos = { x: 0, y: 0 };
    this.isEnabled = true;
    
    // 性能优化
    this.spatialIndex = null;
    this.boundingBoxCache = new Map();
    this.hitTestCache = new Map();
    this.cacheSize = 100; // 限制缓存大小
    
    // 性能监控
    this.performanceMetrics = {
      hitTestTime: 0,
      cacheHitRate: 0,
      totalQueries: 0,
      cacheHits: 0
    };
    
    // 回调函数
    this.onCellClick = null;
    this.onMouseMove = null;
    
    // 防抖和节流
    this.lastProcessTime = 0;
    this.minProcessInterval = 16; // 约60fps
    
    this.setupEventListeners();
    this.buildSpatialIndex();
  }
  
  /**
   * 构建空间索引以加速碰撞检测
   */
  buildSpatialIndex() {
    if (!this.cells || this.cells.length === 0) return;
    
    const startTime = performance.now();
    
    // 计算网格大小
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const gridSize = Math.ceil(Math.sqrt(this.cells.length));
    const cellWidth = canvasWidth / gridSize;
    const cellHeight = canvasHeight / gridSize;
    
    // 初始化空间网格
    this.spatialIndex = {
      gridSize,
      cellWidth,
      cellHeight,
      grid: Array(gridSize * gridSize).fill(null).map(() => [])
    };
    
    // 为每个Cell计算边界框并添加到空间网格
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      const bbox = this.calculateBoundingBox(cell);
      
      // 缓存边界框
      this.boundingBoxCache.set(cell, bbox);
      
      // 计算Cell覆盖的网格范围
      const minGridX = Math.floor(bbox.minX / cellWidth);
      const maxGridX = Math.floor(bbox.maxX / cellWidth);
      const minGridY = Math.floor(bbox.minY / cellHeight);
      const maxGridY = Math.floor(bbox.maxY / cellHeight);
      
      // 将Cell添加到相关的网格单元
      for (let gy = minGridY; gy <= maxGridY; gy++) {
        for (let gx = minGridX; gx <= maxGridX; gx++) {
          if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
            const gridIndex = gy * gridSize + gx;
            this.spatialIndex.grid[gridIndex].push(i);
          }
        }
      }
    }
    
    const buildTime = performance.now() - startTime;
    console.log(`Spatial index built in ${buildTime.toFixed(2)}ms`);
  }
  
  /**
   * 计算Cell的边界框
   */
  calculateBoundingBox(cell) {
    if (!cell.polygon || cell.polygon.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = cell.polygon[0].x;
    let maxX = cell.polygon[0].x;
    let minY = cell.polygon[0].y;
    let maxY = cell.polygon[0].y;
    
    for (const point of cell.polygon) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
  }
  
  /**
   * 设置事件监听器（优化版本）
   */
  setupEventListeners() {
    // 使用节流优化触摸事件处理
    tt.onTouchStart((event) => {
      if (!this.isEnabled) return;
      
      const now = performance.now();
      if (now - this.lastProcessTime < this.minProcessInterval) {
        return; // 跳过过于频繁的事件
      }
      this.lastProcessTime = now;
      
      this.touchStartTime = now;
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchStart(pos);
    });

    tt.onTouchMove((event) => {
      if (!this.isEnabled) return;
      
      const now = performance.now();
      if (now - this.lastProcessTime < this.minProcessInterval) {
        return; // 节流处理
      }
      this.lastProcessTime = now;
      
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchMove(pos);
    });

    tt.onTouchEnd((event) => {
      if (!this.isEnabled) return;
      
      const touchDuration = performance.now() - this.touchStartTime;
      if (touchDuration < 300) {
        this.handleTap(this.lastTouchPos);
      }
    });
  }
  
  /**
   * 优化的触摸坐标转换
   */
  getTouchPosition(touch) {
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  /**
   * 处理触摸开始
   */
  handleTouchStart(pos) {
    // 预热缓存
    this.findCellAtPositionOptimized(pos);
  }
  
  /**
   * 处理触摸移动
   */
  handleTouchMove(pos) {
    if (this.onMouseMove) {
      this.onMouseMove(pos);
    }
  }
  
  /**
   * 优化的点击处理
   */
  handleTap(pos) {
    const startTime = performance.now();
    
    try {
      const clickedCell = this.findCellAtPositionOptimized(pos);
      
      if (clickedCell && this.onCellClick) {
        this.onCellClick(clickedCell);
      }
      
      const hitTestTime = performance.now() - startTime;
      this.performanceMetrics.hitTestTime = hitTestTime;
      
      // 性能警告
      if (hitTestTime > 50) {
        console.warn(`Touch response time exceeded 50ms: ${hitTestTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error('Optimized touch event handling error:', error);
    }
  }
  
  /**
   * 优化的Cell查找（使用空间索引和缓存）
   */
  findCellAtPositionOptimized(pos) {
    this.performanceMetrics.totalQueries++;
    
    // 检查缓存
    const cacheKey = `${Math.floor(pos.x / 5)},${Math.floor(pos.y / 5)}`; // 5像素精度
    if (this.hitTestCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      const cachedResult = this.hitTestCache.get(cacheKey);
      return cachedResult;
    }
    
    let result = null;
    
    if (this.spatialIndex) {
      result = this.findCellUsingSpatialIndex(pos);
    } else {
      result = this.findCellBruteForce(pos);
    }
    
    // 更新缓存
    this.updateHitTestCache(cacheKey, result);
    
    // 更新缓存命中率
    this.performanceMetrics.cacheHitRate = 
      this.performanceMetrics.cacheHits / this.performanceMetrics.totalQueries;
    
    return result;
  }
  
  /**
   * 使用空间索引查找Cell
   */
  findCellUsingSpatialIndex(pos) {
    const { gridSize, cellWidth, cellHeight, grid } = this.spatialIndex;
    
    // 计算网格坐标
    const gridX = Math.floor(pos.x / cellWidth);
    const gridY = Math.floor(pos.y / cellHeight);
    
    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
      return null;
    }
    
    const gridIndex = gridY * gridSize + gridX;
    const candidateCells = grid[gridIndex];
    
    // 在候选Cell中进行精确检测
    for (const cellIndex of candidateCells) {
      const cell = this.cells[cellIndex];
      
      // 首先进行边界框检测（快速排除）
      if (this.pointInBoundingBox(pos, cell)) {
        // 然后进行精确的多边形检测
        if (this.pointInPolygonOptimized(pos, cell.polygon)) {
          return cell;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 暴力搜索（备用方案）
   */
  findCellBruteForce(pos) {
    for (const cell of this.cells) {
      if (this.pointInBoundingBox(pos, cell) && 
          this.pointInPolygonOptimized(pos, cell.polygon)) {
        return cell;
      }
    }
    return null;
  }
  
  /**
   * 边界框检测（快速排除）
   */
  pointInBoundingBox(point, cell) {
    const bbox = this.boundingBoxCache.get(cell);
    if (!bbox) return false;
    
    return point.x >= bbox.minX && point.x <= bbox.maxX &&
           point.y >= bbox.minY && point.y <= bbox.maxY;
  }
  
  /**
   * 优化的点在多边形内检测
   */
  pointInPolygonOptimized(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    const n = polygon.length;
    
    // 优化的射线投射算法
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      // 快速排除：如果点的y坐标不在边的y范围内，跳过
      if ((yi > point.y) === (yj > point.y)) continue;
      
      // 计算交点的x坐标
      const intersectX = (xj - xi) * (point.y - yi) / (yj - yi) + xi;
      
      // 如果交点在点的右侧，切换inside状态
      if (point.x < intersectX) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  /**
   * 更新命中测试缓存
   */
  updateHitTestCache(key, result) {
    // 限制缓存大小
    if (this.hitTestCache.size >= this.cacheSize) {
      // 删除最旧的条目（简单的LRU实现）
      const firstKey = this.hitTestCache.keys().next().value;
      this.hitTestCache.delete(firstKey);
    }
    
    this.hitTestCache.set(key, result);
  }
  
  /**
   * 更新Cell列表（重建空间索引）
   */
  updateCells(cells) {
    this.cells = cells;
    
    // 清理缓存
    this.boundingBoxCache.clear();
    this.hitTestCache.clear();
    
    // 重建空间索引
    this.buildSpatialIndex();
  }
  
  /**
   * 启用/禁用触摸处理
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
  
  /**
   * 优化的震动反馈
   */
  vibrate(type = 'light') {
    try {
      // 使用requestIdleCallback优化震动调用（如果支持）
      const doVibrate = () => {
        if (type === 'heavy') {
          tt.vibrateShort({ type: 'heavy' });
        } else {
          tt.vibrateShort({ type: 'light' });
        }
      };
      
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doVibrate, { timeout: 50 });
      } else {
        doVibrate();
      }
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }
  
  /**
   * 预热缓存（在游戏开始前调用）
   */
  warmupCache() {
    if (!this.cells || this.cells.length === 0) return;
    
    const startTime = performance.now();
    
    // 预计算一些常见位置的命中测试
    const samplePoints = [
      { x: this.canvas.width * 0.25, y: this.canvas.height * 0.25 },
      { x: this.canvas.width * 0.75, y: this.canvas.height * 0.25 },
      { x: this.canvas.width * 0.25, y: this.canvas.height * 0.75 },
      { x: this.canvas.width * 0.75, y: this.canvas.height * 0.75 },
      { x: this.canvas.width * 0.5, y: this.canvas.height * 0.5 }
    ];
    
    for (const point of samplePoints) {
      this.findCellAtPositionOptimized(point);
    }
    
    const warmupTime = performance.now() - startTime;
    console.log(`Touch handler cache warmed up in ${warmupTime.toFixed(2)}ms`);
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  /**
   * 重置性能指标
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      hitTestTime: 0,
      cacheHitRate: 0,
      totalQueries: 0,
      cacheHits: 0
    };
  }
  
  /**
   * 设置性能参数
   */
  setPerformanceSettings(settings) {
    if (settings.cacheSize) {
      this.cacheSize = settings.cacheSize;
    }
    
    if (settings.minProcessInterval) {
      this.minProcessInterval = settings.minProcessInterval;
    }
  }
  
  /**
   * 获取空间索引统计信息
   */
  getSpatialIndexStats() {
    if (!this.spatialIndex) return null;
    
    const { grid } = this.spatialIndex;
    const cellCounts = grid.map(cells => cells.length);
    const totalCells = cellCounts.reduce((sum, count) => sum + count, 0);
    const avgCellsPerGrid = totalCells / grid.length;
    const maxCellsPerGrid = Math.max(...cellCounts);
    const minCellsPerGrid = Math.min(...cellCounts);
    
    return {
      gridSize: this.spatialIndex.gridSize,
      totalGridCells: grid.length,
      avgCellsPerGrid: avgCellsPerGrid.toFixed(2),
      maxCellsPerGrid,
      minCellsPerGrid,
      totalIndexedCells: totalCells
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    this.boundingBoxCache.clear();
    this.hitTestCache.clear();
    this.spatialIndex = null;
    this.cells = [];
    this.onCellClick = null;
    this.onMouseMove = null;
  }
  
  /**
   * 调试：可视化空间索引
   */
  debugDrawSpatialIndex(ctx) {
    if (!this.spatialIndex) return;
    
    const { gridSize, cellWidth, cellHeight } = this.spatialIndex;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    
    // 绘制网格线
    for (let i = 0; i <= gridSize; i++) {
      const x = i * cellWidth;
      const y = i * cellHeight;
      
      // 垂直线
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
      
      // 水平线
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * 调试：显示性能信息
   */
  debugShowPerformanceInfo(ctx) {
    const metrics = this.getPerformanceMetrics();
    const spatialStats = this.getSpatialIndexStats();
    
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 300, 120);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    let y = 30;
    ctx.fillText(`Hit Test Time: ${metrics.hitTestTime.toFixed(2)}ms`, 20, y);
    y += 15;
    ctx.fillText(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`, 20, y);
    y += 15;
    ctx.fillText(`Total Queries: ${metrics.totalQueries}`, 20, y);
    y += 15;
    ctx.fillText(`Cache Size: ${this.hitTestCache.size}/${this.cacheSize}`, 20, y);
    
    if (spatialStats) {
      y += 15;
      ctx.fillText(`Grid: ${spatialStats.gridSize}x${spatialStats.gridSize}`, 20, y);
      y += 15;
      ctx.fillText(`Avg Cells/Grid: ${spatialStats.avgCellsPerGrid}`, 20, y);
    }
    
    ctx.restore();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizedTouchHandler;
}

if (typeof global !== 'undefined') {
  global.OptimizedTouchHandler = OptimizedTouchHandler;
}