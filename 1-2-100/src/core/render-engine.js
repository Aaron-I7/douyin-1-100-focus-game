/**
 * 渲染引擎
 * 负责所有 Canvas 绘制操作
 */

class RenderEngine {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = screenAdapter.pixelRatio;
    

    
    // 动画队列
    this.animations = [];
    
    // 颜色主题
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

  /**
   * 初始化高清 Canvas
   */
  initHDCanvas() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * 创建离屏 Canvas（用于黑暗模式）
   */
  createOffscreenCanvas() {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = tt.createCanvas();
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.offscreenCtx.scale(this.dpr, this.dpr);
    }
  }

  /**
   * 渲染明亮模式
   */
  renderBrightMode(cells, gameState) {
    const ctx = this.ctx;
    const theme = this.colors.bright;
    
    // 清空背景
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 渲染所有 Cell
    for (const cell of cells) {
      this.renderCell(ctx, cell, theme, false);
    }
    
    // 渲染 HUD
    this.renderHUD(gameState, theme);
    
    // 渲染动画
    this.renderAnimations();
  }

  /**
   * 渲染单个 Cell
   */
  renderCell(ctx, cell, theme, isDarkMode) {
    if (cell.polygon.length < 3) return;
    
    // 绘制多边形
    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    
    // 填充
    if (cell.done) {
      ctx.fillStyle = theme.cellDone;
    } else {
      ctx.fillStyle = theme.cellBg;
    }
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = theme.cellBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 绘制数字
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

  /**
   * 获取字体大小
   */
  getFontSize() {
    return Math.max(12, Math.floor(this.width * 0.035));
  }

  /**
   * 渲染黑暗模式
   */
  renderDarkMode(cells, gameState, mousePos) {
    const ctx = this.ctx;
    const theme = this.colors.dark;
    
    // 创建离屏 Canvas（如果还没有）
    this.createOffscreenCanvas();
    
    // 在离屏 Canvas 上渲染基础层
    const offCtx = this.offscreenCtx;
    offCtx.fillStyle = theme.background;
    offCtx.fillRect(0, 0, this.width, this.height);
    
    // 渲染所有 Cell 到离屏 Canvas
    for (const cell of cells) {
      this.renderCell(offCtx, cell, theme, true);
    }
    
    // 主 Canvas: 绘制黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制离屏 Canvas
    ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    // 绘制光照效果（径向渐变）
    this.renderSpotlight(ctx, mousePos);
    
    // 渲染目标提示环
    this.renderTargetRing(ctx, cells, gameState.currentNumber, theme);
    
    // 渲染 HUD
    this.renderHUD(gameState, theme);
    
    // 渲染动画
    this.renderAnimations();
  }

  /**
   * 渲染光照效果（手电筒效果）
   */
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

  /**
   * 渲染目标提示环
   */
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

  /**
   * 渲染 HUD（抬头显示）
   */
  renderHUD(gameState, theme) {
    const ctx = this.ctx;
    const padding = this.screenAdapter.getPadding();
    const fontSize = this.screenAdapter.getFontSize(0.9);
    
    ctx.fillStyle = theme.text;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 目标数字
    ctx.fillStyle = theme.target;
    ctx.font = `bold ${fontSize * 1.2}px "Courier New", monospace`;
    ctx.fillText(`目标: ${gameState.currentNumber}`, padding, padding);
    
    // 计时
    ctx.fillStyle = theme.text;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.timeLeft);
    const timeLabel = gameState.difficulty === 0 ? '时间' : '剩余';
    ctx.fillText(`${timeLabel}: ${timeStr}`, padding, padding + fontSize * 2);
    
    // 错误次数
    ctx.fillStyle = theme.error;
    ctx.fillText(`错误: ${gameState.errors}`, padding, padding + fontSize * 4);
    
    // 连击（黑暗模式）
    if (gameState.mode === 'dark' && gameState.combo > 0) {
      ctx.fillStyle = theme.success;
      ctx.fillText(`连击: ×${gameState.combo}`, padding, padding + fontSize * 6);
    }
    
    // 进度条
    const barY = this.height - 30;
    const barWidth = this.width - padding * 2;
    const progress = Math.min(1, (gameState.currentNumber - 1) / 100);
    
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(padding, barY, barWidth, 4);
    
    ctx.fillStyle = theme.progress;
    ctx.fillRect(padding, barY, barWidth * progress, 4);
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
   * 添加浮动文字动画
   */
  addFloatingText(x, y, text, color, size = 16) {
    this.animations.push({
      type: 'floatingText',
      x, y,
      text, color, size,
      startTime: Date.now(),
      duration: 900
    });
  }

  /**
   * 渲染动画
   */
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

  /**
   * 显示正确点击反馈
   */
  showCorrectFeedback(cell, mode) {
    const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
    
    // 添加浮动文字
    this.addFloatingText(
      cell.site.x,
      cell.site.y,
      '+1',
      theme.success,
      16
    );
  }

  /**
   * 显示错误点击反馈
   */
  showErrorFeedback(cell, mode) {
    const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
    
    // 添加浮动文字
    this.addFloatingText(
      cell.site.x,
      cell.site.y,
      '✗',
      theme.error,
      18
    );
  }

  /**
   * 显示连击反馈
   */
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
    
    this.addFloatingText(
      cell.site.x,
      cell.site.y,
      text,
      this.colors.dark.success,
      size
    );
  }

  /**
   * 清空动画队列
   */
  clearAnimations() {
    this.animations = [];
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.RenderEngine = RenderEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderEngine;
}
