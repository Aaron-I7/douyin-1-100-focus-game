/**
 * load_progress 云函数集成测试
 * 测试与 save_progress 的配合使用
 */

// Mock dySDK
const mockDatabase = {
  collection: jest.fn()
};

const mockCollection = {
  where: jest.fn(),
  get: jest.fn(),
  add: jest.fn(),
  update: jest.fn()
};

jest.mock("@open-dy/node-server-sdk", () => ({
  dySDK: {
    database: () => mockDatabase
  }
}));

const loadProgress = require('../load_progress');
const saveProgress = require('../save_progress');

describe('load_progress 与 save_progress 集成测试', () => {
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase.collection.mockReturnValue(mockCollection);
    mockCollection.where.mockReturnValue(mockCollection);
    
    mockContext = {
      log: jest.fn()
    };
  });

  test('应该能够保存和加载完整的用户进度数据', async () => {
    const openId = 'integration_test_user';
    
    // 准备测试数据
    const progressData = {
      currentLevel: 2,
      level1Completed: true,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {
        level1: {
          time: 45,
          errors: 2,
          timestamp: 1234567890,
          level: 'level1',
          difficulty: 0
        }
      },
      totalGames: 5,
      totalErrors: 8
    };

    // Mock save_progress 成功
    mockCollection.update.mockResolvedValue({
      stats: { updated: 0 }
    });
    mockCollection.add.mockResolvedValue({
      _id: 'test_id_123'
    });

    // 1. 保存用户进度
    const saveResult = await saveProgress({ openId, progressData }, mockContext);
    expect(saveResult.success).toBe(true);

    // Mock load_progress 返回保存的数据
    const savedData = {
      openId,
      ...progressData,
      createdAt: Date.now(),
      updateTime: Date.now()
    };
    
    mockCollection.get.mockResolvedValue({
      data: [savedData]
    });

    // 2. 加载用户进度
    const loadResult = await loadProgress({ openId }, mockContext);
    
    expect(loadResult.success).toBe(true);
    expect(loadResult.data.openId).toBe(openId);
    expect(loadResult.data.currentLevel).toBe(progressData.currentLevel);
    expect(loadResult.data.level1Completed).toBe(progressData.level1Completed);
    expect(loadResult.data.level2Completed).toBe(progressData.level2Completed);
    expect(loadResult.data.customModeUnlocked).toBe(progressData.customModeUnlocked);
    expect(loadResult.data.bestScores).toEqual(progressData.bestScores);
    expect(loadResult.data.totalGames).toBe(progressData.totalGames);
    expect(loadResult.data.totalErrors).toBe(progressData.totalErrors);
    expect(loadResult.data.isNewUser).toBe(false);
  });

  test('应该为新用户提供正确的默认数据结构', async () => {
    const openId = 'new_integration_user';

    // Mock 新用户（数据库中没有记录）
    mockCollection.get.mockResolvedValue({
      data: []
    });

    const loadResult = await loadProgress({ openId }, mockContext);

    expect(loadResult.success).toBe(true);
    expect(loadResult.data).toEqual({
      openId,
      currentLevel: 1,
      level1Completed: false,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {},
      totalGames: 0,
      totalErrors: 0,
      createdAt: expect.any(Number),
      updateTime: expect.any(Number),
      isNewUser: true
    });

    // 验证默认数据可以被 save_progress 接受
    const progressData = {
      currentLevel: loadResult.data.currentLevel,
      level1Completed: loadResult.data.level1Completed,
      level2Completed: loadResult.data.level2Completed,
      customModeUnlocked: loadResult.data.customModeUnlocked,
      bestScores: loadResult.data.bestScores,
      totalGames: loadResult.data.totalGames,
      totalErrors: loadResult.data.totalErrors,
      createdAt: loadResult.data.createdAt
    };

    mockCollection.update.mockResolvedValue({
      stats: { updated: 0 }
    });
    mockCollection.add.mockResolvedValue({
      _id: 'new_user_id'
    });

    const saveResult = await saveProgress({ openId, progressData }, mockContext);
    expect(saveResult.success).toBe(true);
  });

  test('应该正确处理最佳成绩数据的往返', async () => {
    const openId = 'scores_test_user';
    
    const complexBestScores = {
      level1: {
        time: 30,
        errors: 0,
        timestamp: 1234567890,
        level: 'level1',
        difficulty: 0
      },
      level2: {
        time: 120,
        errors: 5,
        timestamp: 1234567900,
        level: 'level2',
        difficulty: 0
      },
      custom_10_free: {
        time: 25,
        errors: 1,
        timestamp: 1234567910,
        level: 'custom_10_free',
        difficulty: 0
      },
      custom_100_60: {
        time: 55,
        errors: 3,
        timestamp: 1234567920,
        level: 'custom_100_60',
        difficulty: 60
      }
    };

    const progressData = {
      currentLevel: 'custom',
      level1Completed: true,
      level2Completed: true,
      customModeUnlocked: true,
      bestScores: complexBestScores,
      totalGames: 20,
      totalErrors: 15
    };

    // Mock 保存成功
    mockCollection.update.mockResolvedValue({
      stats: { updated: 1 }
    });

    const saveResult = await saveProgress({ openId, progressData }, mockContext);
    expect(saveResult.success).toBe(true);

    // Mock 加载返回保存的数据
    mockCollection.get.mockResolvedValue({
      data: [{
        openId,
        ...progressData,
        createdAt: 1234567800,
        updateTime: Date.now()
      }]
    });

    const loadResult = await loadProgress({ openId }, mockContext);

    expect(loadResult.success).toBe(true);
    expect(loadResult.data.bestScores).toEqual(complexBestScores);
    expect(loadResult.data.currentLevel).toBe('custom');
    expect(loadResult.data.customModeUnlocked).toBe(true);
  });

  test('应该在数据库错误时提供一致的降级体验', async () => {
    const openId = 'error_test_user';

    // Mock 数据库错误
    mockCollection.get.mockRejectedValue(new Error('Database connection failed'));

    const loadResult = await loadProgress({ openId }, mockContext);

    // load_progress 应该返回默认数据
    expect(loadResult.success).toBe(true);
    expect(loadResult.data.isNewUser).toBe(true);
    expect(loadResult.data.openId).toBe(openId);

    // 默认数据应该可以被 save_progress 处理
    const progressData = {
      currentLevel: loadResult.data.currentLevel,
      level1Completed: loadResult.data.level1Completed,
      level2Completed: loadResult.data.level2Completed,
      customModeUnlocked: loadResult.data.customModeUnlocked,
      bestScores: loadResult.data.bestScores,
      totalGames: loadResult.data.totalGames,
      totalErrors: loadResult.data.totalErrors
    };

    // Mock save_progress 也失败
    mockCollection.update.mockRejectedValue(new Error('Save failed'));
    mockCollection.add.mockRejectedValue(new Error('Insert failed'));

    const saveResult = await saveProgress({ openId, progressData }, mockContext);
    
    // save_progress 应该返回错误，但不会崩溃
    expect(saveResult.success).toBe(false);
    expect(saveResult.message).toContain('保存用户进度失败');
  });
});