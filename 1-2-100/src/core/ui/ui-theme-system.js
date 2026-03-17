/**
 * ThemeSystem - 极简治愈主题系统
 * 采用 Minimalist Healing 设计理念：柔和米白 + 莫兰迪色系
 * 强调舒适、放松与专注，减少视觉干扰
 */

class ThemeSystem {
  constructor() {
    this.currentTheme = 'minimalistHealing';
    this.themes = {
      minimalistHealing: {
        // 主色调：莫兰迪蓝（柔和、沉静）
        primary: '#779FA1',        
        primaryDark: '#567C7E',    
        primaryLight: '#E0F0F1',   
        
        // 辅色：暖杏色（治愈、温暖）
        secondary: '#E0C9A6',      
        secondaryDark: '#C5AA82',  
        secondaryLight: '#F5E6D0', 
        
        // 强调色：干枯玫瑰（柔和点缀）
        accent: '#D49EA7',         
        accentDark: '#B07D86',     
        accentLight: '#F2D4D9',    
        
        // 背景：米白/纸张质感
        background: {
          type: 'solid',
          color: '#F9F7F2'  // 暖米白
        },
        
        // 游戏元素配色
        cell: {
          bg: '#FFFFFF',                      // 纯白卡片背景
          bgHover: '#F0F4F5',                 // 悬停时的微蓝
          border: '#E6E6E6',                  // 极淡边框
          borderActive: '#779FA1',            // 激活时的莫兰迪蓝边框
          done: '#F2F2F2',                    // 完成后的淡灰
          text: '#4A4A4A',                    // 深灰文字（柔和阅读）
          textDone: '#CCCCCC',                // 完成后的浅灰文字
          shadow: '0 2px 8px rgba(0,0,0,0.04)' // 柔和阴影
        },
        
        // 按钮配色
        button: {
          primary: {
            bg: '#779FA1',
            bgHover: '#668D8F',
            bgActive: '#567C7E',
            text: '#FFFFFF',
            shadow: '0 4px 12px rgba(119, 159, 161, 0.3)',
            radius: 12
          },
          secondary: {
            bg: '#E0C9A6',
            bgHover: '#D4BD9A',
            bgActive: '#C5AA82',
            text: '#5D4D36', 
            shadow: '0 4px 12px rgba(224, 201, 166, 0.3)',
            radius: 12
          },
          accent: {
            bg: '#D49EA7',
            bgHover: '#C58D96',
            bgActive: '#B07D86',
            text: '#FFFFFF',
            shadow: '0 4px 12px rgba(212, 158, 167, 0.3)',
            radius: 12
          },
          // ... 保持结构完整，后续根据需要补充
        },
        
        // HUD 配色
        hud: {
          bg: 'rgba(255, 255, 255, 0.9)',       // 磨砂玻璃白
          text: '#4A4A4A',                      // 深灰文字
          textSecondary: '#888888',             // 浅灰次要文字
          border: 'rgba(0, 0, 0, 0.05)',        // 极淡分割线
          progressBg: '#EEEEEE',
          progressFill: '#779FA1',              // 莫兰迪蓝进度条
          warning: '#E6B89C',                   // 柔和橙
          error: '#D49EA7',                     // 柔和红
        },
        
        // 动画和特效配色
        effects: {
          success: '#779FA1',      // 成功特效
          error: '#D49EA7',        // 错误特效
          particle: [              // 莫兰迪粒子色系
            '#779FA1', 
            '#E0C9A6',  
            '#D49EA7',  
            '#9CC4B2',  
            '#A6B1E1'   
          ],
          ripple: 'rgba(119, 159, 161, 0.2)', // 柔和波纹
          glow: 'rgba(0, 212, 255, 0.8)',  // 发光效果
          pulse: '#FF0080',        // 脉冲效果（霓虹粉）
          trail: 'rgba(57, 255, 20, 0.6)'  // 拖尾效果
        },
        
        // 横屏提示配色
        orientationHint: {
          bg: 'rgba(0, 0, 0, 0.95)',    // 深黑色背景
          text: '#00D4FF',              // 霓虹蓝文字
          icon: '#39FF14',              // 激光绿图标
          border: 'rgba(0, 212, 255, 0.3)' // 霓虹蓝边框
        }
      }
    };
  }
  
  /**
   * 获取当前主题的所有颜色配置
   * @returns {Object} 主题颜色对象
   */
  getThemeColors() {
    return this.themes[this.currentTheme];
  }
  
