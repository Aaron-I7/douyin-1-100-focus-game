class RenderEngine {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
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
    if (this.themeSystem) {
      this.themeSystem.applyBackgroundGradient(ctx, this.width, this.height);
      this.themeSystem.applyCyberpunkDecorations(ctx, this.width, this.height, Date.now());
      this.themeSystem.applyScanlines(ctx, this.width, this.height, Date.now());
      for (const cell of cells) {
        this.renderCellWithTheme(ctx, cell, gameState);
      }
      this.renderHUDWithTheme(gameState);
    } else {
      const theme = this.colors.bright;
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, this.width, this.height);
      for (const cell of cells) {
        this.renderCell(ctx, cell, theme, false);
      }
      this.renderHUD(gameState, theme);
    }
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

  renderCellWithTheme(ctx, cell, gameState) {
    if (cell.polygon.length < 3) return;
    const cellState = cell.done ? 'done' : (cell.number === gameState.currentNumber ? 'active' : 'normal');
    const cellStyle = this.themeSystem.getCellStyle(cellState);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = cellStyle.backgroundColor;
    ctx.fill();
    if (cellStyle.borderColor !== 'transparent') {
      this.themeSystem.applyNeonBorder(
        ctx,
        cell.site.x - 25, cell.site.y - 15,
        50, 30,
        8,
        cellStyle.borderColor,
        cell.number === gameState.currentNumber ? 1.5 : 0.8
      );
    }
    if (cell.number === gameState.currentNumber) {
      this.themeSystem.applyGlowEffect(ctx, cell.site.x, cell.site.y, 30, cellStyle.borderColor);
    }
    if (!cell.done || cellState === 'done') {
      ctx.fillStyle = cellStyle.textColor;
      ctx.font = `bold ${this.getFontSize()}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = cellStyle.textColor;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(cell.number, cell.site.x, cell.site.y);
    }
    ctx.restore();
  }

  renderHUDWithTheme(gameState) {
    const ctx = this.ctx;
    const hudStyle = this.themeSystem.getHUDStyle();
    const padding = this.screenAdapter.getPadding();
    const fontSize = this.screenAdapter.getFontSize(0.9);
    ctx.save();
    const hudHeight = fontSize * 8;
    ctx.fillStyle = hudStyle.bg;
    ctx.fillRect(padding - 10, padding - 10, this.width - (padding * 2) + 20, hudHeight);
    this.themeSystem.applyNeonBorder(
      ctx,
      padding - 10, padding - 10,
      this.width - (padding * 2) + 20, hudHeight,
      10,
      hudStyle.border,
      0.6
    );
    ctx.fillStyle = hudStyle.text;
    ctx.font = `bold ${fontSize * 1.4}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = hudStyle.text;
    ctx.shadowBlur = 10;
    ctx.fillText(`目标: ${gameState.currentNumber}`, padding, padding);
    ctx.fillStyle = hudStyle.textSecondary;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.shadowColor = hudStyle.textSecondary;
    ctx.shadowBlur = 8;
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.timeLeft);
    const timeLabel = gameState.difficulty === 0 ? '时间' : '剩余';
    ctx.fillText(`${timeLabel}: ${timeStr}`, padding, padding + fontSize * 2.5);
    ctx.fillStyle = hudStyle.error;
    ctx.shadowColor = hudStyle.error;
    ctx.fillText(`错误: ${gameState.errors}`, padding, padding + fontSize * 4);
    if (gameState.mode === 'dark' && gameState.combo > 0) {
      ctx.fillStyle = hudStyle.accent;
      ctx.shadowColor = hudStyle.accent;
      ctx.fillText(`连击: ×${gameState.combo}`, padding, padding + fontSize * 5.5);
    }
    const barY = this.height - 40;
    const barWidth = this.width - padding * 2;
    const totalNumbers = gameState.totalNumbers || 100;
    const progress = Math.min(1, (gameState.currentNumber - 1) / totalNumbers);
    ctx.fillStyle = hudStyle.progressBg;
    ctx.fillRect(padding, barY, barWidth, 8);
    ctx.fillStyle = hudStyle.progressFill;
    ctx.shadowColor = hudStyle.progressGlow;
    ctx.shadowBlur = 15;
    ctx.fillRect(padding, barY, barWidth * progress, 8);
    ctx.restore();
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
    const targetCell = cells.find((c) => c.number === targetNumber);
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
    const totalNumbers = gameState.totalNumbers || 100;
    const progress = Math.min(1, (gameState.currentNumber - 1) / totalNumbers);
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
    this.animations = this.animations.filter((anim) => {
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
    if (this.themeSystem) {
      const effectColor = this.themeSystem.getEffectColor('success');
      this.addFloatingText(cell.site.x, cell.site.y, '+1', effectColor, 16);
    } else {
      const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
      this.addFloatingText(cell.site.x, cell.site.y, '+1', theme.success, 16);
    }
  }

  showErrorFeedback(cell, mode) {
    if (this.themeSystem) {
      const effectColor = this.themeSystem.getEffectColor('error');
      this.addFloatingText(cell.site.x, cell.site.y, '✗', effectColor, 18);
    } else {
      const theme = mode === 'bright' ? this.colors.bright : this.colors.dark;
      this.addFloatingText(cell.site.x, cell.site.y, '✗', theme.error, 18);
    }
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
    if (this.themeSystem) {
      const effectColor = this.themeSystem.getEffectColor('success');
      this.addFloatingText(cell.site.x, cell.site.y, text, effectColor, size);
    } else {
      this.addFloatingText(cell.site.x, cell.site.y, text, this.colors.dark.success, size);
    }
  }

  clearAnimations() {
    this.animations = [];
  }
}

module.exports = RenderEngine;
