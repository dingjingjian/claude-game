// 主游戏场景（薄调度层）
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // === 游戏状态 ===
        this.isPaused = true;
        this.passiveEarningTimer = 0;
        this.stationTimer = 0;
        this.stationInterval = GAME_CONFIG.STATION_INTERVAL;
        this.waitingToLoad = false;
        this.waitingStation = null;
        this.isLoading = false;
        this.loadingTimer = 0;
        this.speedLimit = null;
        this.speedLimitStation = null;
        this.soundEnabled = true;
        this.savedTargetSpeed = undefined;

        // 音效管理器
        this.sfx = new SoundManager(this);

        // === 创建各模块 ===

        // 背景
        this.background = new Background(this);
        this.background.create(width, height);
        this.background.createRails(width, height);

        // 火车
        this.train = new Train(this);
        this.train.create(width, height);

        // 信号灯
        this.signalLight = new SignalLight(this);
        this.signalLight.create();

        // 车站系统
        this.stationSystem = new StationSystem(this);
        this.stationSystem.create(width);

        // HUD
        this.hud = new HUD(this);
        this.hud.create(width, height);

        // 速度控制杆
        this.speedLever = new SpeedLever(this);
        this.speedLever.create(width, height);

        // 升级面板
        this.upgradePanel = new UpgradePanel(this);
        this.upgradePanel.create(width, height);

        // 设置面板
        this.settingsPanel = new SettingsPanel(this);
        this.settingsPanel.create(width, height);


        // === 自动存档 ===
        this.time.addEvent({
            delay: GAME_CONFIG.SAVE_INTERVAL,
            callback: () => gameData.save(),
            loop: true
        });

        // === 初始UI ===
        this.hud.refresh();

        // === 启动画面（点击开始，解决浏览器音频自动播放限制） ===
        this._showStartSplash(width, height);
    }

    update(time, delta) {
        if (this.isPaused) return;

        const deltaSeconds = delta / 1000;
        const width = GAME_CONFIG.WIDTH;

        // === 速度平滑变速 ===
        const targetSpeed = gameData.get('targetSpeed');
        const effectiveTarget = this.speedLimit !== null
            ? Math.min(targetSpeed, this.speedLimit)
            : targetSpeed;

        if (gameData.data.trainSpeed < effectiveTarget) {
            gameData.data.trainSpeed = Math.min(effectiveTarget, gameData.data.trainSpeed + GAME_CONFIG.ACCEL_UP * deltaSeconds);
        } else if (gameData.data.trainSpeed > effectiveTarget) {
            gameData.data.trainSpeed = Math.max(effectiveTarget, gameData.data.trainSpeed - GAME_CONFIG.ACCEL_DOWN * deltaSeconds);
        }

        const speed = gameData.get('trainSpeed');

        // === 行驶循环音 ===
        if (speed > 0.5) {
            this.sfx.startRun();
            this.sfx.updateRunRate(speed);
        } else {
            this.sfx.stopRun();
        }

        // === 里程累计 ===
        if (speed > 0) {
            gameData.data.totalDistance += speed * deltaSeconds / 3600;
        }

        // === 被动收益 ===
        const netEarning = gameData.getBaseEarning();
        this.passiveEarningTimer += deltaSeconds;
        if (this.passiveEarningTimer >= 1 && netEarning !== 0) {
            this.passiveEarningTimer -= 1;
            if (netEarning > 0) {
                gameData.addGold(netEarning);
            } else {
                gameData.addGold(netEarning);
            }
            this.hud.refresh();
        }

        // === 破产检测 ===
        if (gameData.checkBankrupt()) {
            this.settingsPanel.showBankrupt();
            return;
        }

        // === 车站生成计时 ===
        this.stationTimer += deltaSeconds;
        if (this.stationTimer >= this.stationInterval) {
            this.stationTimer = 0;
            this.stationSystem.spawn(width);
        }

        // === 各模块更新 ===
        this.background.update(speed, deltaSeconds, width);
        this.stationSystem.update(speed, deltaSeconds, width);
        this.speedLever.update(deltaSeconds);
        this.train.updateSteam(speed, deltaSeconds);
        this.train.updateBob(speed, deltaSeconds);
        this.train.syncSteamPosition();
        this.stationSystem.updateLoading(deltaSeconds);
        this.hud.refresh();

        // === 进站减速完成 → 开始装卸 ===
        if (this.waitingToLoad && speed <= 0.5) {
            this.waitingToLoad = false;
            this.stationSystem.startLoading(this.waitingStation);
        }

        // === 速度显示 ===
        this.hud.speedText.setText(`${t('speedText')}${speed.toFixed(0)} km/h`);
    }

    // === 浮动文字（简单工具函数，保留在Scene） ===
    showFloatingText(text, x, y, color) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 若x/y是面板内相对坐标，转世界坐标
        if (this.upgradePanel.panel.visible && Math.abs(x) < 400) {
            floatingText.x += this.upgradePanel.panel.x;
            floatingText.y += this.upgradePanel.panel.y;
        }

        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    // === 离线收益弹窗 ===
    showOfflineEarnings(amount) {
        const width = GAME_CONFIG.WIDTH;
        const height = GAME_CONFIG.HEIGHT;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(200);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width / 2 - 150, height / 2 - 80, 300, 160, 16);
        panel.lineStyle(3, 0xFFD700);
        panel.strokeRoundedRect(width / 2 - 150, height / 2 - 80, 300, 160, 16);
        panel.setDepth(201);

        const title = this.add.text(width / 2, height / 2 - 50, t('welcomeBack'), {
            fontSize: '24px', fontFamily: 'Microsoft YaHei', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);

        const earningsText = this.add.text(width / 2, height / 2, `${t('offlineEarnings')}${formatNumber(amount)}`, {
            fontSize: '20px', fontFamily: 'Microsoft YaHei', color: '#ffffff'
        }).setOrigin(0.5).setDepth(202);

        const confirmBtn = this.add.text(width / 2, height / 2 + 50, t('confirm'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#ffffff',
            backgroundColor: '#0f3460', padding: { x: 30, y: 8 }
        }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

        confirmBtn.on('pointerdown', () => {
            this.sfx.click();
            overlay.destroy(); panel.destroy(); title.destroy();
            earningsText.destroy(); confirmBtn.destroy();
        });
    }

    // === 启动画面 ===
    _showStartSplash(width, height) {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(999);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        const title = this.add.text(width / 2, height / 2 - 40, t('pageTitle'), {
            fontSize: '32px', fontFamily: 'Microsoft YaHei', color: '#FFD700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(1000);

        const hint = this.add.text(width / 2, height / 2 + 20, t('clickToStart'), {
            fontSize: '20px', fontFamily: 'Microsoft YaHei', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(1000);

        // 呼吸动画
        this.tweens.add({
            targets: hint,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        overlay.on('pointerdown', () => {
            this.sfx.click();
            overlay.destroy();
            title.destroy();
            hint.destroy();
            this.isPaused = false;
            this.sfx.startBGM();
            // 离线收益（在启动画面消失后显示）
            if (gameData.get('offlineEarnings') > 0) {
                this.showOfflineEarnings(gameData.get('offlineEarnings'));
                gameData.data.offlineEarnings = 0;
            }
        });
    }

    // === 全局文本刷新（语言切换） ===
    refreshAllText() {
        document.getElementById('page-title').textContent = t('pageTitle');
        document.getElementById('rotate-text').textContent = t('rotateHint');

        this.hud.upgradeBtnText && this.hud.upgradeBtnText.setText(t('upgrade'));
        this.hud.refreshText();
        this.hud.refresh();

        if (this.settingsPanel.panel.visible) {
            this.settingsPanel._refreshTexts();
        }
        if (this.upgradePanel.panel.visible) {
            this.upgradePanel.refresh();
        }

        this.stationSystem.refreshNames();
    }

    // 格式数字（委托给全局函数）
    formatNumber(num) {
        return formatNumber(num);
    }
}