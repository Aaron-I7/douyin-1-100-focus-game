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
  }

  /**
   * 生成庆祝粒子效果
   */
  generateCelebrationParticles() {
    this.particleEffects = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      this.particleEffects.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 6 + 2,
        color: this.getRandomColor(),
        life: 1.0,
        decay: 0.02
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
   * 更新过渡动画
   */
  update() {
    if (!this.isTransitioning) return;
    
    const elapsed = Date.now() - this.transitionStartTime;
    const progress = Math.min(elapsed / this.transitionDuration, 1);
    
    // 更新动画参数
    if (progress < 0.5) {
      // 前半段：淡入
      this.fadeOpacity = progress * 2;
      this.textScale = 0.5 + (progress * 2) * 0.5;
    } else {
      // 后半段：淡出
      this.fadeOpacity = 2 - (progress * 2);
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
   * 更新粒子效果
   */
  updateParticles() {
    this.particleEffects = this.particleEffects.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
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
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
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
      subText = '难度飙升！！！';
    } else if (this.fromLevel === 2) {
      mainText = '🏆 全部完成！';
      subText = '恭喜通关！';
    }
    
    // 绘制主文字
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(this.width * 0.08 * this.textScale)}px Arial, sans-serif`;
    ctx.fillText(mainText, centerX, centerY - 30);
    
    // 绘制副文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(this.width * 0.05 * this.textScale)}px Arial, sans-serif`;
    ctx.fillText(subText, centerX, centerY + 30);
    
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