/**
 * 解锁系统
 * 负责管理自选模式的解锁状态和条件检查
 * 
 * 需求: 4.1, 4.6
 * - 管理自选模式解锁状态
 * - 检查解锁条件（完成第二关）
 * - 与云端数据存储集成
 */

class UnlockSystem {
  constructor(cloudStorage = null) {
    this.cloudStorage = cloudStorage;
    
    // 解锁状态
    this.unlockStates = {
      customMode: false
    };
    
    // 解锁条件配置
    this.unlockConditions = {
      customMode: {
        requiredLevel: 2,
        description: '完成第二关解锁自选模式'
      }
    };
  }

  /**
   * 检查自选模式是否已解锁
   * @returns {boolean} 是否已解锁
   */
  isCustomModeUnlocked() {
    return this.unlockStates.customMode;
  }

  /**
   * 解锁自选模式
   * @param {boolean} saveToCloud - 是否保存到云端
   * @returns {Promise<boolean>} 解锁是否成功
   */
  async unlockCustomMode(saveToCloud = true) {
    try {
      // 设置本地解锁状态
      this.unlockStates.customMode = true;
      
      console.log('自选模式已解锁');
      
      // 保存到云端（如果有云存储服务）
      if (saveToCloud && this.cloudStorage) {
        try {
          await this.cloudStorage.saveProgress({
            customModeUnlocked: true,
            unlockTime: Date.now()
          });
          console.log('解锁状态已保存到云端');
        } catch (error) {
          console.warn('保存解锁状态到云端失败，但本地解锁成功:', error);
          // 即使云端保存失败，本地解锁仍然有效
        }
      }
      
      return true;
    } catch (error) {
      console.error('解锁自选模式失败:', error);
      return false;
    }
  }

  /**
   * 检查解锁条件
   * @param {Object} gameProgress - 游戏进度数据
   * @param {Object} gameProgress.levelStates - 关卡状态
   * @returns {Object} 解锁条件检查结果
   */
  checkUnlockCondition(gameProgress) {
    const result = {
      customMode: {
        unlocked: false,
        canUnlock: false,
        condition: this.unlockConditions.customMode,
        reason: ''
      }
    };
    
    try {
      // 检查自选模式解锁条件
      const customModeCondition = this.unlockConditions.customMode;
      const requiredLevel = customModeCondition.requiredLevel;
      
      // 检查是否已经解锁
      if (this.unlockStates.customMode) {
        result.customMode.unlocked = true;
        result.customMode.canUnlock = false;
        result.customMode.reason = '已解锁';
        return result;
      }
      
      // 检查是否满足解锁条件
      // 支持两种数据格式：直接的 levelStates 或 LevelManager 的格式
      let levelStates = null;
      if (gameProgress) {
        if (gameProgress.levelStates) {
          // 直接的 levelStates 格式
          levelStates = gameProgress.levelStates;
        } else if (gameProgress.states) {
          // LevelManager 的格式
          levelStates = gameProgress.states;
        }
      }
      
      if (levelStates) {
        const levelState = levelStates[requiredLevel];
        
        if (levelState && levelState.completed) {
          result.customMode.unlocked = false;
          result.customMode.canUnlock = true;
          result.customMode.reason = '满足解锁条件，可以解锁';
        } else {
          result.customMode.unlocked = false;
          result.customMode.canUnlock = false;
          result.customMode.reason = `需要完成第${requiredLevel}关`;
        }
      } else {
        result.customMode.unlocked = false;
        result.customMode.canUnlock = false;
        result.customMode.reason = '游戏进度数据不可用';
      }
      
    } catch (error) {
      console.error('检查解锁条件时出错:', error);
      result.customMode.reason = '检查解锁条件时出错';
    }
    
    return result;
  }

  /**
   * 从云端或本地存储加载解锁状态
   * @param {Object} userData - 用户数据
   * @returns {boolean} 加载是否成功
   */
  loadUnlockStates(userData) {
    try {
      if (userData && typeof userData.customModeUnlocked === 'boolean') {
        this.unlockStates.customMode = userData.customModeUnlocked;
        console.log('解锁状态已加载:', this.unlockStates);
        return true;
      } else {
        console.log('未找到解锁状态数据，使用默认值');
        return false;
      }
    } catch (error) {
      console.error('加载解锁状态失败:', error);
      return false;
    }
  }

  /**
   * 重置所有解锁状态（用于测试或重置游戏）
   * @param {boolean} saveToCloud - 是否保存到云端
   * @returns {Promise<boolean>} 重置是否成功
   */
  async resetUnlockStates(saveToCloud = false) {
    try {
      this.unlockStates.customMode = false;
      
      console.log('解锁状态已重置');
      
      // 保存到云端（如果需要）
      if (saveToCloud && this.cloudStorage) {
        try {
          await this.cloudStorage.saveProgress({
            customModeUnlocked: false,
            resetTime: Date.now()
          });
          console.log('重置状态已保存到云端');
        } catch (error) {
          console.warn('保存重置状态到云端失败:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('重置解锁状态失败:', error);
      return false;
    }
  }

  /**
   * 获取所有解锁状态
   * @returns {Object} 解锁状态对象
   */
  getAllUnlockStates() {
    return {
      ...this.unlockStates
    };
  }

  /**
   * 获取解锁条件配置
   * @returns {Object} 解锁条件配置
   */
  getUnlockConditions() {
    return {
      ...this.unlockConditions
    };
  }

  /**
   * 设置云存储服务
   * @param {Object} cloudStorage - 云存储服务实例
   */
  setCloudStorage(cloudStorage) {
    this.cloudStorage = cloudStorage;
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.UnlockSystem = UnlockSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnlockSystem;
}