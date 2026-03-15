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

// ==================== Voronoi 生成器 ====================

class VoronoiGenerator {
  constructor(width, height, numSites) {
    this.width = width;
    this.height = height;
    this.numSites = numSites;
    this.sites = [];
    this.cells = [];
    this.randomSeed = Date.now();
  }

  generateSites() {
    const sites = [];
    const gridSize = Math.ceil(Math.sqrt(this.numSites));
    const cellW = this.width / gridSize;
    const cellH = this.height / gridSize;
    
    for (let i = 0; i < this.numSites; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = (col + 0.5 + (Math.random() - 0.5) * 0.8) * cellW;
      const y = (row + 0.5 + (Math.random() - 0.5) * 0.8) * cellH;
      const clampedX = Math.max(10, Math.min(this.width - 10, x));
      const clampedY = Math.max(10, Math.min(this.height - 10, y));
      sites.push(new Point(clampedX, clampedY));
    }
    return sites;
  }

  generateVoronoiCells() {
    const cells = this.sites.map((site, i) => new Cell(site, i + 1));
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const polygon = this.buildCellPolygon(cell.site, i);
      cell.polygon = polygon;
    }
    return cells;
  }

  buildCellPolygon(site, siteIndex) {
    const numAngles = 36;
    const maxRadius = Math.max(this.width, this.height);
    const points = [];
    
    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      
      let minR = 0;
      let maxR = maxRadius;
      let boundaryPoint = null;
      
      for (let iter = 0; iter < 20; iter++) {
        const r = (minR + maxR) / 2;
        const testX = site.x + dx * r;
        const testY = site.y + dy * r;
        
        if (testX < 0 || testX > this.width || testY < 0 || testY > this.height) {
          maxR = r;
          continue;
        }
        
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
    return this.clipPolygonToBounds(points);
  }

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

  assignNumbers(cells) {
    const numbers = Array.from({ length: this.numSites }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    cells.forEach((cell, i) => {
      cell.number = numbers[i];
    });
  }

  validateCells(cells) {
    const minArea = (this.width * this.height) * 0.005;
    for (const cell of cells) {
      const area = cell.getArea();
      if (area < minArea) {
        console.warn(`Cell ${cell.number} area too small: ${area}`);
        return false;
      }
    }
    const numbers = cells.map(c => c.number).sort((a, b) => a - b);
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i] === numbers[i + 1]) {
        console.error('Duplicate numbers found');
        return false;
      }
    }
    return true;
  }

  generate() {
    console.log('Generating Voronoi diagram...');
    const startTime = Date.now();
    this.sites = this.generateSites();
    console.log(`Generated ${this.sites.length} sites`);
    this.cells = this.generateVoronoiCells();
    console.log(`Generated ${this.cells.length} cells`);
    this.assignNumbers(this.cells);
    const valid = this.validateCells(this.cells);
    if (!valid) {
      throw new Error('Voronoi generation validation failed');
    }
    const endTime = Date.now();
    console.log(`Voronoi generation completed in ${endTime - startTime}ms`);
    return this.cells;
  }
}

// ==================== 网格布局生成器 ====================

class GridLayoutGenerator {
  constructor(width, height, numCells) {
    this.width = width;
    this.height = height;
    this.numCells = numCells;
  }

