class ThemeSystem {
  constructor() {
    this.currentTheme = 'darkNeon';
    
    // Eye-care / Soft Dark Mode block gradients (Low saturation, comfortable contrast)
    this.blockGradients = [
      ['#64748b', '#475569'], // Slate 500 -> 600 (Blue-ish Grey)
      ['#71717a', '#52525b'], // Zinc 500 -> 600 (Cool Grey)
      ['#6b7280', '#4b5563'], // Gray 500 -> 600 (Neutral)
      ['#78716c', '#57534e'], // Stone 500 -> 600 (Warm Grey)
      ['#60a5fa', '#3b82f6'], // Soft Blue (Muted)
      ['#34d399', '#10b981'], // Soft Emerald (Muted)
      ['#818cf8', '#6366f1'], // Soft Indigo (Muted)
      ['#fbbf24', '#f59e0b'], // Soft Amber (Muted)
      ['#f472b6', '#ec4899'], // Soft Pink (Muted)
    ];

    // Irregular polygon paths (x%, y%)
    this.polygonPaths = [
      [5, 0, 95, 3, 100, 95, 2, 100],
      [3, 2, 98, 0, 96, 98, 0, 95],
      [0, 5, 100, 0, 97, 100, 4, 96],
      [2, 0, 96, 4, 100, 97, 0, 100],
      [4, 3, 100, 0, 98, 100, 0, 98],
      [0, 0, 97, 2, 100, 100, 3, 97],
      [1, 4, 100, 0, 96, 96, 0, 100],
      [3, 0, 100, 3, 97, 100, 0, 96],
      [0, 2, 98, 0, 100, 98, 2, 100],
    ];

    this.themes = {
      darkNeon: {
        background: {
          type: 'linearGradient',
          colors: ['#18181b', '#27272a', '#18181b'], // Zinc 950 -> 900 -> 950 (Soft Matte Dark)
          stops: [0, 0.5, 1.0]
        },
        text: '#e4e4e7', // Zinc 200 (Soft White)
        textSecondary: '#a1a1aa', // Zinc 400
        primary: '#fbbf24', // amber-400 (Soft Gold)
        accent: '#f472b6', // pink-400 (Soft Pink)
        success: '#34d399', // emerald-400
        error: '#f87171', // red-400
        cardBg: 'rgba(39, 39, 42, 0.6)', // Zinc 800 with opacity
        cardBorder: 'rgba(255, 255, 255, 0.08)',
      }
    };
  }

  getThemeColors() {
    return this.themes[this.currentTheme];
  }

  getBlockGradient(index) {
    return this.blockGradients[index % this.blockGradients.length];
  }

  getPolygonPath(index) {
    return this.polygonPaths[index % this.polygonPaths.length];
  }

  applyBackgroundGradient(ctx, w, h) {
    const theme = this.getThemeColors();
    const bgConfig = theme.background;
    
    // Draw base gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    bgConfig.colors.forEach((color, index) => {
      const stop = bgConfig.stops ? bgConfig.stops[index] : index / (bgConfig.colors.length - 1);
      grad.addColorStop(stop, color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    // Add decorative circles (Very subtle in eye-care mode)
    ctx.save();
    
    // Soft Warm Glow top-left
    ctx.globalAlpha = 0.05; // Very low opacity
    ctx.fillStyle = '#fbbf24'; // amber
    const rad1 = w * 0.6;
    const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, rad1);
    grad1.addColorStop(0, '#fbbf24');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, rad1, rad1);
    
    // Soft Cool Glow bottom-right
    const rad2 = w * 0.7;
    const grad2 = ctx.createRadialGradient(w, h, 0, w, h, rad2);
    grad2.addColorStop(0, '#64748b'); // slate
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(w - rad2, h - rad2, rad2, rad2);
    
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

  // Draw 3D Block (Web style)
  draw3DBlock(ctx, x, y, w, h, radius, gradientColors, isPressed, isWrong, clipPoints = null) {
    ctx.save();
    
    // Handle Polygon Shape (Level 1)
    if (clipPoints) {
      ctx.beginPath();
      const startX = x + (clipPoints[0] / 100) * w;
      const startY = y + (clipPoints[1] / 100) * h;
      ctx.moveTo(startX, startY);
      for (let i = 2; i < clipPoints.length; i += 2) {
        const px = x + (clipPoints[i] / 100) * w;
        const py = y + (clipPoints[i + 1] / 100) * h;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      // Standard Rounded Rect (Level 2)
      this.roundRect(ctx, x, y, w, h, radius);
    }

    // Shadow
    if (!isPressed && !isWrong) {
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowOffsetY = 4;
      ctx.shadowBlur = 0; // Solid shadow for 3D feel
    } else if (isPressed) {
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
    }

    // Fill
    if (isWrong) {
      // Use the gradient passed from RenderEngine if available, otherwise default error
      if (gradientColors && gradientColors[0] === '#f87171') {
         const grad = ctx.createLinearGradient(x, y, x + w, y + h);
         grad.addColorStop(0, gradientColors[0]);
         grad.addColorStop(1, gradientColors[1]);
         ctx.fillStyle = grad;
      } else {
         ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      }
      ctx.fill();
      
      // Error Border
      ctx.strokeStyle = '#fca5a5'; // red-300
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, gradientColors[0]);
      grad.addColorStop(1, gradientColors[1]);
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Top highlight border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

module.exports = ThemeSystem;
