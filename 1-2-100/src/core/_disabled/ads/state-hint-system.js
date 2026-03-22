/**
 * HintSystem - 提示系统
 * 
 * 功能：
 * - 在游戏中添加"观看广告获得提示"按钮
 * - 观看完成后高亮显示目标数字 3 秒
 * - 限制每局最多 2 次提示
 * - 提供视觉提示效果（闪烁环、高亮等）
 */

class HintSystem {
  constructor(adManager, gameManager) {
    this.adManager = adManager;
    this.gameManager = gameManager;
    this.isHintActive = false;
    this.hintDuration = 3000; // 提示持续时间（毫秒）
    this.currentHintTimer = null;
    this.hintEffects = [];
  }
  
  /**
   * 检查是否可以使用提示
   * @param {Object} gameState - 游戏状态
   * @returns {Object} 检查结果
   */
  canUseHint(gameState) {
    // 检查游戏是否正在进行中
    if (gameState.state !== 'playing') {
      return {
        available: false,
        reason: '游戏未在进行中'
      };
    }
    
    // 检查是否已完成游戏
    if (gameState.currentNumber > gameState.totalNumbers) {
      return {
        available: false,
        reason: '游戏已完成'
      };
    }
    
    // 检查广告是否可用
    const adAvailability = this.adManager.checkAdAvailability('hint');
    if (!adAvailability.available) {
      return {
        available: false,
        reason: adAvailability.reason
      };
    }
    
    return {
      available: true,
      reason: null
    };
  }
  
  /**
   * 显示提示按钮
   * @param {Object} gameState - 游戏状态
   * @returns {Object} 提示按钮数据
   */
  getHintButtonData(gameState) {
    const availability = this.canUseHint(gameState);
    const remainingUses = this.adManager.getRemainingUses('hint');
    
    return {
      visible: gameState.state === 'playing',
      enabled: availability.available,
      text: `提示 (${remainingUses})`,
      tooltip: availability.available 
        ? `观看广告获得提示，剩余 ${remainingUses} 次`
        : availability.reason,
      remainingUses: remainingUses,
      isHintActive: this.isHintActive
    };
  }
  
  /**
   * 使用提示功能
   * @param {Object} gameState - 游戏状态
   * @param {Function} onHintSuccess - 提示成功回调
   * @param {Function} onHintFail - 提示失败回调
   */
  async useHint(gameState, onHintSuccess, onHintFail) {
    // 检查是否可以使用提示
    const availability = this.canUseHint(gameState);
    if (!availability.available) {
      if (onHintFail) onHintFail(availability.reason);
      return;
    }
    
    if (this.isHintActive) {
      if (onHintFail) onHintFail('提示正在使用中');
      return;
    }
    
    this.isHintActive = true;
    
    try {
      // 显示激励视频广告
      const success = await this.adManager.showRewardedAd(
        'hint',
        () => this.handleHintSuccess(gameState, onHintSuccess),
        (reason) => this.handleHintFail(reason, onHintFail)
      );
      
      if (!success) {
        this.isHintActive = false;
        if (onHintFail) onHintFail('广告播放失败');
      }
      
    } catch (error) {
      console.error('Hint failed:', error);
      this.isHintActive = false;
      if (onHintFail) onHintFail('提示过程出错');
    }
  }
  
  /**
   * 处理提示成功
   * @param {Object} gameState - 游戏状态
   * @param {Function} onHintSuccess - 提示成功回调
   */
  handleHintSuccess(gameState, onHintSuccess) {
    console.log('Hint successful, showing target highlight');
    
    // 找到目标数字的 Cell
    const targetCell = this.findTargetCell(gameState);
    
    if (targetCell) {
      // 开始高亮提示效果
      this.startHintEffect(targetCell, gameState.currentNumber);
      
      // 创建提示结果数据
      const hintResult = {
        success: true,
        targetCell: targetCell,
        targetNumber: gameState.currentNumber,
        duration: this.hintDuration,
        message: `找到数字 ${gameState.currentNumber} 了！`
      };
      
      // 调用提示成功回调
      if (onHintSuccess) {
        onHintSuccess(hintResult);
      }
      
      // 设置定时器结束提示效果
      this.currentHintTimer = setTimeout(() => {
        this.endHintEffect();
      }, this.hintDuration);
      
    } else {
      console.error('Target cell not found');
      this.isHintActive = false;
      if (onHintSuccess) {
        onHintSuccess({
          success: false,
          message: '未找到目标数字'
        });
      }
    }
    
    // 记录提示事件
    this.trackHintEvent('success', {
      targetNumber: gameState.currentNumber,
      remainingUses: this.adManager.getRemainingUses('hint')
    });
  }
  
  /**
   * 处理提示失败
   * @param {string} reason - 失败原因
   * @param {Function} onHintFail - 提示失败回调
   */
  handleHintFail(reason, onHintFail) {
    console.log('Hint failed:', reason);
    
    this.isHintActive = false;
    
    // 创建失败结果数据
    const failResult = {
      success: false,
      reason: reason,
      message: `提示失败：${reason}`
    };
    
    // 调用提示失败回调
    if (onHintFail) {
      onHintFail(failResult);
    }
    
    // 记录提示事件
    this.trackHintEvent('failed', {
      reason: reason,
      remainingUses: this.adManager.getRemainingUses('hint')
    });
  }
  