  generate() {
    console.log('Using grid layout fallback...');
    const cells = [];
    const gridSize = Math.ceil(Math.sqrt(this.numCells));
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;
    const numbers = Array.from({ length: this.numCells }, (_, i) => i + 1);
    this.shuffle(numbers);
    
    for (let i = 0; i < this.numCells; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const offsetX = (Math.random() - 0.5) * cellWidth * 0.3;
      const offsetY = (Math.random() - 0.5) * cellHeight * 0.3;
      const centerX = (col + 0.5) * cellWidth + offsetX;
      const centerY = (row + 0.5) * cellHeight + offsetY;
      const site = new Point(centerX, centerY);
      const cell = new Cell(site, numbers[i]);
      const x1 = col * cellWidth;
      const y1 = row * cellHeight;
      const x2 = (col + 1) * cellWidth;
      const y2 = (row + 1) * cellHeight;
      cell.polygon = [
        new Point(x1, y1),
        new Point(x2, y1),
        new Point(x2, y2),
        new Point(x1, y2)
      ];
      cells.push(cell);
    }
    console.log(`Generated ${cells.length} grid cells`);
    return cells;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// ==================== 渲染引擎 ====================

class RenderEngine {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = screenAdapter.pixelRatio;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.animations = [];
    this.colors = {
      bright: {
        background: '#f8f9fa',
        cellBg: '#ffffff',
        cellBorder: '#e0e0e0',
        cellDone: 'rgba(200, 200, 200, 0.3)',
        text: '#333333',
        target: '#1D9E75',
        success: '#5DCAA5',
        error: '#ef4444',
        progress: '#1D9E75'
      },
      dark: {
        background: '#0b0f1a',
        cellBg: '#1a2744',
        cellBorder: '#1e2f4a',
        text: '#8ab4cc',
        target: '#5DCAA5',
        success: '#10b981',
        error: '#ef4444',
        progress: '#5DCAA5'
      }
    };
  }

  initHDCanvas() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  createOffscreenCanvas() {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = tt.createCanvas();
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.offscreenCtx.scale(this.dpr, this.dpr);
    }
  }

