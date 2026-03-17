/**
 * 关卡过渡管理器
 * 负责关卡间的过渡动画和提示
 */

class TransitionManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // 过渡状态
    this.isTransitioning = false;
    this.transitionType = null; // 'levelComplete' | 'levelStart'
    this.transitionStartTime = 0;
    this.transitionDuration = 2000; // 2秒
    
    // 动画参数
    this.fadeOpacity = 0;
    this.textScale = 1;
    this.particleEffects = [];
  }

  /**
   * 显示关卡过渡
   */
  showLevelTransition(fromLevel, toLevel, onComplete) {
    this.isTransitioning = true;
    this.transitionType = 'levelComplete';
    this.transitionStartTime = Date.now();
    this.onTransitionComplete = onComplete;
    this.fromLevel = fromLevel;
    this.toLevel = toLevel;
    
    // 生成庆祝粒子效果
    this.generateCelebrationParticles();
    
    console.log(`Starting transition from level ${fromLevel} to level ${toLevel}`);
    
    // 返回过渡数据
    const transitionData = {
      fromLevel: fromLevel,
      toLevel: toLevel,
      message: this.getEncouragementMessage(fromLevel, toLevel),
      timestamp: this.transitionStartTime,
      duration: this.transitionDuration,
      animationType: 'fadeInOut'
    };
    
    return Promise.resolve(transitionData);
  }

  /**
   * 生成庆祝粒子效果
   */
  generateCelebrationParticles() {
    this.particleEffects = [];
    const particleCount = 30; // 增加粒子数量
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const size = 3 + Math.random() * 5;
      
      this.particleEffects.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // 添加向上的初始速度
        size: size,
        color: this.getRandomColor(),
        life: 1.0,
        decay: 0.015, // 稍微慢一点的衰减
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        gravity: 0.1 // 添加重力效果
      });
    }
  }

  /**
   * 获取随机颜色
   */
  getRandomColor() {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 获取鼓励消息
   */
  getEncouragementMessage(fromLevel, toLevel) {
    if (fromLevel === 1 && toLevel === 2) {
      return '难度飙升！！！';
    } else if (fromLevel === 2 && toLevel === 'custom') {
      return '恭喜通关！自选模式已解锁！';
    }
    return '太棒了！';
  }

  /**
   * 更新过渡动画
   */
  update() {
    if (!this.isTransitioning) return;
    
    const elapsed = Date.now() - this.transitionStartTime;
    const progress = Math.min(elapsed / this.transitionDuration, 1);
    
    // 更新动画参数 - 使用更平滑的缓动函数
    if (progress < 0.3) {
      // 前30%：快速淡入
      const fadeProgress = progress / 0.3;
      this.fadeOpacity = this.easeOutCubic(fadeProgress);
      this.textScale = 0.3 + this.easeOutBack(fadeProgress) * 0.7;
    } else if (progress < 0.7) {
      // 中间40%：保持显示
      this.fadeOpacity = 1;
      this.textScale = 1;
    } else {
      // 后30%：缓慢淡出
      const fadeProgress = (progress - 0.7) / 0.3;
      this.fadeOpacity = 1 - this.easeInCubic(fadeProgress);
      this.textScale = 1;
    }
    
    // 更新粒子效果
    this.updateParticles();
    
    // 检查是否完成
    if (progress >= 1) {
      this.isTransitioning = false;
      if (this.onTransitionComplete) {
        this.onTransitionComplete();
      }
    }
  }

  /**
   * 缓动函数 - 三次方缓出
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 缓动函数 - 三次方缓入
   */
  easeInCubic(t) {
    return t * t * t;
  }

  /**
   * 缓动函数 - 回弹效果
   */
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * 更新粒子效果
   */
  updateParticles() {
    this.particleEffects = this.particleEffects.filter(particle => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 应用重力
      if (particle.gravity) {
        particle.vy += particle.gravity;
      }
      
      // 更新旋转
      if (particle.rotation !== undefined) {
        particle.rotation += particle.rotationSpeed || 0;
      }
      
      // 更新生命值
      particle.life -= particle.decay;
      
      // 添加空气阻力
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      return particle.life > 0;
    });
  }

  /**
   * 渲染过渡效果
   */
  render() {
    if (!this.isTransitioning) return;
    
    const ctx = this.ctx;
    
    // 绘制半透明背景
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeOpacity * 0.7})`;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制粒子效果
    this.renderParticles();
    
    // 绘制过渡文字
    this.renderTransitionText();
    
    ctx.restore();
  }

  /**
   * 渲染粒子效果
   */
  renderParticles() {
    const ctx = this.ctx;
    
    this.particleEffects.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life * this.fadeOpacity;
      
      // 移动到粒子位置
      ctx.translate(particle.x, particle.y);
      
      // 应用旋转
      if (particle.rotation !== undefined) {
        ctx.rotate(particle.rotation);
      }
      
      // 绘制粒子 - 使用星形而不是圆形
      ctx.fillStyle = particle.color;
      this.drawStar(ctx, 0, 0, particle.size, 5);
      
      ctx.restore();
    });
  }

  /**
   * 绘制星形粒子
   */
  drawStar(ctx, x, y, radius, points) {
    const angle = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const a = i * angle;
      const px = x + r * Math.cos(a);
      const py = y + r * Math.sin(a);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 渲染过渡文字
   */
  renderTransitionText() {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    ctx.save();
    ctx.globalAlpha = this.fadeOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 主要文字
    let mainText = '';
    let subText = '';
    
    if (this.fromLevel === 1 && this.toLevel === 2) {
      mainText = '🎉 第一关完成！';
      subText = this.getEncouragementMessage(this.fromLevel, this.toLevel);
    } else if (this.fromLevel === 2) {
      mainText = '🏆 全部完成！';
      subText = this.getEncouragementMessage(this.fromLevel, 'custom');
    }
    
    // 绘制主文字 - 添加阴影效果
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(this.width * 0.08 * this.textScale)}px "PingFang SC", Arial, sans-serif`;
    ctx.fillText(mainText, centerX, centerY - 40);
    ctx.restore();
    
    // 绘制副文字 - 添加发光效果
    ctx.save();
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05 * this.textScale)}px "PingFang SC", Arial, sans-serif`;
    ctx.fillText(subText, centerX, centerY + 20);
    ctx.restore();
    
    ctx.restore();
  }

  /**
   * 检查是否正在过渡
   */
  isActive() {
    return this.isTransitioning;
  }

  /**
   * 强制停止过渡
   */
  stop() {
    this.isTransitioning = false;
    this.particleEffects = [];
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.TransitionManager = TransitionManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransitionManager;
}