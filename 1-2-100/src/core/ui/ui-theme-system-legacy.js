class ThemeSystem {
  constructor() {
    this.currentTheme = 'neonCyberpunk';
    this.themes = {
      neonCyberpunk: {
        primary: '#00D4FF',
        primaryDark: '#0099CC',
        primaryLight: '#33DDFF',
        secondary: '#39FF14',
        secondaryDark: '#2BCC10',
        secondaryLight: '#5AFF3D',
        accent: '#FF0080',
        accentDark: '#CC0066',
        accentLight: '#FF33A0',
        background: {
          type: 'radialGradient',
          colors: ['#0A0A0A', '#1A0033', '#000D1A', '#000000'],
          stops: [0, 0.4, 0.8, 1.0]
        },
        cell: {
          bg: 'rgba(0, 0, 0, 0.8)',
          bgHover: 'rgba(0, 212, 255, 0.1)',
          border: '#00D4FF',
          borderActive: '#39FF14',
          done: 'rgba(57, 255, 20, 0.2)',
          text: '#FFFFFF',
          textDone: 'rgba(255, 255, 255, 0.3)',
          glow: 'rgba(0, 212, 255, 0.6)'
        },
        button: {
          primary: {
            bg: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
            bgHover: 'linear-gradient(135deg, #33DDFF 0%, #00AADD 100%)',
            bgActive: 'linear-gradient(135deg, #0099CC 0%, #007799 100%)',
            text: '#000000',
            shadow: 'rgba(0, 212, 255, 0.8)',
            glow: 'rgba(0, 212, 255, 0.6)'
          },
          secondary: {
            bg: 'linear-gradient(135deg, #39FF14 0%, #2BCC10 100%)',
            bgHover: 'linear-gradient(135deg, #5AFF3D 0%, #39FF14 100%)',
            bgActive: 'linear-gradient(135deg, #2BCC10 0%, #1A9900 100%)',
            text: '#000000',
            shadow: 'rgba(57, 255, 20, 0.8)',
            glow: 'rgba(57, 255, 20, 0.6)'
          },
          accent: {
            bg: 'linear-gradient(135deg, #FF0080 0%, #CC0066 100%)',
            bgHover: 'linear-gradient(135deg, #FF33A0 0%, #FF0080 100%)',
            bgActive: 'linear-gradient(135deg, #CC0066 0%, #990044 100%)',
            text: '#FFFFFF',
            shadow: 'rgba(255, 0, 128, 0.8)',
            glow: 'rgba(255, 0, 128, 0.6)'
          }
        },
        hud: {
          bg: 'rgba(0, 0, 0, 0.9)',
          text: '#00D4FF',
          textSecondary: '#39FF14',
          border: 'rgba(0, 212, 255, 0.5)',
          progressBg: 'rgba(0, 0, 0, 0.6)',
          progressFill: '#39FF14',
          progressGlow: 'rgba(57, 255, 20, 0.8)',
          warning: '#FF8000',
          error: '#FF0040',
          accent: '#FF0080'
        },
        effects: {
          success: '#39FF14',
          error: '#FF0040',
          particle: ['#00D4FF', '#39FF14', '#FF0080', '#8000FF', '#00FFFF'],
          ripple: '#00D4FF',
          glow: 'rgba(0, 212, 255, 0.8)',
          pulse: '#FF0080',
          trail: 'rgba(57, 255, 20, 0.6)'
        }
      }
    };
  }

  getThemeColors() {
    return this.themes[this.currentTheme];
  }

  applyBackgroundGradient(ctx, width, height) {
    const theme = this.getThemeColors();
    const bgConfig = theme.background;
    let gradient;
    if (bgConfig.type === 'radialGradient') {
      const centerX = width * 0.5;
      const centerY = height * 0.3;
      const radius = Math.max(width, height) * 0.8;
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 0, height);
    }
    bgConfig.colors.forEach((color, index) => {
      const stop = bgConfig.stops ? bgConfig.stops[index] : index / (bgConfig.colors.length - 1);
      gradient.addColorStop(stop, color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  getButtonStyle(type = 'primary') {
    const theme = this.getThemeColors();
    const buttonConfig = theme.button[type] || theme.button.primary;
    return {
      backgroundColor: buttonConfig.bg,
      backgroundColorHover: buttonConfig.bgHover,
      backgroundColorActive: buttonConfig.bgActive,
      textColor: buttonConfig.text,
      shadowColor: buttonConfig.shadow,
      borderRadius: 25,
      shadowBlur: 15,
      shadowOffsetY: 4
    };
  }

  getCellStyle(state = 'normal') {
    const theme = this.getThemeColors();
    const cellConfig = theme.cell;
    const styles = {
      normal: { backgroundColor: cellConfig.bg, borderColor: cellConfig.border, textColor: cellConfig.text, borderWidth: 2 },
      hover: { backgroundColor: cellConfig.bgHover, borderColor: cellConfig.borderActive, textColor: cellConfig.text, borderWidth: 3 },
      active: { backgroundColor: cellConfig.bgHover, borderColor: cellConfig.borderActive, textColor: cellConfig.text, borderWidth: 3 },
      done: { backgroundColor: cellConfig.done, borderColor: 'transparent', textColor: cellConfig.textDone, borderWidth: 1 }
    };
    return styles[state] || styles.normal;
  }

  getHUDStyle() {
    const theme = this.getThemeColors();
    return theme.hud;
  }

  getEffectColor(effectType) {
    const theme = this.getThemeColors();
    return theme.effects[effectType];
  }

  applyGlowEffect(ctx, x, y, radius, color) {
    const theme = this.getThemeColors();
    const glowColor = color || theme.effects.glow;
    ctx.save();
    const layers = [{ blur: radius * 0.8, alpha: 0.8 }, { blur: radius * 0.5, alpha: 0.6 }, { blur: radius * 0.2, alpha: 0.4 }];
    layers.forEach((layer) => {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = layer.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = layer.alpha;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    });
    ctx.restore();
  }

  applyNeonBorder(ctx, x, y, width, height, borderRadius, color, glowIntensity = 1) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();
    ctx.shadowBlur = 5 * glowIntensity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  applyButtonGradient(ctx, x, y, width, height, type = 'primary', state = 'normal') {
    const theme = this.getThemeColors();
    const buttonConfig = theme.button[type] || theme.button.primary;
    let gradientColors;
    switch (state) {
      case 'hover':
        gradientColors = this.parseGradient(buttonConfig.bgHover);
        break;
      case 'active':
        gradientColors = this.parseGradient(buttonConfig.bgActive);
        break;
      default:
        gradientColors = this.parseGradient(buttonConfig.bg);
    }
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradientColors.forEach((colorStop) => {
      gradient.addColorStop(colorStop.stop, colorStop.color);
    });
    ctx.fillStyle = gradient;
    if (buttonConfig.glow) {
      ctx.shadowColor = buttonConfig.glow;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  parseGradient(gradientStr) {
    if (!gradientStr.includes('linear-gradient')) {
      return [{ stop: 0, color: gradientStr }, { stop: 1, color: gradientStr }];
    }
    const matches = gradientStr.match(/#[0-9A-Fa-f]{6}/g);
    if (matches && matches.length >= 2) {
      return [{ stop: 0, color: matches[0] }, { stop: 1, color: matches[1] }];
    }
    return [{ stop: 0, color: '#00D4FF' }, { stop: 1, color: '#0099CC' }];
  }

  applyScanlines(ctx, width, height, time) {
    const theme = this.getThemeColors();
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1;
    const lineSpacing = 4;
    const offset = (time * 0.1) % (lineSpacing * 2);
    for (let y = -offset; y < height + lineSpacing; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  applyCyberpunkDecorations(ctx, width, height, time) {
    this.drawCyberpunkGrid(ctx, width, height, time);
    this.drawFloatingHexagons(ctx, width, height, time);
    this.drawDataStreams(ctx, width, height, time);
    this.drawCornerDecorations(ctx, width, height);
  }

  drawCyberpunkGrid(ctx, width, height, time) {
    const theme = this.getThemeColors();
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = (time * 0.02) % gridSize;
    for (let x = -offset; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -offset; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFloatingHexagons(ctx, width, height, time) {
    const theme = this.getThemeColors();
    const hexagons = [
      { x: width * 0.1, y: height * 0.2, size: 20, speed: 0.001 },
      { x: width * 0.8, y: height * 0.3, size: 15, speed: 0.0015 },
      { x: width * 0.2, y: height * 0.7, size: 25, speed: 0.0008 },
      { x: width * 0.9, y: height * 0.8, size: 18, speed: 0.0012 }
    ];
    ctx.save();
    hexagons.forEach((hex) => {
      const rotation = time * hex.speed;
      const pulse = Math.sin(time * 0.003 + hex.x * 0.01) * 0.3 + 0.7;
      ctx.save();
      ctx.translate(hex.x, hex.y);
      ctx.rotate(rotation);
      ctx.globalAlpha = 0.3 * pulse;
      ctx.strokeStyle = theme.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * hex.size;
        const y = Math.sin(angle) * hex.size;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  drawDataStreams(ctx, width, height, time) {
    const theme = this.getThemeColors();
    const streams = [
      { x: width * 0.05, direction: 1, speed: 0.1 },
      { x: width * 0.95, direction: -1, speed: 0.08 },
      { x: width * 0.3, direction: 1, speed: 0.12 },
      { x: width * 0.7, direction: -1, speed: 0.09 }
    ];
    ctx.save();
    streams.forEach((stream) => {
      const y = ((time * stream.speed * stream.direction) % (height + 100)) - 50;
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stream.x, y);
      ctx.lineTo(stream.x, y + 30);
      ctx.stroke();
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 10;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(stream.x, y + 15, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawCornerDecorations(ctx, width, height) {
    const theme = this.getThemeColors();
    const cornerSize = 30;
    ctx.save();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(10, cornerSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(cornerSize, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, 10);
    ctx.lineTo(width - 10, 10);
    ctx.lineTo(width - 10, cornerSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, height - cornerSize);
    ctx.lineTo(10, height - 10);
    ctx.lineTo(cornerSize, height - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.lineTo(width - 10, height - cornerSize);
    ctx.stroke();
    ctx.restore();
  }
}

module.exports = ThemeSystem;
