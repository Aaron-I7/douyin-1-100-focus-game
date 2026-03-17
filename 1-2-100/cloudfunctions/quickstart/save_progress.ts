/**
 * 保存用户进度到云数据库
 * @param params 调用参数，包含 openId 和 progressData
 * @param context 调用上下文
 * 
 * @return 函数的返回数据，包含保存结果
 */
import { dySDK } from "@open-dy/node-server-sdk";

interface ProgressData {
  openId: string;
  currentLevel: 1 | 2 | 'custom';
  level1Completed: boolean;
  level2Completed: boolean;
  customModeUnlocked: boolean;
  bestScores: {
    level1?: ScoreRecord;
    level2?: ScoreRecord;
    custom_10_free?: ScoreRecord;
    custom_10_60?: ScoreRecord;
    custom_100_free?: ScoreRecord;
    custom_100_60?: ScoreRecord;
    custom_100_120?: ScoreRecord;
    custom_100_180?: ScoreRecord;
  };
  totalGames: number;
  totalErrors: number;
  createdAt?: number;
  updateTime: number;
}

interface ScoreRecord {
  time: number;        // 完成时间（秒）
  errors: number;      // 错误次数
  timestamp: number;   // 记录时间戳
  level: string;       // 关卡标识
  difficulty: number;  // 时间限制（秒），0 表示自由模式
}

export default async function (params: any, context: any) {
  try {
    const { openId, progressData } = params;
    
    // 参数验证
    if (!openId) {
      return {
        success: false,
        code: 1,
        message: "缺少必要参数：openId",
        data: null
      };
    }
    
    if (!progressData) {
      return {
        success: false,
        code: 1,
        message: "缺少必要参数：progressData",
        data: null
      };
    }
    
    const database = dySDK.database();
    const collection = database.collection("user_progress");
    
    // 准备保存的数据
    const dataToSave: ProgressData = {
      openId,
      currentLevel: progressData.currentLevel || 1,
      level1Completed: progressData.level1Completed || false,
      level2Completed: progressData.level2Completed || false,
      customModeUnlocked: progressData.customModeUnlocked || false,
      bestScores: progressData.bestScores || {},
      totalGames: progressData.totalGames || 0,
      totalErrors: progressData.totalErrors || 0,
      updateTime: Date.now()
    };
    
    // 如果是新记录，设置创建时间
    if (!progressData.createdAt) {
      dataToSave.createdAt = Date.now();
    } else {
      dataToSave.createdAt = progressData.createdAt;
    }
    
    context.log(`Saving progress for openId: ${openId}`);
    context.log(`Progress data:`, dataToSave);
    
    // 使用 upsert 操作处理并发写入
    // 先尝试更新，如果记录不存在则插入
    try {
      const updateResult = await collection
        .where({ openId })
        .update(dataToSave);
      const updateStats = (updateResult as any)?.stats;
      
      context.log(`Update result:`, updateResult);
      
      // 如果没有匹配的记录被更新，则插入新记录
      if (updateStats && updateStats.updated === 0) {
        context.log(`No existing record found, inserting new record`);
        const insertResult = await collection.add(dataToSave);
        const insertId = (insertResult as any)?._id || (insertResult as any)?.id || '';
        context.log(`Insert result:`, insertResult);
        
        return {
          success: true,
          code: 0,
          message: "用户进度保存成功（新建）",
          data: {
            operation: "insert",
            id: insertId,
            updateTime: dataToSave.updateTime
          }
        };
      } else {
        return {
          success: true,
          code: 0,
          message: "用户进度更新成功",
          data: {
            operation: "update",
            updated: updateStats?.updated || 0,
            updateTime: dataToSave.updateTime
          }
        };
      }
      
    } catch (updateError: any) {
      context.log(`Update failed, trying insert:`, updateError);
      
      // 如果更新失败，可能是因为记录不存在，尝试插入
      try {
        const insertResult = await collection.add(dataToSave);
        const insertId = (insertResult as any)?._id || (insertResult as any)?.id || '';
        context.log(`Insert result:`, insertResult);
        
        return {
          success: true,
          code: 0,
          message: "用户进度保存成功（新建）",
          data: {
            operation: "insert",
            id: insertId,
            updateTime: dataToSave.updateTime
          }
        };
      } catch (insertError: any) {
        context.log(`Insert also failed:`, insertError);
        
        // 如果插入也失败，可能是并发冲突，再次尝试更新
        try {
          const retryUpdateResult = await collection
            .where({ openId })
            .update(dataToSave);
          const retryUpdateStats = (retryUpdateResult as any)?.stats;
          
          return {
            success: true,
            code: 0,
            message: "用户进度更新成功（重试）",
            data: {
              operation: "retry_update",
              updated: retryUpdateStats?.updated || 0,
              updateTime: dataToSave.updateTime
            }
          };
        } catch (retryError: any) {
          throw retryError;
        }
      }
    }
    
  } catch (error: any) {
    context.log(`Save progress error:`, error);
    
    return {
      success: false,
      code: 1,
      message: `保存用户进度失败: ${error.message || '未知错误'}`,
      data: {
        error: error.message,
        stack: error.stack
      }
    };
  }
}
