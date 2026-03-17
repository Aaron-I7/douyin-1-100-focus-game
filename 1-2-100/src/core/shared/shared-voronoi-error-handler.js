/**
 * Voronoi 生成错误处理器
 * 实现重试机制和网格布局降级方案
 */
class VoronoiErrorHandler {
  constructor(voronoiGenerator) {
    this.voronoiGenerator = voronoiGenerator;
    this.maxRetries = 3;
    this.retryCount = 0;
    this.lastError = null;
  }

  /**
   * 带重试机制的 Voronoi 生成
   * @param {number} numSites 站点数量
   * @param {number} width 画布宽度
   * @param {number} height 画布高度
   * @returns {Promise<Array>} Cell 数组
   */
  async generateWithRetry(numSites, width, height) {
    this.retryCount = 0;
    this.lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Voronoi generation attempt ${attempt}/${this.maxRetries}`);
        
        // 为每次重试使用不同的随机种子
        const seed = Date.now() + attempt * 1000 + Math.floor(Math.random() * 1000);
        this.voronoiGenerator.setSeed(seed);
        
        // 尝试生成 Voronoi 图
        const cells = await this.attemptVoronoiGeneration(numSites, width, height);
        
        // 验证生成结果
        this.validateGenerationResult(cells, numSites);
        
        console.log(`Voronoi generation successful on attempt ${attempt}`);
        return cells;

      } catch (error) {
        this.lastError = error;
        this.retryCount = attempt;
        
        console.warn(`Voronoi generation attempt ${attempt} failed:`, error.message);
        
        // 记录错误详情
        this.logGenerationError(attempt, error, { numSites, width, height });
        
        if (attempt === this.maxRetries) {
          console.error('All Voronoi generation attempts failed, using grid fallback');
          return this.generateGridFallback(numSites, width, height);
        }
        
        // 在重试之间添加延迟
        await this.delay(100 * attempt);
      }
    }
  }

  /**
   * 尝试生成 Voronoi 图
   * @param {number} numSites 站点数量
   * @param {number} width 画布宽度
   * @param {number} height 画布高度
   * @returns {Promise<Array>} Cell 数组
   */
  async attemptVoronoiGeneration(numSites, width, height) {
    const startTime = Date.now();
    
    // 设置超时限制（5秒）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Voronoi generation timeout')), 5000);
    });
    
    // 生成 Voronoi 图
    const generationPromise = new Promise((resolve, reject) => {
      try {
        const cells = this.voronoiGenerator.generate(numSites, width, height);
        resolve(cells);
      } catch (error) {
        reject(error);
      }
    });
    
    const cells = await Promise.race([generationPromise, timeoutPromise]);
    
    const generationTime = Date.now() - startTime;
    console.log(`Voronoi generation completed in ${generationTime}ms`);
    
    return cells;
  }

  /**
   * 验证生成结果
   * @param {Array} cells Cell 数组
   * @param {number} expectedCount 期望的 Cell 数量
   */
  validateGenerationResult(cells, expectedCount) {
    if (!Array.isArray(cells)) {
      throw new Error('Generated cells is not an array');
    }
    
    if (cells.length !== expectedCount) {
      throw new Error(`Invalid cell count: expected ${expectedCount}, got ${cells.length}`);
    }
    
    // 验证每个 Cell 的基本结构
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      
      if (!cell || typeof cell !== 'object') {
        throw new Error(`Invalid cell at index ${i}: not an object`);
      }
      
      if (!cell.site || typeof cell.site.x !== 'number' || typeof cell.site.y !== 'number') {
        throw new Error(`Invalid cell site at index ${i}`);
      }
      
      if (!Array.isArray(cell.polygon) || cell.polygon.length < 3) {
        throw new Error(`Invalid cell polygon at index ${i}: insufficient vertices`);
      }
      
      if (typeof cell.number !== 'number' || cell.number < 1) {
        throw new Error(`Invalid cell number at index ${i}`);
      }
    }
    
    // 验证数字唯一性
    const numbers = cells.map(cell => cell.number);
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== numbers.length) {
      throw new Error('Duplicate numbers found in cells');
    }
    
    // 验证数字范围
    const minNumber = Math.min(...numbers);
    const maxNumber = Math.max(...numbers);
    const expectedMax = expectedCount === 10 ? 10 : 100;
    
    if (minNumber !== 1 || maxNumber !== expectedMax) {
      throw new Error(`Invalid number range: expected 1-${expectedMax}, got ${minNumber}-${maxNumber}`);
    }
  }

  /**
   * 生成网格布局作为降级方案
   * @param {number} numSites 站点数量
   * @param {number} width 画布宽度
   * @param {number} height 画布高度
   * @returns {Array} Cell 数组
   */
  generateGridFallback(numSites, width, height) {
    console.log('Generating grid layout fallback');
    
    const cells = [];
    const padding = Math.min(width, height) * 0.05;
    const availableWidth = width - 2 * padding;
    const availableHeight = height - 2 * padding;
    
    // 计算网格尺寸
    const cols = Math.ceil(Math.sqrt(numSites * (availableWidth / availableHeight)));
    const rows = Math.ceil(numSites / cols);
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    // 生成网格 Cell
    for (let i = 0; i < numSites; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = padding + col * cellWidth + cellWidth / 2;
      const y = padding + row * cellHeight + cellHeight / 2;
      
      // 创建矩形多边形
      const halfWidth = cellWidth * 0.4;
      const halfHeight = cellHeight * 0.4;
      
      const cell = {
        site: { x, y },
        number: i + 1,
        polygon: [
          { x: x - halfWidth, y: y - halfHeight },
          { x: x + halfWidth, y: y - halfHeight },
          { x: x + halfWidth, y: y + halfHeight },
          { x: x - halfWidth, y: y + halfHeight }
        ],
        done: false,
        isGridFallback: true
      };
      
      cells.push(cell);
    }
    
    // 随机打乱数字分配
    this.shuffleNumbers(cells);
    
    console.log(`Grid fallback generated ${cells.length} cells`);
    return cells;
  }

  /**
   * 随机打乱 Cell 的数字分配
   * @param {Array} cells Cell 数组
   */
  shuffleNumbers(cells) {
    const numbers = cells.map((_, index) => index + 1);
    
    // Fisher-Yates 洗牌算法
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // 分配打乱后的数字
    cells.forEach((cell, index) => {
      cell.number = numbers[index];
    });
  }

  /**
   * 记录生成错误
   * @param {number} attempt 尝试次数
   * @param {Error} error 错误对象
   * @param {Object} params 生成参数
   */
  logGenerationError(attempt, error, params) {
    const errorLog = {
      timestamp: Date.now(),
      attempt,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      params,
      seed: this.voronoiGenerator.currentSeed
    };
    
    console.error('Voronoi generation error:', errorLog);
    
    // 尝试上报错误
    try {
      if (typeof window !== 'undefined' && window.analyticsManager) {
        window.analyticsManager.trackEvent('voronoi_generation_error', {
          attempt,
          error_message: error.message,
          num_sites: params.numSites,
          canvas_size: `${params.width}x${params.height}`
        });
      }
    } catch (reportError) {
      console.error('Failed to report Voronoi error:', reportError);
    }
  }

  /**
   * 延迟函数
   * @param {number} ms 延迟毫秒数
   * @returns {Promise} Promise 对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取最后一次错误信息
   * @returns {Error|null} 错误对象
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * 获取重试次数
   * @returns {number} 重试次数
   */
  getRetryCount() {
    return this.retryCount;
  }

  /**
   * 重置错误状态
   */
  reset() {
    this.retryCount = 0;
    this.lastError = null;
  }

  /**
   * 设置最大重试次数
   * @param {number} maxRetries 最大重试次数
   */
  setMaxRetries(maxRetries) {
    this.maxRetries = Math.max(1, Math.min(10, maxRetries));
  }
}

export default VoronoiErrorHandler;