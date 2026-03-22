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
    this.nextLevelTimeLimitSec = 10 * 60;
  }

  showLevelTransition(fromLevel, toLevel, onComplete, options = {}) {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.isTransitioning = true;
    this.transitionType = 'levelComplete';
    this.transitionStartTime = Date.now();
    // Reduce transition duration since it's just a floating text overlay now
    this.transitionDuration = 1500;
    this.onTransitionComplete = onComplete;
    this.fromLevel = fromLevel;
    this.toLevel = toLevel;
    this.nextLevelTimeLimitSec = Number(options.nextLevelTimeLimitSec) > 0 ? Number(options.nextLevelTimeLimitSec) : 10 * 60;
    this.fadeOpacity = 0;
    this.textScale = 0.5;
    this.particleEffects = [];
    // Create subtle particles for the floating text
    this.createParticles(15);
    console.log(`Starting transition from level ${fromLevel} to level ${toLevel}`);
  }

  createParticles(count) {
    this.particleEffects = [];
    for (let i = 0; i < count; i++) {
      this.particleEffects.push({
        x: this.width / 2 + (Math.random() - 0.5) * 100,
        y: this.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2, // slight upward drift
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        size: Math.random() * 3 + 1,
        color: ['#426564', '#cbe8e6', '#f1f4f2'][Math.floor(Math.random() * 3)]
      });
    }
  }


  update(deltaTime = 16) {
    if (!this.isTransitioning) return;
    const now = Date.now();
    const elapsed = now - this.transitionStartTime;
    this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
    
    // Animation easing
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    if (this.transitionProgress < 0.2) {
      // Fade in
      this.fadeOpacity = this.transitionProgress / 0.2;
      this.textScale = 0.8 + easeOutCubic(this.transitionProgress / 0.2) * 0.2;
    } else if (this.transitionProgress > 0.8) {
      // Fade out
      this.fadeOpacity = 1 - (this.transitionProgress - 0.8) / 0.2;
      this.textScale = 1 + easeInOutQuad((this.transitionProgress - 0.8) / 0.2) * 0.1;
    } else {
      // Hold
      this.fadeOpacity = 1;
      this.textScale = 1;
    }
    
    // Update particles
    this.particleEffects.forEach(p => {
      p.x += p.vx * (deltaTime / 16);
      p.y += p.vy * (deltaTime / 16);
      p.vy += 0.1; // gravity
      p.life -= 0.01 * (deltaTime / 16);
      if (p.life < 0) p.life = 0;
    });
    
    if (this.transitionProgress >= 1) {
      this.isTransitioning = false;
      if (typeof this.onTransitionComplete === 'function') {
        this.onTransitionComplete();
      }
    }
  }

  render() {
    if (!this.isTransitioning) return;
    const ctx = this.ctx;
    ctx.save();
    // Dark background (Zinc-950)
    ctx.fillStyle = `rgba(24, 24, 27, ${0.98 * this.fadeOpacity})`;
    ctx.fillRect(0, 0, this.width, this.height);
    
    this.renderParticles();
    this.renderTransitionText();
    ctx.restore();
  }

  renderParticles() {
    // No particles in the requested design
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

  renderTransitionText() {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    ctx.save();
    ctx.globalAlpha = this.fadeOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const minutes = Math.max(1, Math.round((Number(this.nextLevelTimeLimitSec) || (10 * 60)) / 60));
    let mainText = '\u6700\u540e\u4e00\u5173!';
    let subText = `1 \u2192 100 \u00b7 \u9650\u65f6${minutes}\u5206\u949f`;
    let statusText = '\u51c6\u5907\u4e2d...';
    
    if (this.fromLevel === 2) {
      mainText = '\u5168\u90e8\u5b8c\u6210!';
      subText = '\u606d\u559c\u901a\u5173';
      statusText = '';
    }
    
    // Main Title: Soft Gradient (Amber -> Orange -> Red)
    // Shifted up significantly to avoid overlap with subtext
    ctx.font = `800 ${Math.floor(this.width * 0.13 * this.textScale)}px "Manrope", "PingFang SC", sans-serif`;
    const grad = ctx.createLinearGradient(centerX - 100, centerY - 80, centerX + 100, centerY - 20);
    grad.addColorStop(0, '#fcd34d'); // Amber-300
    grad.addColorStop(0.5, '#fbbf24'); // Amber-400
    grad.addColorStop(1, '#f87171'); // Red-400 (Soft)
    ctx.fillStyle = grad;
    
    // Text Shadow/Glow (Subtle)
    ctx.shadowColor = 'rgba(251, 191, 36, 0.3)';
    ctx.shadowBlur = 20;
    ctx.fillText(mainText, centerX, centerY - 100); // Moved up from -80 to -100
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Subtext: Soft Blue-Grey
    ctx.fillStyle = '#93c5fd'; // Blue-300
    ctx.font = `500 ${Math.floor(this.width * 0.05 * this.textScale)}px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText(subText, centerX, centerY + 40); // Moved down from +20 to +40
    
    // Status: Grey (Delayed appearance)
    const elapsed = Date.now() - this.transitionStartTime;
    const delay = 600; // 600ms delay
    
    if (statusText && elapsed > delay) {
       // Separate fade in for status
       const statusOpacity = Math.min(1, (elapsed - delay) / 300);
       
       ctx.globalAlpha = this.fadeOpacity * statusOpacity;
       ctx.fillStyle = '#71717a'; // Zinc-500
       ctx.font = `400 ${Math.floor(this.width * 0.035 * this.textScale)}px "Manrope", "PingFang SC", sans-serif`;
       ctx.fillText(statusText, centerX, centerY + 130); // Moved down from +100 to +130
    }
    
    ctx.restore();
  }

  isActive() {
    return this.isTransitioning;
  }

  stop() {
    this.isTransitioning = false;
    this.particleEffects = [];
    this.nextLevelTimeLimitSec = 10 * 60;
  }
}

module.exports = TransitionManager;
