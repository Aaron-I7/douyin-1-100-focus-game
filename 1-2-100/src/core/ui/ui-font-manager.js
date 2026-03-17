/**
 * FontManager - 字体管理器
 * 负责加载和管理游戏中使用的特色字体
 * 
 * 功能：
 * - 异步加载字体文件
 * - 字体加载状态管理
 * - 字体降级处理
 * - 字体应用管理
 */

class FontManager {
  constructor() {
    this.fonts = new Map();
    this.loadingPromises = new Map();
    this.loadedFonts = new Set();
    
    // 字体配置
    this.fontConfig = {
      title: {
        name: 'GameTitle',
        family: 'GameTitle, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
        url: null, // 将在 16.2 中设置
        fallback: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
        weight: 'bold',
        style: 'normal'
      },
      number: {
        name: 'GameNumber',
        family: '"Courier New", "Monaco", "Menlo", monospace',
        url: null, // 使用系统等宽字体
        fallback: '"Courier New", "Monaco", "Menlo", monospace',
        weight: 'normal',
        style: 'normal'
      },
      ui: {
        name: 'GameUI',
        family: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
        url: null, // 使用系统字体
        fallback: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
        weight: 'normal',
        style: 'normal'
      }
    };
  }

  /**
   * 加载字体
   * @param {string} fontType - 字体类型 ('title', 'number', 'ui')
   * @param {string} url - 字体文件 URL（可选）
   * @returns {Promise<boolean>} 加载是否成功
   */
  async loadFont(fontType, url = null) {
    if (!this.fontConfig[fontType]) {
      console.error(`Unknown font type: ${fontType}`);
      return false;
    }

    const config = this.fontConfig[fontType];
    
    // 如果提供了 URL，更新配置
    if (url) {
      config.url = url;
    }

    // 如果没有 URL，表示使用系统字体
    if (!config.url) {
      this.loadedFonts.add(fontType);
      return true;
    }

    // 检查是否已经在加载中
    if (this.loadingPromises.has(fontType)) {
      return await this.loadingPromises.get(fontType);
    }

    // 检查是否已经加载
    if (this.loadedFonts.has(fontType)) {
      return true;
    }

    // 开始加载字体
    const loadingPromise = this._loadFontFile(config);
    this.loadingPromises.set(fontType, loadingPromise);

    try {
      const success = await loadingPromise;
      if (success) {
        this.loadedFonts.add(fontType);
        this.fonts.set(fontType, config);
      }
      return success;
    } catch (error) {
      console.error(`Failed to load font ${fontType}:`, error);
      return false;
    } finally {
      this.loadingPromises.delete(fontType);
    }
  }

  /**
   * 实际加载字体文件
   * @private
   * @param {Object} config - 字体配置
   * @returns {Promise<boolean>}
   */
  async _loadFontFile(config) {
    try {
      // 在抖音小游戏环境中，使用 FontFace API 加载字体
      if (typeof FontFace !== 'undefined') {
        const fontFace = new FontFace(
          config.name,
          `url(${config.url})`,
          {
            weight: config.weight,
            style: config.style
          }
        );

        await fontFace.load();
        
        // 添加到文档字体集合
        if (document && document.fonts) {
          document.fonts.add(fontFace);
        }

        return true;
      } else {
        // 降级方案：使用传统方式加载字体
        return await this._loadFontLegacy(config);
      }
    } catch (error) {
      console.warn(`Font loading failed, using fallback: ${error.message}`);
      return false;
    }
  }

  /**
   * 传统字体加载方式（降级方案）
   * @private
   * @param {Object} config - 字体配置
   * @returns {Promise<boolean>}
   */
  async _loadFontLegacy(config) {
    return new Promise((resolve) => {
      // 创建样式元素
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${config.name}';
          src: url('${config.url}');
          font-weight: ${config.weight};
          font-style: ${config.style};
        }
      `;
      
      document.head.appendChild(style);

      // 创建测试元素来检测字体是否加载完成
      const testElement = document.createElement('div');
      testElement.style.fontFamily = config.name;
      testElement.style.fontSize = '12px';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.textContent = 'Test';
      document.body.appendChild(testElement);

      // 检测字体加载
      let attempts = 0;
      const maxAttempts = 50; // 5秒超时
      
      const checkFont = () => {
        attempts++;
        
        // 简单的字体检测：检查元素宽度变化
        const width = testElement.offsetWidth;
        
        if (width > 0 || attempts >= maxAttempts) {
          document.body.removeChild(testElement);
          resolve(attempts < maxAttempts);
        } else {
          setTimeout(checkFont, 100);
        }
      };

      checkFont();
    });
  }

  /**
   * 获取字体族名称
   * @param {string} fontType - 字体类型
   * @returns {string} 字体族名称
   */
  getFontFamily(fontType) {
    if (!this.fontConfig[fontType]) {
      console.warn(`Unknown font type: ${fontType}, using default`);
      return this.fontConfig.ui.family;
    }

    const config = this.fontConfig[fontType];
    
    // 如果字体已加载，返回完整字体族
    if (this.loadedFonts.has(fontType)) {
      return config.family;
    }
    
    // 否则返回降级字体
    return config.fallback;
  }

  /**
   * 检查字体是否已加载
   * @param {string} fontType - 字体类型
   * @returns {boolean} 是否已加载
   */
  isFontLoaded(fontType) {
    return this.loadedFonts.has(fontType);
  }

  /**
   * 获取字体样式对象
   * @param {string} fontType - 字体类型
   * @param {number} size - 字体大小
   * @returns {Object} 字体样式对象
   */
  getFontStyle(fontType, size) {
    const config = this.fontConfig[fontType] || this.fontConfig.ui;
    const family = this.getFontFamily(fontType);
    
    return {
      fontFamily: family,
      fontSize: `${size}px`,
      fontWeight: config.weight,
      fontStyle: config.style
    };
  }

  /**
   * 应用字体到 Canvas 上下文
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} fontType - 字体类型
   * @param {number} size - 字体大小
   */
  applyFont(ctx, fontType, size) {
    const style = this.getFontStyle(fontType, size);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  }

  /**
   * 预加载所有字体
   * @returns {Promise<Object>} 加载结果
   */
  async preloadAllFonts() {
    const results = {};
    const loadPromises = [];

    for (const fontType of Object.keys(this.fontConfig)) {
      const promise = this.loadFont(fontType).then(success => {
        results[fontType] = success;
        return success;
      });
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    return results;
  }

  /**
   * 获取加载进度
   * @returns {Object} 加载进度信息
   */
  getLoadingProgress() {
    const totalFonts = Object.keys(this.fontConfig).length;
    const loadedCount = this.loadedFonts.size;
    const loadingCount = this.loadingPromises.size;
    
    return {
      total: totalFonts,
      loaded: loadedCount,
      loading: loadingCount,
      progress: totalFonts > 0 ? loadedCount / totalFonts : 1,
      isComplete: loadedCount === totalFonts && loadingCount === 0
    };
  }

  /**
   * 设置字体 URL
   * @param {string} fontType - 字体类型
   * @param {string} url - 字体文件 URL
   */
  setFontUrl(fontType, url) {
    if (this.fontConfig[fontType]) {
      this.fontConfig[fontType].url = url;
    }
  }

  /**
   * 重置字体管理器
   */
  reset() {
    this.fonts.clear();
    this.loadingPromises.clear();
    this.loadedFonts.clear();
  }
}

export default FontManager;