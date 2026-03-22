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

  getLevelVisualProfile(gameState) {
    const totalNumbers = gameState && gameState.totalNumbers ? gameState.totalNumbers : 100;
    if (totalNumbers <= 10) {
      return {
        key: 'level1',
        title: '第一关',
        subtitle: '基础入门',
        boardInset: 12,
        boardRadius: 30,
        cellFontScale: 1.16,
        activeStroke: 1.5,
        activeShadow: 10
      };
    }
    return {
      key: 'level2',
      title: '第二关',
      subtitle: '世纪挑战',
      boardInset: 8,
      boardRadius: 24,
      cellFontScale: 0.94,
      activeStroke: 1.25,
      activeShadow: 7
    };
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

  renderLevelBoardFrame(cells, profile) {
    if (!cells || cells.length === 0) return;
    const ctx = this.ctx;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cell of cells) {
      for (const p of cell.polygon) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return;
    
    // Calculate bounding box and add padding
    const padding = 16;
    const x = Math.max(4, minX - padding);
    const y = Math.max(4, minY - padding);
    const w = Math.max(20, Math.min(this.width - x - 4, maxX - minX + padding * 2));
    const h = Math.max(20, Math.min(this.height - y - 4, maxY - minY + padding * 2));
    
    ctx.save();
    if (this.themeSystem && typeof this.themeSystem.drawNeomorphicShape === 'function') {
      // Use inset shadow for the board frame
      this.themeSystem.drawNeomorphicShape(ctx, x, y, w, h, 36, 'inset', '#f1f4f2');
    } else {
      const bg = ctx.createLinearGradient(x, y, x + w, y + h);
      bg.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
      bg.addColorStop(1, 'rgba(241, 244, 242, 0.86)');
      ctx.fillStyle = bg;
      this.roundRect(ctx, x, y, w, h, profile.boardRadius);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBrightMode(cells, gameState) {
    const ctx = this.ctx;
    const profile = this.getLevelVisualProfile(gameState);
    if (this.themeSystem) {
      this.themeSystem.applyBackgroundGradient(ctx, this.width, this.height);
      if (typeof this.themeSystem.applyAmbientBackground === 'function') {
        this.themeSystem.applyAmbientBackground(ctx, this.width, this.height);
      }
      this.renderLevelBoardFrame(cells, profile);
      for (const cell of cells) {
        this.renderCellWithTheme(ctx, cell, gameState, profile);
      }
      this.renderHUDWithTheme(gameState, profile);
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
      ctx.font = `${this.getFontSize()}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const opacity = cell.done ? 0.2 : 1;
      ctx.globalAlpha = opacity;
      ctx.fillText(cell.number, cell.site.x, cell.site.y);
      ctx.globalAlpha = 1;
    }
  }

  renderCellWithTheme(ctx, cell, gameState, profile = this.getLevelVisualProfile(gameState)) {
    if (!cell || !cell.site) return;
    
    const now = gameState && gameState.now ? gameState.now : Date.now();
    const pressed = !!(cell.pressedUntil && cell.pressedUntil > now);
    const isError = !!(cell.errorUntil && cell.errorUntil > now);
    const isLevel1 = gameState.totalNumbers <= 9;
    const gameplayMode = gameState && gameState.gameplayMode ? gameState.gameplayMode : 'simple';
    const usesTemporaryCheck = gameplayMode === 'hard' || gameplayMode === 'hell';
    const showCheckMark = !!(
      cell.done && (
        gameplayMode === 'simple' ||
        (usesTemporaryCheck && Number(cell.checkVisibleUntil || 0) >= now)
      )
    );
    const showRecoveredNumber = !!(cell.done && !showCheckMark);
    
    ctx.save();
    
    // Determine cell bounds
    // Assuming structured grid, use rectLike logic or fallback to cell.site center
    let x, y, w, h;
    const rectLike = this.getAxisAlignedRect(cell.polygon);
    
    if (rectLike) {
      const inset = Math.max(1, Math.min(rectLike.w, rectLike.h) * 0.02); // Reduced inset to 2%
      x = rectLike.x + inset;
      y = rectLike.y + inset;
      w = rectLike.w - inset * 2;
      h = rectLike.h - inset * 2;
    } else {
       // Fallback for non-rect polygons (though we should enforce grid)
       // Use bounding box
       const bounds = this.getPolygonBounds(cell.polygon);
       x = bounds.minX + 1;
       y = bounds.minY + 1;
       w = bounds.maxX - bounds.minX - 2;
       h = bounds.maxY - bounds.minY - 2;
    }

    // Determine visual style based on level
    let clipPoints = null;
    let gradient = ['#475569', '#334155']; // fallback (Slate)
    let radius = 12;

    if (this.themeSystem) {
       const idx = (cell.number - 1);
       if (isLevel1) {
          clipPoints = this.themeSystem.getPolygonPath(idx);
          gradient = this.themeSystem.getBlockGradient(idx);
          radius = 0; // Polygon doesn't use radius in draw3DBlock
       } else {
          // Level 2
          gradient = this.themeSystem.getBlockGradient(idx);
          radius = Math.max(8, Math.min(w, h) * 0.22);
       }
    }

    // Override colors for state
    if (cell.done) {
       // Web version: bg-white/5 border-white/10 text-white/20
       // We'll handle this in draw3DBlock or here
    }

    if (this.themeSystem && typeof this.themeSystem.draw3DBlock === 'function') {
       // Simple mode keeps completed cells visibly receded; hard/hell restore normal visuals after 5s.
       const shouldUseDoneGradient = cell.done && !showRecoveredNumber;
       let drawGradient = shouldUseDoneGradient ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)'] : gradient;
       
       if (isError) {
          // Error Red Gradient (Soft Red to Dark Red)
          drawGradient = ['#f87171', '#dc2626']; 
       }
       
       this.themeSystem.draw3DBlock(ctx, x, y, w, h, radius, drawGradient, pressed, isError, clipPoints);
    } else {
       // Fallback
       ctx.fillStyle = '#ccc';
       ctx.fillRect(x, y, w, h);
    }

    // Draw Text or Error Icon
    // Web Level 1: 1.8rem (~28px), Level 2: 0.7rem (~11px)
    // Scale based on cell size
    const fontSize = isLevel1 ? h * 0.4 : h * 0.5; 
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isError) {
       // Draw X icon
       ctx.shadowColor = 'rgba(0,0,0,0.2)';
       ctx.shadowBlur = 2;
       ctx.shadowOffsetY = 1;
       
       ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White X
       ctx.font = `${isLevel1 ? 800 : 700} ${fontSize}px sans-serif`;
       ctx.fillText("✕", x + w/2, y + h/2);
    } else {
        const text = showCheckMark ? '\u2714' : cell.number.toString();
        const shouldDimText = cell.done && showCheckMark;
        // After temporary check disappears in hard/hell, keep number style same as active cells.
        ctx.fillStyle = shouldDimText ? 'rgba(255, 255, 255, 0.88)' : '#e4e4e7'; // Zinc-200
        ctx.font = `${isLevel1 ? 800 : 700} ${fontSize}px "Manrope", "PingFang SC", sans-serif`;

        // Text Shadow (Softer)
        if (!shouldDimText) {
           ctx.shadowColor = 'rgba(0,0,0,0.3)'; // Reduced opacity
           ctx.shadowBlur = 4;
           ctx.shadowOffsetY = 2;
        } else {
           ctx.shadowColor = 'transparent';
        }
        
        if (text) {
          ctx.fillText(text, x + w/2, y + h/2);
        }
    }
    
    ctx.restore();
  }

  getPolygonBounds(polygon) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of polygon) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  getAxisAlignedRect(polygon) {
    if (!polygon || polygon.length !== 4) return null;
    const xs = polygon.map((p) => p.x);
    const ys = polygon.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;
    if (w <= 0 || h <= 0) return null;
    const tolerance = Math.max(0.5, Math.min(w, h) * 0.06);
    for (const p of polygon) {
      const xOk = Math.abs(p.x - minX) <= tolerance || Math.abs(p.x - maxX) <= tolerance;
      const yOk = Math.abs(p.y - minY) <= tolerance || Math.abs(p.y - maxY) <= tolerance;
      if (!xOk || !yOk) return null;
    }
    return { x: minX, y: minY, w, h };
  }

  renderHUDWithTheme(gameState, profile = this.getLevelVisualProfile(gameState)) {
    const ctx = this.ctx;
    const safeTop = this.screenAdapter && this.screenAdapter.safeArea && typeof this.screenAdapter.safeArea.top === 'number'
      ? this.screenAdapter.safeArea.top
      : 20;

    ctx.save();
    
    // Exit Button (Top Left)
    // We'll define bounds here but handling is done in GameManager based on these coordinates
    const exitX = 16;
    const exitY = safeTop + 12; // slightly adjusted
    const exitSize = 32;
    
    // Draw Exit Button Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // Softer
    this.roundRect(ctx, exitX, exitY, exitSize, exitSize, 10);
    ctx.fill();
    
    // Draw "X" Icon
    ctx.fillStyle = '#e4e4e7'; // Soft White
    ctx.font = 'bold 16px sans-serif'; // simple icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', exitX + exitSize/2, exitY + exitSize/2 + 1); // +1 for visual center

    // Title
    const isLevel1 = gameState.totalNumbers <= 9;
    const title = isLevel1 ? "第一关 · 热身" : "最终关 · 1-100";
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw Title (small, top)
    const titleY = safeTop + 4; // Moved up
    ctx.fillStyle = '#a1a1aa'; // Zinc-400 (Soft Grey)
    ctx.font = `12px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText(title, this.width / 2, titleY);
    
    let nextContentY = titleY + 16; // Reduced gap

    // Level 2 Timer
    if (!isLevel1) {
       // Web: Clock icon + Time
       // Time color: cyan-400 (#22d3ee) normally, red-400 (#f87171) if < 60s
       // If difficulty is 0, use elapsedTime, else timeLeft
       const isTimerMode = gameState.difficulty > 0;
       const displayTime = isTimerMode ? gameState.timeLeft : gameState.elapsedTime;
       
       // Softer colors: Slate-300 for normal, Red-300 for urgent
       const timeColor = (isTimerMode && displayTime < 60) ? '#fca5a5' : '#cbd5e1';
       
       const timeStr = this.formatTime(displayTime);
       ctx.fillStyle = timeColor;
       ctx.font = `700 24px "Manrope", monospace`;
       ctx.fillText(timeStr, this.width / 2, nextContentY);
       
       nextContentY += 28; // Reduced gap
    } else {
       // Add some spacing for Level 1 to balance layout
       nextContentY += 10;
    }

    // Progress Hint: "请按顺序点击: X / Y"
    const nextNum = gameState.currentNumber;
    const total = gameState.totalNumbers;
    
    const hintY = nextContentY + 4; // Reduced gap
    
    // Measure texts to center them properly
    ctx.font = `12px "Manrope", "PingFang SC", sans-serif`;
    const prefix = "请按顺序点击: ";
    const prefixWidth = ctx.measureText(prefix).width;
    
    ctx.font = `700 16px "Manrope", "PingFang SC", sans-serif`;
    const numWidth = ctx.measureText(nextNum.toString()).width;
    
    ctx.font = `12px "Manrope", "PingFang SC", sans-serif`;
    const suffix = ` / ${total}`;
    const suffixWidth = ctx.measureText(suffix).width;
    
    const totalWidth = prefixWidth + numWidth + suffixWidth;
    const startX = (this.width - totalWidth) / 2;
    
    // Draw "请按顺序点击: "
    ctx.fillStyle = '#71717a'; // Zinc-500 (Muted)
    ctx.font = `12px "Manrope", "PingFang SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(prefix, startX, hintY + 2); // align baseline with larger number
    
    // Draw "X"
    ctx.fillStyle = '#fcd34d'; // Amber-300 (Soft Gold)
    ctx.font = `700 16px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText(nextNum.toString(), startX + prefixWidth, hintY);
    
    // Draw "/ Y"
    ctx.fillStyle = '#71717a'; // Zinc-500
    ctx.font = `12px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText(suffix, startX + prefixWidth + numWidth, hintY + 2);

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
    const fontSize = this.screenAdapter.getFontSize(0.86);
    const safeTop = this.screenAdapter && this.screenAdapter.safeArea && typeof this.screenAdapter.safeArea.top === 'number'
      ? this.screenAdapter.safeArea.top
      : 0;
    const safeBottom = this.screenAdapter && this.screenAdapter.safeArea && typeof this.screenAdapter.safeArea.bottom === 'number'
      ? this.screenAdapter.safeArea.bottom
      : this.height;
    const panelX = padding;
    const panelY = Math.max(padding * 0.5, safeTop + 6);
    const panelWidth = this.width - padding * 2;
    const panelHeight = Math.max(fontSize * 3.6 + 16, 68);
    const totalNumbers = gameState.totalNumbers || 100;
    const progress = Math.min(1, Math.max(0, (gameState.currentNumber - 1) / totalNumbers));
    const progressPercent = `${Math.round(progress * 100)}%`;
    const progressBottomInset = Math.max(10, this.height - safeBottom + 6);
    ctx.save();
    ctx.fillStyle = 'rgba(20, 28, 41, 0.6)';
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(138, 180, 204, 0.35)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 14);
    ctx.stroke();
    ctx.fillStyle = theme.target;
    ctx.font = `bold ${fontSize * 1.08}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`目标 ${gameState.currentNumber}`, panelX + 12, panelY + 10);
    ctx.fillStyle = '#A8BFCE';
    ctx.font = `${fontSize * 0.86}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`进度 ${progressPercent}`, panelX + 12, panelY + fontSize * 1.75);
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.timeLeft);
    const timeLabel = gameState.difficulty === 0 ? '时间' : '剩余';
    const rightX = panelX + panelWidth - 12;
    ctx.textAlign = 'right';
    ctx.fillStyle = gameState.difficulty > 0 && gameState.timeLeft <= 10 ? '#F2BB7D' : theme.text;
    ctx.font = `bold ${fontSize * 0.92}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${timeLabel} ${timeStr}`, rightX, panelY + 10);
    ctx.fillStyle = theme.error;
    ctx.font = `${fontSize * 0.86}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`错误 ${gameState.errors}`, rightX, panelY + fontSize * 1.75);
    if (gameState.mode === 'dark' && gameState.combo > 0) {
      ctx.fillStyle = theme.success;
      ctx.textAlign = 'center';
      ctx.fillText(`连击 ×${gameState.combo}`, panelX + panelWidth * 0.5, panelY + panelHeight - fontSize * 1.15);
    }
    const barY = this.height - progressBottomInset - 10;
    const barWidth = this.width - padding * 2;
    ctx.fillStyle = 'rgba(200, 200, 200, 0.22)';
    this.roundRect(ctx, padding, barY, barWidth, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = theme.progress;
    if (progress > 0) {
      this.roundRect(ctx, padding, barY, Math.max(8, barWidth * progress), 7, 3.5);
      ctx.fill();
    }
    ctx.restore();
  }

  formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
    return;
  }

  showErrorFeedback(cell, mode) {
    return;
  }

  showComboFeedback(cell, combo) {
    return;
  }

  clearAnimations() {
    this.animations = [];
  }
}

module.exports = RenderEngine;
