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

        // 创建火车
        this.createTrain(width, height);

        // 创建车站组
        this.stations = this.add.group();

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
        // 天空渐变
        const skyGradient = this.add.graphics();
        skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FA, 0xE0F7FA, 1);
        skyGradient.fillRect(0, 0, width, height * 0.6);

        // 远山
        const mountains = this.add.graphics();
        mountains.fillStyle(0x228B22, 0.6);
        for (let i = 0; i < 5; i++) {
            const x = i * 250 - 50;
            const peakHeight = 100 + Math.random() * 80;
            mountains.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - peakHeight, x + 250, height * 0.45);
        }

        // 地面
        const ground = this.add.graphics();
        ground.fillStyle(0x8B4513);
        ground.fillRect(0, height * 0.65, width, height * 0.35);

        // 草地
        ground.fillStyle(0x228B22);
        ground.fillRect(0, height * 0.62, width, 15);
    }

    createRails(width, height) {
        const railY = height * 0.68;
        const rails = this.add.graphics();

        // 枕木
        rails.fillStyle(0x8B4513);
        for (let x = 0; x < width; x += 30) {
            rails.fillRect(x, railY - 2, 20, 8);
        }

        // 铁轨
        rails.lineStyle(3, 0x666666);
        rails.beginPath();
        rails.moveTo(0, railY);
        rails.lineTo(width, railY);
        rails.strokePath();

        rails.beginPath();
        rails.moveTo(0, railY + 6);
        rails.lineTo(width, railY + 6);
        rails.strokePath();
    }

    createTrain(width, height) {
        const trainY = height * 0.65 - 10;

        // 火车容器
        this.train = this.add.container(-200, trainY);

        // 添加车头
        const locomotive = this.add.image(0, 0, 'locomotive');
        locomotive.setOrigin(0, 1);
        this.train.add(locomotive);

        // 添加初始车厢
        this.updateTrainCarriages();

        // 火车位置（用于UI显示）
        this.trainWorldX = -200;
    }

    updateTrainCarriages() {
        // 清除现有车厢（保留车头）
        while (this.train.length > 1) {
            this.train.getAt(1).destroy();
        }

        const carriages = gameData.get('carriages');
        let offsetX = 120; // 车头宽度

        // 添加货车厢
        for (let i = 0; i < carriages.freight; i++) {
            const car = this.add.image(offsetX, 0, 'freight-car');
            car.setOrigin(0, 1);
            this.train.add(car);
            offsetX += 100;
        }

        // 添加客车厢
        for (let i = 0; i < carriages.passenger; i++) {
            const car = this.add.image(offsetX, 0, 'passenger-car');
            car.setOrigin(0, 1);
            this.train.add(car);
            offsetX += 100;
        }

        // 添加餐车
        for (let i = 0; i < carriages.dining; i++) {
            const car = this.add.image(offsetX, 0, 'dining-car');
            car.setOrigin(0, 1);
            this.train.add(car);
            offsetX += 100;
        }

        // 添加油罐车
        for (let i = 0; i < carriages.oil; i++) {
            const car = this.add.image(offsetX, 0, 'oil-car');
            car.setOrigin(0, 1);
            this.train.add(car);
            offsetX += 100;
        }
    }

    createUI(width, height) {
        // 顶部信息栏背景
        const uiBg = this.add.graphics();
        uiBg.fillStyle(0x1a1a2e, 0.9);
        uiBg.fillRect(0, 0, width, 60);
        uiBg.lineStyle(2, 0x0f3460);
        uiBg.strokeRect(0, 0, width, 60);

        // 金币图标
        this.add.image(30, 30, 'coin');

        // 金币文字
        this.goldText = this.add.text(55, 30, '0', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // 收益/秒
        this.earningText = this.add.text(55, 50, '每秒: 0', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        // 车厢统计
        this.carriageText = this.add.text(width - 20, 20, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0);

        // 到站收益统计
        this.stationText = this.add.text(width - 20, 45, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa',
            align: 'right'
        }).setOrigin(1, 0);

        // 升级按钮
        this.upgradeBtn = this.add.image(width / 2, height - 30, 'btn-buy')
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.upgradeBtn.setTexture('btn-buy-hover'))
            .on('pointerout', () => this.upgradeBtn.setTexture('btn-buy'))
            .on('pointerdown', () => this.toggleUpgradePanel());

        this.upgradeBtnText = this.add.text(width / 2, height - 30, '升级', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 暂停按钮
        const pauseBtn = this.add.text(width - 80, height - 30, '⏸ 暂停', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            pauseBtn.setText(this.isPaused ? '▶ 继续' : '⏸ 暂停');
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
        panelBg.fillRoundedRect(-200, -200, 400, 400, 16);
        panelBg.lineStyle(3, 0x0f3460);
        panelBg.strokeRoundedRect(-200, -200, 400, 400, 16);
        this.upgradePanel.add(panelBg);

        // 标题
        const title = this.add.text(0, -180, '升级中心', {
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
            const y = -120 + index * 70;

            // 选项背景
            const optBg = this.add.graphics();
            optBg.fillStyle(0x16213e, 0.8);
            optBg.fillRoundedRect(-180, y, 360, 60, 8);
            this.upgradePanel.add(optBg);

            // 图标
            const icon = this.add.image(-150, y + 30, opt.icon).setScale(0.5);
            this.upgradePanel.add(icon);

            // 名称和描述
            const nameText = this.add.text(-100, y + 15, opt.name, {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.upgradePanel.add(nameText);

            const descText = this.add.text(-100, y + 38, opt.desc, {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#aaaaaa'
            });
            this.upgradePanel.add(descText);

            // 数量/等级
            const countText = this.add.text(80, y + 15, '', {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#87CEEB'
            });
            this.upgradePanel.add(countText);

            // 购买按钮
            const buyBtn = this.add.image(140, y + 40, 'btn-buy')
                .setScale(0.8)
                .setInteractive({ useHandCursor: true });
            this.upgradePanel.add(buyBtn);

            const priceText = this.add.text(140, y + 40, '', {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#FFD700'
            }).setOrigin(0.5);
            this.upgradePanel.add(priceText);

            buyBtn.on('pointerdown', () => {
                if (opt.key === 'locomotive') {
                    if (gameData.upgradeLocomotive()) {
                        this.updateTrainCarriages();
                        this.showFloatingText('车头升级!', 140, y + 40, '#00FF00');
                    }
                } else {
                    if (gameData.buyCarriage(opt.key)) {
                        this.updateTrainCarriages();
                        this.showFloatingText('购买成功!', 140, y + 40, '#00FF00');
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
        const closeBtn = this.add.text(180, -180, '✕', {
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

            // 按钮状态
            if (gold >= price) {
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

        this.goldText.setText(this.formatNumber(gold));
        this.earningText.setText(`每秒: ${this.formatNumber(gameData.getBaseEarning())}`);

        this.carriageText.setText(
            `🚂 车厢: ${carriages.freight + carriages.passenger + carriages.dining + carriages.oil}`
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

        const station = this.add.image(width + 100, this.cameras.main.height * 0.65 - 40, textureKey);
        station.setOrigin(0.5, 1);
        station.stationType = type;
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

        // 移动火车
        this.trainWorldX += speed * deltaSeconds * 50;
        this.train.x = (this.trainWorldX % (width + 500)) - 200;

        // 移动车站
        this.stations.getChildren().forEach(station => {
            station.x -= speed * deltaSeconds * 50;
            if (station.nameText) {
                station.nameText.x = station.x;
            }

            // 检测到站
            if (Math.abs(station.x - this.train.x) < 50 && !station.earned) {
                station.earned = true;
                this.showStationEarning(station);
            }

            // 移除屏幕外的车站
            if (station.x < -200) {
                if (station.nameText) station.nameText.destroy();
                station.destroy();
            }
        });

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
