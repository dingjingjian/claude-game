// 主游戏场景
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 游戏状态
        this.isPaused = false;
        this.passiveEarningTimer = 0;
        this.stationTimer = 0;
        this.stationInterval = 35; // 每35秒生成一个车站

        // 进站减速状态
        this.waitingToLoad = false;
        this.waitingStation = null;

        // 到站装卸状态
        this.isLoading = false;
        this.loadingTimer = 0;
        this.loadingDuration = 5; // 装卸货等待时间（秒）
        this.loadingText = null;
        this.loadingBar = null;
        this.loadingBarBg = null;

        // 创建背景
        this.createBackground(width, height);

        // 创建铁轨
        this.createRails(width, height);

        // 创建车站组
        this.stations = this.add.group();

        // 创建火车
        this.createTrain(width, height);

        // 创建金币动画组
        this.coinTexts = this.add.group();

        // 创建UI
        this.createUI(width, height);

        // 创建速度控制杆
        this.createSpeedLever(width, height);

        // 创建升级面板
        this.createUpgradePanel(width, height);

        // 显示离线收益
        if (gameData.get('offlineEarnings') > 0) {
            this.showOfflineEarnings(gameData.get('offlineEarnings'));
            gameData.data.offlineEarnings = 0;
        }

        // 自动保存
        this.time.addEvent({
            delay: 30000,
            callback: () => gameData.save(),
            loop: true
        });

        // 生成初始车站
        this.spawnStation(width);

        // 更新UI
        this.updateUI();
    }

    createBackground(width, height) {
        // 天空渐变（固定）
        const skyGradient = this.add.graphics();
        skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FA, 0xE0F7FA, 1);
        skyGradient.fillRect(0, 0, width, height * 0.6);

        // 远山（视差背景，绘制足够宽以便无缝循环）
        this.mountainWidth = 20 * 250;
        this.mountains = this.add.container(0, 0);
        const mountainsGfx = this.add.graphics();
        mountainsGfx.fillStyle(0x228B22, 0.6);
        const mountainPeaks = [];
        for (let i = 0; i < 20; i++) {
            const x = i * 250 - 50;
            const peakHeight = 100 + Math.random() * 80;
            mountainPeaks.push({ x, peakHeight });
            mountainsGfx.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - peakHeight, x + 250, height * 0.45);
        }
        // 第二套山：偏移 mountainWidth，在 wrap 点与第一套重叠衔接
        for (let i = 0; i < mountainPeaks.length; i++) {
            const src = mountainPeaks[i];
            const x = src.x + this.mountainWidth;
            mountainsGfx.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - src.peakHeight, x + 250, height * 0.45);
        }
        this.mountains.add(mountainsGfx);

        // 云朵（视差移动）
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            const cloud = this.add.graphics();
            const cloudX = i * 200 + Math.random() * 100;
            const cloudY = 50 + Math.random() * 100;
            // 绘制在原点附近，用 x 属性控制位置
            cloud.fillStyle(0xFFFFFF, 0.8);
            cloud.fillCircle(0, 0, 25);
            cloud.fillCircle(20, -10, 20);
            cloud.fillCircle(40, 0, 25);
            cloud.x = cloudX;
            cloud.y = cloudY;
            this.clouds.push(cloud);
        }

        // 树木（视差背景，双sprite无缝平铺）
        const treeStripWidth = 1500;
        const treeCount = 25;
        const treeGfx = this.make.graphics({ x: 0, y: 0, add: false });
        for (let i = 0; i < treeCount; i++) {
            const treeX = i * 60 + Math.random() * 20;
            const treeHeight = 30 + Math.random() * 40;
            treeGfx.fillStyle(0x8B4513);
            treeGfx.fillRect(treeX, height * 0.55 - treeHeight, 8, treeHeight);
            treeGfx.fillStyle(0x228B22);
            treeGfx.fillCircle(treeX + 4, height * 0.55 - treeHeight - 15, 20);
        }
        treeGfx.generateTexture('trees-strip', treeStripWidth, height);
        treeGfx.destroy();

        this.trees1 = this.add.image(0, 0, 'trees-strip').setOrigin(0, 0);
        this.trees2 = this.add.image(treeStripWidth, 0, 'trees-strip').setOrigin(0, 0).setFlipX(true);
        this.treeStripWidth = treeStripWidth;

        // 地面和草地（视差背景）
        this.ground = this.add.container(0, 0);
        const groundGfx = this.add.graphics();
        groundGfx.fillStyle(0x8B4513);
        groundGfx.fillRect(-width, height * 0.65, width * 3, height * 0.35);
        groundGfx.fillStyle(0x228B22);
        groundGfx.fillRect(-width, height * 0.62, width * 3, 15);
        this.ground.add(groundGfx);
    }

    createRails(width, height) {
        const railY = height * 0.68;

        // 铁轨（视差背景，绘制足够宽以便无缝循环）
        this.rails = this.add.container(0, 0);
        const railsGfx = this.add.graphics();

        // 枕木
        railsGfx.fillStyle(0x8B4513);
        for (let x = -width; x < width * 2; x += 30) {
            railsGfx.fillRect(x, railY - 2, 20, 8);
        }

        // 铁轨
        railsGfx.lineStyle(3, 0x666666);
        railsGfx.beginPath();
        railsGfx.moveTo(-width, railY);
        railsGfx.lineTo(width * 2, railY);
        railsGfx.strokePath();

        railsGfx.beginPath();
        railsGfx.moveTo(-width, railY + 6);
        railsGfx.lineTo(width * 2, railY + 6);
        railsGfx.strokePath();

        this.rails.add(railsGfx);
        this.railsTileWidth = width;
    }

    createTrain(width, height) {
        const trainY = height * 0.65 + 21;
        const trainX = width * 0.5; // 火车固定在屏幕中间

        // 火车容器
        this.train = this.add.container(trainX, trainY);
        this.train.setDepth(10); // 火车在最上层

        // 记录基准Y位置，用于起伏动画
        this.trainBaseY = trainY;
        this.trainBobTime = 0;
        this.trainCenterX = 0;

        // 添加车头
        this.locomotive = this.add.image(60, 0, 'locomotive');
        this.locomotive.setOrigin(0.5, 1);
        this.locomotive.setScale(0.22);
        this.train.add(this.locomotive);

        // 蒸汽效果（Tween驱动，不依赖ParticleEmitter）
        this.steamOffsetX = 48;
        this.steamOffsetY = -50;
        // 气缸位置（车头前下方）
        this.cylinderOffsetX = 36;
        this.cylinderOffsetY = -10;
        this.steamPool = [];
        this.steamIndex = 0;
        this.steamTimer = 0;
        for (let i = 0; i < 40; i++) {
            const puff = this.add.image(0, 0, 'steam-particle');
            puff.setScale(0.8);
            puff.setAlpha(0);
            puff.setDepth(20);
            this.steamPool.push(puff);
        }

        // 添加初始车厢
        this.updateTrainCarriages();
    }


    updateTrainCarriages() {
        // 清除现有车厢（保留车头）
        while (this.train.length > 1) {
            this.train.getAt(1).destroy();
        }

        const carriages = gameData.get('carriages');
        const carriageScale = 0.22;
        const carriageSpacing = 130;
        let offsetX = -72; // 第一节车厢紧接车头左侧

        // 添加客车厢
        for (let i = 0; i < carriages.passenger; i++) {
            const car = this.add.image(offsetX, 0, 'passenger-car');
            car.setOrigin(0.5, 1);
            car.setScale(carriageScale);
            this.train.add(car);
            offsetX -= carriageSpacing;
        }

        // 添加餐车
        for (let i = 0; i < carriages.dining; i++) {
            const car = this.add.image(offsetX, 0, 'dining-car');
            car.setOrigin(0.5, 1);
            car.setScale(carriageScale);
            this.train.add(car);
            offsetX -= carriageSpacing;
        }

        // 添加货车厢
        for (let i = 0; i < carriages.freight; i++) {
            const car = this.add.image(offsetX, 0, 'freight-car');
            car.setOrigin(0.5, 1);
            car.setScale(carriageScale);
            this.train.add(car);
            offsetX -= carriageSpacing;
        }

        // 添加油罐车
        for (let i = 0; i < carriages.oil; i++) {
            const car = this.add.image(offsetX, 0, 'oil-car');
            car.setOrigin(0.5, 1);
            car.setScale(carriageScale);
            this.train.add(car);
            offsetX -= carriageSpacing;
        }

        // 自动居中：根据火车总宽度调整容器位置
        this.centerTrain();
    }

    centerTrain() {
        const totalCarriages = this.train.length - 1; // 减去车头
        if (totalCarriages <= 0) {
            this.train.x = this.cameras.main.width * 0.5;
            return;
        }

        // 车头右边缘
        const locoRight = this.locomotive.x + this.locomotive.displayWidth * 0.5;
        // 最后一节车厢的左边缘（最后一个child就是最远的车厢）
        const lastCar = this.train.getAt(this.train.length - 1);
        const lastCarLeft = lastCar.x - lastCar.displayWidth * 0.5;

        // 火车总宽度（从最左到最右）
        const trainWidth = locoRight - lastCarLeft;
        // 火车视觉中心（容器内坐标）
        this.trainCenterX = (locoRight + lastCarLeft) * 0.5;

        // 让火车视觉中心对齐屏幕中心
        this.train.x = this.cameras.main.width * 0.5 - this.trainCenterX;
    }

    emitSteamPuff(speed = 0, offsetX = 0, offsetY = 0, scaleMul = 1, tint = 0xdddddd, driftMul = 1, durationMul = 1) {
        const puff = this.steamPool[this.steamIndex];
        this.steamIndex = (this.steamIndex + 1) % this.steamPool.length;

        // 停掉上一轮 tween
        if (puff._tween) {
            puff._tween.stop();
        }

        // 直接用车头的实时世界坐标（不依赖 _trainRef）
        const locoWorldX = this.train.x + this.locomotive.x;
        const locoWorldY = this.train.y + this.locomotive.y;
        const startX = locoWorldX + offsetX + (Math.random() - 0.5) * 10;
        const startY = locoWorldY + offsetY + (Math.random() - 0.5) * 5;

        puff.setPosition(startX, startY);
        puff.setScale(0.6 * scaleMul);
        puff.setAlpha(1);
        puff.setTint(tint);
        puff.setVisible(true);

        // sigmoid 曲线：低速少飘，100左右饱和
        const speedFactor = 400 / (1 + Math.exp(-(speed - 80) / 30));
        const driftX = -(50 + speedFactor + Math.random() * 60) * driftMul;  // 向左飘，和速度挂钩
        const driftY = -(60 + Math.random() * 80);

        puff._tween = this.tweens.add({
            targets: puff,
            x: startX + driftX,
            y: startY + driftY,
            scale: { from: 0.8 * scaleMul, to: 2.8 * scaleMul },
            alpha: { from: 1, to: 0 },
            duration: (2000 + Math.random() * 1000) * durationMul,
            ease: 'Quad.easeOut',
            onComplete: () => {
                puff.setVisible(false);
                puff.setAlpha(0);
            }
        });
    }

    createUI(width, height) {
        // 顶部信息栏背景
        const uiBg = this.add.graphics();
        uiBg.fillStyle(0x1a1a2e, 0.9);
        uiBg.fillRect(0, 0, width, 60);
        uiBg.lineStyle(2, 0x0f3460);
        uiBg.strokeRect(0, 0, width, 60);
        uiBg.setDepth(20); // UI在最上层

        // 金币图标
        const coinIcon = this.add.image(30, 30, 'coin');
        coinIcon.setDepth(20);

        // 金币文字
        this.goldText = this.add.text(55, 24, '0', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 前缀+净收入
        this.earningPrefixText = this.add.text(55, 44, '每秒: ', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 净收入数值
        this.earningNetText = this.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 收入部分
        this.earningIncomeText = this.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#00FF00'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 维护部分
        this.earningMaintText = this.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#FF6347'
        }).setOrigin(0, 0.5).setDepth(20);

        // 速度显示
        this.speedText = this.add.text(width / 2, 30, '', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            color: '#87CEEB'
        }).setOrigin(0.5).setDepth(20);

        // 车厢统计
        this.carriageText = this.add.text(width - 20, 12, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 到站收益统计
        this.stationText = this.add.text(width - 20, 36, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 升级按钮
        this.upgradeBtn = this.add.image(width / 2, height - 45, 'btn-upgrade')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => this.upgradeBtn.setTexture('btn-upgrade-hover'))
            .on('pointerout', () => this.upgradeBtn.setTexture('btn-upgrade'))
            .on('pointerdown', () => this.toggleUpgradePanel());

        this.upgradeBtnText = this.add.text(width / 2, height - 45, '升级', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20);

        // 暂停按钮
        const pauseBtn = this.add.image(width - 80, height - 40, 'btn-pause')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => pauseBtn.setTexture('btn-pause-hover'))
            .on('pointerout', () => pauseBtn.setTexture('btn-pause'));
        
        const pauseBtnText = this.add.text(width - 80, height - 40, '⏸ 暂停', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20);

        pauseBtn.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            pauseBtnText.setText(this.isPaused ? '▶ 继续' : '⏸ 暂停');
        });

        // 音效开关按钮
        this.soundEnabled = true;
        const soundBtn = this.add.image(width - 220, height - 40, 'btn-sound')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => soundBtn.setTexture('btn-sound-hover'))
            .on('pointerout', () => soundBtn.setTexture('btn-sound'));
        
        const soundBtnText = this.add.text(width - 220, height - 40, '🔊 音效', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20);

        soundBtn.on('pointerdown', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtnText.setText(this.soundEnabled ? '🔊 音效' : '🔇 静音');
        });

        // 重置按钮
        const resetBtn = this.add.image(80, height - 40, 'btn-reset')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => resetBtn.setTexture('btn-reset-hover'))
            .on('pointerout', () => resetBtn.setTexture('btn-reset'));
        
        const resetBtnText = this.add.text(80, height - 40, '↻ 重置', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20);

        resetBtn.on('pointerdown', () => {
            this.showResetConfirm(width, height);
        });

        // 装卸货进度条（默认隐藏）
        this.loadingBarBg = this.add.graphics();
        this.loadingBarBg.setDepth(25);
        this.loadingBarBg.setVisible(false);

        this.loadingBar = this.add.graphics();
        this.loadingBar.setDepth(26);
        this.loadingBar.setVisible(false);

        this.loadingText = this.add.text(0, 0, '装卸货中...', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(27);
        this.loadingText.setVisible(false);
    }

    createSpeedLever(width, height) {
        const maxSpeed = gameData.get('locomotive').speed;
        const targetSpeed = gameData.get('targetSpeed');

        // 控制杆参数
        const leverX = width - 35;
        const leverTop = 110;
        const leverBottom = height - 110;
        const leverHeight = leverBottom - leverTop;
        const trackWidth = 18;
        const handleRadius = 16;

        this.leverX = leverX;
        this.leverTop = leverTop;
        this.leverBottom = leverBottom;
        this.leverHeight = leverHeight;

        // 控制杆容器
        this.leverContainer = this.add.container(0, 0);
        this.leverContainer.setDepth(20);

        // 轨道背景（凹槽）
        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x111122, 0.9);
        trackBg.fillRoundedRect(leverX - trackWidth / 2, leverTop, trackWidth, leverHeight, 9);
        trackBg.lineStyle(2, 0x334466);
        trackBg.strokeRoundedRect(leverX - trackWidth / 2, leverTop, trackWidth, leverHeight, 9);
        this.leverContainer.add(trackBg);

        // 填充条（从底部到当前速度位置）
        this.leverFill = this.add.graphics();
        this.leverContainer.add(this.leverFill);

        // 刻度线
        const tickCount = 6;
        for (let i = 0; i <= tickCount; i++) {
            const y = leverBottom - (i / tickCount) * leverHeight;
            const tickW = (i % 3 === 0) ? 10 : 6;
            const tick = this.add.graphics();
            tick.lineStyle(1, 0x556688);
            tick.beginPath();
            tick.moveTo(leverX - trackWidth / 2 - 3, y);
            tick.lineTo(leverX - trackWidth / 2 - 3 - tickW, y);
            tick.strokePath();
            this.leverContainer.add(tick);
        }

        // "0" 标签（底部）
        const label0 = this.add.text(leverX, leverBottom + 16, '0', {
            fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#667788'
        }).setOrigin(0.5);
        this.leverContainer.add(label0);

        // 极速标签（顶部）
        this.leverMaxLabel = this.add.text(leverX, leverTop -16, `${maxSpeed}`, {
            fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#667788'
        }).setOrigin(0.5);
        this.leverContainer.add(this.leverMaxLabel);

        // 当前速度数值显示
        this.leverSpeedLabel = this.add.text(leverX - 30, leverTop -16, `${Math.round(targetSpeed)}`, {
            fontSize: '16px', fontFamily: 'Microsoft YaHei', color: '#3c89e8', fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        this.leverContainer.add(this.leverSpeedLabel);

        // 控制杆手柄
        this.leverHandle = this.add.graphics();
        this.leverContainer.add(this.leverHandle);

        // 手柄初始位置
        this.leverHandleY = this.speedToLeverY(targetSpeed);
        this.drawLeverHandle(this.leverHandleY);
        this.drawLeverFill(this.leverHandleY);

        // 交互区域（整个轨道可点击拖拽）
        const hitZone = this.add.rectangle(leverX, leverTop + leverHeight / 2, trackWidth + 30, leverHeight + 20)
            .setInteractive({ useHandCursor: true, draggable: true })
            .setDepth(21)
            .setAlpha(0.001);

        this.leverDragging = false;

        hitZone.on('pointerdown', (pointer) => {
            if (this.waitingToLoad || this.isLoading) return;
            this.leverDragging = true;
            this.updateLeverFromPointer(pointer);
        });

        hitZone.on('drag', (pointer) => {
            if (this.waitingToLoad || this.isLoading) return;
            this.updateLeverFromPointer(pointer);
        });

        hitZone.on('pointerup', () => {
            this.leverDragging = false;
        });

        hitZone.on('pointerupoutside', () => {
            this.leverDragging = false;
        });

        this.leverHitZone = hitZone;
    }

    speedToLeverY(speed) {
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
        return this.leverBottom - ratio * this.leverHeight;
    }

    leverYToSpeed(y) {
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = Math.max(0, Math.min(1, (this.leverBottom - y) / this.leverHeight));
        return ratio * maxSpeed;
    }

    drawLeverHandle(y) {
        this.leverHandle.clear();
        // 手柄底色
        const speed = this.leverYToSpeed(y);
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = speed / maxSpeed;
        // 颜色：绿 → 黄 → 红
        let color;
        if (ratio < 0.5) {
            color = Phaser.Display.Color.Interpolate.ColorWithColor(
                new Phaser.Display.Color(76, 175, 80),
                new Phaser.Display.Color(255, 193, 7),
                100, ratio * 200
            );
        } else {
            color = Phaser.Display.Color.Interpolate.ColorWithColor(
                new Phaser.Display.Color(255, 193, 7),
                new Phaser.Display.Color(244, 67, 54),
                100, (ratio - 0.5) * 200
            );
        }
        const handleColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        // 手柄阴影
        this.leverHandle.fillStyle(0x000000, 0.3);
        this.leverHandle.fillRoundedRect(this.leverX - 15, y - 8 + 2, 30, 16, 6);
        // 手柄主体
        this.leverHandle.fillStyle(handleColor);
        this.leverHandle.fillRoundedRect(this.leverX - 15, y - 8, 30, 16, 6);
        this.leverHandle.lineStyle(1, 0xffffff, 0.4);
        this.leverHandle.strokeRoundedRect(this.leverX - 15, y - 8, 30, 16, 6);
        // 手柄中间凹槽线
        this.leverHandle.lineStyle(1, 0x000000, 0.2);
        this.leverHandle.beginPath();
        this.leverHandle.moveTo(this.leverX - 6, y - 2);
        this.leverHandle.lineTo(this.leverX - 6, y + 2);
        this.leverHandle.moveTo(this.leverX, y - 2);
        this.leverHandle.lineTo(this.leverX, y + 2);
        this.leverHandle.moveTo(this.leverX + 6, y - 2);
        this.leverHandle.lineTo(this.leverX + 6, y + 2);
        this.leverHandle.strokePath();
    }

    drawLeverFill(handleY) {
        this.leverFill.clear();
        const fillTop = handleY;
        const fillBottom = this.leverBottom;
        const fillHeight = fillBottom - fillTop;
        if (fillHeight > 0) {
            this.leverFill.fillStyle(0x2196F3, 0.25);
            this.leverFill.fillRoundedRect(this.leverX - 6, fillTop, 12, fillHeight, 3);
        }
    }

    updateLeverFromPointer(pointer) {
        const y = Math.max(this.leverTop, Math.min(this.leverBottom, pointer.y));
        const newSpeed = this.leverYToSpeed(y);
        gameData.data.targetSpeed = newSpeed;
        // 不直接跳到点击位置，只记录目标，让 update 平滑过渡
        this.leverUserTargetY = y;
    }

    // 更新控制杆外观（升级后极速变化时调用）
    refreshSpeedLever() {
        const maxSpeed = gameData.get('locomotive').speed;
        const targetSpeed = gameData.get('targetSpeed');
        this.leverMaxLabel.setText(`${maxSpeed}`);
        this.leverHandleY = this.speedToLeverY(targetSpeed);
        this.drawLeverHandle(this.leverHandleY);
        this.drawLeverFill(this.leverHandleY);
        this.leverSpeedLabel.setText(`${Math.round(targetSpeed)}`);
    }

    createUpgradePanel(width, height) {
        // 升级面板容器
        this.upgradePanel = this.add.container(width / 2, height / 2);
        this.upgradePanel.setVisible(false);
        this.upgradePanel.setDepth(100);

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(-320, -230, 640, 460, 16);
        panelBg.lineStyle(3, 0x0f3460);
        panelBg.strokeRoundedRect(-320, -230, 640, 460, 16);
        this.upgradePanel.add(panelBg);

        // 标题
        const title = this.add.text(0, -190, '升级中心', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.upgradePanel.add(title);

        // 升级选项
        this.upgradeOptions = [];
        const options = [
            { key: 'locomotive', name: '升级车头', desc: '', icon: 'locomotive' },
            { key: 'freight', name: '货车厢', desc: '到站高收益', icon: 'freight-car' },
            { key: 'oil', name: '油罐车', desc: '货运到站+20%', icon: 'oil-car' },
            { key: 'passenger', name: '客车厢', desc: '每秒高收益', icon: 'passenger-car' },
            { key: 'dining', name: '餐车', desc: '客运每秒+20%', icon: 'dining-car' }
        ];

        options.forEach((opt, index) => {
            const y = -160 + index * 76;

            // 选项背景
            const optBg = this.add.graphics();
            optBg.fillStyle(0x16213e, 0.8);
            optBg.fillRoundedRect(-300, y, 600, 68, 8);
            this.upgradePanel.add(optBg);

            // 图标
            const icon = this.add.image(-230, y + 34, opt.icon).setScale(0.17);
            this.upgradePanel.add(icon);

            // 名称和描述
            const nameText = this.add.text(-160, y + 14, opt.name, {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.upgradePanel.add(nameText);

            const descText = this.add.text(-160, y + 40, opt.desc, {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#aaaaaa'
            });
            this.upgradePanel.add(descText);

            // 数量/等级
            const countText = this.add.text(-70, y + 24, '', {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#87CEEB'
            }).setOrigin(0, 0.5);
            this.upgradePanel.add(countText);

            // 脱钩按钮
            const detachBtn = this.add.image(110, y + 34, 'btn-danger')
                .setScale(0.6)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => detachBtn.setTexture('btn-danger-hover'))
                .on('pointerout', () => detachBtn.setTexture('btn-danger'));
            this.upgradePanel.add(detachBtn);

            const detachText = this.add.text(110, y + 34, '脱钩', {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.upgradePanel.add(detachText);

            // 购买按钮
            const btnTexture = opt.key === 'locomotive' ? 'btn-locomotive' : 'btn-buy';
            const btnHoverTexture = opt.key === 'locomotive' ? 'btn-locomotive-hover' : 'btn-buy-hover';
            const buyBtn = this.add.image(220, y + 34, btnTexture)
                .setScale(0.6)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (buyBtn.texture.key !== 'btn-disabled') buyBtn.setTexture(btnHoverTexture);
                })
                .on('pointerout', () => {
                    if (buyBtn.texture.key === btnHoverTexture) buyBtn.setTexture(btnTexture);
                });
            this.upgradePanel.add(buyBtn);

            const priceText = this.add.text(220, y + 34, '', {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#FFD700'
            }).setOrigin(0.5);
            this.upgradePanel.add(priceText);

            buyBtn.on('pointerdown', () => {
                if (opt.key === 'locomotive') {
                    if (gameData.upgradeLocomotive()) {
                        this.updateTrainCarriages();
                        this.refreshSpeedLever();
                        this.showFloatingText('车头升级!', 220, y + 34, '#00FF00');
                    }
                } else {
                    if (gameData.buyCarriage(opt.key)) {
                        this.updateTrainCarriages();
                        this.showFloatingText('购买成功!', 220, y + 34, '#00FF00');
                    }
                }
                this.updateUpgradePanel();
                this.updateUI();
            });

            detachBtn.on('pointerdown', () => {
                if (opt.key !== 'locomotive') {
                    if (gameData.detachCarriage(opt.key)) {
                        this.updateTrainCarriages();
                        this.showFloatingText('脱钩成功!', -55, y + 34, '#FF6347');
                    }
                    this.updateUpgradePanel();
                    this.updateUI();
                }
            });

            this.upgradeOptions.push({
                key: opt.key,
                countText,
                priceText,
                descText,
                buyBtn,
                detachBtn,
                detachText
            });
        });

        // 关闭按钮
        const closeBtn = this.add.text(300, -210, '✕', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            color: '#e94560'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.upgradePanel.add(closeBtn);

        closeBtn.on('pointerdown', () => this.toggleUpgradePanel());
    }

    toggleUpgradePanel() {
        this.upgradePanel.setVisible(!this.upgradePanel.visible);
        if (this.upgradePanel.visible) {
            this.updateUpgradePanel();
        }
    }

    updateUpgradePanel() {
        const carriages = gameData.get('carriages');
        const prices = gameData.get('prices');
        const gold = gameData.get('gold');
        const totalCarriages = carriages.freight + carriages.passenger + carriages.dining + carriages.oil;
        const maxSpeed = 300;
        const isSpeedMaxed = gameData.get('locomotive').speed >= maxSpeed;

        this.upgradeOptions.forEach(opt => {
            let count, price;

            if (opt.key === 'locomotive') {
                count = `Lv.${gameData.get('locomotive').level}`;
                price = prices.locomotive;
                // 显示维护费变化
                const currentCost = gameData.getMaintenanceCost();
                const nextLevel = gameData.get('locomotive').level + 1;
                const nextLocoSpeed = Math.min(gameData.get('locomotive').speed + 10, 300);
                const currentSpeed = gameData.get('trainSpeed');
                const nextCost = Math.floor((nextLevel + 1) * (1 + currentSpeed / 100));
                const descOpt = this.upgradeOptions.find(o => o.key === 'locomotive');
                if (descOpt && descOpt.descText) {
                    if (gameData.get('locomotive').speed >= 300) {
                        descOpt.descText.setText('已满速');
                    } else {
                        const currentLocoSpeed = gameData.get('locomotive').speed;
                        descOpt.descText.setText(`极速 ${currentLocoSpeed}→${nextLocoSpeed} km/h | 维护费 ${currentCost}→${nextCost}金/秒`);
                    }
                }
                // 车头不显示脱钩按钮
                opt.detachBtn.setVisible(false);
                opt.detachText.setVisible(false);
            } else {
                count = `x${carriages[opt.key]}`;
                price = prices[opt.key];
                // 脱钩按钮：车厢数量>0时可用
                const hasCarriage = carriages[opt.key] > 0;
                opt.detachBtn.setVisible(hasCarriage);
                opt.detachText.setVisible(hasCarriage);

                // 动态更新各车厢描述
                const descOpt = this.upgradeOptions.find(o => o.key === opt.key);
                if (descOpt && descOpt.descText) {
                    switch (opt.key) {
                        case 'freight': {
                            const oilBonus = carriages.oil * 20;
                            const perSec = 2;
                            const perStation = 25 * (1 + carriages.oil * 0.2);
                            const bonusText = oilBonus > 0 ? ` (油罐+${oilBonus}%)` : '';
                            descOpt.descText.setText(`+${perSec} 金/秒  到站+${perStation.toFixed(0)}${bonusText}`);
                            break;
                        }
                        case 'oil': {
                            descOpt.descText.setText(`货运到站+20%/节  当前+${carriages.oil * 20}%`);
                            break;
                        }
                        case 'passenger': {
                            const diningBonus = carriages.dining * 20;
                            const perSec = 10 * (1 + carriages.dining * 0.2);
                            const bonusText = diningBonus > 0 ? ` (餐车+${diningBonus}%)` : '';
                            descOpt.descText.setText(`+${perSec.toFixed(1)} 金/秒${bonusText}  到站+10`);
                            break;
                        }
                        case 'dining': {
                            const totalPassengerEarning = carriages.passenger * 10 * (1 + carriages.dining * 0.2);
                            descOpt.descText.setText(`客运每秒+20%/节  当前客运 ${totalPassengerEarning.toFixed(1)} 金/秒`);
                            break;
                        }
                    }
                }
            }

            opt.countText.setText(count);
            opt.priceText.setText(`💰 ${price}`);

            // 车厢已达上限时禁用按钮
            const isCarriageFull = opt.key !== 'locomotive' && totalCarriages >= 5;
            
            if (isCarriageFull) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText('已满');
                opt.priceText.setColor('#333');
            } else if (opt.key === 'locomotive' && isSpeedMaxed) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText('已满速');
                opt.priceText.setColor('#333');
            } else if (gold >= price) {
                const activeTexture = opt.key === 'locomotive' ? 'btn-locomotive' : 'btn-buy';
                opt.buyBtn.setTexture(activeTexture);
                opt.priceText.setColor('#FFD700');
            } else {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setColor('#333');
            }
        });
    }

    updateUI() {
        const gold = gameData.get('gold');
        const carriages = gameData.get('carriages');
        const stationsVisited = gameData.get('stationsVisited');
        const speed = gameData.get('trainSpeed');

        this.goldText.setText(this.formatNumber(gold));
        const carriageEarning = gameData.getCarriageEarning();
        const maintenance = gameData.getMaintenanceCost();
        const net = gameData.getBaseEarning();
        const netStr = net >= 0 ? `+${this.formatNumber(net)}` : this.formatNumber(net);

        // 净收入颜色：正数绿色，负数红色，0灰色
        let netColor = '#aaaaaa';
        if (net > 0) netColor = '#00FF00';
        else if (net < 0) netColor = '#FF6347';

        this.earningPrefixText.setText('每秒: ');
        this.earningNetText.setText(netStr + '  ');
        this.earningNetText.setColor(netColor);
        this.earningIncomeText.setText(`(收入:${this.formatNumber(carriageEarning)}，`);
        this.earningMaintText.setText(`维护:${maintenance})`);

        // 逐个定位，从左到右排列
        const baseX = 55;
        this.earningPrefixText.setX(baseX);
        this.earningNetText.setX(baseX + this.earningPrefixText.width);
        this.earningIncomeText.setX(baseX + this.earningPrefixText.width + this.earningNetText.width);
        this.earningMaintText.setX(baseX + this.earningPrefixText.width + this.earningNetText.width + this.earningIncomeText.width);
        this.speedText.setText(`🚂 当前时速: ${speed.toFixed(0)} km/h`);

        this.carriageText.setText(
            `🚃 车厢: ${carriages.freight + carriages.passenger + carriages.dining + carriages.oil}`
        );

        this.stationText.setText(`📍 到站: ${stationsVisited}次`);

        // 如果升级面板打开，同步更新按钮状态
        if (this.upgradePanel && this.upgradePanel.visible) {
            this.updateUpgradePanel();
        }
    }

    spawnStation(width) {
        const types = ['freight', 'passenger', 'mixed'];
        const type = types[Math.floor(Math.random() * types.length)];

        let textureKey;
        switch(type) {
            case 'freight': textureKey = 'station-freight'; break;
            case 'passenger': textureKey = 'station-passenger'; break;
            case 'mixed': textureKey = 'station-mixed'; break;
        }

        const station = this.add.image(width + 100, this.cameras.main.height * 0.65, textureKey);
        station.setOrigin(0.5, 1);
        station.stationType = type;
        station.setDepth(5); // 车站在火车之下
        this.stations.add(station);

        // 车站名称
        const names = {
            freight: ['货物集散中心', '煤炭转运站', '木材仓库'],
            passenger: ['中央车站', '城市客运站', '高铁站'],
            mixed: ['综合枢纽站', '城际车站', '联合车站']
        };

        const name = names[type][Math.floor(Math.random() * names[type].length)];
        const nameText = this.add.text(station.x, station.y - 85, name, {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);

        station.nameText = nameText;
    }

    showStationEarning(station) {
        const earning = gameData.getStationEarning(station.stationType);
        gameData.addGold(earning);

        // 显示收益动画
        const typeNames = {
            freight: '货运站',
            passenger: '客运站',
            mixed: '综合站'
        };

        this.showFloatingText(
            `+${this.formatNumber(earning)} (${typeNames[station.stationType]})`,
            station.x,
            station.y - 100,
            '#FFD700'
        );

        // 更新到站次数
        gameData.data.stationsVisited++;
        this.updateUI();
        // 不在这里调用 startLoading，等速度降到0后由 waitingToLoad 机制触发
    }

    startLoading(station) {
        this.isLoading = true;
        this.loadingTimer = 0;
        this.currentStation = station;

        // 显示装卸货UI
        const trainX = this.train.x;
        const trainY = this.train.y;

        this.loadingText.setText('装卸货中...');
        this.loadingText.setPosition(trainX, trainY - 80);
        this.loadingText.setVisible(true);

        this.loadingBarBg.clear();
        this.loadingBarBg.fillStyle(0x333333, 0.8);
        this.loadingBarBg.fillRoundedRect(trainX - 50, trainY - 60, 100, 12, 6);
        this.loadingBarBg.setVisible(true);

        this.loadingBar.clear();
        this.loadingBar.setVisible(true);
    }

    updateLoading(deltaSeconds) {
        if (!this.isLoading) return;

        this.loadingTimer += deltaSeconds;
        const progress = Math.min(this.loadingTimer / this.loadingDuration, 1);

        // 更新进度条
        this.loadingBar.clear();
        this.loadingBar.fillStyle(0xFFD700);
        this.loadingBar.fillRoundedRect(
            this.train.x - 48,
            this.train.y - 58,
            96 * progress,
            8,
            4
        );

        // 更新倒计时文字
        const remaining = Math.ceil(this.loadingDuration - this.loadingTimer);
        this.loadingText.setText(`装卸货中... ${remaining}s`);

        // 装卸完成
        if (this.loadingTimer >= this.loadingDuration) {
            this.finishLoading();
        }
    }

    finishLoading() {
        this.isLoading = false;
        this.loadingText.setVisible(false);
        this.loadingBar.setVisible(false);
        this.loadingBarBg.setVisible(false);
        this.loadingBar.clear();
        this.loadingBarBg.clear();
        // 恢复之前的目标速度
        if (this.savedTargetSpeed !== undefined) {
            gameData.data.targetSpeed = this.savedTargetSpeed;
            this.savedTargetSpeed = undefined;
        }
    }

    showFloatingText(text, x, y, color) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    showOfflineEarnings(amount) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(200);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width/2 - 150, height/2 - 80, 300, 160, 16);
        panel.lineStyle(3, 0xFFD700);
        panel.strokeRoundedRect(width/2 - 150, height/2 - 80, 300, 160, 16);
        panel.setDepth(201);

        const title = this.add.text(width/2, height/2 - 50, '欢迎回来！', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);

        const earningsText = this.add.text(width/2, height/2, `离线收益: +${this.formatNumber(amount)}`, {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(202);

        const confirmBtn = this.add.text(width/2, height/2 + 50, '确定', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 30, y: 8 }
        }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

        confirmBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            earningsText.destroy();
            confirmBtn.destroy();
        });
    }

    showResetConfirm(width, height) {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(300);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width / 2 - 150, height / 2 - 60, 300, 120, 16);
        panel.lineStyle(3, 0xe94560);
        panel.strokeRoundedRect(width / 2 - 150, height / 2 - 60, 300, 120, 16);
        panel.setDepth(301);

        const title = this.add.text(width / 2, height / 2 - 30, '确定要重置游戏吗？', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(302);

        const desc = this.add.text(width / 2, height / 2, '所有进度将丢失！', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(302);

        const cancelBtn = this.add.text(width / 2 - 60, height / 2 + 35, '取消', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 20, y: 6 }
        }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });

        const confirmBtn = this.add.text(width / 2 + 60, height / 2 + 35, '确定', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#e94560',
            padding: { x: 20, y: 6 }
        }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });

        cancelBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            desc.destroy();
            cancelBtn.destroy();
            confirmBtn.destroy();
        });

        confirmBtn.on('pointerdown', () => {
            gameData.reset();
        });
    }

    showBankruptScreen() {
        this.isPaused = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 16);
        panel.lineStyle(3, 0xe94560);
        panel.strokeRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 16);
        panel.setDepth(501);

        const title = this.add.text(width / 2, height / 2 - 100, '💥 破产了！', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            color: '#e94560',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(502);

        const desc = this.add.text(width / 2, height / 2 - 60, '资金链断裂，铁路公司倒闭...', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(502);

        const stats = this.add.text(width / 2, height / 2 - 10,
            `到站: ${gameData.get('stationsVisited')}次
总金币: ${this.formatNumber(gameData.get('totalGold'))}`, {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(502);

        const restartBtn = this.add.text(width / 2, height / 2 + 60, '重新开始', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#e94560',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setDepth(502).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            gameData.reset();
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    }

    update(time, delta) {
        if (this.isPaused) return;

        const deltaSeconds = delta / 1000;
        // 平滑变速：trainSpeed 向 targetSpeed 靠拢
        const targetSpeed = gameData.get('targetSpeed');
        const accelUp = 200;   // 加速快（玩家调速响应）
        const accelDown = 40;  // 减速慢（进站自然停车）
        if (gameData.data.trainSpeed < targetSpeed) {
            gameData.data.trainSpeed = Math.min(targetSpeed, gameData.data.trainSpeed + accelUp * deltaSeconds);
        } else if (gameData.data.trainSpeed > targetSpeed) {
            gameData.data.trainSpeed = Math.max(targetSpeed, gameData.data.trainSpeed - accelDown * deltaSeconds);
        }
        const speed = gameData.get('trainSpeed');
        const width = this.cameras.main.width;
        const trainScreenX = this.train.x; // 火车固定位置（不变）

        // 同步控制杆位置
        if (this.leverHandleY !== undefined) {
            if (this.waitingToLoad || this.isLoading) {
                // 自动操作：直接吸到 trainSpeed 位置
                const expectedY = this.speedToLeverY(speed);
                this.leverHandleY = expectedY;
                this.drawLeverHandle(expectedY);
                this.drawLeverFill(expectedY);
                this.leverSpeedLabel.setText(`${Math.round(speed)}`);
            } else if (this.leverDragging && this.leverUserTargetY !== undefined) {
                // 用户拖拽中：平滑过渡到用户目标位置
                this.leverHandleY += (this.leverUserTargetY - this.leverHandleY) * Math.min(1, 15 * deltaSeconds);
                this.drawLeverHandle(this.leverHandleY);
                this.drawLeverFill(this.leverHandleY);
                this.leverSpeedLabel.setText(`${Math.round(speed)}`);
            } else {
                // 正常状态：控制杆跟随 targetSpeed（用户设定值）
                const maxSpeed = gameData.get('locomotive').speed;
                const targetRatio = Math.max(0, Math.min(1, targetSpeed / maxSpeed));
                const expectedY = this.leverBottom - targetRatio * this.leverHeight;
                if (Math.abs(this.leverHandleY - expectedY) > 0.5) {
                    this.leverHandleY += (expectedY - this.leverHandleY) * Math.min(1, 15 * deltaSeconds);
                    this.drawLeverHandle(this.leverHandleY);
                    this.drawLeverFill(this.leverHandleY);
                }
                this.leverSpeedLabel.setText(`${Math.round(speed)}`);
            }
        }

        // 更新装卸货进度
        this.updateLoading(deltaSeconds);

        // 蒸汽效果 - 发射新的蒸汽泡
        if (this.steamPool && speed > 0) {
            this.steamTimer += deltaSeconds;
            const trainSpeed = speed || 0;
            const interval = Math.max(0.03, 0.1 - trainSpeed * 0.0005);
            if (this.steamTimer >= interval) {
                this.steamTimer = 0;
                // 烟囱蒸汽（深灰色）
                this.emitSteamPuff(trainSpeed, this.steamOffsetX, this.steamOffsetY, 1.2, 0x999999);
                // 气缸蒸汽（浅灰色，更小，向后飘2倍，飘速慢一倍）
                if (Math.random() < 0.4) {
                    this.emitSteamPuff(trainSpeed, this.cylinderOffsetX, this.cylinderOffsetY, 0.6, 0xdddddd, 2, 2);
                }
            }
        }

        // 火车起伏动态效果（速度越快起伏越大）
        this.trainBobTime = (this.trainBobTime || 0) + deltaSeconds * speed * 0.06;
        const bobAmount = 0.5 + speed * 0.003;
        for (let i = 0; i < this.train.length; i++) {
            const child = this.train.getAt(i);
            if (typeof child._origY === 'undefined') {
                child._origY = child.y;
            }
            child.y = child._origY + Math.sin(this.trainBobTime - i * 0.6) * bobAmount;
        }

        // 蒸汽泡跟随车头位置（用车头的世界坐标，而不是容器原点）
        const locoWorldX = this.train.x + this.locomotive.x;
        const locoWorldY = this.train.y + this.locomotive.y;
        for (let i = 0; i < this.steamPool.length; i++) {
            this.steamPool[i]._trainRef = { x: locoWorldX, y: locoWorldY };
        }

        // 移动车站（向左移动）- 速度为0时停止
        this.stations.getChildren().forEach(station => {
            if (speed > 0) {
                station.x -= speed * deltaSeconds * 1.5;
                if (station.nameText) {
                    station.nameText.x = station.x;
                }
            }

            // 检测到站（火车编组中心经过车站时）- 两阶段：先进站减速，速度到0后装卸
            const trainVisualCenterX = trainScreenX + (this.trainCenterX || 0) - 65; // 偏左半节车厢
            if (Math.abs(station.x - trainVisualCenterX) < 60 && !station.earned) {
                station.earned = true;
                this.showStationEarning(station);
                // 开始进站减速
                this.waitingToLoad = true;
                this.waitingStation = station;
                this.savedTargetSpeed = gameData.get('targetSpeed');
                gameData.data.targetSpeed = 0;
            }

            // 移除屏幕外的车站（装卸货时不移除当前车站）
            if (station.x < -200 && !(this.isLoading && station === this.currentStation)) {
                if (station.nameText) station.nameText.destroy();
                station.destroy();
            }
        });

        // 背景视差滚动（不同层不同速度，模拟远近景深）- 速度为0时停止
        if (speed > 0) {
            // 远山（最慢）
            this.mountains.x -= speed * deltaSeconds * 0.25;
            if (this.mountains.x < -this.mountainWidth) {
                this.mountains.x += this.mountainWidth;
            }

            // 树木（中速，双sprite平铺循环）
            const treeDelta = speed * deltaSeconds * 0.6;
            this.trees1.x -= treeDelta;
            this.trees2.x -= treeDelta;
            if (this.trees1.x < -this.treeStripWidth) {
                this.trees1.x = this.trees2.x + this.treeStripWidth;
            }
            if (this.trees2.x < -this.treeStripWidth) {
                this.trees2.x = this.trees1.x + this.treeStripWidth;
            }

            // 云朵（慢速视差）
            if (this.clouds) {
                this.clouds.forEach(cloud => {
                    cloud.x -= speed * deltaSeconds * 0.45;
                    if (cloud.x < -100) {
                        cloud.x = width + 100;
                    }
                });
            }

            // 地面和草地（与车站同速）
            this.ground.x -= speed * deltaSeconds * 1.5;
            if (this.ground.x < -width) {
                this.ground.x += width;
            }

            // 铁轨（与车站同速）
            this.rails.x -= speed * deltaSeconds * 1.5;
            if (this.rails.x < -this.railsTileWidth) {
                this.rails.x += this.railsTileWidth;
            }
        }

        // 进站减速完成（速度到0）→ 开始装卸
        if (this.waitingToLoad && speed <= 0.5) {
            this.waitingToLoad = false;
            this.startLoading(this.waitingStation);
        }

        // 被动收益
        this.passiveEarningTimer += deltaSeconds;
        if (this.passiveEarningTimer >= 1) {
            const earning = gameData.getBaseEarning();
            gameData.addGold(earning);
            this.passiveEarningTimer = 0;
            this.updateUI();
            // 破产检测
            if (gameData.checkBankrupt()) {
                this.showBankruptScreen();
                return;
            }
        }

        // 生成新车站
        this.stationTimer += deltaSeconds;
        if (this.stationTimer >= this.stationInterval) {
            this.spawnStation(width);
            this.stationTimer = 0;
        }
    }
}
