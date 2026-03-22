/**
 * 渲染引擎
 * 负责所有 Canvas 绘制操作
 * 集成 ThemeSystem 实现独特的视觉设计
 */

// 导入 ThemeSystem
const ThemeSystem = require('./ui-theme-system');

class RenderEngine {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = screenAdapter.pixelRatio;
    
    // 主题系统
    this.themeSystem = themeSystem || new ThemeSystem();
    
    // 动画系统集成
    this.animationIntegration = null;
    this.initializeAnimationSystem();
    
    // 兼容性：保留旧的动画队列
    this.animations = [];
  }

  /**
   * 初始化动画系统
   */
  initializeAnimationSystem() {
    try {
      // 检查是否有 AnimationIntegration 类可用
      if (typeof AnimationIntegration !== 'undefined') {
        this.animationIntegration = new AnimationIntegration();
        this.animationIntegration.initialize({
          maxAnimations: 50,
          reducedMotion: false
        });
      }
    } catch (error) {
      console.warn('Animation system initialization failed:', error);
      this.animationIntegration = null;
    }
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
   * 渲染极简治愈模式
   */
  renderBrightMode(cells, gameState) {
    const ctx = this.ctx;
    const theme = this.themeSystem.getThemeColors();
    
    // 1. 渲染纯色背景（米白）
    ctx.fillStyle = theme.background.color;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 2. 渲染所有 Cell（卡片式）
    for (const cell of cells) {
      this.renderMinimalistCell(ctx, cell, gameState);
    }
    
    // 3. 渲染 HUD（悬浮卡片）
    this.renderMinimalistHUD(gameState);
    
    // 4. 更新和渲染动画系统（柔和动效）
    this.updateAnimations(ctx);
  }

  /**
   * 更新动画系统
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} deltaTime - 时间差
   */
  updateAnimations(ctx, deltaTime = 16) {
    // 使用新的动画系统
    if (this.animationIntegration) {
      this.animationIntegration.update(ctx, deltaTime);
    }
    
    // 兼容性：继续支持旧的动画系统
    this.renderAnimations();
  }

  /**
   * 处理游戏事件动画
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  handleGameEvent(eventType, eventData) {
    if (this.animationIntegration) {
      this.animationIntegration.handleGameEvent(eventType, eventData);
    }
  }

  /**
   * 渲染单个 Cell（极简卡片风格）
   */
  renderMinimalistCell(ctx, cell, gameState) {
    if (cell.polygon.length < 3) return;
    
    const theme = this.themeSystem.getThemeColors();
    let bgColor = theme.cell.bg;
    let textColor = theme.cell.text;
    let shadowColor = 'rgba(0,0,0,0.04)';
    let shadowBlur = 4;
    let offsetY = 2;

    // 状态判定
    if (cell.done) {
      bgColor = theme.cell.done;
      textColor = theme.cell.textDone;
      shadowColor = 'transparent';
      offsetY = 0;
    } else if (cell.number === gameState.currentNumber) {
      bgColor = theme.primaryLight; // 柔和蓝底
      textColor = theme.primaryDark;
      shadowColor = theme.primary;
      shadowBlur = 12;
      offsetY = 4; // 浮起感
    }

    // 绘制柔和圆角卡片（模拟）
    ctx.save();
    
    // 阴影层
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = offsetY;
    
    ctx.beginPath();
    ctx.moveTo(cell.polygon[0].x, cell.polygon[0].y);
    for (let i = 1; i < cell.polygon.length; i++) {
      ctx.lineTo(cell.polygon[i].x, cell.polygon[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
    
    // 极细描边（增加精致感）
    if (!cell.done) {
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1;
      ctx.strokeStyle = cell.number === gameState.currentNumber ? theme.primary : theme.cell.border;
      ctx.stroke();
    }
    
    // 绘制文字（使用圆润字体）
    const center = this.getPolygonCenter(cell.polygon);
    const fontSize = 24; // 可根据 cell 大小动态计算
    
    ctx.fillStyle = textColor;
    ctx.font = `500 ${fontSize}px "Rounded Mplus 1c", "Varela Round", sans-serif`; // 假定系统有圆体或回退
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.number, center.x, center.y);
    
    ctx.restore();
  }

  /**
   * 渲染极简 HUD
   */
  renderMinimalistHUD(gameState) {
    const ctx = this.ctx;
    const padding = 20;
    const theme = this.themeSystem.getThemeColors();
    
    // 顶部信息栏（透明背景）
    
    // 目标数字（大字号强调）
    ctx.fillStyle = theme.primaryDark;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Target: ${gameState.currentNumber}`, padding, padding + 40); // 下移避开刘海
    
    // 时间（右侧胶囊）
    const timeStr = this.formatTime(gameState.elapsedTime || 0);
    ctx.save();
    ctx.fillStyle = theme.hud.progressBg;
    ctx.beginPath();
    ctx.roundRect(this.width - 120, padding + 40, 100, 36, 18);
    ctx.fill();
    
    ctx.fillStyle = theme.hud.text;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, this.width - 70, padding + 58);
    ctx.restore();
    
    // 底部极简进度条
    const barHeight = 6;
    const barY = this.height - 40;
    const maxNumber = gameState.level === 1 ? 10 : 100;
    const progress = Math.min(1, (gameState.currentNumber - 1) / maxNumber);
    
    // 轨道
    ctx.fillStyle = theme.hud.progressBg;
    ctx.beginPath();
    ctx.roundRect(padding, barY, this.width - padding*2, barHeight, 3);
    ctx.fill();
    
    // 进度
    if (progress > 0) {
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.roundRect(padding, barY, (this.width - padding*2) * progress, barHeight, 3);
      ctx.fill();
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
   * 添加浮动文字动画（使用新的主题系统）
   */
  addFloatingText(x, y, text, type = 'success', size = 16) {
    const effectColor = this.themeSystem.getEffectColor(type);
    this.animations.push({
      type: 'floatingText',
      x, y,
      text, 
      color: effectColor,
      size,
      startTime: Date.now(),
      duration: 900
    });
  }

  /**
   * 添加粒子效果
   */
  addParticleEffect(x, y, count = 8) {
    const particleColors = this.themeSystem.getEffectColor('particle');
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      
      this.animations.push({
        type: 'particle',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 3 + Math.random() * 3,
        startTime: Date.now(),
        duration: 600
      });
    }
  }

  /**
   * 添加波纹效果
   */
  addRippleEffect(x, y, maxRadius = 50) {
    this.animations.push({
      type: 'ripple',
      x, y,
      maxRadius,
      color: this.themeSystem.getEffectColor('ripple'),
      startTime: Date.now(),
      duration: 500
    });
  }

  /**
   * 渲染动画（支持多种动画类型）
   */
  renderAnimations() {
    const now = Date.now();
    const ctx = this.ctx;
    
    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.startTime;
      if (elapsed > anim.duration) return false;
      
      const progress = elapsed / anim.duration;
      
      switch (anim.type) {
        case 'floatingText':
          this.renderFloatingText(ctx, anim, progress);
          break;
        case 'particle':
          this.renderParticle(ctx, anim, progress);
          break;
        case 'ripple':
          this.renderRipple(ctx, anim, progress);
          break;
      }
      
      return true;
    });
  }

  /**
   * 渲染浮动文字动画（极简版）
   */
  renderFloatingText(ctx, anim, progress) {
    const y = anim.y - progress * 40; // 减小位移幅度
    const opacity = 1 - progress;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = anim.color;
    // 使用圆润字体替代等宽字体
    ctx.font = `500 ${anim.size}px "Rounded Mplus 1c", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 移除强烈阴影，改用柔和发光
    // ctx.shadowColor = anim.color;
    // ctx.shadowBlur = 5;
    ctx.fillText(anim.text, anim.x, y);
    
    ctx.restore();
  }

  /**
   * 渲染粒子动画（极简版）
   */
  renderParticle(ctx, anim, progress) {
    const x = anim.x + anim.vx * progress * 80;
    const y = anim.y + anim.vy * progress * 80;
    const opacity = (1 - progress) * 0.8; // 降低不透明度
    const size = anim.size * (1 - progress * 0.3);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = anim.color;
    // 移除粒子发光
    // ctx.shadowColor = anim.color;
    // ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 渲染波纹动画（极简版）
   */
  renderRipple(ctx, anim, progress) {
    const radius = anim.maxRadius * progress;
    const opacity = (1 - progress) * 0.5; // 降低不透明度
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = anim.color;
    ctx.lineWidth = 2; // 固定线宽
    // 移除波纹发光
    // ctx.shadowColor = anim.color;
    // ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 显示正确点击反馈（使用新的动画系统）
   */
  showCorrectFeedback(cell) {
    // 使用新的动画系统
    if (this.animationIntegration) {
      this.handleGameEvent('cellClick', {
        x: cell.site.x,
        y: cell.site.y,
        isCorrect: true,
        number: cell.number,
        cellSize: 30
      });
    } else {
      // 兼容性：使用旧的动画系统
      this.addFloatingText(
        cell.site.x,
        cell.site.y,
        '+1',
        'success',
        18
      );
      
      this.addParticleEffect(cell.site.x, cell.site.y, 6);
      this.addRippleEffect(cell.site.x, cell.site.y, 40);
    }
  }

  /**
   * 显示错误点击反馈（使用新的动画系统）
   */
  showErrorFeedback(cell) {
    // 使用新的动画系统
    if (this.animationIntegration) {
      this.handleGameEvent('cellClick', {
        x: cell.site.x,
        y: cell.site.y,
        isCorrect: false,
        number: cell.number,
        cellSize: 30
      });
    } else {
      // 兼容性：使用旧的动画系统
      this.addFloatingText(
        cell.site.x,
        cell.site.y,
        '✗',
        'error',
        20
      );
      
      this.addRippleEffect(cell.site.x, cell.site.y, 60);
    }
  }

  /**
   * 显示关卡完成动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} level - 关卡编号
   */
  showLevelCompleteAnimation(x, y, level) {
    if (this.animationIntegration) {
      this.handleGameEvent('levelComplete', { x, y, level });
    }
  }

  /**
   * 显示游戏完成动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} time - 完成时间
   * @param {number} errors - 错误次数
   */
  showGameCompleteAnimation(x, y, time, errors) {
    if (this.animationIntegration) {
      this.handleGameEvent('gameComplete', { x, y, time, errors });
    }
  }

  /**
   * 显示按钮点击动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} size - 按钮大小
   * @param {string} type - 按钮类型
   */
  showButtonClickAnimation(x, y, size, type = 'default') {
    if (this.animationIntegration) {
      this.handleGameEvent('buttonClick', { x, y, size, type });
    }
  }

  /**
   * 显示目标提示动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {boolean} show - 是否显示
   */
  showTargetHint(x, y, show = true) {
    if (this.animationIntegration) {
      this.handleGameEvent('targetHint', { x, y, show });
    }
  }

  /**
   * 显示连击动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} combo - 连击数
   */
  showComboAnimation(x, y, combo) {
    if (this.animationIntegration) {
      this.handleGameEvent('combo', { x, y, combo });
    }
  }

  /**
   * 显示时间奖励动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} seconds - 奖励秒数
   */
  showTimeBonusAnimation(x, y, seconds) {
    if (this.animationIntegration) {
      this.handleGameEvent('timeBonus', { x, y, seconds });
    }
  }

  /**
   * 显示解锁动画
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} feature - 解锁功能
   */
  showUnlockAnimation(x, y, feature) {
    if (this.animationIntegration) {
      this.handleGameEvent('unlock', { x, y, feature });
    }
  }

  /**
   * 获取动画性能信息
   * @returns {Object} 性能信息
   */
  getAnimationPerformanceInfo() {
    if (this.animationIntegration) {
      return this.animationIntegration.getPerformanceInfo();
    }
    return {
      frameCount: 0,
      averageFPS: 60,
      animationCount: this.animations.length
    };
  }

  /**
   * 设置动画选项
   * @param {Object} settings - 动画设置
   */
  setAnimationSettings(settings) {
    if (this.animationIntegration) {
      this.animationIntegration.setAnimationSettings(settings);
    }
  }

  applyReducedMotion(enabled) {
    const reducedMotion = !!enabled;
    if (this.animationIntegration) {
      if (reducedMotion) {
        this.animationIntegration.enableReducedMotion();
      } else {
        this.animationIntegration.disableReducedMotion();
      }
    }
    this.setAnimationSettings({ reducedMotion });
  }

  /**
   * 暂停动画
   */
  pauseAnimations() {
    if (this.animationIntegration) {
      this.animationIntegration.pauseAnimations();
    }
  }

  /**
   * 恢复动画
   */
  resumeAnimations() {
    if (this.animationIntegration) {
      this.animationIntegration.resumeAnimations();
    }
  }



  /**
   * 清空动画队列
   */
  clearAnimations() {
    this.animations = [];
    
    // 清空新的动画系统
    if (this.animationIntegration) {
      this.animationIntegration.clearAllAnimations();
    }
  }

  /**
   * 渲染横屏提示
   */
  renderOrientationHint() {
    const orientation = this.screenAdapter.getOrientation();
    if (orientation !== 'landscape') return;
    
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const hintStyle = this.themeSystem.getOrientationHintStyle();
    const dims = this.screenAdapter.calculateDimensions();
    
    // 提示位置：顶部居中
    const hintY = dims.hudHeight * 0.3;
    const hintText = '💡 横屏体验更清晰';
    
    ctx.save();
    
    // 半透明背景
    ctx.fillStyle = hintStyle.bg;
    ctx.fillRect(0, 0, w, dims.hudHeight * 0.5);
    
    // 提示文字
    ctx.fillStyle = hintStyle.text;
    ctx.font = `${dims.fontSize * 0.7}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hintText, w / 2, hintY);
    
    ctx.restore();
  }

  /**
   * 销毁渲染引擎
   */
  destroy() {
    this.clearAnimations();
    
    if (this.animationIntegration) {
      this.animationIntegration.destroy();
      this.animationIntegration = null;
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.RenderEngine = RenderEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderEngine;
}