  /**
   * 应用背景渐变到 Canvas 上下文
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  applyBackgroundGradient(ctx, width, height) {
    const theme = this.getThemeColors();
    const bgConfig = theme.background;
    
    if (bgConfig.type === 'solid') {
      ctx.fillStyle = bgConfig.color;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    
    let gradient;
    
    if (bgConfig.type === 'radialGradient') {
      // 径向渐变
      const centerX = width * 0.5;
      const centerY = height * 0.3;
      const radius = Math.max(width, height) * 0.8;
      
      gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
    } else {
      // 线性渐变：从上到下
      gradient = ctx.createLinearGradient(0, 0, 0, height);
    }
    
    // 添加颜色停止点
    if (bgConfig.colors) {
      bgConfig.colors.forEach((color, index) => {
        const stop = bgConfig.stops ? bgConfig.stops[index] : index / (bgConfig.colors.length - 1);
        gradient.addColorStop(stop, color);
      });
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  /**
   * 获取按钮样式配置
   * @param {string} type - 按钮类型 (primary, secondary, accent, danger, success)
   * @returns {Object} 按钮样式对象
   */
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
  
  /**
   * 获取 Cell 样式配置
   * @param {string} state - Cell 状态 (normal, hover, active, done)
   * @returns {Object} Cell 样式对象
   */
  getCellStyle(state = 'normal') {
    const theme = this.getThemeColors();
    const cellConfig = theme.cell;
    
    const styles = {
      normal: {
        backgroundColor: cellConfig.bg,
        borderColor: cellConfig.border,
        textColor: cellConfig.text,
        borderWidth: 2
      },
      hover: {
        backgroundColor: cellConfig.bgHover,
        borderColor: cellConfig.borderActive,
        textColor: cellConfig.text,
        borderWidth: 3
      },
      active: {
        backgroundColor: cellConfig.bgHover,
        borderColor: cellConfig.borderActive,
        textColor: cellConfig.text,
        borderWidth: 3
      },
      done: {
        backgroundColor: cellConfig.done,
        borderColor: 'transparent',
        textColor: cellConfig.textDone,
        borderWidth: 1
      }
    };
    
    return styles[state] || styles.normal;
  }
  
  /**
   * 获取 HUD 样式配置
   * @returns {Object} HUD 样式对象
   */
  getHUDStyle() {
    const theme = this.getThemeColors();
    return theme.hud;
  }
  
  /**
   * 获取特效颜色
   * @param {string} effectType - 特效类型
   * @returns {string|Array} 颜色值或颜色数组
   */
  getEffectColor(effectType) {
    const theme = this.getThemeColors();
    return theme.effects[effectType];
  }
  
  /**
   * 获取横屏提示样式
   * @returns {Object} 横屏提示样式对象
   */
  getOrientationHintStyle() {
    const theme = this.getThemeColors();
    return theme.orientationHint;
  }
  
