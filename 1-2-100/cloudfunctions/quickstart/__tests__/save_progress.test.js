/**
 * 测试 save_progress 云函数
 */
const saveProgress = require('../save_progress.js');

// Mock dySDK
const mockDatabase = {
  collection: jest.fn(),
};

const mockCollection = {
  where: jest.fn(),
  update: jest.fn(),
  add: jest.fn(),
};

jest.mock('@open-dy/node-server-sdk', () => ({
  dySDK: {
    database: () => mockDatabase
  }
}));

describe('save_progress cloud function', () => {
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = {
      log: jest.fn()
    };
    
    mockDatabase.collection.mockReturnValue(mockCollection);
    mockCollection.where.mockReturnValue(mockCollection);
  });

  test('should save new user progress successfully', async () => {
    // Mock successful insert
    mockCollection.update.mockResolvedValue({
      stats: { updated: 0 }
    });
    mockCollection.add.mockResolvedValue({
      _id: 'test_id_123'
    });

    const params = {
      openId: 'test_open_id',
      progressData: {
        currentLevel: 1,
        level1Completed: false,
        level2Completed: false,
        customModeUnlocked: false,
        bestScores: {},
        totalGames: 0,
        totalErrors: 0
      }
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(true);
    expect(result.code).toBe(0);
    expect(result.data.operation).toBe('insert');
    expect(result.data.id).toBe('test_id_123');
    expect(mockDatabase.collection).toHaveBeenCalledWith('user_progress');
  });

  test('should update existing user progress successfully', async () => {
    // Mock successful update
    mockCollection.update.mockResolvedValue({
      stats: { updated: 1 }
    });

    const params = {
      openId: 'test_open_id',
      progressData: {
        currentLevel: 2,
        level1Completed: true,
        level2Completed: false,
        customModeUnlocked: false,
        bestScores: {
          level1: {
            time: 120,
            errors: 2,
            timestamp: Date.now(),
            level: 'level1',
            difficulty: 0
          }
        },
        totalGames: 1,
        totalErrors: 2,
        createdAt: Date.now() - 86400000 // 1 day ago
      }
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(true);
    expect(result.code).toBe(0);
    expect(result.data.operation).toBe('update');
    expect(result.data.updated).toBe(1);
  });

  test('should handle concurrent write conflicts with retry', async () => {
    // Mock update failure, insert failure, then successful retry update
    mockCollection.update
      .mockRejectedValueOnce(new Error('Update failed'))
      .mockResolvedValueOnce({
        stats: { updated: 1 }
      });
    
    mockCollection.add.mockRejectedValue(new Error('Insert failed - duplicate key'));

    const params = {
      openId: 'test_open_id',
      progressData: {
        currentLevel: 1,
        level1Completed: false
      }
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(true);
    expect(result.code).toBe(0);
    expect(result.data.operation).toBe('retry_update');
    expect(mockCollection.update).toHaveBeenCalledTimes(2);
    expect(mockCollection.add).toHaveBeenCalledTimes(1);
  });

  test('should return error for missing openId', async () => {
    const params = {
      progressData: {
        currentLevel: 1
      }
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(false);
    expect(result.code).toBe(1);
    expect(result.message).toContain('缺少必要参数：openId');
  });

  test('should return error for missing progressData', async () => {
    const params = {
      openId: 'test_open_id'
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(false);
    expect(result.code).toBe(1);
    expect(result.message).toContain('缺少必要参数：progressData');
  });

  test('should handle database errors gracefully', async () => {
    mockCollection.update.mockRejectedValue(new Error('Database connection failed'));
    mockCollection.add.mockRejectedValue(new Error('Database connection failed'));

    const params = {
      openId: 'test_open_id',
      progressData: {
        currentLevel: 1
      }
    };

    const result = await saveProgress(params, mockContext);

    expect(result.success).toBe(false);
    expect(result.code).toBe(1);
    expect(result.message).toContain('保存用户进度失败');
    expect(result.data.error).toContain('Database connection failed');
  });

  test('should preserve existing createdAt timestamp', async () => {
    mockCollection.update.mockResolvedValue({
      stats: { updated: 1 }
    });

    const existingCreatedAt = Date.now() - 86400000; // 1 day ago
    const params = {
      openId: 'test_open_id',
      progressData: {
        currentLevel: 2,
        createdAt: existingCreatedAt
      }
    };

    await saveProgress(params, mockContext);

    // Verify that the update was called with the preserved createdAt
    const updateCall = mockCollection.update.mock.calls[0][0];
    expect(updateCall.createdAt).toBe(existingCreatedAt);
    expect(updateCall.updateTime).toBeGreaterThan(existingCreatedAt);
  });

  test('should set createdAt for new records', async () => {
    mockCollection.update.mockResolvedValue({
      stats: { updated: 0 }
    });
    mockCollection.add.mockResolvedValue({
      _id: 'new_record_id'
    });

    const params = {
      openId: 'new_user_id',
      progressData: {
        currentLevel: 1
        // No createdAt provided
      }
    };

    await saveProgress(params, mockContext);

    // Verify that createdAt was set for the new record
    const addCall = mockCollection.add.mock.calls[0][0];
    expect(addCall.createdAt).toBeDefined();
    expect(addCall.createdAt).toBeGreaterThan(Date.now() - 1000); // Within last second
  });
});