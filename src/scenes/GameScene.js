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
        this.stationInterval = 10; // 每10秒生成一个车站

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
        this.mountains = this.add.container(0, 0);
        const mountainsGfx = this.add.graphics();
        mountainsGfx.fillStyle(0x228B22, 0.6);
        for (let i = 0; i < 20; i++) {
            const x = i * 250 - 50;
            const peakHeight = 100 + Math.random() * 80;
            mountainsGfx.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - peakHeight, x + 250, height * 0.45);
        }
        this.mountains.add(mountainsGfx);
        this.mountainWidth = 20 * 250;

        // 云朵（视差移动）
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            const cloud = this.add.graphics();
            const cloudX = i * 200 + Math.random() * 100;
            const cloudY = 50 + Math.random() * 100;
            cloud.fillStyle(0xFFFFFF, 0.8);
            cloud.fillCircle(cloudX, cloudY, 25);
            cloud.fillCircle(cloudX + 20, cloudY - 10, 20);
            cloud.fillCircle(cloudX + 40, cloudY, 25);
            this.clouds.push(cloud);
        }

        // 树木（视差背景，绘制足够宽以便无缝循环）
        this.trees = this.add.container(0, 0);
        const treesGfx = this.add.graphics();
        for (let i = 0; i < 30; i++) {
            const treeX = i * 70 + Math.random() * 30;
            const treeHeight = 30 + Math.random() * 40;
            treesGfx.fillStyle(0x8B4513);
            treesGfx.fillRect(treeX, height * 0.55 - treeHeight, 8, treeHeight);
            treesGfx.fillStyle(0x228B22);
            treesGfx.fillCircle(treeX + 4, height * 0.55 - treeHeight - 15, 20);
        }
        this.trees.add(treesGfx);
        this.treesWidth = 30 * 70;

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

        // 添加车头（朝右），图片本身朝左需要翻转
        const locomotive = this.add.image(60, 0, 'locomotive');
        locomotive.setOrigin(0.5, 1);
        locomotive.scaleX = -1;
        this.train.add(locomotive);

        // 添加初始车厢
        this.updateTrainCarriages();
    }


    updateTrainCarriages() {
        // 清除现有车厢（保留车头）
        while (this.train.length > 1) {
            this.train.getAt(1).destroy();
        }

        const carriages = gameData.get('carriages');
        let offsetX = -40; // 第一节车厢紧接车头左侧

        // 添加货车厢
        for (let i = 0; i < carriages.freight; i++) {
            const car = this.add.image(offsetX, 2, 'freight-car');
            car.setOrigin(0.5, 1);
            this.train.add(car);
            offsetX -= 100;
        }

        // 添加客车厢
        for (let i = 0; i < carriages.passenger; i++) {
            const car = this.add.image(offsetX, 2, 'passenger-car');
            car.setOrigin(0.5, 1);
            this.train.add(car);
            offsetX -= 100;
        }

        // 添加餐车
        for (let i = 0; i < carriages.dining; i++) {
            const car = this.add.image(offsetX, 2, 'dining-car');
            car.setOrigin(0.5, 1);
            this.train.add(car);
            offsetX -= 100;
        }

        // 添加油罐车
        for (let i = 0; i < carriages.oil; i++) {
            const car = this.add.image(offsetX, 2, 'oil-car');
            car.setOrigin(0.5, 1);
            this.train.add(car);
            offsetX -= 100;
        }
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
        this.goldText = this.add.text(55, 30, '0', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒
        this.earningText = this.add.text(55, 50, '每秒: 0', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5).setDepth(20);

        // 速度显示
        this.speedText = this.add.text(width / 2, 30, '', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#87CEEB'
        }).setOrigin(0.5).setDepth(20);

        // 车厢统计
        this.carriageText = this.add.text(width - 20, 20, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 到站收益统计
        this.stationText = this.add.text(width - 20, 45, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 升级按钮
        this.upgradeBtn = this.add.image(width / 2, height - 30, 'btn-buy')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => this.upgradeBtn.setTexture('btn-buy-hover'))
            .on('pointerout', () => this.upgradeBtn.setTexture('btn-buy'))
            .on('pointerdown', () => this.toggleUpgradePanel());

        this.upgradeBtnText = this.add.text(width / 2, height - 30, '升级', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20);

        // 暂停按钮
        const pauseBtn = this.add.text(width - 80, height - 30, '⏸ 暂停', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            pauseBtn.setText(this.isPaused ? '▶ 继续' : '⏸ 暂停');
        });

        // 音效开关按钮
        this.soundEnabled = true;
        const soundBtn = this.add.text(width - 180, height - 30, '🔊 音效', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

        soundBtn.on('pointerdown', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtn.setText(this.soundEnabled ? '🔊 音效' : '🔇 静音');
            // 这里可以添加实际的音效控制逻辑
        });

        // 重置按钮
        const resetBtn = this.add.text(80, height - 30, ' 重置', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#e94560',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

        resetBtn.on('pointerdown', () => {
            this.showResetConfirm(width, height);
        });
    }

    createUpgradePanel(width, height) {
        // 升级面板容器
        this.upgradePanel = this.add.container(width / 2, height / 2);
        this.upgradePanel.setVisible(false);
        this.upgradePanel.setDepth(100);

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(-300, -210, 600, 420, 16);
        panelBg.lineStyle(3, 0x0f3460);
        panelBg.strokeRoundedRect(-300, -210, 600, 420, 16);
        this.upgradePanel.add(panelBg);

        // 标题
        const title = this.add.text(0, -160, '升级中心', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.upgradePanel.add(title);

        // 升级选项
        this.upgradeOptions = [];
        const options = [
            { key: 'freight', name: '货车厢', desc: '运货赚金币', icon: 'freight-car' },
            { key: 'passenger', name: '客车厢', desc: '载人赚金币', icon: 'passenger-car' },
            { key: 'dining', name: '餐车', desc: '提升收益20%', icon: 'dining-car' },
            { key: 'oil', name: '油罐车', desc: '降低油耗15%', icon: 'oil-car' },
            { key: 'locomotive', name: '升级车头', desc: '提升速度', icon: 'locomotive' }
        ];

        options.forEach((opt, index) => {
            const y = -130 + index * 64;

            // 选项背景
            const optBg = this.add.graphics();
            optBg.fillStyle(0x16213e, 0.8);
            optBg.fillRoundedRect(-280, y, 560, 56, 8);
            this.upgradePanel.add(optBg);

            // 图标
            const icon = this.add.image(-240, y + 28, opt.icon).setScale(0.5);
            this.upgradePanel.add(icon);

            // 名称和描述
            const nameText = this.add.text(-190, y + 12, opt.name, {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.upgradePanel.add(nameText);

            const descText = this.add.text(-190, y + 34, opt.desc, {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#aaaaaa'
            });
            this.upgradePanel.add(descText);

            // 数量/等级
            const countText = this.add.text(60, y + 28, '', {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#87CEEB'
            }).setOrigin(0, 0.5);
            this.upgradePanel.add(countText);

            // 购买按钮
            const buyBtn = this.add.image(180, y + 28, 'btn-buy')
                .setScale(0.75)
                .setInteractive({ useHandCursor: true });
            this.upgradePanel.add(buyBtn);

            const priceText = this.add.text(180, y + 28, '', {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#FFD700'
            }).setOrigin(0.5);
            this.upgradePanel.add(priceText);

            buyBtn.on('pointerdown', () => {
                if (opt.key === 'locomotive') {
                    if (gameData.upgradeLocomotive()) {
                        this.updateTrainCarriages();
                        this.showFloatingText('车头升级!', 180, y + 28, '#00FF00');
                    }
                } else {
                    if (gameData.buyCarriage(opt.key)) {
                        this.updateTrainCarriages();
                        this.showFloatingText('购买成功!', 180, y + 28, '#00FF00');
                    }
                }
                this.updateUpgradePanel();
                this.updateUI();
            });

            this.upgradeOptions.push({
                key: opt.key,
                countText,
                priceText,
                buyBtn
            });
        });

        // 关闭按钮
        const closeBtn = this.add.text(280, -180, '✕', {
            fontSize: '24px',
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
        const isSpeedMaxed = gameData.get('trainSpeed') >= maxSpeed;

        this.upgradeOptions.forEach(opt => {
            let count, price;

            if (opt.key === 'locomotive') {
                count = `Lv.${gameData.get('locomotive').level}`;
                price = prices.locomotive;
            } else {
                count = `x${carriages[opt.key]}`;
                price = prices[opt.key];
            }

            opt.countText.setText(count);
            opt.priceText.setText(`💰 ${price}`);

            // 车厢已达上限时禁用按钮
            const isCarriageFull = opt.key !== 'locomotive' && totalCarriages >= 5;
            
            if (isCarriageFull) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText('已满');
                opt.priceText.setColor('#666666');
            } else if (opt.key === 'locomotive' && isSpeedMaxed) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText('已满速');
                opt.priceText.setColor('#666666');
            } else if (gold >= price) {
                opt.buyBtn.setTexture('btn-buy');
                opt.priceText.setColor('#FFD700');
            } else {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setColor('#666666');
            }
        });
    }

    updateUI() {
        const gold = gameData.get('gold');
        const carriages = gameData.get('carriages');
        const stationsVisited = gameData.get('stationsVisited');
        const speed = gameData.get('trainSpeed');

        this.goldText.setText(this.formatNumber(gold));
        this.earningText.setText(`每秒: ${this.formatNumber(gameData.getBaseEarning())}`);
        this.speedText.setText(`🚂 速度: ${speed.toFixed(1)} km/h`);

        this.carriageText.setText(
            `🚃 车厢: ${carriages.freight + carriages.passenger + carriages.dining + carriages.oil}`
        );

        this.stationText.setText(`📍 到站: ${stationsVisited}次`);
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
        const speed = gameData.get('trainSpeed');
        const width = this.cameras.main.width;
        const trainScreenX = this.train.x; // 火车固定位置（不变）

        // 火车起伏动态效果
        this.trainBobTime = (this.trainBobTime || 0) + deltaSeconds * speed * 0.06;
        const bobAmount = 0.5 + speed * 0.003;
        for (let i = 0; i < this.train.length; i++) {
            const child = this.train.getAt(i);
            if (typeof child._origY === 'undefined') {
                child._origY = child.y;
            }
            child.y = child._origY + Math.sin(this.trainBobTime - i * 0.6) * bobAmount;
        }

        // 移动车站（向左移动）
        this.stations.getChildren().forEach(station => {
            station.x -= speed * deltaSeconds * 1.5;
            if (station.nameText) {
                station.nameText.x = station.x;
            }

            // 检测到站（车站经过火车位置时）
            if (Math.abs(station.x - trainScreenX) < 60 && !station.earned) {
                station.earned = true;
                this.showStationEarning(station);
            }

            // 移除屏幕外的车站
            if (station.x < -200) {
                if (station.nameText) station.nameText.destroy();
                station.destroy();
            }
        });

        // 背景视差滚动（不同层不同速度，模拟远近景深）
        // 远山（最慢）
        this.mountains.x -= speed * deltaSeconds * 0.25;
        if (this.mountains.x < -this.mountainWidth + width) {
            this.mountains.x += this.mountainWidth;
        }

        // 树木（中速）
        this.trees.x -= speed * deltaSeconds * 0.6;
        if (this.trees.x < -this.treesWidth + width) {
            this.trees.x += this.treesWidth;
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

        // 被动收益
        this.passiveEarningTimer += deltaSeconds;
        if (this.passiveEarningTimer >= 1) {
            const earning = gameData.getBaseEarning();
            gameData.addGold(earning);
            this.passiveEarningTimer = 0;
            this.updateUI();
        }

        // 生成新车站
        this.stationTimer += deltaSeconds;
        if (this.stationTimer >= this.stationInterval) {
            this.spawnStation(width);
            this.stationTimer = 0;
        }
    }
}
