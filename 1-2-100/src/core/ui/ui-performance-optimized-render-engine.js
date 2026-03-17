/**
 * 性能优化的渲染引擎
 * 实现脏矩形更新、帧率控制、内存优化等性能优化策略
 */

class PerformanceOptimizedRenderEngine {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = screenAdapter.pixelRatio;
    
    // 性能监控
    this.performanceMetrics = {
      frameCount: 0,
      lastFrameTime: 0,
      averageFPS: 60,
      renderTime: 0,
      dirtyRectCount: 0
    };
    
    // 脏矩形系统
    this.dirtyRects = [];
    this.lastGameState = null;
    this.lastCells = null;
    
    // 渲染缓存
    this.backgroundCache = null;
    this.hudCache = null;
    this.cellCache = new Map();
    
    // 帧率控制
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.lastRenderTime = 0;
    
    // 动画系统优化
    this.animations = [];
    this.maxAnimations = 30; // 限制最大动画数量
    
    // 内存管理
    this.gcCounter = 0;
    this.gcInterval = 300; // 每300帧触发一次垃圾回收检查
    
    this.initializeOptimizations();
  }
  
  /**
   * 初始化性能优化
   */
  initializeOptimizations() {
    // 创建离屏Canvas用于缓存
    this.createOffscreenCanvases();
    
    // 预计算常用值
    this.precomputeValues();
    
    // 设置性能监控
    this.setupPerformanceMonitoring();
  }
  
  /**
   * 创建离屏Canvas
   */
  createOffscreenCanvases() {
    try {
      // 背景缓存Canvas
      this.backgroundCanvas = document.createElement('canvas');
      this.backgroundCanvas.width = this.width;
      this.backgroundCanvas.height = this.height;
      this.backgroundCtx = this.backgroundCanvas.getContext('2d');
      
      // HUD缓存Canvas
      this.hudCanvas = document.createElement('canvas');
      this.hudCanvas.width = this.width;
      this.hudCanvas.height = 100; // HUD高度
      this.hudCtx = this.hudCanvas.getContext('2d');
      
    } catch (error) {
      console.warn('Failed to create offscreen canvases:', error);
      this.backgroundCanvas = null;
      this.hudCanvas = null;
    }
  }
  
  /**
   * 预计算常用值
   */
  precomputeValues() {
    this.fontSize = Math.max(12, Math.floor(this.width * 0.035));
    this.padding = this.screenAdapter.getPadding();
    this.hudHeight = this.fontSize * 6;
  }
  
  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    this.performanceMetrics.lastFrameTime = performance.now();
  }
  
  /**
   * 主渲染方法 - 使用脏矩形优化
   */
  render(cells, gameState, forceFullRender = false) {
    const startTime = performance.now();
    
    // 帧率控制
    if (!this.shouldRender(startTime) && !forceFullRender) {
      return;
    }
    
    // 检测变化并计算脏矩形
    const dirtyRects = this.calculateDirtyRects(cells, gameState, forceFullRender);
    
    if (dirtyRects.length === 0 && !forceFullRender) {
      return; // 没有变化，跳过渲染
    }
    
    // 清除脏矩形区域
    this.clearDirtyRects(dirtyRects);
    
    // 渲染背景（如果需要）
    if (this.needsBackgroundUpdate(dirtyRects)) {
      this.renderBackground(dirtyRects);
    }
    
    // 渲染Cells（仅渲染变化的）
    this.renderCells(cells, gameState, dirtyRects);
    
    // 渲染HUD（如果需要）
    if (this.needsHUDUpdate(gameState)) {
      this.renderHUD(gameState);
    }
    
    // 渲染动画
    this.renderAnimations();
    
    // 更新缓存状态
    this.updateCacheState(cells, gameState);
    
    // 更新性能指标
    this.updatePerformanceMetrics(startTime, dirtyRects.length);
    
    // 内存管理
    this.manageMemory();
  }
  
  /**
   * 判断是否应该渲染（帧率控制）
   */
  shouldRender(currentTime) {
    if (currentTime - this.lastRenderTime < this.frameInterval) {
      return false;
    }
    this.lastRenderTime = currentTime;
    return true;
  }
  
  /**
   * 计算脏矩形
   */
  calculateDirtyRects(cells, gameState, forceFullRender) {
    if (forceFullRender || !this.lastGameState || !this.lastCells) {
      return [{ x: 0, y: 0, width: this.width, height: this.height }];
    }
    
    const dirtyRects = [];
    
    // 检查游戏状态变化
    if (this.hasGameStateChanged(gameState)) {
      // HUD区域需要更新
      dirtyRects.push({
        x: 0,
        y: 0,
        width: this.width,
        height: this.hudHeight
      });
      
      // 进度条区域需要更新
      dirtyRects.push({
        x: 0,
        y: this.height - 40,
        width: this.width,
        height: 40
      });
    }
    
    // 检查Cell变化
    const changedCells = this.findChangedCells(cells);
    for (const cell of changedCells) {
      const bounds = this.getCellBounds(cell);
      dirtyRects.push(bounds);
    }
    
    // 合并重叠的矩形
    return this.mergeDirtyRects(dirtyRects);
  }
  
  /**
   * 检查游戏状态是否变化
   */
  hasGameStateChanged(gameState) {
    if (!this.lastGameState) return true;
    
    return (
      this.lastGameState.currentNumber !== gameState.currentNumber ||
      this.lastGameState.errors !== gameState.errors ||
      this.lastGameState.elapsedTime !== gameState.elapsedTime ||
      this.lastGameState.timeLeft !== gameState.timeLeft
    );
  }
  
  /**
   * 查找变化的Cell
   */
  findChangedCells(cells) {
    if (!this.lastCells) return cells;
    
    const changedCells = [];
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const lastCell = this.lastCells[i];
      
      if (!lastCell || cell.done !== lastCell.done) {
        changedCells.push(cell);
      }
    }
    
    return changedCells;
  }
  
  /**
   * 获取Cell边界
   */
  getCellBounds(cell) {
    if (!cell.polygon || cell.polygon.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
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
    
    // 添加一些边距以确保完全覆盖
    const margin = 5;
    return {
      x: Math.floor(minX - margin),
      y: Math.floor(minY - margin),
      width: Math.ceil(maxX - minX + margin * 2),
      height: Math.ceil(maxY - minY + margin * 2)
    };
  }
  
  /**
   * 合并重叠的脏矩形
   */
  mergeDirtyRects(rects) {
    if (rects.length <= 1) return rects;
    
    const merged = [];
    const sorted = rects.sort((a, b) => a.x - b.x);
    
    for (const rect of sorted) {
      if (merged.length === 0) {
        merged.push(rect);
        continue;
      }
      
      const last = merged[merged.length - 1];
      
      // 检查是否重叠或相邻
      if (this.rectsOverlap(last, rect)) {
        // 合并矩形
        const newRect = {
          x: Math.min(last.x, rect.x),
          y: Math.min(last.y, rect.y),
          width: Math.max(last.x + last.width, rect.x + rect.width) - Math.min(last.x, rect.x),
          height: Math.max(last.y + last.height, rect.y + rect.height) - Math.min(last.y, rect.y)
        };
        merged[merged.length - 1] = newRect;
      } else {
        merged.push(rect);
      }
    }
    
    return merged;
  }
  
  /**
   * 检查两个矩形是否重叠
   */
  rectsOverlap(rect1, rect2) {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }
  
  /**
   * 清除脏矩形区域
   */
  clearDirtyRects(dirtyRects) {
    for (const rect of dirtyRects) {
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }
  }
  
  /**
   * 检查是否需要更新背景
   */
  needsBackgroundUpdate(dirtyRects) {
    // 如果有全屏脏矩形或背景缓存无效，则需要更新
    return dirtyRects.some(rect => 
      rect.width >= this.width * 0.8 && rect.height >= this.height * 0.8
    ) || !this.backgroundCache;
  }
  
  /**
   * 渲染背景（使用缓存）
   */
  renderBackground(dirtyRects) {
    if (!this.backgroundCache && this.backgroundCanvas) {
      // 创建背景缓存
      this.themeSystem.applyBackgroundGradient(
        this.backgroundCtx, 
        this.width, 
        this.height
      );
      this.backgroundCache = true;
    }
    
    if (this.backgroundCanvas) {
      // 使用缓存的背景
      for (const rect of dirtyRects) {
        this.ctx.drawImage(
          this.backgroundCanvas,
          rect.x, rect.y, rect.width, rect.height,
          rect.x, rect.y, rect.width, rect.height
        );
      }
    } else {
      // 直接绘制背景
      this.themeSystem.applyBackgroundGradient(this.ctx, this.width, this.height);
    }
  }
  
  /**
   * 渲染Cells（仅渲染脏矩形区域内的）
   */
  renderCells(cells, gameState, dirtyRects) {
    for (const cell of cells) {
      // 检查Cell是否在脏矩形区域内
      if (this.cellIntersectsDirtyRects(cell, dirtyRects)) {
        this.renderCell(cell, gameState);
      }
    }
  }
  
  /**
   * 检查Cell是否与脏矩形相交
   */
  cellIntersectsDirtyRects(cell, dirtyRects) {
    const cellBounds = this.getCellBounds(cell);
    
    return dirtyRects.some(rect => this.rectsOverlap(cellBounds, rect));
  }
  
  /**
   * 渲染单个Cell（优化版本）
   */
  renderCell(cell, gameState) {
    if (cell.polygon.length < 3) return;
    
    const ctx = this.ctx;
    
    // 获取Cell样式
    let cellState = 'normal';
    if (cell.done) {
      cellState = 'done';
    } else if (cell.number === gameState.currentNumber) {
      cellState = 'active';
    }
    
    const cellStyle = this.themeSystem.getCellStyle(cellState);
    
    // 使用Path2D优化路径绘制
    const path = new Path2D();
    path.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      path.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    path.closePath();
    
    // 填充背景
    ctx.fillStyle = cellStyle.backgroundColor;
    ctx.fill(path);
    
    // 绘制边框
    if (cellStyle.borderColor !== 'transparent') {
      ctx.strokeStyle = cellStyle.borderColor;
      ctx.lineWidth = cellStyle.borderWidth;
      ctx.stroke(path);
    }
    
    // 绘制数字
    if (!cell.done) {
      ctx.fillStyle = cellStyle.textColor;
      ctx.font = `bold ${this.fontSize}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 为当前目标数字添加发光效果
      if (cell.number === gameState.currentNumber) {
        ctx.save();
        ctx.shadowColor = this.themeSystem.getEffectColor('glow');
        ctx.shadowBlur = 20;
        ctx.fillText(cell.number, cell.site.x, cell.site.y);
        ctx.restore();
      } else {
        ctx.fillText(cell.number, cell.site.x, cell.site.y);
      }
    }
  }
  
  /**
   * 检查是否需要更新HUD
   */
  needsHUDUpdate(gameState) {
    return this.hasGameStateChanged(gameState) || !this.hudCache;
  }
  
  /**
   * 渲染HUD（使用缓存）
   */
  renderHUD(gameState) {
    if (this.hudCanvas) {
      // 清除HUD缓存
      this.hudCtx.clearRect(0, 0, this.width, this.hudHeight);
      
      // 在离屏Canvas上绘制HUD
      this.drawHUDContent(this.hudCtx, gameState);
      
      // 将HUD缓存绘制到主Canvas
      this.ctx.drawImage(this.hudCanvas, 0, 0);
      
      this.hudCache = true;
    } else {
      // 直接在主Canvas上绘制
      this.drawHUDContent(this.ctx, gameState);
    }
  }
  
  /**
   * 绘制HUD内容
   */
  drawHUDContent(ctx, gameState) {
    const hudStyle = this.themeSystem.getHUDStyle();
    const fontSize = this.screenAdapter.getFontSize(0.9);
    
    // HUD背景
    ctx.fillStyle = hudStyle.bg;
    ctx.fillRect(0, 0, this.width, this.hudHeight);
    
    // 目标数字
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${fontSize * 1.2}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`目标: ${gameState.currentNumber}`, this.padding, this.padding);
    
    // 时间显示
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.timeLeft);
    const timeLabel = gameState.difficulty === 0 ? '时间' : '剩余';
    
    let timeColor = hudStyle.text;
    if (gameState.difficulty > 0 && gameState.timeLeft <= 10) {
      timeColor = hudStyle.warning;
      const shouldFlash = Math.floor(Date.now() / 500) % 2 === 0;
      if (shouldFlash) {
        timeColor = hudStyle.error;
      }
    }
    
    ctx.fillStyle = timeColor;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.fillText(`${timeLabel}: ${timeStr}`, this.padding, this.padding + fontSize * 2);
    
    // 错误次数
    ctx.fillStyle = hudStyle.error;
    ctx.fillText(`错误: ${gameState.errors}`, this.padding, this.padding + fontSize * 4);
  }
  
  /**
   * 渲染动画（优化版本）
   */
  renderAnimations() {
    const now = Date.now();
    const ctx = this.ctx;
    
    // 限制动画数量
    if (this.animations.length > this.maxAnimations) {
      this.animations = this.animations.slice(-this.maxAnimations);
    }
    
    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.startTime;
      if (elapsed > anim.duration) return false;
      
      const progress = elapsed / anim.duration;
      this.renderAnimation(ctx, anim, progress);
      return true;
    });
  }
  
  /**
   * 渲染单个动画
   */
  renderAnimation(ctx, anim, progress) {
    ctx.save();
    
    switch (anim.type) {
      case 'floatingText':
        const y = anim.y - progress * 60;
        const opacity = 1 - progress;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = anim.color;
        ctx.font = `bold ${anim.size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(anim.text, anim.x, y);
        break;
        
      case 'particle':
        const px = anim.x + anim.vx * progress * 100;
        const py = anim.y + anim.vy * progress * 100;
        const pOpacity = 1 - progress;
        const size = anim.size * (1 - progress * 0.5);
        ctx.globalAlpha = pOpacity;
        ctx.fillStyle = anim.color;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'ripple':
        const radius = anim.maxRadius * progress;
        const rOpacity = (1 - progress) * 0.8;
        ctx.globalAlpha = rOpacity;
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * 更新缓存状态
   */
  updateCacheState(cells, gameState) {
    this.lastGameState = { ...gameState };
    this.lastCells = cells.map(cell => ({ ...cell }));
  }
  
  /**
   * 更新性能指标
   */
  updatePerformanceMetrics(startTime, dirtyRectCount) {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.performanceMetrics.frameCount++;
    this.performanceMetrics.renderTime = renderTime;
    this.performanceMetrics.dirtyRectCount = dirtyRectCount;
    
    // 计算平均FPS
    const deltaTime = endTime - this.performanceMetrics.lastFrameTime;
    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      this.performanceMetrics.averageFPS = 
        (this.performanceMetrics.averageFPS * 0.9) + (currentFPS * 0.1);
    }
    this.performanceMetrics.lastFrameTime = endTime;
  }
  
  /**
   * 内存管理
   */
  manageMemory() {
    this.gcCounter++;
    
    if (this.gcCounter >= this.gcInterval) {
      this.gcCounter = 0;
      
      // 清理过期的缓存
      this.cleanupCache();
      
      // 限制动画数量
      if (this.animations.length > this.maxAnimations) {
        this.animations = this.animations.slice(-this.maxAnimations);
      }
      
      // 建议垃圾回收（如果支持）
      if (typeof gc === 'function') {
        gc();
      }
    }
  }
  
  /**
   * 清理缓存
   */
  cleanupCache() {
    // 清理Cell缓存（如果有的话）
    if (this.cellCache.size > 100) {
      this.cellCache.clear();
    }
  }
  
  /**
   * 格式化时间
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  /**
   * 添加动画（优化版本）
   */
  addAnimation(type, x, y, options = {}) {
    // 限制动画数量
    if (this.animations.length >= this.maxAnimations) {
      this.animations.shift(); // 移除最旧的动画
    }
    
    const animation = {
      type,
      x,
      y,
      startTime: Date.now(),
      ...options
    };
    
    this.animations.push(animation);
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  /**
   * 设置目标FPS
   */
  setTargetFPS(fps) {
    this.targetFPS = Math.max(30, Math.min(120, fps));
    this.frameInterval = 1000 / this.targetFPS;
  }
  
  /**
   * 强制全屏重绘
   */
  forceFullRender(cells, gameState) {
    this.render(cells, gameState, true);
  }
  
  /**
   * 清理资源
   */
  destroy() {
    this.animations = [];
    this.dirtyRects = [];
    this.cellCache.clear();
    this.backgroundCache = null;
    this.hudCache = null;
    
    if (this.backgroundCanvas) {
      this.backgroundCanvas = null;
      this.backgroundCtx = null;
    }
    
    if (this.hudCanvas) {
      this.hudCanvas = null;
      this.hudCtx = null;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizedRenderEngine;
}

if (typeof global !== 'undefined') {
  global.PerformanceOptimizedRenderEngine = PerformanceOptimizedRenderEngine;
}