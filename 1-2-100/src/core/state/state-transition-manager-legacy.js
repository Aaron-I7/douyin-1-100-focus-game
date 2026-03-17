class TransitionManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.width = canvas.width;
    this.height = canvas.height;
    this.isTransitioning = false;
    this.transitionType = null;
    this.transitionStartTime = 0;
    this.transitionDuration = 2000;
    this.fadeOpacity = 0;
    this.textScale = 1;
    this.particleEffects = [];
  }

  showLevelTransition(fromLevel, toLevel, onComplete) {
    this.isTransitioning = true;
    this.transitionType = 'levelComplete';
    this.transitionStartTime = Date.now();
    this.onTransitionComplete = onComplete;
    this.fromLevel = fromLevel;
    this.toLevel = toLevel;
    this.generateCelebrationParticles();
    console.log(`Starting transition from level ${fromLevel} to level ${toLevel}`);
  }

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

  getRandomColor() {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    if (!this.isTransitioning) return;
    const elapsed = Date.now() - this.transitionStartTime;
    const progress = Math.min(elapsed / this.transitionDuration, 1);
    if (progress < 0.5) {
      this.fadeOpacity = progress * 2;
      this.textScale = 0.5 + (progress * 2) * 0.5;
    } else {
      this.fadeOpacity = 2 - (progress * 2);
      this.textScale = 1;
    }
    this.updateParticles();
    if (progress >= 1) {
      this.isTransitioning = false;
      if (this.onTransitionComplete) {
        this.onTransitionComplete();
      }
    }
  }

  updateParticles() {
    this.particleEffects = this.particleEffects.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      return particle.life > 0;
    });
  }

  render() {
    if (!this.isTransitioning) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeOpacity * 0.7})`;
    ctx.fillRect(0, 0, this.width, this.height);
    this.renderParticles();
    this.renderTransitionText();
    ctx.restore();
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particleEffects.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.life * this.fadeOpacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderTransitionText() {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    ctx.save();
    ctx.globalAlpha = this.fadeOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let mainText = '';
    let subText = '';
    if (this.fromLevel === 1 && this.toLevel === 2) {
      mainText = '🎉 第一关完成！';
      subText = '难度飙升！！！';
    } else if (this.fromLevel === 2) {
      mainText = '🏆 全部完成！';
      subText = '恭喜通关！';
    }
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(this.width * 0.08 * this.textScale)}px Arial, sans-serif`;
    ctx.fillText(mainText, centerX, centerY - 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(this.width * 0.05 * this.textScale)}px Arial, sans-serif`;
    ctx.fillText(subText, centerX, centerY + 30);
    ctx.restore();
  }

  isActive() {
    return this.isTransitioning;
  }

  stop() {
    this.isTransitioning = false;
    this.particleEffects = [];
  }
}

module.exports = TransitionManager;
