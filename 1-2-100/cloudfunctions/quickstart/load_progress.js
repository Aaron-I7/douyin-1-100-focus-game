/**
 * 从云数据库加载用户进度
 * @param params 调用参数，包含 openId
 * @param context 调用上下文
 * 
 * @return 函数的返回数据，包含用户进度数据或默认数据
 */
const { dySDK } = require("@open-dy/node-server-sdk");

module.exports = async function (params, context) {
  try {
    const { openId } = params;
    
    // 参数验证
    if (!openId) {
      return {
        success: false,
        code: 1,
        message: "缺少必要参数：openId",
        data: null
      };
    }
    
    const database = dySDK.database();
    const collection = database.collection("user_progress");
    
    context.log(`Loading progress for openId: ${openId}`);
    
    try {
      // 查询用户进度数据
      const queryResult = await collection
        .where({ openId })
        .get();
      
      context.log(`Query result:`, queryResult);
      
      // 如果找到用户数据，返回实际数据
      if (queryResult.data && queryResult.data.length > 0) {
        const userData = queryResult.data[0];
        
        context.log(`Found user data for openId: ${openId}`);
        
        return {
          success: true,
          code: 0,
          message: "用户进度加载成功",
          data: {
            openId: userData.openId,
            currentLevel: userData.currentLevel || 1,
            level1Completed: userData.level1Completed || false,
            level2Completed: userData.level2Completed || false,
            customModeUnlocked: userData.customModeUnlocked || false,
            bestScores: userData.bestScores || {},
            totalGames: userData.totalGames || 0,
            totalErrors: userData.totalErrors || 0,
            createdAt: userData.createdAt || Date.now(),
            updateTime: userData.updateTime || Date.now(),
            isNewUser: false
          }
        };
      } else {
        // 用户不存在，返回默认数据
        context.log(`No user data found for openId: ${openId}, returning default data`);
        
        const defaultData = {
          openId,
          currentLevel: 1,
          level1Completed: false,
          level2Completed: false,
          customModeUnlocked: false,
          bestScores: {},
          totalGames: 0,
          totalErrors: 0,
          createdAt: Date.now(),
          updateTime: Date.now(),
          isNewUser: true
        };
        
        return {
          success: true,
          code: 0,
          message: "新用户，返回默认进度数据",
          data: defaultData
        };
      }
      
    } catch (queryError) {
      context.log(`Database query error:`, queryError);
      
      // 数据库查询失败，返回默认数据以确保游戏可以继续
      context.log(`Database query failed, returning default data for openId: ${openId}`);
      
      const defaultData = {
        openId,
        currentLevel: 1,
        level1Completed: false,
        level2Completed: false,
        customModeUnlocked: false,
        bestScores: {},
        totalGames: 0,
        totalErrors: 0,
        createdAt: Date.now(),
        updateTime: Date.now(),
        isNewUser: true
      };
      
      return {
        success: true,
        code: 0,
        message: "数据库查询失败，返回默认进度数据",
        data: defaultData
      };
    }
    
  } catch (error) {
    context.log(`Load progress error:`, error);
    
    // 发生错误时也返回默认数据，确保游戏不会因为数据加载失败而无法启动
    const defaultData = {
      openId: (params && params.openId) || 'unknown',
      currentLevel: 1,
      level1Completed: false,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {},
      totalGames: 0,
      totalErrors: 0,
      createdAt: Date.now(),
      updateTime: Date.now(),
      isNewUser: true
    };
    
    return {
      success: true,
      code: 0,
      message: `加载用户进度时发生错误，返回默认数据: ${error.message || '未知错误'}`,
      data: defaultData
    };
  }
};