  /**
   * 查找目标数字的 Cell
   * @param {Object} gameState - 游戏状态
   * @returns {Object|null} 目标 Cell
   */
  findTargetCell(gameState) {
    if (!gameState.cells || !Array.isArray(gameState.cells)) {
      return null;
    }
    
    return gameState.cells.find(cell => 
      cell.number === gameState.currentNumber && !cell.done
    );
  }
  
  /**
   * 开始提示效果
   * @param {Object} targetCell - 目标 Cell
   * @param {number} targetNumber - 目标数字
   */
  startHintEffect(targetCell, targetNumber) {
    // 清除之前的提示效果
    this.clearHintEffects();
    
    // 创建闪烁环效果
    const pulseEffect = {
      type: 'pulse',
      x: targetCell.site.x,
      y: targetCell.site.y,
      radius: 50,
      color: '#FFE66D',
      startTime: Date.now(),
      duration: this.hintDuration
    };
    
    // 创建高亮背景效果
    const highlightEffect = {
      type: 'highlight',
      cell: targetCell,
      color: 'rgba(255, 230, 109, 0.3)',
      startTime: Date.now(),
      duration: this.hintDuration
    };
    
    // 创建浮动文字效果
    const textEffect = {
      type: 'floatingText',
      x: targetCell.site.x,
      y: targetCell.site.y - 60,
      text: `这里是 ${targetNumber}`,
      color: '#FF6B6B',
      fontSize: 18,
      startTime: Date.now(),
      duration: this.hintDuration
    };
    
    this.hintEffects = [pulseEffect, highlightEffect, textEffect];
    
    console.log(`Hint effect started for number ${targetNumber}`);
  }
  
  /**
   * 结束提示效果
   */
  endHintEffect() {
    this.clearHintEffects();
    this.isHintActive = false;
    
    if (this.currentHintTimer) {
      clearTimeout(this.currentHintTimer);
      this.currentHintTimer = null;
    }
    
    console.log('Hint effect ended');
  }
  
  /**
   * 清除所有提示效果
   */
  clearHintEffects() {
    this.hintEffects = [];
  }
  
  /**
   * 更新提示效果动画
   * @param {number} currentTime - 当前时间戳
   * @returns {Array} 当前活跃的提示效果
   */
  updateHintEffects(currentTime) {
    if (!this.isHintActive || this.hintEffects.length === 0) {
      return [];
    }
    
    // 过滤掉已过期的效果
    this.hintEffects = this.hintEffects.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      return elapsed < effect.duration;
    });
    
    // 如果所有效果都过期了，结束提示
    if (this.hintEffects.length === 0) {
      this.endHintEffect();
    }
    
    return this.hintEffects;
  }
  
  /**
   * 渲染提示效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} currentTime - 当前时间戳
   */
  renderHintEffects(ctx, currentTime) {
    const activeEffects = this.updateHintEffects(currentTime);
    
    activeEffects.forEach(effect => {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      
      ctx.save();
      
      switch (effect.type) {
        case 'pulse':
          this.renderPulseEffect(ctx, effect, progress);
          break;
        case 'highlight':
          this.renderHighlightEffect(ctx, effect, progress);
          break;
        case 'floatingText':
          this.renderFloatingTextEffect(ctx, effect, progress);
          break;
      }
      
      ctx.restore();
    });
  }
  
  /**
   * 渲染脉冲效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Object} effect - 效果对象
   * @param {number} progress - 进度 (0-1)
   */
  renderPulseEffect(ctx, effect, progress) {
    const pulseScale = 1 + Math.sin(progress * Math.PI * 6) * 0.3;
    const opacity = 1 - progress * 0.5;
    
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * pulseScale, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  /**
   * 渲染高亮效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Object} effect - 效果对象
   * @param {number} progress - 进度 (0-1)
   */
  renderHighlightEffect(ctx, effect, progress) {
    const opacity = (1 - progress) * 0.6;
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = effect.color;
    
    // 绘制 Cell 的高亮背景
    if (effect.cell && effect.cell.polygon) {
      ctx.beginPath();
      effect.cell.polygon.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.fill();
    }
  }
  
  /**
   * 渲染浮动文字效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Object} effect - 效果对象
   * @param {number} progress - 进度 (0-1)
   */
  renderFloatingTextEffect(ctx, effect, progress) {
    const y = effect.y - progress * 20;
    const opacity = 1 - progress;
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = effect.color;
    ctx.font = `bold ${effect.fontSize}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(effect.text, effect.x, y);
  }
  
  /**
   * 获取提示状态信息
   * @returns {Object} 提示状态
   */
  getHintStatus() {
    return {
      isHintActive: this.isHintActive,
      hintDuration: this.hintDuration,
      remainingUses: this.adManager.getRemainingUses('hint'),
      adAvailable: this.adManager.checkAdAvailability('hint').available,
      activeEffects: this.hintEffects.length
    };
  }
  
  /**
   * 记录提示事件（用于数据分析）
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  trackHintEvent(eventType, eventData) {
    try {
      // 如果有分析管理器，记录事件
      if (this.gameManager && this.gameManager.analyticsManager) {
        this.gameManager.analyticsManager.trackEvent('hint', {
          type: eventType,
          ...eventData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to track hint event:', error);
    }
  }
  
  /**
   * 重置提示系统（新游戏开始时调用）
   */
  reset() {
    this.endHintEffect();
    console.log('Hint system reset');
  }
}

// 导出 HintSystem 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HintSystem;
} else if (typeof window !== 'undefined') {
  window.HintSystem = HintSystem;
}