  renderBrightMode(cells, gameState) {
    const ctx = this.ctx;
    const theme = this.colors.bright;
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, this.width, this.height);
    for (const cell of cells) {
      this.renderCell(ctx, cell, theme, false);
    }
    this.renderHUD(gameState, theme);
    this.renderAnimations();
  }

  renderCell(ctx, cell, theme, isDarkMode) {
    if (cell.polygon.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    if (cell.done) {
      ctx.fillStyle = theme.cellDone;
    } else {
      ctx.fillStyle = theme.cellBg;
    }
    ctx.fill();
    ctx.strokeStyle = theme.cellBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (!cell.done || isDarkMode) {
      ctx.fillStyle = theme.text;
      ctx.font = `${this.getFontSize()}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const opacity = cell.done ? 0.2 : 1;
      ctx.globalAlpha = opacity;
      ctx.fillText(cell.number, cell.site.x, cell.site.y);
      ctx.globalAlpha = 1;
    }
  }

  getFontSize() {
    return Math.max(12, Math.floor(this.width * 0.035));
  }

  renderDarkMode(cells, gameState, mousePos) {
    const ctx = this.ctx;
    const theme = this.colors.dark;
    this.createOffscreenCanvas();
    const offCtx = this.offscreenCtx;
    offCtx.fillStyle = theme.background;
    offCtx.fillRect(0, 0, this.width, this.height);
    for (const cell of cells) {
      this.renderCell(offCtx, cell, theme, true);
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.renderSpotlight(ctx, mousePos);
    this.renderTargetRing(ctx, cells, gameState.currentNumber, theme);
    this.renderHUD(gameState, theme);
    this.renderAnimations();
  }

  renderSpotlight(ctx, mousePos) {
    const radius = this.width * 0.15;
    const gradient = ctx.createRadialGradient(
      mousePos.x, mousePos.y, 0,
      mousePos.x, mousePos.y, radius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderTargetRing(ctx, cells, targetNumber, theme) {
    const targetCell = cells.find(c => c.number === targetNumber);
    if (!targetCell || targetCell.done) return;
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(targetCell.site.x, targetCell.site.y, 15 + pulse * 5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(93, 202, 165, ${0.4 + pulse * 0.6})`;
    ctx.lineWidth = 2 + pulse * 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  renderHUD(gameState, theme) {
    const ctx = this.ctx;
    const padding = this.screenAdapter.getPadding();
    const fontSize = this.screenAdapter.getFontSize(0.9);
    ctx.fillStyle = theme.text;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.target;
    ctx.font = `bold ${fontSize * 1.2}px "Courier New", monospace`;
    ctx.fillText(`目标: ${gameState.currentNumber}`, padding, padding);
    ctx.fillStyle = theme.text;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.timeLeft);
    const timeLabel = gameState.difficulty === 0 ? '时间' : '剩余';
    ctx.fillText(`${timeLabel}: ${timeStr}`, padding, padding + fontSize * 2);
    ctx.fillStyle = theme.error;
    ctx.fillText(`错误: ${gameState.errors}`, padding, padding + fontSize * 4);
    if (gameState.mode === 'dark' && gameState.combo > 0) {
      ctx.fillStyle = theme.success;
      ctx.fillText(`连击: ×${gameState.combo}`, padding, padding + fontSize * 6);
    }
    const barY = this.height - 30;
    const barWidth = this.width - padding * 2;
    const progress = Math.min(1, (gameState.currentNumber - 1) / 100);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(padding, barY, barWidth, 4);
    ctx.fillStyle = theme.progress;
    ctx.fillRect(padding, barY, barWidth * progress, 4);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  addFloatingText(x, y, text, color, size = 16) {
    this.animations.push({
      type: 'floatingText',
      x, y, text, color, size,
      startTime: Date.now(),
      duration: 900
    });
  }

  renderAnimations() {
    const now = Date.now();
    const ctx = this.ctx;
    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.startTime;
      if (elapsed > anim.duration) return false;
      const progress = elapsed / anim.duration;
      if (anim.type === 'floatingText') {
        const y = anim.y - progress * 60;
        const opacity = 1 - progress;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = anim.color;
        ctx.font = `bold ${anim.size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(anim.text, anim.x, y);
        ctx.restore();
      }
      return true;
    });
  }

  showCorrectFeedback(cell, mode) {
    const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
    this.addFloatingText(cell.site.x, cell.site.y, '+1', theme.success, 16);
  }

  showErrorFeedback(cell, mode) {
    const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
    this.addFloatingText(cell.site.x, cell.site.y, '✗', theme.error, 18);
  }

  showComboFeedback(cell, combo) {
    let text = '+1';
    let size = 16;
    if (combo >= 10) {
      text = `⚡ ×${combo}`;
      size = 20;
    } else if (combo >= 5) {
      text = `×${combo} 🔥`;
      size = 18;
    }
    this.addFloatingText(cell.site.x, cell.site.y, text, this.colors.dark.success, size);
  }

  clearAnimations() {
    this.animations = [];
  }
}

// ==================== 触摸处理器 ====================

class TouchHandler {
  constructor(canvas, cells, gameManager) {
    this.canvas = canvas;
    this.cells = cells;
    this.gameManager = gameManager;
    this.touchStartTime = 0;
    this.lastTouchPos = { x: 0, y: 0 };
    this.isEnabled = true;
    this.onCellClick = null;
    this.onMouseMove = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    tt.onTouchStart((event) => {
      this.touchStartTime = Date.now();
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchStart(pos);
    });

    tt.onTouchMove((event) => {
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchMove(pos);
    });

    tt.onTouchEnd((event) => {
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < 300) {
        this.handleTap(this.lastTouchPos);
      }
    });
  }

  getTouchPosition(touch) {
    return { x: touch.clientX, y: touch.clientY };
  }

  handleTouchStart(pos) {}

  handleTouchMove(pos) {
    if (this.gameManager && this.gameManager.state === 'playing' && this.onMouseMove) {
      this.onMouseMove(pos);
    }
  }

  handleTap(pos) {
    try {
      // 如果在菜单状态，检查UI按钮点击
      if (this.gameManager && this.gameManager.state === 'menu') {
        const btn = this.gameManager.uiManager.handleClick(pos.x, pos.y);
        if (btn) {
          this.gameManager.handleUIClick(btn);
        }
        return;
      }
      
      // 如果在游戏状态，检查Cell点击
      if (this.gameManager && this.gameManager.state === 'playing' && this.isEnabled) {
        const clickedCell = this.findCellAtPosition(pos);
        if (clickedCell && this.onCellClick) {
          this.onCellClick(clickedCell);
        }
      }
    } catch (error) {
      console.error('Touch event handling error:', error);
    }
  }

  findCellAtPosition(pos) {
    for (const cell of this.cells) {
      if (this.pointInPolygon(pos, cell.polygon)) {
        return cell;
      }
    }
    return null;
  }

  pointInPolygon(point, polygon) {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  updateCells(cells) {
    this.cells = cells;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  vibrate(type = 'light') {
    try {
      if (type === 'heavy') {
        tt.vibrateShort({ type: 'heavy' });
      } else {
        tt.vibrateShort({ type: 'light' });
      }
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }
}

// ==================== UI 管理器 ====================

class UIManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    // 使用逻辑尺寸，而不是物理像素尺寸
    this.width = screenAdapter.screenWidth;
    this.height = screenAdapter.screenHeight;
    this.currentScreen = 'start'; // start | modeSelect | difficultySelect | game | result
    this.selectedMode = null;
    this.selectedDifficulty = null;
    this.buttons = [];
    this.onStartGame = null;
    
    console.log('UIManager初始化, 使用逻辑尺寸:', { width: this.width, height: this.height });
  }

  renderStartScreen() {
    console.log('renderStartScreen开始执行');
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    console.log('Canvas尺寸:', { width: w, height: h });
    console.log('Context存在:', !!ctx);
    
    // 渐变背景（参考羊了个羊的温暖色调）
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFE5B4');
    gradient.addColorStop(0.5, '#FFD4A3');
    gradient.addColorStop(1, '#FFC48C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    console.log('背景绘制完成');
    
    // 装饰性圆点
    this.drawDecorativeCircles(ctx);
    
    console.log('装饰圆点绘制完成');
    
    // 游戏标题
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(w * 0.12)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1-100', w / 2, h * 0.25);
    
    ctx.restore();
    
    console.log('标题绘制完成');
    
    // 副标题
    ctx.fillStyle = '#8B4513';
    ctx.font = `${Math.floor(w * 0.045)}px Arial, sans-serif`;
    ctx.fillText('专注力挑战', w / 2, h * 0.35);
    
    console.log('副标题绘制完成');
    
    // 开始按钮
    console.log('准备绘制按钮');
    this.drawButton(ctx, {
      x: w * 0.2,
      y: h * 0.55,
      width: w * 0.6,
      height: 60,
      text: '开始游戏',
      color: '#FF6B6B',
      textColor: '#FFFFFF',
      id: 'start'
    });
    
    console.log('按钮绘制完成');
    
    // 说明文字
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(w * 0.035)}px Arial, sans-serif`;
    ctx.fillText('按顺序点击 1-100 的数字', w / 2, h * 0.75);
    ctx.fillText('挑战你的专注力极限！', w / 2, h * 0.8);
    
    console.log('说明文字绘制完成');
    console.log('renderStartScreen执行完成，按钮数量:', this.buttons.length);
  }

  renderModeSelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    this.drawDecorativeCircles(ctx);
    
    // 标题
    ctx.fillStyle = '#1976D2';
    ctx.font = `bold ${Math.floor(w * 0.07)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择游戏模式', w / 2, h * 0.2);
    
    // 明亮模式按钮
    this.drawModeCard(ctx, {
      x: w * 0.1,
      y: h * 0.35,
      width: w * 0.8,
      height: 100,
      icon: '☀️',
      title: '明亮视野',
      desc: '清晰可见所有数字',
      color: '#4CAF50',
      id: 'bright'
    });
    
    // 黑暗模式按钮
    this.drawModeCard(ctx, {
      x: w * 0.1,
      y: h * 0.55,
      width: w * 0.8,
      height: 100,
      icon: '🌙',
      title: '黑暗视野',
      desc: '手电筒照亮，挑战更高难度',
      color: '#5C6BC0',
      id: 'dark'
    });
    
    // 返回按钮
    this.drawSmallButton(ctx, {
      x: 20,
      y: h - 70,
      width: 80,
      height: 40,
      text: '返回',
      color: '#9E9E9E',
      id: 'back'
    });
  }

  renderDifficultySelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFF3E0');
    gradient.addColorStop(1, '#FFE0B2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    this.drawDecorativeCircles(ctx);
    
    // 标题
    ctx.fillStyle = '#E65100';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', w / 2, h * 0.15);
    
    const buttonWidth = w * 0.4;
    const buttonHeight = 80;
    const spacing = 20;
    
    // 难度按钮（2x2布局）
    const difficulties = [
      { text: '自由模式', time: 0, color: '#66BB6A', id: 'free' },
      { text: '1分钟', time: 60, color: '#FFA726', id: '60' },
      { text: '2分钟', time: 120, color: '#FF7043', id: '120' },
      { text: '3分钟', time: 180, color: '#EF5350', id: '180' }
    ];
    
    difficulties.forEach((diff, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = w * 0.1 + col * (buttonWidth + spacing);
      const y = h * 0.3 + row * (buttonHeight + spacing);
      
      this.drawDifficultyButton(ctx, {
        x, y,
        width: buttonWidth,
        height: buttonHeight,
        text: diff.text,
        color: diff.color,
        id: diff.id,
        time: diff.time
      });
    });
    
    // 返回按钮
    this.drawSmallButton(ctx, {
      x: 20,
      y: h - 70,
      width: 80,
      height: 40,
      text: '返回',
      color: '#9E9E9E',
      id: 'back'
    });
  }

  renderResultScreen(stats) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 渐变背景
    const isWin = stats.completed === 100;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    if (isWin) {
      gradient.addColorStop(0, '#E8F5E9');
      gradient.addColorStop(1, '#C8E6C9');
    } else {
      gradient.addColorStop(0, '#FFEBEE');
      gradient.addColorStop(1, '#FFCDD2');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    this.drawDecorativeCircles(ctx);
    
    // 结果标题
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    
    ctx.fillStyle = isWin ? '#2E7D32' : '#C62828';
    ctx.font = `bold ${Math.floor(w * 0.1)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(isWin ? '🎉 完成！' : '⏰ 时间到', w / 2, h * 0.2);
    ctx.restore();
    
    // 成绩卡片
    this.drawResultCard(ctx, {
      x: w * 0.1,
      y: h * 0.35,
      width: w * 0.8,
      height: 200,
      stats: stats
    });
    
    // 按钮
    this.drawButton(ctx, {
      x: w * 0.1,
      y: h * 0.65,
      width: w * 0.35,
      height: 50,
      text: '再来一局',
      color: '#4CAF50',
      textColor: '#FFFFFF',
      id: 'restart'
    });
    
    this.drawButton(ctx, {
      x: w * 0.55,
      y: h * 0.65,
      width: w * 0.35,
      height: 50,
      text: '返回首页',
      color: '#2196F3',
      textColor: '#FFFFFF',
      id: 'home'
    });
  }

  drawButton(ctx, btn) {
    ctx.save();
    
    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    // 按钮背景
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 25);
    ctx.fill();
    
    ctx.restore();
    
    // 按钮文字
    ctx.fillStyle = btn.textColor || '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    
    // 保存按钮信息用于点击检测
    this.buttons.push({
      id: btn.id,
      x: btn.x,
      y: btn.y,
      width: btn.width,
      height: btn.height
    });
  }

  drawModeCard(ctx, card) {
    ctx.save();
    
    // 卡片阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // 卡片背景
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, card.x, card.y, card.width, card.height, 15);
    ctx.fill();
    
    ctx.restore();
    
    // 左侧图标
    ctx.font = `${Math.floor(this.width * 0.12)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.icon, card.x + 60, card.y + card.height / 2);
    
    // 右侧文字
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${Math.floor(this.width * 0.055)}px Arial, sans-serif`;
    ctx.fillText(card.title, card.x + 120, card.y + card.height / 2 - 15);
    
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(this.width * 0.035)}px Arial, sans-serif`;
    ctx.fillText(card.desc, card.x + 120, card.y + card.height / 2 + 15);
    
    // 右侧箭头
    ctx.fillStyle = card.color;
    ctx.font = `${Math.floor(this.width * 0.06)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText('>', card.x + card.width - 20, card.y + card.height / 2);
    
    this.buttons.push({
      id: card.id,
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height
    });
  }

  drawDifficultyButton(ctx, btn) {
    ctx.save();
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 15);
    ctx.fill();
    
    ctx.restore();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 - 10);
    
    if (btn.time > 0) {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`限时 ${btn.time}秒`, btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    } else {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText('无时间限制', btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    }
    
    this.buttons.push({
      id: btn.id,
      x: btn.x,
      y: btn.y,
      width: btn.width,
      height: btn.height,
      time: btn.time
    });
  }

  drawSmallButton(ctx, btn) {
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    
    this.buttons.push({
      id: btn.id,
      x: btn.x,
      y: btn.y,
      width: btn.width,
      height: btn.height
    });
  }

  drawResultCard(ctx, card) {
    ctx.save();
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, card.x, card.y, card.width, card.height, 15);
    ctx.fill();
    
    ctx.restore();
    
    const centerX = card.x + card.width / 2;
    const startY = card.y + 30;
    const lineHeight = 45;
    
    ctx.textAlign = 'center';
    
    // 完成数量
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('完成数量', centerX, startY);
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = `bold ${Math.floor(this.width * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${card.stats.completed}/100`, centerX, startY + 30);
    
    // 用时/错误
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`用时: ${this.formatTime(card.stats.time)}`, centerX - 80, startY + 80);
    ctx.fillText(`错误: ${card.stats.errors}次`, centerX + 80, startY + 80);
    
    // 连击（如果有）
    if (card.stats.maxCombo > 0) {
      ctx.fillText(`最高连击: ${card.stats.maxCombo}`, centerX, startY + 120);
    }
  }

  drawDecorativeCircles(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    const circles = [
      { x: this.width * 0.1, y: this.height * 0.1, r: 40 },
      { x: this.width * 0.9, y: this.height * 0.15, r: 30 },
      { x: this.width * 0.15, y: this.height * 0.85, r: 35 },
      { x: this.width * 0.85, y: this.height * 0.9, r: 25 }
    ];
    
    circles.forEach(circle => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  handleClick(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        return btn;
      }
    }
    return null;
  }

  render(screen, data) {
    console.log('UIManager.render被调用, screen:', screen);
    this.buttons = [];
    this.currentScreen = screen;
    
    switch (screen) {
      case 'start':
        console.log('渲染开始界面');
        this.renderStartScreen();
        console.log('开始界面渲染完成');
        break;
      case 'modeSelect':
        console.log('渲染模式选择界面');
        this.renderModeSelectScreen();
        break;
      case 'difficultySelect':
        console.log('渲染难度选择界面');
        this.renderDifficultySelectScreen();
        break;
      case 'result':
        console.log('渲染结果界面');
        this.renderResultScreen(data);
        break;
      default:
        console.error('未知的screen:', screen);
    }
  }
}

