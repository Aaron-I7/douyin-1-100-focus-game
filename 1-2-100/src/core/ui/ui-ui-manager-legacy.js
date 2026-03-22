class UIManager {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    this.width = screenAdapter.screenWidth;
    this.height = screenAdapter.screenHeight;
    this.currentScreen = 'start';
    this.selectedDifficulty = null;
    this.buttons = [];
    this.onStartGame = null;
    this.userProfileManager = null;
    this.startupPromptDisabled = false;
    this.reducedMotionEnabled = false;
    this.selectedMode = 'simple';
    this.leaderboardMode = 'simple';
    this.modeLabels = {
      simple: '简单',
      hard: '困难',
      hell: '地狱'
    };
    this.leaderboardByMode = {
      simple: [
        { rank: 1, name: '广东省', count: '1,203人', color: '#fcd34d' },
        { rank: 2, name: '北京市', count: '982人', color: '#d4d4d8' },
        { rank: 3, name: '上海市', count: '856人', color: '#fdba74' }
      ],
      hard: [
        { rank: 1, name: '广东省', count: '742人', color: '#93c5fd' },
        { rank: 2, name: '北京市', count: '615人', color: '#d4d4d8' },
        { rank: 3, name: '江苏省', count: '533人', color: '#fdba74' }
      ],
      hell: [
        { rank: 1, name: '广东省', count: '281人', color: '#f87171' },
        { rank: 2, name: '北京市', count: '236人', color: '#d4d4d8' },
        { rank: 3, name: '浙江省', count: '198人', color: '#fdba74' }
      ]
    };
    const safeArea = this.screenAdapter && this.screenAdapter.safeArea
      ? this.screenAdapter.safeArea
      : { top: 0, bottom: this.height, left: 0, right: this.width };
    this.safeTop = typeof safeArea.top === 'number' ? safeArea.top : 0;
    this.safeBottom = typeof safeArea.bottom === 'number' ? safeArea.bottom : this.height;
    console.log('UIManager初始化，使用逻辑尺寸:', { width: this.width, height: this.height });
  }

  setStartupPromptDisabled(disabled) {
    this.startupPromptDisabled = !!disabled;
  }

  setReducedMotionEnabled(enabled) {
    this.reducedMotionEnabled = !!enabled;
  }

  normalizeMode(mode) {
    if (!mode || !this.modeLabels[mode]) {
      return 'simple';
    }
    return mode;
  }

  getModeLabel(mode) {
    const normalized = this.normalizeMode(mode);
    return this.modeLabels[normalized] || this.modeLabels.simple;
  }

  renderStartScreen(data = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const selectedMode = this.normalizeMode(data.selectedMode || this.selectedMode);
    const leaderboardMode = this.normalizeMode(data.leaderboardMode || selectedMode);
    const homeStats = data.homeStats || {};
    const dailyChallengeState = data.dailyChallengeState || {};
    const challengeCount = Number(homeStats.challengeCount || 12543);
    const todayPassCount = Number(homeStats.todayPassCount || 842);
    const freePlayLeft = Number.isFinite(Number(dailyChallengeState.freeLeft))
      ? Number(dailyChallengeState.freeLeft)
      : Number.isFinite(Number(homeStats.freePlayLeft))
        ? Number(homeStats.freePlayLeft)
        : 3;
    if (data.leaderboardByMode && typeof data.leaderboardByMode === 'object') {
      this.leaderboardByMode = {
        ...this.leaderboardByMode,
        ...data.leaderboardByMode
      };
    }
    this.selectedMode = selectedMode;
    this.leaderboardMode = leaderboardMode;
    
    // Draw background
    if (this.themeSystem) {
       this.themeSystem.applyBackgroundGradient(ctx, w, h);
    } else {
       ctx.fillStyle = '#18181b'; // Zinc-950
       ctx.fillRect(0, 0, w, h);
    }
    
    const safeTop = this.safeTop || 20;
    
    // 1. Top Right Board (Simulated)
    const boardW = 160;
    const boardH = 60;
    const boardX = w - boardW - 16;
    const boardY = safeTop + 10;
    
    ctx.save();
    ctx.fillStyle = '#27272a'; // Zinc-800
    ctx.strokeStyle = '#3f3f46'; // Zinc-700
    ctx.lineWidth = 2;
    this.roundRect(ctx, boardX, boardY, boardW, boardH, 12);
    ctx.fill();
    ctx.stroke();
    
    // Board Content
    ctx.fillStyle = '#a1a1aa'; // Zinc-400
    ctx.font = '10px "Manrope", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('挑战公告栏', boardX + boardW/2, boardY + 6);
    
    // Rows (Simulated data)
    ctx.textAlign = 'left';
    
    // Row 1
    ctx.fillStyle = '#67e8f9'; // Cyan-300 (Soft)
    ctx.fillText('挑战人数', boardX + 10, boardY + 24);
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px "Manrope", sans-serif';
    ctx.fillText(challengeCount.toLocaleString(), boardX + boardW - 10, boardY + 24);
    
    // Row 2
    ctx.textAlign = 'left';
    ctx.font = '10px "Manrope", sans-serif';
    ctx.fillStyle = '#fcd34d'; // Amber-300 (Soft)
    ctx.fillText('今日通过', boardX + 10, boardY + 42);
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px "Manrope", sans-serif';
    ctx.fillText(todayPassCount.toLocaleString(), boardX + boardW - 10, boardY + 42);
    ctx.restore();

    // 2. Title Section
    const titleY = boardY + boardH + 80;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    
    // Gradient Text "1-100"
    ctx.font = '800 60px "Manrope", sans-serif';
    const text = "1-100";
    const textWidth = ctx.measureText(text).width;
    const textX = w / 2 - textWidth / 2;
    const textY = titleY;
    
    const grad = ctx.createLinearGradient(textX, textY - 60, textX + textWidth, textY);
    grad.addColorStop(0, '#fcd34d'); // Amber-300
    grad.addColorStop(0.5, '#fbbf24'); // Amber-400
    grad.addColorStop(1, '#fca5a5'); // Red-300 (Soft)
    ctx.fillStyle = grad;
    ctx.fillText(text, w/2, textY);
    
    // Subtitle
    ctx.fillStyle = '#a1a1aa'; // Zinc-400
    ctx.font = '14px "Manrope", sans-serif';
    ctx.fillText('舒尔特方格 极限注意力挑战', w/2, textY + 30);
    ctx.restore();

    // 3. Start Button
    const btnW = Math.min(320, w - 48);
    const btnH = 80;
    const btnX = (w - btnW) / 2;
    const btnY = textY + 80;
    
    ctx.save();
    // Button Gradient (Softer Orange/Red)
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#fdba74'); // Orange-300
    btnGrad.addColorStop(0.5, '#fca5a5'); // Red-300
    btnGrad.addColorStop(1, '#f9a8d4'); // Pink-300
    ctx.fillStyle = btnGrad;
    
    // Shadow
    ctx.shadowColor = 'rgba(251, 146, 60, 0.3)'; // Orange-400/30
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 20);
    ctx.fill();
    
    // Inner Glare
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    this.roundRect(ctx, btnX, btnY, btnW, btnH/2, 20);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px "Manrope", sans-serif';
    ctx.fillText('开始游戏', w/2, btnY + 30);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px "Manrope", sans-serif';
    ctx.fillText(`今日剩余免费次数: ${Math.max(0, freePlayLeft)}`, w/2, btnY + 55);
    
    ctx.restore();
    
    this.buttons = [{ id: 'start', x: btnX, y: btnY, width: btnW, height: btnH }];

    // 4. Ranking List (Simplified)
    const rankY = btnY + btnH + 60;
    ctx.save();
    ctx.fillStyle = '#fcd34d'; // Amber-300
    ctx.font = 'bold 16px "Manrope", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`通关省份排行榜（${this.getModeLabel(leaderboardMode)}）`, 24, rankY);

    // Difficulty tabs
    const tabY = rankY + 28;
    const tabContainerW = w - 48;
    const tabGap = 8;
    const tabW = (tabContainerW - tabGap * 2) / 3;
    const tabH = 28;
    const tabs = [
      { id: 'leaderboardSimple', mode: 'simple', text: '简单' },
      { id: 'leaderboardHard', mode: 'hard', text: '困难' },
      { id: 'leaderboardHell', mode: 'hell', text: '地狱' }
    ];

    tabs.forEach((tab, index) => {
      const tabX = 24 + index * (tabW + tabGap);
      const isActive = leaderboardMode === tab.mode;

      ctx.beginPath();
      this.roundRect(ctx, tabX, tabY, tabW, tabH, 10);
      ctx.fillStyle = isActive ? 'rgba(251, 191, 36, 0.22)' : 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = isActive ? 'rgba(251, 191, 36, 0.75)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isActive ? '#fde68a' : '#cbd5e1';
      ctx.font = 'bold 12px "Manrope", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.text, tabX + tabW / 2, tabY + tabH / 2);

      this.buttons.push({ id: tab.id, x: tabX, y: tabY, width: tabW, height: tabH });
    });

    // List Items
    const itemH = 50;
    const items = this.leaderboardByMode[leaderboardMode] || this.leaderboardByMode.simple;
    const listStartY = tabY + tabH + 14;

    items.forEach((item, idx) => {
       const y = listStartY + idx * (itemH + 10);
       const x = 24;
       const width = w - 48;
       
       // Bg
       ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
       this.roundRect(ctx, x, y, width, itemH, 12);
       ctx.fill();
       
       // Rank Circle
       ctx.beginPath();
       ctx.arc(x + 25, y + itemH/2, 12, 0, Math.PI * 2);
       ctx.fillStyle = item.color;
       ctx.fill();
       ctx.fillStyle = '#000';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.font = 'bold 10px sans-serif';
       ctx.fillText(item.rank.toString(), x + 25, y + itemH/2);
       
       // Name
       ctx.fillStyle = '#e4e4e7'; // Zinc-200
       ctx.textAlign = 'left';
       ctx.font = 'bold 14px "Manrope", sans-serif';
       ctx.fillText(item.name, x + 50, y + itemH/2);

       // Avatars (Overlapping)
       const avatarSize = 24;
       const avatarOverlap = 14;
       const avatarStartX = x + 110;
       const avatarY = y + itemH/2;
       
       for (let i = 0; i < 4; i++) {
          this.drawAvatar(ctx, avatarStartX + i * avatarOverlap, avatarY, avatarSize, idx * 4 + i);
       }
       
       // Count
       ctx.fillStyle = '#a1a1aa'; // Zinc-400
       ctx.textAlign = 'right';
       ctx.font = '12px "Manrope", sans-serif';
       ctx.fillText(item.count, x + width - 15, y + itemH/2);
    });
    
    ctx.restore();
  }

  drawAvatar(ctx, x, y, size, seed) {
    const r = size / 2;
    ctx.save();
    
    // Avatar Background (Random soft pastel color)
    const colors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4'];
    ctx.fillStyle = colors[seed % colors.length];
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple Face
    ctx.fillStyle = '#4b5563'; // Gray-600
    // Eyes
    ctx.beginPath();
    ctx.arc(x - r/3, y - r/5, 1.5, 0, Math.PI * 2);
    ctx.arc(x + r/3, y - r/5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (Smile)
    ctx.beginPath();
    ctx.arc(x, y + r/5, r/3, 0, Math.PI, false);
    ctx.stroke();
    
    // Border
    ctx.strokeStyle = '#27272a'; // Match background
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }

  renderDifficultySelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const safeTop = this.safeTop;
    const safeBottom = this.safeBottom;
    
    // Draw background
    ctx.fillStyle = '#f8faf8';
    ctx.fillRect(0, 0, w, h);
    
    // TopAppBar
    ctx.fillStyle = '#f8faf8';
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(0, 0, w, safeTop + 56);
    
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#426564';
    ctx.font = `600 20px "Manrope", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('模式选择', w / 2, safeTop + 28);
    
    let currentY = safeTop + 100;
    
    ctx.fillStyle = '#426564';
    ctx.font = `800 32px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText('选择挑战时长', w / 2, currentY);
    
    currentY += 60;
    
    const padding = 24;
    const btnW = (w - padding * 2 - 16) / 2;
    const btnH = 80;
    
    const difficulties = [
      { text: '自由模式', time: 0, id: 'free', color: '#426564', bg: '#f1f4f2' },
      { text: '1分钟', time: 60, id: '60', color: '#e0fffe', bg: '#426564' },
      { text: '2分钟', time: 120, id: '120', color: '#426564', bg: '#f1f4f2' },
      { text: '3分钟', time: 180, id: '180', color: '#426564', bg: '#f1f4f2' }
    ];
    
    this.buttons = [];
    
    difficulties.forEach((diff, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = padding + col * (btnW + 16);
      const y = currentY + row * (btnH + 16);
      
      if (diff.bg === '#426564') {
        // Primary button
        ctx.fillStyle = diff.bg;
        ctx.shadowColor = 'rgba(66, 101, 100, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        this.roundRect(ctx, x, y, btnW, btnH, 20);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      } else {
        if (this.themeSystem && typeof this.themeSystem.drawNeomorphicShape === 'function') {
          this.themeSystem.drawNeomorphicShape(ctx, x, y, btnW, btnH, 20, 'emboss', diff.bg);
        } else {
          ctx.fillStyle = diff.bg;
          this.roundRect(ctx, x, y, btnW, btnH, 20);
          ctx.fill();
        }
      }
      
      ctx.fillStyle = diff.color;
      ctx.font = `700 18px "Manrope", "PingFang SC", sans-serif`;
      ctx.fillText(diff.text, x + btnW / 2, y + btnH / 2);
      
      this.buttons.push({ id: diff.id, x, y, width: btnW, height: btnH });
    });
    
    currentY += (btnH + 16) * 2 + 40;
    
    // Info Card
    const cardW = w - padding * 2;
    if (this.themeSystem && typeof this.themeSystem.drawNeomorphicShape === 'function') {
      this.themeSystem.drawNeomorphicShape(ctx, padding, currentY, cardW, 100, 24, 'inset', '#f1f4f2');
    } else {
      ctx.fillStyle = '#f1f4f2';
      this.roundRect(ctx, padding, currentY, cardW, 100, 24);
      ctx.fill();
    }
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#426564';
    ctx.font = `700 16px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText('当前目标：1-10', padding + 24, currentY + 30);
    ctx.fillStyle = '#59615f';
    ctx.font = `500 12px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText('完成第一关后将进入第二关过场', padding + 24, currentY + 60);
    ctx.fillText('并自动切换到 1-100 挑战。', padding + 24, currentY + 80);
    
    // Back Button
    const backBtnW = 120;
    const backBtnH = 48;
    const backBtnX = (w - backBtnW) / 2;
    const backBtnY = safeBottom - 100;
    
    if (this.themeSystem && typeof this.themeSystem.drawNeomorphicShape === 'function') {
      this.themeSystem.drawNeomorphicShape(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 24, 'emboss', '#f1f4f2');
    } else {
      ctx.fillStyle = '#f1f4f2';
      this.roundRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, 24);
      ctx.fill();
    }
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#59615f';
    ctx.font = `600 16px "Manrope", "PingFang SC", sans-serif`;
    ctx.fillText('返回', w / 2, backBtnY + 24);
    
    this.buttons.push({ id: 'back', x: backBtnX, y: backBtnY, width: backBtnW, height: backBtnH });
  }

  renderCustomModeSelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.fillStyle = '#2E7D32';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('自选模式', w / 2, h * 0.15);
    ctx.fillStyle = '#388E3C';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择你想要的挑战', w / 2, h * 0.22);
    const buttonWidth = w * 0.8;
    const buttonHeight = 60;
    const spacing = 15;
    const customModes = [
      { text: '1-10 练习模式', description: '适合新手练习', color: '#66BB6A', id: 'custom10' },
      { text: '1-100 挑战模式', description: '终极挑战', color: '#FF7043', id: 'custom100' }
    ];
    customModes.forEach((mode, index) => {
      const y = h * 0.35 + index * (buttonHeight + spacing);
      this.drawCustomModeButton(ctx, { x: w * 0.1, y, width: buttonWidth, height: buttonHeight, text: mode.text, description: mode.description, color: mode.color, id: mode.id });
    });
    this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
  }

  renderCustomTimeSelectScreen(data) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const mode = data ? data.mode : 10;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.fillStyle = '#1976D2';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${mode === 10 ? '1-10 练习' : '1-100 挑战'}`, w / 2, h * 0.15);
    ctx.fillStyle = '#1E88E5';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择时间限制', w / 2, h * 0.22);
    const buttonWidth = w * 0.4;
    const buttonHeight = 70;
    const horizontalSpacing = w * 0.05;
    const verticalSpacing = 20;
    const startX = (w - buttonWidth * 2 - horizontalSpacing) / 2;
    const startY = h * 0.35;
    const timeOptions = [
      { text: '自由模式', description: '无时间限制', color: '#66BB6A', id: 'customFree', difficulty: 0 },
      { text: '1分钟', description: '快速挑战', color: '#FFA726', id: 'custom60', difficulty: 60 },
      { text: '2分钟', description: '标准模式', color: '#FF7043', id: 'custom120', difficulty: 120 },
      { text: '3分钟', description: '充裕时间', color: '#EF5350', id: 'custom180', difficulty: 180 }
    ];
    timeOptions.forEach((option, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (buttonWidth + horizontalSpacing);
      const y = startY + row * (buttonHeight + verticalSpacing);
      this.drawCustomModeButton(ctx, { x, y, width: buttonWidth, height: buttonHeight, text: option.text, description: option.description, color: option.color, id: option.id });
    });
    this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
  }
  renderModeSelect100Screen(data = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const selectedMode = data.selectedMode || 'simple';

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#ECEFF1');
    gradient.addColorStop(1, '#CFD8DC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this.drawDecorativeCircles(ctx);

    ctx.fillStyle = '#263238';
    ctx.font = 'bold ' + Math.floor(w * 0.07) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1-100 挑战模式', w / 2, h * 0.14);

    const buttonWidth = w * 0.78;
    const buttonHeight = 72;
    const startX = w * 0.11;
    const startY = h * 0.28;
    const gap = 18;

    const modeOptions = [
      { id: 'modeSimple', mode: 'simple', text: '简单', color: '#4DB6AC' },
      { id: 'modeHard', mode: 'hard', text: '困难', color: '#42A5F5' },
      { id: 'modeHell', mode: 'hell', text: '地狱', color: '#EF5350' }
    ];

    modeOptions.forEach((option, index) => {
      const y = startY + index * (buttonHeight + gap);
      this.drawCustomModeButton(ctx, {
        x: startX,
        y,
        width: buttonWidth,
        height: buttonHeight,
        text: option.text,
        color: option.color,
        id: option.id
      });
      if (selectedMode === option.mode) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold ' + Math.floor(w * 0.04) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('已选', startX + buttonWidth - 16, y + buttonHeight / 2);
        ctx.restore();
      }
    });

    this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
  }
  renderCustomModeExplanationScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(0.5, '#C8E6C9');
    gradient.addColorStop(1, '#A5D6A7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#2E7D32';
    ctx.font = `bold ${Math.floor(w * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('自选模式说明', w / 2, h * 0.12);
    ctx.restore();
    ctx.fillStyle = '#388E3C';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择适合你的挑战方式', w / 2, h * 0.19);
    this.drawExplanationCard(ctx, {
      x: w * 0.1, y: h * 0.26, width: w * 0.8, height: 140, icon: '🔢', title: '1-10 练习模式', description: '适合新手练习',
      features: ['- 只需找到 1-10 的数字', '- 难度较低，轻松上手', '- 可选择限时或自由模式'], color: '#66BB6A'
    });
    this.drawExplanationCard(ctx, {
      x: w * 0.1, y: h * 0.48, width: w * 0.8, height: 140, icon: '🏆', title: '1-100 挑战模式', description: '终极挑战，考验专注力',
      features: ['- 完整 1-100 数字挑战', '- 难度更高，需要强专注', '- 支持多种限时设置'], color: '#FF7043'
    });
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(w * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('1-10：自由/1/2/3分钟 · 1-100：简单8/困难12/地狱16分钟', w / 2, h * 0.72);
    this.drawButton(ctx, { x: w * 0.2, y: h * 0.78, width: w * 0.6, height: 55, text: '开始选择', color: '#4CAF50', textColor: '#FFFFFF', id: 'startCustomMode' });
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(w * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('点击开始选择你想要的挑战', w / 2, h * 0.9);
  }

  drawExplanationCard(ctx, config) {
    const { x, y, width, height, icon, title, description, features, color } = config;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, 6, height, 12);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `${Math.floor(this.width * 0.06)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(icon, x + 20, y + 15);
    ctx.fillStyle = '#212121';
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(title, x + 60, y + 18);
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(this.width * 0.032)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(description, x + 60, y + 45);
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(this.width * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const featureStartY = y + 70;
    const lineHeight = Math.floor(this.width * 0.04);
    features.forEach((feature, index) => {
      ctx.fillText(feature, x + 20, featureStartY + index * lineHeight);
    });
  }

  renderResultScreen(gameState) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const isSuccess = gameState.success !== false;
    
    // Draw background (Deep Dark)
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, w, h);

    // Draw Static Confetti Background only on success
    if (isSuccess) {
      this.drawConfetti(ctx, w, h);
    }
    
    // Victory/Failure Card
    ctx.save();
    
    // Modal Bg (Dark overlay)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);
    
    // Card
    const cardW = Math.min(320, w - 48);
    const cardH = 420;
    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;
    
    // Card Background (Dark Blue/Purple)
    ctx.fillStyle = '#2d2d55'; // Dark blue-ish purple
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    
    // Card Border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Content
    const centerX = w / 2;
    let currY = cardY + 50;
    
    // Icon
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '64px sans-serif';
    ctx.fillText(isSuccess ? '🏆' : '😢', centerX, currY);
    
    currY += 60;
    
    // Title
    ctx.font = '800 32px "Manrope", sans-serif';
    const title = isSuccess ? '恭喜通关！' : '挑战失败';
    const tw = ctx.measureText(title).width;
    const tGrad = ctx.createLinearGradient(centerX - tw/2, currY - 20, centerX + tw/2, currY + 20);
    if (isSuccess) {
      tGrad.addColorStop(0, '#fde047'); // yellow
      tGrad.addColorStop(1, '#fb923c'); // orange
    } else {
      tGrad.addColorStop(0, '#fca5a5'); // red-300
      tGrad.addColorStop(1, '#ef4444'); // red-500
    }
    ctx.fillStyle = tGrad;
    ctx.fillText(title, centerX, currY);
    
    currY += 40;
    
    // Subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px "Manrope", sans-serif';
    const subtitle = isSuccess 
      ? '你已成功完成 1-100 舒尔特方格挑战！' 
      : '很遗憾，你在规定时间内未完成挑战';
    ctx.fillText(subtitle, centerX, currY);
    
    currY += 30;
    
    // Time & Progress
    const timeStr = this.formatTime(gameState.elapsedTime || gameState.time || 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px "Manrope", sans-serif';
    if (isSuccess) {
      ctx.fillText(`用时 ${timeStr}`, centerX, currY);
    } else {
      const progress = gameState.completed || 0;
      const total = gameState.totalNumbers || 100;
      ctx.fillText(`进度 ${progress}/${total} · 用时 ${timeStr}`, centerX, currY);
    }
    
    currY += 50;
    
    // Avatar Badge Section (Only for success)
    if (isSuccess) {
      const badgeY = currY;
      // Green Circle Badge
      ctx.beginPath();
      ctx.arc(centerX - 60, badgeY, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; // emerald-500
      ctx.fill();
      ctx.strokeStyle = '#fbbf24'; // amber ring
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Star inside badge
      ctx.fillStyle = '#fbbf24';
      ctx.font = '20px sans-serif';
      ctx.fillText('*', centerX - 60, badgeY + 2);
      
      // Text
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px "Manrope", sans-serif';
      ctx.fillText('你的头像已加入通关榜', centerX - 30, badgeY);
    } else {
      // For failure, maybe show a "Try Again" hint or just empty space
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px "Manrope", sans-serif';
      ctx.fillText('不要灰心，下次一定行', centerX, currY);
    }
    
    currY += 60;
    
    // Button
    const btnW = cardW - 60;
    const btnH = 50;
    const btnX = centerX - btnW / 2;
    const btnY = currY;
    
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    if (isSuccess) {
      btnGrad.addColorStop(0, '#f97316'); // orange-500
      btnGrad.addColorStop(1, '#ef4444'); // red-500
    } else {
      btnGrad.addColorStop(0, '#64748b'); // slate-500
      btnGrad.addColorStop(1, '#475569'); // slate-600
    }
    ctx.fillStyle = btnGrad;
    
    // Button Shadow
    ctx.shadowColor = isSuccess ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 25);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Manrope", sans-serif';
    ctx.fillText('返回首页', centerX, btnY + btnH/2);
    
    this.buttons = [{ id: 'home', x: btnX, y: btnY, width: btnW, height: btnH }];
    
    ctx.restore();
  }

  drawConfetti(ctx, w, h) {
    // Deterministic random based on simple seed or just random
    // Since this is likely drawn once per frame or static, we need to be careful.
    // If it's static, Math.random() is fine.
    
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6', '#d946ef'];
    
    for (let i = 0; i < 50; i++) {
       const x = Math.random() * w;
       const y = Math.random() * h;
       const size = Math.random() * 8 + 4;
       const color = colors[Math.floor(Math.random() * colors.length)];
       const rotation = Math.random() * Math.PI * 2;
       
       ctx.save();
       ctx.translate(x, y);
       ctx.rotate(rotation);
       ctx.fillStyle = color;
       ctx.fillRect(-size/2, -size/2, size, size * 0.6); // rectangular confetti
       ctx.restore();
    }
    
    for (let i = 0; i < 30; i++) {
       const x = Math.random() * w;
       const y = Math.random() * h;
       const size = Math.random() * 6 + 3;
       const color = colors[Math.floor(Math.random() * colors.length)];
       
       ctx.beginPath();
       ctx.arc(x, y, size/2, 0, Math.PI * 2);
       ctx.fillStyle = color;
       ctx.fill();
    }
  }

  renderAuthorizationScreen(data = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(0.5, '#BBDEFB');
    gradient.addColorStop(1, '#90CAF9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#1976D2';
    ctx.font = `${Math.floor(w * 0.15)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔐', w / 2, h * 0.2);
    ctx.restore();
    ctx.fillStyle = '#1565C0';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('需要授权登录', w / 2, h * 0.32);
    const explanationLines = [
      '为了保存您的游戏进度和成绩',
      '需要获取您的抖音账号信息',
      '',
      '我们承诺：',
      '- 仅用于游戏数据同步',
      '- 不会获取您的个人隐私',
      '- 可随时在设置中取消授权'
    ];
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    let startY = h * 0.42;
    const lineHeight = Math.floor(w * 0.05);
    explanationLines.forEach((line, index) => {
      if (line.startsWith('-')) {
        ctx.textAlign = 'left';
        ctx.fillText(line, w * 0.15, startY + index * lineHeight);
        ctx.textAlign = 'center';
      } else if (line === '我们承诺：') {
        ctx.save();
        ctx.font = `bold ${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = '#1976D2';
        ctx.fillText(line, w / 2, startY + index * lineHeight);
        ctx.restore();
      } else if (line !== '') {
        ctx.fillText(line, w / 2, startY + index * lineHeight);
      }
    });
    this.drawButton(ctx, { x: w * 0.1, y: h * 0.75, width: w * 0.35, height: 50, text: '同意授权', color: '#4CAF50', textColor: '#FFFFFF', id: 'authorize' });
    this.drawButton(ctx, { x: w * 0.55, y: h * 0.75, width: w * 0.35, height: 50, text: '暂不授权', color: '#FF7043', textColor: '#FFFFFF', id: 'deny' });
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(w * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择暂不授权将使用本地存储，无法跨设备同步', w / 2, h * 0.88);
  }

  renderLevel2CompleteScreen(stats) {
     this.renderResultScreen(stats);
  }

  drawUnlockNotification(ctx, config) {
    const { x, y, width, height } = config;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#CBE8E6');
    gradient.addColorStop(1, '#BDDAD8');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, x, y, width, height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2D4A49';
    ctx.font = `bold ${Math.floor(this.width * 0.06)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OK', x + width / 2, y + height * 0.3);
    ctx.font = `bold ${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('自选模式已解锁', x + width / 2, y + height * 0.6);
    ctx.font = `${Math.floor(this.width * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('可自由选择 1-10 练习或 1-100 挑战', x + width / 2, y + height * 0.8);
  }

  drawButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 25);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = btn.textColor || '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawButtonWithTheme(ctx, btn) {
    if (!this.themeSystem) {
      this.drawButton(ctx, { ...btn, color: btn.type === 'primary' ? '#FF6B6B' : '#4CAF50', textColor: '#FFFFFF' });
      return;
    }
    const buttonStyle = this.themeSystem.getButtonStyle(btn.type || 'primary');
    ctx.save();
    this.themeSystem.applyButtonGradient(ctx, btn.x, btn.y, btn.width, btn.height, btn.type || 'primary', 'normal');
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, buttonStyle.borderRadius || 25);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, buttonStyle.borderRadius || 25);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = buttonStyle.textColor;
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    ctx.restore();
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawLockedButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#BDBDBD';
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 25);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(this.width * 0.04)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
      ctx.fillText('🔒', btn.x + btn.width / 2 - 40, btn.y + btn.height / 2);
    ctx.fillStyle = '#757575';
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px Arial, sans-serif`;
    ctx.fillText(btn.text, btn.x + btn.width / 2 + 10, btn.y + btn.height / 2);
  }

  drawDifficultyButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 - 10);
    if (btn.time > 0) {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`限时 ${btn.time}秒`, btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    } else {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText('无时间限制', btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    }
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height, time: btn.time });
  }

  drawSmallButton(ctx, btn) {
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawCustomModeButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (btn.description) {
      ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 - 8);
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(btn.description, btn.x + btn.width / 2, btn.y + btn.height / 2 + 12);
    } else {
      ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawResultCard(ctx, card) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, card.x, card.y, card.width, card.height, 15);
    ctx.fill();
    ctx.restore();
    const centerX = card.x + card.width / 2;
    const startY = card.y + 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('完成数量', centerX, startY);
    ctx.fillStyle = '#4CAF50';
    ctx.font = `bold ${Math.floor(this.width * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${card.stats.completed}/100`, centerX, startY + 30);
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`用时: ${this.formatTime(card.stats.time)}`, centerX - 80, startY + 80);
    ctx.fillText(`错误: ${card.stats.errors}次`, centerX + 80, startY + 80);
    if (card.stats.maxCombo > 0) {
      ctx.fillText(`最高连击: ${card.stats.maxCombo}`, centerX, startY + 120);
    }
  }

  drawDecorativeCircles(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    const circles = [
      { x: this.width * 0.1, y: this.height * 0.1, r: 40 },
      { x: this.width * 0.9, y: this.height * 0.15, r: 30 },
      { x: this.width * 0.15, y: this.height * 0.85, r: 35 },
      { x: this.width * 0.85, y: this.height * 0.9, r: 25 }
    ];
    circles.forEach((circle) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  setUserProfileManager(userProfileManager) {
    this.userProfileManager = userProfileManager;
  }

  handleClick(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        return btn;
      }
    }
    return null;
  }

  render(screen, data) {
    console.log('UIManager.render screen:', screen);
    this.buttons = [];
    this.currentScreen = screen;
    switch (screen) {
      case 'start':
        console.log('渲染开始界面');
        this.renderStartScreen(data || {});
        console.log('开始界面渲染完成');
        break;
      case 'difficultySelect':
        console.log('渲染难度选择界面');
        this.renderDifficultySelectScreen();
        break;
      case 'customModeSelect':
        console.log('渲染自选模式选择界面');
        this.renderCustomModeSelectScreen();
        break;
      case 'customModeExplanation':
        console.log('渲染自选模式说明界面');
        this.renderCustomModeExplanationScreen();
        break;
      case 'customTimeSelect':
        console.log('渲染自选模式时间选择界面');
        this.renderCustomTimeSelectScreen(data);
        break;
      case 'modeSelect100':
        this.renderModeSelect100Screen(data);
        break;
      case 'result':
        console.log('渲染结果界面');
        this.renderResultScreen(data);
        break;
      case 'level2Complete':
        console.log('渲染第二关完成界面');
        this.renderLevel2CompleteScreen(data);
        break;
      case 'authorization':
        console.log('渲染授权引导界面');
        this.renderAuthorizationScreen(data);
        break;
      default:
        console.error('未知的screen:', screen);
    }
  }
}

module.exports = UIManager;