  /**
   * 创建霓虹发光效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} radius - 发光半径
   * @param {string} color - 发光颜色
   */
  applyGlowEffect(ctx, x, y, radius, color) {
    const theme = this.getThemeColors();
    const glowColor = color || theme.effects.glow;
    
    ctx.save();
    
    // 创建多层发光效果
    const layers = [
      { blur: radius * 0.8, alpha: 0.8 },
      { blur: radius * 0.5, alpha: 0.6 },
      { blur: radius * 0.2, alpha: 0.4 }
    ];
    
    layers.forEach(layer => {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = layer.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = layer.alpha;
      
      // 绘制发光圆形
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  /**
   * 创建霓虹边框效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} borderRadius - 圆角半径
   * @param {string} color - 边框颜色
   * @param {number} glowIntensity - 发光强度
   */
  applyNeonBorder(ctx, x, y, width, height, borderRadius, color, glowIntensity = 1) {
    ctx.save();
    
    // 外层发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制边框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();
    
    // 内层高亮
    ctx.shadowBlur = 5 * glowIntensity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 创建渐变按钮背景
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} type - 按钮类型
   * @param {string} state - 按钮状态
   */
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
    
    // 创建线性渐变
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradientColors.forEach((colorStop, index) => {
      gradient.addColorStop(colorStop.stop, colorStop.color);
    });
    
    ctx.fillStyle = gradient;
    
    // 添加发光效果
    if (buttonConfig.glow) {
      ctx.shadowColor = buttonConfig.glow;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  
  /**
   * 解析渐变字符串
   * @param {string} gradientStr - 渐变字符串
   * @returns {Array} 颜色停止点数组
   */
  parseGradient(gradientStr) {
    if (!gradientStr.includes('linear-gradient')) {
      return [{ stop: 0, color: gradientStr }, { stop: 1, color: gradientStr }];
    }
    
    // 简单解析 linear-gradient 字符串
    const matches = gradientStr.match(/#[0-9A-Fa-f]{6}/g);
    if (matches && matches.length >= 2) {
      return [
        { stop: 0, color: matches[0] },
        { stop: 1, color: matches[1] }
      ];
    }
    
    return [{ stop: 0, color: '#00D4FF' }, { stop: 1, color: '#0099CC' }];
  }
  
  /**
   * 创建脉冲动画效果
   * @param {number} time - 当前时间戳
   * @param {number} speed - 脉冲速度
   * @returns {number} 脉冲强度 (0-1)
   */
  getPulseIntensity(time, speed = 1) {
    return (Math.sin(time * 0.005 * speed) + 1) * 0.5;
  }
  
  /**
   * 创建扫描线效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @param {number} time - 当前时间戳
   */
  applyScanlines(ctx, width, height, time) {
    const theme = this.getThemeColors();
    
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1;
    
    // 水平扫描线
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
  
  /**
   * 创建赛博朋克背景装饰
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @param {number} time - 当前时间戳
   */
  applyCyberpunkDecorations(ctx, width, height, time) {
    const theme = this.getThemeColors();
    
    // 1. 网格线背景
    this.drawCyberpunkGrid(ctx, width, height, time);
    
    // 2. 浮动的六边形
    this.drawFloatingHexagons(ctx, width, height, time);
    
    // 3. 数据流线条
    this.drawDataStreams(ctx, width, height, time);
    
    // 4. 角落装饰
    this.drawCornerDecorations(ctx, width, height);
  }
  
  /**
   * 绘制赛博朋克网格背景
   */
  drawCyberpunkGrid(ctx, width, height, time) {
    const theme = this.getThemeColors();
    
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    const offset = (time * 0.02) % gridSize;
    
    // 垂直线
    for (let x = -offset; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平线
    for (let y = -offset; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制浮动六边形
   */
  drawFloatingHexagons(ctx, width, height, time) {
    const theme = this.getThemeColors();
    const hexagons = [
      { x: width * 0.1, y: height * 0.2, size: 20, speed: 0.001 },
      { x: width * 0.8, y: height * 0.3, size: 15, speed: 0.0015 },
      { x: width * 0.2, y: height * 0.7, size: 25, speed: 0.0008 },
      { x: width * 0.9, y: height * 0.8, size: 18, speed: 0.0012 }
    ];
    
    ctx.save();
    
    hexagons.forEach(hex => {
      const rotation = time * hex.speed;
      const pulse = Math.sin(time * 0.003 + hex.x * 0.01) * 0.3 + 0.7;
      
      ctx.save();
      ctx.translate(hex.x, hex.y);
      ctx.rotate(rotation);
      ctx.globalAlpha = 0.3 * pulse;
      ctx.strokeStyle = theme.secondary;
      ctx.lineWidth = 2;
      
      // 绘制六边形
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
  
  /**
   * 绘制数据流线条
   */
  drawDataStreams(ctx, width, height, time) {
    const theme = this.getThemeColors();
    const streams = [
      { x: width * 0.05, direction: 1, speed: 0.1 },
      { x: width * 0.95, direction: -1, speed: 0.08 },
      { x: width * 0.3, direction: 1, speed: 0.12 },
      { x: width * 0.7, direction: -1, speed: 0.09 }
    ];
    
    ctx.save();
    
    streams.forEach(stream => {
      const y = ((time * stream.speed * stream.direction) % (height + 100)) - 50;
      
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      
      // 绘制流动线条
      ctx.beginPath();
      ctx.moveTo(stream.x, y);
      ctx.lineTo(stream.x, y + 30);
      ctx.stroke();
      
      // 绘制发光点
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 10;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(stream.x, y + 15, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  /**
   * 绘制角落装饰
   */
  drawCornerDecorations(ctx, width, height) {
    const theme = this.getThemeColors();
    const cornerSize = 30;
    
    ctx.save();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    
    // 左上角
    ctx.beginPath();
    ctx.moveTo(10, cornerSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(cornerSize, 10);
    ctx.stroke();
    
    // 右上角
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, 10);
    ctx.lineTo(width - 10, 10);
    ctx.lineTo(width - 10, cornerSize);
    ctx.stroke();
    
    // 左下角
    ctx.beginPath();
    ctx.moveTo(10, height - cornerSize);
    ctx.lineTo(10, height - 10);
    ctx.lineTo(cornerSize, height - 10);
    ctx.stroke();
    
    // 右下角
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.lineTo(width - 10, height - cornerSize);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 获取当前主题名称
   * @returns {string} 主题名称
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// 导出 ThemeSystem 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSystem;
} else if (typeof window !== 'undefined') {
  window.ThemeSystem = ThemeSystem;
}