/**
 * 关卡管理器
 * 负责关卡配置、状态管理和进度跟踪
 */

class LevelManager {
  constructor(unlockSystem = null) {
    // 解锁系统实例
    this.unlockSystem = unlockSystem;
    // 关卡配置
    this.levels = {
      1: {
        id: 1,
        name: '第一关',
        description: '热身练习：1-10',
        cellCount: 10,
        numberRange: { min: 1, max: 10 },
        unlocked: true,
        completed: false
      },
      2: {
        id: 2,
        name: '第二关',
        description: '终极挑战：1-100',
        cellCount: 100,
        numberRange: { min: 1, max: 100 },
        unlocked: false,
        completed: false
      }
    };
    
    // 当前关卡
    this.currentLevel = 1;
    
    // 关卡状态
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  /**
   * 获取当前关卡配置
   */
  getCurrentLevelConfig() {
    const config = this.levels[this.currentLevel];
    if (!config) return config;
    return {
      ...config,
      numbers: config.cellCount,
      range: [config.numberRange.min, config.numberRange.max]
    };
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  /**
   * 获取指定关卡配置
   */
  getLevelConfig(levelId) {
    const config = this.levels[levelId];
    if (!config) return config;
    return {
      ...config,
      numbers: config.cellCount,
      range: [config.numberRange.min, config.numberRange.max]
    };
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(levelId) {
    if (this.levels[levelId] && this.levels[levelId].unlocked) {
      this.currentLevel = levelId;
      return true;
    }
    return false;
  }

  /**
   * 检查关卡是否解锁
   */
  isLevelUnlocked(levelId) {
    return this.levels[levelId] && this.levels[levelId].unlocked;
  }

  /**
   * 检查关卡是否完成
   */
  isLevelCompleted(levelId) {
    return this.levelStates[levelId] && this.levelStates[levelId].completed;
  }

  /**
   * 完成关卡
   */
  async completeLevel(levelId, stats) {
    if (!this.levels[levelId]) return false;

    const levelState = this.levelStates[levelId];
    
    // 标记为完成
    levelState.completed = true;
    this.levels[levelId].completed = true;

    // 更新最佳成绩
    if (levelState.bestTime === null || stats.time < levelState.bestTime) {
      levelState.bestTime = stats.time;
    }
    
    if (levelState.bestErrors === null || stats.errors < levelState.bestErrors) {
      levelState.bestErrors = stats.errors;
    }

    // 解锁下一关
    const nextLevelId = levelId + 1;
    if (this.levels[nextLevelId]) {
      this.levels[nextLevelId].unlocked = true;
    }

    // 集成解锁系统：完成第二关时解锁自选模式
    if (levelId === 2 && this.unlockSystem) {
      try {
        console.log('Level 2 completed, attempting to unlock custom mode...');
        const unlockResult = await this.unlockSystem.unlockCustomMode();
        if (unlockResult) {
          console.log('Custom mode unlocked successfully!');
        } else {
          console.warn('Failed to unlock custom mode');
        }
      } catch (error) {
        console.error('Error unlocking custom mode:', error);
      }
    }

    console.log(`Level ${levelId} completed!`, {
      stats,
      bestTime: levelState.bestTime,
      bestErrors: levelState.bestErrors
    });

    return true;
  }

  /**
   * 获取关卡状态
   */
  getLevelState(levelId) {
    return this.levelStates[levelId];
  }

  /**
   * 获取所有关卡状态
   */
  getAllLevelStates() {
    return {
      levels: this.levels,
      states: this.levelStates,
      currentLevel: this.currentLevel
    };
  }

  /**
   * 重置关卡进度（用于测试）
   */
  resetProgress() {
    this.currentLevel = 1;
    
    // 重置关卡解锁状态
    this.levels[1].unlocked = true;
    this.levels[1].completed = false;
    this.levels[2].unlocked = false;
    this.levels[2].completed = false;
    
    // 重置关卡状态
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  /**
   * 获取下一个未完成的关卡
   */
  getNextUncompletedLevel() {
    for (let levelId = 1; levelId <= 2; levelId++) {
      if (this.levels[levelId].unlocked && !this.levelStates[levelId].completed) {
        return levelId;
      }
    }
    return null; // 所有关卡都已完成
  }

  /**
   * 检查是否所有关卡都已完成
   */
  areAllLevelsCompleted() {
    return this.levelStates[1].completed && this.levelStates[2].completed;
  }

  /**
   * 设置解锁系统
   */
  setUnlockSystem(unlockSystem) {
    this.unlockSystem = unlockSystem;
  }

  /**
   * 检查自选模式是否已解锁（用于主菜单显示）
   */
  isCustomModeUnlocked() {
    if (!this.unlockSystem) {
      return false;
    }
    return this.unlockSystem.isCustomModeUnlocked();
  }

  /**
   * 检查是否可以解锁自选模式
   */
  canUnlockCustomMode() {
    if (!this.unlockSystem) {
      return false;
    }
    
    const gameProgress = this.getAllLevelStates();
    const unlockCheck = this.unlockSystem.checkUnlockCondition(gameProgress);
    return unlockCheck.customMode.canUnlock;
  }

  /**
   * 获取解锁状态信息（用于UI显示）
   */
  getUnlockStatus() {
    if (!this.unlockSystem) {
      return {
        customModeUnlocked: false,
        canUnlockCustomMode: false,
        unlockReason: '解锁系统未初始化'
      };
    }
    
    const gameProgress = this.getAllLevelStates();
    const unlockCheck = this.unlockSystem.checkUnlockCondition(gameProgress);
    
    return {
      customModeUnlocked: this.unlockSystem.isCustomModeUnlocked(),
      canUnlockCustomMode: unlockCheck.customMode.canUnlock,
      unlockReason: unlockCheck.customMode.reason
    };
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.LevelManager = LevelManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelManager;
}