// ==================== 游戏管理器 ====================

class GameManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.state = 'menu';
    this.mode = 'bright';
    this.difficulty = 180;
    this.currentNumber = 1;
    this.errors = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsedTime = 0;
    this.timeLeft = 0;
    this.cells = [];
    this.timer = null;
    this.animationFrameId = null;
    this.mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    this.voronoiGenerator = null;
    this.gridGenerator = null;
    this.renderEngine = null;
    this.touchHandler = null;
    this.uiManager = null;
    this.currentScreen = 'start';
  }

  async init() {
    console.log('Initializing GameManager...');
    try {
      const bounds = this.screenAdapter.getGameBounds();
      this.voronoiGenerator = new VoronoiGenerator(bounds.width, bounds.height, 100);
      this.gridGenerator = new GridLayoutGenerator(bounds.width, bounds.height, 100);
      this.renderEngine = new RenderEngine(this.canvas, this.ctx, this.screenAdapter);
      
      // 注意：不在这里调用initHDCanvas，因为UIManager需要未缩放的context
      // this.renderEngine.initHDCanvas();
      
      this.uiManager = new UIManager(this.canvas, this.ctx, this.screenAdapter);
      
      // 创建全局TouchHandler，传入gameManager引用
      this.touchHandler = new TouchHandler(this.canvas, [], this);
      
      console.log('GameManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize GameManager:', error);
      return false;
    }
  }

  setupUIClickHandler() {
    // UI点击事件在TouchHandler中统一处理
    // 不需要单独的事件监听器
  }

  handleUIClick(btn) {
    console.log('UI Button clicked:', btn.id);
    
    // 添加震动反馈
    try {
      tt.vibrateShort({ type: 'light' });
    } catch (e) {}
    
    switch (btn.id) {
      case 'start':
        this.currentScreen = 'modeSelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
        this.uiManager.render('modeSelect');
        break;
        
      case 'bright':
        this.mode = 'bright';
        this.currentScreen = 'difficultySelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
        this.uiManager.render('difficultySelect');
        break;
        
      case 'dark':
        this.mode = 'dark';
        this.currentScreen = 'difficultySelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
        this.uiManager.render('difficultySelect');
        break;
        
      case 'free':
        this.difficulty = 0;
        this.startGame();
        break;
        
      case '60':
        this.difficulty = 60;
        this.startGame();
        break;
        
      case '120':
        this.difficulty = 120;
        this.startGame();
        break;
        
      case '180':
        this.difficulty = 180;
        this.startGame();
        break;
        
      case 'back':
        if (this.currentScreen === 'difficultySelect') {
          this.currentScreen = 'modeSelect';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
          this.uiManager.render('modeSelect');
        } else if (this.currentScreen === 'modeSelect') {
          this.currentScreen = 'start';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
          this.uiManager.render('start');
        }
        break;
        
      case 'restart':
        this.startGame();
        break;
        
      case 'home':
        this.currentScreen = 'start';
        this.state = 'menu';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置缩放
        this.uiManager.render('start');
        break;
    }
  }

  showMenu() {
    console.log('显示主菜单');
    console.log('当前状态:', this.state);
    console.log('UIManager存在:', !!this.uiManager);
    
    this.state = 'menu';
    this.currentScreen = 'start';
    
    // 重置canvas缩放，因为UI需要未缩放的context
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    if (this.uiManager) {
      console.log('调用UIManager.render(start)');
      this.uiManager.render('start');
      console.log('UIManager.render完成');
    } else {
      console.error('UIManager未初始化！');
    }
  }

  startGame() {
    console.log('Starting game...', { mode: this.mode, difficulty: this.difficulty });
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    this.cells = this.generateVoronoiWithRetry(3);
    const bounds = this.screenAdapter.getGameBounds();
    for (const cell of this.cells) {
      cell.site.y += bounds.y;
      for (const point of cell.polygon) {
        point.y += bounds.y;
      }
    }
    
    // 初始化HD Canvas用于游戏渲染
    this.renderEngine.initHDCanvas();
    
    // 更新TouchHandler的cells和回调
    this.touchHandler.updateCells(this.cells);
    this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
    this.touchHandler.onMouseMove = (pos) => this.handleMouseMove(pos);
    this.touchHandler.setEnabled(true);
    
    this.startTimer();
    this.startRenderLoop();
    console.log('Game started successfully');
  }

  generateVoronoiWithRetry(maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Voronoi generation attempt ${attempt}/${maxRetries}`);
        const cells = this.voronoiGenerator.generate();
        if (cells.length !== 100) {
          throw new Error(`Invalid cell count: ${cells.length}`);
        }
        console.log('Voronoi generation successful');
        return cells;
      } catch (error) {
        console.warn(`Voronoi generation attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error('All Voronoi generation attempts failed, using grid fallback');
          return this.gridGenerator.generate();
        }
        this.voronoiGenerator.randomSeed = Date.now() + attempt;
      }
    }
  }

  handleCellClick(cell) {
    if (this.state !== 'playing' || cell.done) return;
    if (cell.number === this.currentNumber) {
      this.handleCorrectClick(cell);
    } else {
      this.handleWrongClick(cell);
    }
  }

  handleCorrectClick(cell) {
    cell.done = true;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    if (this.mode === 'dark' && this.combo >= 5) {
      this.renderEngine.showComboFeedback(cell, this.combo);
    } else {
      this.renderEngine.showCorrectFeedback(cell, this.mode);
    }
    this.touchHandler.vibrate('light');
    this.currentNumber++;
    if (this.currentNumber > 100) {
      this.winGame();
    }
  }

  handleWrongClick(cell) {
    this.errors++;
    this.combo = 0;
    this.renderEngine.showErrorFeedback(cell, this.mode);
    this.touchHandler.vibrate('heavy');
  }

  handleMouseMove(pos) {
    this.mousePos = pos;
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (this.difficulty === 0) {
        this.elapsedTime++;
      } else {
        this.timeLeft--;
        this.elapsedTime++;
        if (this.timeLeft <= 0) {
          this.gameOver();
        }
      }
    }, 1000);
  }

  startRenderLoop() {
    const loop = () => {
      if (this.state !== 'playing') return;
      try {
        const gameState = {
          mode: this.mode,
          difficulty: this.difficulty,
          currentNumber: this.currentNumber,
          errors: this.errors,
          combo: this.combo,
          elapsedTime: this.elapsedTime,
          timeLeft: this.timeLeft
        };
        if (this.mode === 'bright') {
          this.renderEngine.renderBrightMode(this.cells, gameState);
        } else {
          this.renderEngine.renderDarkMode(this.cells, gameState, this.mousePos);
        }
        this.animationFrameId = requestAnimationFrame(loop);
      } catch (error) {
        console.error('Render loop error:', error);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  winGame() {
    console.log('Game won!');
    this.state = 'menu';
    this.stopGame();
    
    // 重置canvas缩放用于UI渲染
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const stats = {
      completed: 100,
      time: this.elapsedTime,
      errors: this.errors,
      maxCombo: this.maxCombo
    };
    
    this.uiManager.render('result', stats);
    console.log('Game stats:', stats);
  }

  gameOver() {
    console.log('Game over!');
    this.state = 'menu';
    this.stopGame();
    
    // 重置canvas缩放用于UI渲染
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const stats = {
      completed: this.currentNumber - 1,
      time: this.elapsedTime,
      errors: this.errors,
      maxCombo: this.maxCombo
    };
    
    this.uiManager.render('result', stats);
    console.log('Game stats:', stats);
  }

  stopGame() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.touchHandler) {
      this.touchHandler.setEnabled(false);
    }
  }

  setMode(mode) {
    this.mode = mode;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
}

// ==================== 主程序 ====================

let gameManager = null;
let screenAdapter = null;

async function init() {
  try {
    console.log('初始化游戏...');
    screenAdapter = new ScreenAdapter();
    const success = screenAdapter.init();
    if (!success) {
      console.warn('屏幕适配器初始化失败，使用默认配置');
    }
    if (!screenAdapter.isPortrait()) {
      showOrientationWarning();
      return;
    }
    const canvas = tt.createCanvas();
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) {
      throw new Error('Canvas 创建失败');
    }
    canvas.width = screenAdapter.screenWidth;
    canvas.height = screenAdapter.screenHeight;
    console.log('Canvas 创建成功:', { width: canvas.width, height: canvas.height });
    gameManager = new GameManager(canvas, ctx, screenAdapter);
    const initSuccess = await gameManager.init();
    if (!initSuccess) {
      throw new Error('游戏管理器初始化失败');
    }
    gameManager.showMenu();
  } catch (error) {
    console.error('游戏初始化失败:', error);
    showErrorScreen('无法初始化游戏，请重启应用');
  }
}

