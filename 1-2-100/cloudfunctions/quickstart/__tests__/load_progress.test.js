/**
 * load_progress 云函数单元测试
 */

// Mock dySDK
const mockDatabase = {
  collection: jest.fn()
};

const mockCollection = {
  where: jest.fn(),
  get: jest.fn()
};

jest.mock("@open-dy/node-server-sdk", () => ({
  dySDK: {
    database: () => mockDatabase
  }
}));

const loadProgress = require('../load_progress');

describe('load_progress 云函数测试', () => {
  let mockContext;

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
    
    // 设置默认的 mock 行为
    mockDatabase.collection.mockReturnValue(mockCollection);
    mockCollection.where.mockReturnValue(mockCollection);
    
    // Mock context
    mockContext = {
      log: jest.fn()
    };
  });

  describe('参数验证', () => {
    test('应该在缺少 openId 时返回错误', async () => {
      const params = {};
      
      const result = await loadProgress(params, mockContext);
      
      expect(result).toEqual({
        success: false,
        code: 1,
        message: "缺少必要参数：openId",
        data: null
      });
    });

    test('应该在 openId 为空字符串时返回错误', async () => {
      const params = { openId: '' };
      
      const result = await loadProgress(params, mockContext);
      
      expect(result).toEqual({
        success: false,
        code: 1,
        message: "缺少必要参数：openId",
        data: null
      });
    });
  });

  describe('用户数据存在的情况', () => {
    test('应该返回现有用户的完整数据', async () => {
      const openId = 'test_user_123';
      const existingUserData = {
        openId,
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
        totalErrors: 8,
        createdAt: 1234567890,
        updateTime: 1234567900
      };

      mockCollection.get.mockResolvedValue({
        data: [existingUserData]
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.message).toBe("用户进度加载成功");
      expect(result.data).toEqual({
        ...existingUserData,
        isNewUser: false
      });

      // 验证数据库查询调用
      expect(mockDatabase.collection).toHaveBeenCalledWith("user_progress");
      expect(mockCollection.where).toHaveBeenCalledWith({ openId });
      expect(mockCollection.get).toHaveBeenCalled();
    });

    test('应该为缺失字段提供默认值', async () => {
      const openId = 'test_user_456';
      const incompleteUserData = {
        openId,
        level1Completed: true
        // 其他字段缺失
      };

      mockCollection.get.mockResolvedValue({
        data: [incompleteUserData]
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        openId,
        currentLevel: 1,  // 默认值
        level1Completed: true,
        level2Completed: false,  // 默认值
        customModeUnlocked: false,  // 默认值
        bestScores: {},  // 默认值
        totalGames: 0,  // 默认值
        totalErrors: 0,  // 默认值
        createdAt: expect.any(Number),  // 当前时间
        updateTime: expect.any(Number),  // 当前时间
        isNewUser: false
      });
    });
  });

  describe('用户数据不存在的情况', () => {
    test('应该为新用户返回默认数据', async () => {
      const openId = 'new_user_789';

      mockCollection.get.mockResolvedValue({
        data: []  // 空数组表示没有找到数据
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.message).toBe("新用户，返回默认进度数据");
      expect(result.data).toEqual({
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
    });

    test('应该在查询结果为 null 时返回默认数据', async () => {
      const openId = 'new_user_null';

      mockCollection.get.mockResolvedValue({
        data: null
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.isNewUser).toBe(true);
      expect(result.data.openId).toBe(openId);
    });
  });

  describe('数据库错误处理', () => {
    test('应该在数据库查询失败时返回默认数据', async () => {
      const openId = 'error_user_123';
      const dbError = new Error('Database connection failed');

      mockCollection.get.mockRejectedValue(dbError);

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.message).toBe("数据库查询失败，返回默认进度数据");
      expect(result.data).toEqual({
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

      // 验证错误被记录
      expect(mockContext.log).toHaveBeenCalledWith('Database query error:', dbError);
    });

    test('应该在数据库初始化失败时返回默认数据', async () => {
      const openId = 'init_error_user';
      
      // Mock database() 抛出错误
      mockDatabase.collection.mockImplementation(() => {
        throw new Error('Database initialization failed');
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.message).toContain("加载用户进度时发生错误，返回默认数据");
      expect(result.data.isNewUser).toBe(true);
      expect(result.data.openId).toBe(openId);
    });
  });

  describe('边缘情况', () => {
    test('应该处理 openId 为特殊字符的情况', async () => {
      const openId = 'user@#$%^&*()_+';

      mockCollection.get.mockResolvedValue({
        data: []
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.openId).toBe(openId);
    });

    test('应该处理非常长的 openId', async () => {
      const openId = 'a'.repeat(1000);

      mockCollection.get.mockResolvedValue({
        data: []
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.openId).toBe(openId);
    });

    test('应该在完全失败时使用 unknown 作为 openId', async () => {
      // 传入无效参数导致 params.openId 无法访问
      const params = null;

      const result = await loadProgress(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.openId).toBe('unknown');
      expect(result.data.isNewUser).toBe(true);
    });
  });

  describe('日志记录', () => {
    test('应该记录关键操作日志', async () => {
      const openId = 'log_test_user';

      mockCollection.get.mockResolvedValue({
        data: [{
          openId,
          currentLevel: 1
        }]
      });

      const params = { openId };
      await loadProgress(params, mockContext);

      // 验证日志调用
      expect(mockContext.log).toHaveBeenCalledWith(`Loading progress for openId: ${openId}`);
      expect(mockContext.log).toHaveBeenCalledWith('Query result:', expect.any(Object));
      expect(mockContext.log).toHaveBeenCalledWith(`Found user data for openId: ${openId}`);
    });

    test('应该记录新用户日志', async () => {
      const openId = 'new_log_user';

      mockCollection.get.mockResolvedValue({
        data: []
      });

      const params = { openId };
      await loadProgress(params, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(`No user data found for openId: ${openId}, returning default data`);
    });
  });

  describe('数据完整性', () => {
    test('返回的时间戳应该是有效的数字', async () => {
      const openId = 'timestamp_test_user';

      mockCollection.get.mockResolvedValue({
        data: []
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(typeof result.data.createdAt).toBe('number');
      expect(typeof result.data.updateTime).toBe('number');
      expect(result.data.createdAt).toBeGreaterThan(0);
      expect(result.data.updateTime).toBeGreaterThan(0);
    });

    test('bestScores 应该始终是对象', async () => {
      const openId = 'scores_test_user';

      // 测试数据库返回 null bestScores
      mockCollection.get.mockResolvedValue({
        data: [{
          openId,
          bestScores: null
        }]
      });

      const params = { openId };
      const result = await loadProgress(params, mockContext);

      expect(result.data.bestScores).toEqual({});
      expect(typeof result.data.bestScores).toBe('object');
    });
  });
});