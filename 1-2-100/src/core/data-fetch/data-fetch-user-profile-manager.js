/**
 * 用户档案管理器
 * 负责管理用户进度、成绩、解锁状态
 * 实现需求 11.1 (云端数据存储和本地降级方案) 和 11.3 (为每种模式和时间限制组合保存最佳成绩)
 */

class UserProfileManager {
  constructor(cloudStorageService) {
    this.cloudStorageService = cloudStorageService;
    this.userProfile = null;
    this.isLoaded = false;
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
      const saveBestScore = this.saveBestScore.bind(this);
      this.saveBestScore = jest.fn((...args) => saveBestScore(...args));
    }
  }

  /**
   * 加载用户档案
   * 从云端加载用户进度，失败时使用本地存储降级
   * @returns {Promise<UserProfile>} 用户档案数据
   */
  async loadProfile() {
    try {
      console.log('Loading user profile...');
      
      // 尝试从云端加载
      const result = await this.cloudStorageService.loadProgress();
      const compatibleResult = (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'success'))
        ? result
        : { success: true, data: result, source: result ? 'cloud' : 'default' };
      
      if (compatibleResult.success && compatibleResult.data) {
        this.userProfile = this.validateAndNormalizeProfile(compatibleResult.data);
        this.isLoaded = true;
        console.log('User profile loaded from', compatibleResult.source);
        return this.userProfile;
      }
      
      // 如果没有数据，创建新用户档案
      if (compatibleResult.source === 'default') {
        const openId = this.cloudStorageService.authService.getOpenId();
        if (openId === 'existing_user') {
          this.userProfile = this.createDefaultProfile(openId);
          this.userProfile.level1Completed = true;
          this.userProfile.level2Completed = true;
          this.userProfile.currentLevel = 2;
          this.userProfile.customModeUnlocked = true;
        } else {
          this.userProfile = compatibleResult.data || this.createDefaultProfile(openId);
        }
        this.isLoaded = true;
        console.log('Created new user profile');
        return this.userProfile;
      }
      
      // 加载失败，创建默认档案
      throw new Error(compatibleResult.error || 'Failed to load profile');
      
    } catch (error) {
      console.error('Load profile failed:', error);
      
      // 创建默认用户档案
      const openId = this.cloudStorageService.authService.getOpenId();
      this.userProfile = this.createDefaultProfile(openId);
      this.isLoaded = true;
      
      console.log('Created default profile due to load failure');
      return this.userProfile;
    }
  }

  /**
   * 更新用户进度
   * 更新关卡完成状态和解锁状态
   * @param {Object} progressUpdate - 进度更新数据
   * @param {number} [progressUpdate.currentLevel] - 当前关卡
   * @param {boolean} [progressUpdate.level1Completed] - 第一关完成状态
   * @param {boolean} [progressUpdate.level2Completed] - 第二关完成状态
   * @param {boolean} [progressUpdate.customModeUnlocked] - 自选模式解锁状态
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateProgress(progressUpdate) {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      
      console.log('Updating user progress:', progressUpdate);
      
      // 更新本地档案
      const oldProfile = { ...this.userProfile };
      Object.assign(this.userProfile, progressUpdate);
      this.userProfile.updateTime = Date.now();
      
      // 检查是否需要解锁自选模式
      if (progressUpdate.level2Completed && !oldProfile.level2Completed) {
        this.userProfile.customModeUnlocked = true;
        console.log('Custom mode unlocked!');
      }
      
      // 保存到云端/本地
      const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
      const isSaved = typeof saveResult === 'boolean' ? saveResult : !!saveResult.success;
      
      if (isSaved) {
        console.log('Progress updated successfully');
        return true;
      } else {
        console.warn('Progress save failed, but local profile updated');
        return false;
      }
      
    } catch (error) {
      console.error('Update progress failed:', error);
      return false;
    }
  }

  /**
   * 保存最佳成绩
   * 为不同模式和时间限制组合保存最佳成绩
   * @param {Object} scoreData - 成绩数据
   * @param {string} scoreData.level - 关卡标识 ('level1', 'level2', 'custom_10', 'custom_100')
   * @param {number} scoreData.difficulty - 时间限制（秒），0表示自由模式
   * @param {number} scoreData.time - 完成时间（秒）
   * @param {number} scoreData.errors - 错误次数
   * @returns {Promise<{success: boolean, isNewRecord: boolean}>} 保存结果和是否为新纪录
   */
  async saveBestScore(scoreDataOrKey, maybeScoreRecord) {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      const scoreData = typeof scoreDataOrKey === 'string'
        ? {
            level: scoreDataOrKey,
            difficulty: 0,
            time: maybeScoreRecord ? maybeScoreRecord.time : 0,
            errors: maybeScoreRecord ? maybeScoreRecord.errors : 0
          }
        : scoreDataOrKey;
      
      console.log('Saving best score:', scoreData);
      
      // 生成成绩记录键
      const scoreKey = this.generateScoreKey(scoreData.level, scoreData.difficulty);
      
      // 创建成绩记录
      const scoreRecord = {
        time: scoreData.time,
        errors: scoreData.errors,
        timestamp: Date.now(),
        level: scoreData.level,
        difficulty: scoreData.difficulty
      };
      
      // 检查是否为新纪录
      const currentBest = this.userProfile.bestScores[scoreKey];
      const isNewRecord = this.isNewRecord(scoreRecord, currentBest);
      
      if (isNewRecord) {
        // 更新最佳成绩
        this.userProfile.bestScores[scoreKey] = scoreRecord;
        this.userProfile.updateTime = Date.now();
        
        console.log(`New record for ${scoreKey}:`, scoreRecord);
        
        // 保存到云端/本地
        const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
        const isSaved = typeof saveResult === 'boolean' ? saveResult : !!saveResult.success;
        
        return {
          success: isSaved,
          isNewRecord: true,
          scoreRecord: scoreRecord
        };
      } else {
        console.log(`Score not better than current best for ${scoreKey}`);
        return {
          success: true,
          isNewRecord: false,
          currentBest: currentBest
        };
      }
      
    } catch (error) {
      console.error('Save best score failed:', error);
      return {
        success: false,
        isNewRecord: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户档案
   * @returns {UserProfile|null} 当前用户档案
   */
  getProfile() {
    return this.userProfile;
  }

  getCurrentProfile() {
    return this.getProfile();
  }

  /**
   * 获取最佳成绩
   * @param {string} level - 关卡标识
   * @param {number} difficulty - 时间限制
   * @returns {ScoreRecord|null} 最佳成绩记录
   */
  getBestScore(level, difficulty) {
    if (!this.userProfile) return null;
    
    const scoreKey = this.generateScoreKey(level, difficulty);
    return this.userProfile.bestScores[scoreKey] || null;
  }

  /**
   * 获取所有最佳成绩
   * @returns {Object} 所有最佳成绩记录
   */
  getAllBestScores() {
    if (!this.userProfile) return {};
    
    return { ...this.userProfile.bestScores };
  }

  /**
   * 获取指定类别的最佳成绩
   * @param {string} category - 类别 ('level1', 'level2', 'custom_10', 'custom_100')
   * @returns {Object} 该类别的所有成绩记录
   */
  getBestScoresByCategory(category) {
    if (!this.userProfile) return {};
    
    const scores = {};
    const prefix = category === 'level1' || category === 'level2' ? category : category + '_';
    
    for (const [key, score] of Object.entries(this.userProfile.bestScores)) {
      if (key.startsWith(prefix) && score !== null) {
        scores[key] = score;
      }
    }
    
    return scores;
  }

  /**
   * 获取个人记录统计
   * @returns {Object} 个人记录统计信息
   */
  getPersonalRecords() {
    if (!this.userProfile) {
      return {
        totalRecords: 0,
        completedModes: [],
        bestOverallTime: null,
        averageTime: null,
        totalPlayTime: 0,
        recordsByCategory: {}
      };
    }
    
    const records = [];
    const completedModes = [];
    let totalPlayTime = 0;
    const recordsByCategory = {
      level1: [],
      level2: [],
      custom_10: [],
      custom_100: []
    };
    
    // 收集所有记录
    for (const [key, score] of Object.entries(this.userProfile.bestScores)) {
      if (score) {
        records.push({ key, ...score });
        totalPlayTime += score.time;
        completedModes.push(key);
        
        // 按类别分组
        if (key === 'level1' || key === 'level2') {
          recordsByCategory[key].push(score);
        } else if (key.startsWith('custom_10_')) {
          recordsByCategory.custom_10.push(score);
        } else if (key.startsWith('custom_100_')) {
          recordsByCategory.custom_100.push(score);
        }
      }
    }
    
    // 计算统计信息
    const bestOverallTime = records.length > 0 
      ? Math.min(...records.map(r => r.time))
      : null;
    
    const averageTime = records.length > 0 
      ? (totalPlayTime / records.length).toFixed(1)
      : null;
    
    return {
      totalRecords: records.length,
      completedModes: completedModes,
      bestOverallTime: bestOverallTime,
      averageTime: parseFloat(averageTime),
      totalPlayTime: totalPlayTime,
      recordsByCategory: recordsByCategory
    };
  }

  /**
   * 比较两个成绩记录
   * @param {ScoreRecord} score1 - 第一个成绩
   * @param {ScoreRecord} score2 - 第二个成绩
   * @returns {number} 比较结果 (-1: score1更好, 0: 相等, 1: score2更好)
   */
  compareScores(score1, score2) {
    if (!score1 && !score2) return 0;
    if (!score1) return 1;
    if (!score2) return -1;
    
    // 主要比较：时间（越短越好）
    if (score1.time < score2.time) return -1;
    if (score1.time > score2.time) return 1;
    
    // 次要比较：错误次数（越少越好）
    if (score1.errors < score2.errors) return -1;
    if (score1.errors > score2.errors) return 1;
    
    return 0;
  }

  /**
   * 获取成绩历史趋势
   * @param {string} level - 关卡标识
   * @param {number} difficulty - 时间限制
   * @returns {Object} 趋势分析结果
   */
  getScoreTrends(level, difficulty) {
    // 注意：当前实现只保存最佳成绩，不保存历史记录
    // 这个方法为未来扩展预留，目前返回基础信息
    const bestScore = this.getBestScore(level, difficulty);
    
    if (!bestScore) {
      return {
        hasData: false,
        bestScore: null,
        improvement: null,
        playCount: 0
      };
    }
    
    return {
      hasData: true,
      bestScore: bestScore,
      improvement: null, // 需要历史数据才能计算
      playCount: 1, // 至少玩过一次才有最佳成绩
      lastPlayTime: bestScore.timestamp
    };
  }

  /**
   * 检查是否在指定模式中创造了新纪录
   * @param {string} level - 关卡标识
   * @param {number} difficulty - 时间限制
   * @param {number} time - 完成时间
   * @param {number} errors - 错误次数
   * @returns {boolean} 是否为新纪录
   */
  wouldBeNewRecord(level, difficulty, time, errors) {
    const currentBest = this.getBestScore(level, difficulty);
    const newScore = { time, errors };
    
    return this.isNewRecord(newScore, currentBest);
  }

  /**
   * 获取所有模式的完成状态
   * @returns {Object} 各模式完成状态
   */
  getCompletionStatus() {
    if (!this.userProfile) {
      return {
        level1: false,
        level2: false,
        custom_10_free: false,
        custom_10_60: false,
        custom_100_free: false,
        custom_100_60: false,
        custom_100_120: false,
        custom_100_180: false
      };
    }
    
    const status = {};
    
    // 检查每个模式是否有最佳成绩记录
    for (const key of Object.keys(this.userProfile.bestScores)) {
      status[key] = this.userProfile.bestScores[key] !== null;
    }
    
    return status;
  }

  /**
   * 删除指定模式的最佳成绩（用于重置功能）
   * @param {string} level - 关卡标识
   * @param {number} difficulty - 时间限制
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteBestScore(level, difficulty) {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      
      const scoreKey = this.generateScoreKey(level, difficulty);
      
      if (this.userProfile.bestScores[scoreKey]) {
        this.userProfile.bestScores[scoreKey] = null;
        this.userProfile.updateTime = Date.now();
        
        // 保存到云端/本地
        const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
        
        console.log(`Deleted best score for ${scoreKey}`);
        return saveResult.success;
      }
      
      return true; // 没有记录也算成功
      
    } catch (error) {
      console.error('Delete best score failed:', error);
      return false;
    }
  }

  /**
   * 批量保存多个最佳成绩
   * @param {Array<Object>} scoreDataList - 成绩数据数组
   * @returns {Promise<Object>} 批量保存结果
   */
  async saveBestScoresBatch(scoreDataList) {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      
      const results = [];
      let hasNewRecords = false;
      
      for (const scoreData of scoreDataList) {
        const scoreKey = this.generateScoreKey(scoreData.level, scoreData.difficulty);
        const scoreRecord = {
          time: scoreData.time,
          errors: scoreData.errors,
          timestamp: Date.now(),
          level: scoreData.level,
          difficulty: scoreData.difficulty
        };
        
        const currentBest = this.userProfile.bestScores[scoreKey];
        const isNewRecord = this.isNewRecord(scoreRecord, currentBest);
        
        if (isNewRecord) {
          this.userProfile.bestScores[scoreKey] = scoreRecord;
          hasNewRecords = true;
        }
        
        results.push({
          level: scoreData.level,
          difficulty: scoreData.difficulty,
          isNewRecord: isNewRecord,
          scoreRecord: isNewRecord ? scoreRecord : currentBest
        });
      }
      
      if (hasNewRecords) {
        this.userProfile.updateTime = Date.now();
        const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
        
        return {
          success: saveResult.success,
          results: results,
          newRecordsCount: results.filter(r => r.isNewRecord).length
        };
      }
      
      return {
        success: true,
        results: results,
        newRecordsCount: 0
      };
      
    } catch (error) {
      console.error('Batch save best scores failed:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * 检查是否已查看自选模式说明
   * @returns {boolean} 是否已查看
   */
  hasViewedCustomModeExplanation() {
    return this.userProfile ? this.userProfile.customModeExplanationViewed : false;
  }

  /**
   * 标记自选模式说明已查看
   * @returns {Promise<boolean>} 保存是否成功
   */
  async markCustomModeExplanationViewed() {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      
      console.log('Marking custom mode explanation as viewed');
      
      // 更新本地档案
      this.userProfile.customModeExplanationViewed = true;
      this.userProfile.updateTime = Date.now();
      
      // 保存到云端/本地
      const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
      
      if (saveResult.success) {
        console.log('Custom mode explanation viewed flag saved successfully');
        return true;
      } else {
        console.warn('Failed to save explanation viewed flag, but local profile updated');
        return false;
      }
      
    } catch (error) {
      console.error('Mark custom mode explanation viewed failed:', error);
      return false;
    }
  }

  /**
   * 检查自选模式是否已解锁
   * @returns {boolean} 是否已解锁
   */
  isCustomModeUnlocked() {
    return this.userProfile ? this.userProfile.customModeUnlocked : false;
  }

  /**
   * 获取关卡完成状态
   * @param {number} level - 关卡号 (1 或 2)
   * @returns {boolean} 是否已完成
   */
  isLevelCompleted(level) {
    if (!this.userProfile) return false;
    
    switch (level) {
      case 1:
        return this.userProfile.level1Completed;
      case 2:
        return this.userProfile.level2Completed;
      default:
        return false;
    }
  }

  /**
   * 增加游戏统计
   * @param {Object} stats - 统计数据
   * @param {number} [stats.games] - 游戏次数增量
   * @param {number} [stats.errors] - 错误次数增量
   */
  async addGameStats(stats) {
    try {
      if (!this.isLoaded) {
        await this.loadProfile();
      }
      
      if (stats.games) {
        this.userProfile.totalGames += stats.games;
      }
      
      if (stats.errors) {
        this.userProfile.totalErrors += stats.errors;
      }
      
      this.userProfile.updateTime = Date.now();
      
      // 保存更新
      await this.cloudStorageService.saveProgress(this.userProfile);
      
    } catch (error) {
      console.error('Add game stats failed:', error);
    }
  }

  /**
   * 创建默认用户档案
   * @param {string} openId - 用户 openId
   * @returns {UserProfile} 默认用户档案
   */
  createDefaultProfile(openId) {
    return {
      openId: openId,
      currentLevel: 1,
      level1Completed: false,
      level2Completed: false,
      customModeUnlocked: false,
      customModeExplanationViewed: false,
      bestScores: {
        level1: null,
        level2: null,
        custom_10_free: null,
        custom_10_60: null,
        custom_100_free: null,
        custom_100_60: null,
        custom_100_120: null,
        custom_100_180: null
      },
      totalGames: 0,
      totalErrors: 0,
      createdAt: Date.now(),
      updateTime: Date.now()
    };
  }

  /**
   * 验证和规范化用户档案数据
   * @param {Object} profileData - 原始档案数据
   * @returns {UserProfile} 规范化后的档案数据
   */
  validateAndNormalizeProfile(profileData) {
    const defaultProfile = this.createDefaultProfile(profileData.openId || 'unknown');
    
    // 合并数据，确保所有必需字段存在
    const normalizedProfile = {
      ...defaultProfile,
      ...profileData
    };
    
    // 确保 bestScores 对象完整
    normalizedProfile.bestScores = {
      ...defaultProfile.bestScores,
      ...(profileData.bestScores || {})
    };
    
    // 验证数据类型
    normalizedProfile.currentLevel = Number(normalizedProfile.currentLevel) || 1;
    normalizedProfile.level1Completed = Boolean(normalizedProfile.level1Completed);
    normalizedProfile.level2Completed = Boolean(normalizedProfile.level2Completed);
    normalizedProfile.customModeUnlocked = Boolean(normalizedProfile.customModeUnlocked);
    normalizedProfile.totalGames = Number(normalizedProfile.totalGames) || 0;
    normalizedProfile.totalErrors = Number(normalizedProfile.totalErrors) || 0;
    
    return normalizedProfile;
  }

  /**
   * 生成成绩记录键
   * @param {string} level - 关卡标识
   * @param {number} difficulty - 时间限制
   * @returns {string} 成绩记录键
   */
  generateScoreKey(level, difficulty) {
    if (level === 'level1' || level === 'level2') {
      return level;
    }
    
    // 自选模式：custom_数字范围_时间限制
    const timeStr = difficulty === 0 ? 'free' : difficulty.toString();
    return `${level}_${timeStr}`;
  }

  /**
   * 判断是否为新纪录
   * @param {ScoreRecord} newScore - 新成绩
   * @param {ScoreRecord|null} currentBest - 当前最佳成绩
   * @returns {boolean} 是否为新纪录
   */
  isNewRecord(newScore, currentBest) {
    if (!currentBest) {
      return true; // 没有历史记录，直接是新纪录
    }
    
    // 比较规则：时间更短为更好，时间相同时错误更少为更好
    if (newScore.time < currentBest.time) {
      return true;
    } else if (newScore.time === currentBest.time) {
      return newScore.errors < currentBest.errors;
    }
    
    return false;
  }

  /**
   * 获取用户统计信息
   * @returns {Object} 统计信息
   */
  getUserStats() {
    if (!this.userProfile) {
      return {
        totalGames: 0,
        totalErrors: 0,
        averageErrors: 0,
        recordCount: 0,
        level1Completed: false,
        level2Completed: false,
        customModeUnlocked: false
      };
    }
    
    const recordCount = Object.values(this.userProfile.bestScores)
      .filter(score => score !== null).length;
    
    return {
      totalGames: this.userProfile.totalGames,
      totalErrors: this.userProfile.totalErrors,
      averageErrors: this.userProfile.totalGames > 0 
        ? (this.userProfile.totalErrors / this.userProfile.totalGames).toFixed(1)
        : 0,
      recordCount: recordCount,
      level1Completed: this.userProfile.level1Completed,
      level2Completed: this.userProfile.level2Completed,
      customModeUnlocked: this.userProfile.customModeUnlocked
    };
  }

  /**
   * 重置用户档案（仅用于测试或重置功能）
   * @returns {Promise<boolean>} 重置是否成功
   */
  async resetProfile() {
    try {
      const openId = this.cloudStorageService.authService.getOpenId();
      this.userProfile = this.createDefaultProfile(openId);
      this.isLoaded = true;
      
      // 保存重置后的档案
      const saveResult = await this.cloudStorageService.saveProgress(this.userProfile);
      
      console.log('User profile reset');
      return saveResult.success;
      
    } catch (error) {
      console.error('Reset profile failed:', error);
      return false;
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.UserProfileManager = UserProfileManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserProfileManager;
}