function showMainMenu() {
  console.log('显示主菜单');
  if (gameManager && gameManager.uiManager) {
    gameManager.showMenu();
  }
}

function showOrientationWarning() {
  const canvas = tt.createCanvas();
  const ctx = canvas.getContext('2d');
  if (!canvas || !ctx) return;
  const systemInfo = tt.getSystemInfoSync();
  canvas.width = systemInfo.windowWidth;
  canvas.height = systemInfo.windowHeight;
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.floor(canvas.height * 0.05)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('请将设备旋转至竖屏', canvas.width / 2, canvas.height / 2);
  ctx.fillText('🔄', canvas.width / 2, canvas.height / 2 + 60);
}

function showErrorScreen(message) {
  try {
    const canvas = tt.createCanvas();
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) {
      console.error('无法创建错误提示界面');
      return;
    }
    const systemInfo = tt.getSystemInfoSync();
    canvas.width = systemInfo.windowWidth || 375;
    canvas.height = systemInfo.windowHeight || 667;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#D85A30';
    ctx.font = `${Math.floor(canvas.width * 0.05)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.floor(canvas.width * 0.04)}px Arial`;
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
  } catch (error) {
    console.error('显示错误界面失败:', error);
  }
}

tt.onError((error) => {
  console.error('全局错误:', error);
  showErrorScreen('游戏遇到错误');
});

init();
