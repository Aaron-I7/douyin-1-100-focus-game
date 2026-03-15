/**
 * UI测试文件
 * 用于测试UI是否能正常显示
 */

console.log('UI测试启动...');

function testUI() {
  try {
    // 获取系统信息
    const systemInfo = tt.getSystemInfoSync();
    console.log('系统信息:', systemInfo);
    
    // 创建Canvas
    const canvas = tt.createCanvas();
    const ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) {
      console.error('Canvas创建失败');
      return;
    }
    
    canvas.width = systemInfo.windowWidth;
    canvas.height = systemInfo.windowHeight;
    
    console.log('Canvas创建成功:', {
      width: canvas.width,
      height: canvas.height
    });
    
    // 绘制测试UI
    const w = canvas.width;
    const h = canvas.height;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFE5B4');
    gradient.addColorStop(0.5, '#FFD4A3');
    gradient.addColorStop(1, '#FFC48C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    console.log('背景绘制完成');
    
    // 标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(w * 0.1)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1-100', w / 2, h * 0.25);
    
    console.log('标题绘制完成');
    
    // 副标题
    ctx.fillStyle = '#8B4513';
    ctx.font = `${Math.floor(w * 0.04)}px Arial`;
    ctx.fillText('专注力挑战', w / 2, h * 0.35);
    
    console.log('副标题绘制完成');
    
    // 按钮
    ctx.fillStyle = '#FF6B6B';
    const btnX = w * 0.2;
    const btnY = h * 0.5;
    const btnW = w * 0.6;
    const btnH = 60;
    
    // 圆角矩形
    ctx.beginPath();
    ctx.moveTo(btnX + 25, btnY);
    ctx.lineTo(btnX + btnW - 25, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + 25);
    ctx.lineTo(btnX + btnW, btnY + btnH - 25);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - 25, btnY + btnH);
    ctx.lineTo(btnX + 25, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - 25);
    ctx.lineTo(btnX, btnY + 25);
    ctx.quadraticCurveTo(btnX, btnY, btnX + 25, btnY);
    ctx.closePath();
    ctx.fill();
    
    console.log('按钮绘制完成');
    
    // 按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(w * 0.045)}px Arial`;
    ctx.fillText('开始游戏', w / 2, btnY + btnH / 2);
    
    console.log('按钮文字绘制完成');
    
    // 说明文字
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(w * 0.035)}px Arial`;
    ctx.fillText('按顺序点击 1-100 的数字', w / 2, h * 0.7);
    ctx.fillText('挑战你的专注力极限！', w / 2, h * 0.75);
    
    console.log('说明文字绘制完成');
    console.log('UI测试完成！如果你能看到完整界面，说明UI系统正常');
    
  } catch (error) {
    console.error('UI测试失败:', error);
  }
}

// 启动测试
testUI();
