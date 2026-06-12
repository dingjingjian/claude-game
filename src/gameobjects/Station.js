// 车站系统模块：车站生成、移动、到站检测、装卸货UI
class StationSystem {
    constructor(scene) {
        this.scene = scene;
    }

    create(width) {
        // 车站组
        this.stations = this.scene.add.group();

        // 装卸货进度条UI（默认隐藏）
        this.loadingBarBg = this.scene.add.graphics();
        this.loadingBarBg.setDepth(25);
        this.loadingBarBg.setVisible(false);

        this.loadingBar = this.scene.add.graphics();
        this.loadingBar.setDepth(26);
        this.loadingBar.setVisible(false);

        this.loadingText = this.scene.add.text(0, 0, t('loading'), {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(27);
        this.loadingText.setVisible(false);

        // 当前装卸的车站
        this.currentStation = null;

        // 生成初始车站
        this.spawn(width);
    }

    spawn(width) {
        const carriages = gameData.get('carriages');
        const types = ['mixed'];
        if (carriages.freight > 0 || carriages.oil > 0) types.push('freight');
        if (carriages.passenger > 0 || carriages.dining > 0) types.push('passenger');
        const type = types[Math.floor(Math.random() * types.length)];

        // 从配置中随机选一张图片
        const cfg = this.scene.stationConfigs || {};
        const pool = cfg[type] || [];
        let textureKey = `station-${type}-0`;  // fallback
        let imgScale = 1.0;
        let imgOffsetX = 0;
        let imgOffsetY = 0;

        if (pool.length > 0) {
            const item = pool[Math.floor(Math.random() * pool.length)];
            const file = item.file.replace('.png', '');  // e.g. "freight-1"
            textureKey = `station-${file}`;  // e.g. "station-freight-1"
            imgScale = item.scale || 1.0;
            imgOffsetX = item.offsetX || 0;
            imgOffsetY = item.offsetY || 0;
        }

        // 确保车站完全在屏幕外生成
        const stationW = this.scene.textures.exists(textureKey)
            ? this.scene.textures.get(textureKey).getSourceImage().width * imgScale
            : 200;
        const offscreenX = width + stationW * 0.5 + 50;
        const speed = gameData.get('trainSpeed') || 0;
        const visualMul = 0.8 + speed / 120;
        const pixelSpeed = speed * 1.5 * visualMul;
        const decelTime = Math.max(0, (speed - 80) / 100);
        const brakeDist = 300 + pixelSpeed * decelTime * 0.6;
        const spawnX = Math.max(offscreenX, width * 0.5 + brakeDist);

        const station = this.scene.add.image(spawnX + imgOffsetX, this.scene.cameras.main.height * 0.678 + imgOffsetY, textureKey);
        station.setOrigin(0.5, 1);
        station.setScale(imgScale);
        station.stationType = type;
        station.setDepth(5);
        this.stations.add(station);

        return station;
    }

    // 显示到站收益
    _showEarning(station) {
        const earning = gameData.getStationEarning(station.stationType);
        gameData.addGold(earning);

        const typeName = getStationTypeName(station.stationType);

        this.scene.showFloatingText(
            `+${this.scene.formatNumber(earning)} (${typeName})`,
            station.x,
            station.y - 100,
            '#FFD700'
        );

        this.scene.sfx.gold();

        gameData.data.stationsVisited++;
        this.scene.hud.refresh();
    }

    // 开始装卸
    startLoading(station) {
        this.scene.isLoading = true;
        this.scene.loadingTimer = 0;
        this.currentStation = station;

        const trainX = this.scene.train.container.x;
        const trainY = this.scene.train.container.y;

        this.loadingText.setText(t('loading'));
        this.loadingText.setPosition(trainX, trainY - 80);
        this.loadingText.setVisible(true);

        this.loadingBarBg.clear();
        this.loadingBarBg.fillStyle(0x333333, 0.8);
        this.loadingBarBg.fillRoundedRect(trainX - 50, trainY - 60, 100, 12, 6);
        this.loadingBarBg.setVisible(true);

        this.loadingBar.clear();
        this.loadingBar.setVisible(true);
    }

    // 更新装卸进度
    updateLoading(deltaSeconds) {
        if (!this.scene.isLoading) return;

        this.scene.loadingTimer += deltaSeconds;
        const progress = Math.min(this.scene.loadingTimer / GAME_CONFIG.LOADING_DURATION, 1);

        this.loadingBar.clear();
        this.loadingBar.fillStyle(0xFFD700);
        this.loadingBar.fillRoundedRect(
            this.scene.train.container.x - 48,
            this.scene.train.container.y - 58,
            96 * progress,
            8,
            4
        );

        const remaining = Math.ceil(GAME_CONFIG.LOADING_DURATION - this.scene.loadingTimer);
        this.loadingText.setText(`${t('loading')} ${remaining}s`);

        if (this.scene.loadingTimer >= GAME_CONFIG.LOADING_DURATION) {
            this._finishLoading();
        }
    }

    _finishLoading() {
        this.scene.isLoading = false;
        this.loadingText.setVisible(false);
        this.loadingBar.setVisible(false);
        this.loadingBarBg.setVisible(false);
        this.loadingBar.clear();
        this.loadingBarBg.clear();

        // 恢复之前的目标速度
        if (this.scene.savedTargetSpeed !== undefined) {
            gameData.data.targetSpeed = this.scene.savedTargetSpeed;
            this.scene.savedTargetSpeed = undefined;
        }

        // 解除进站限速
        this.scene.speedLimit = null;
        this.scene.speedLimitStation = null;

        // 出站亮绿灯，延迟隐藏
        this.scene.signalLight.setState('green');
        this.scene.signalLight.show(true);
        this.scene.time.delayedCall(GAME_CONFIG.SIGNAL_HIDE_DELAY, () => {
            this.scene.signalLight.show(false);
            this.scene.signalLight.setState('none');
        });

        // 出发汽笛
        this.scene.sfx.whistle();
    }

    // 更新所有车站：移动、到站检测、清理
    update(speed, deltaSeconds, width) {
        const trainScreenX = this.scene.train.container.x;
        const trainVisualCenterX = trainScreenX + (this.scene.train.centerX || 0) - 65;

        this.stations.getChildren().forEach(station => {
            // 移动
            if (speed > 0) {
                const visualMul = 0.8 + speed / 120;
                station.x -= speed * deltaSeconds * 1.5 * visualMul;
            }

            // 进站限速检测
            const stationDist = station.x - trainVisualCenterX;
            if (!station.earned && stationDist > 0) {
                const visualMul = 0.8 + speed / 120;
                const pixelSpeed = speed * 1.5 * visualMul;
                const decelTime = Math.max(0, (speed - 80) / 100);
                const activationRange = 300 + pixelSpeed * decelTime * 0.6;
                if (!this.scene.speedLimit && stationDist < activationRange) {
                    this.scene.speedLimit = 80;
                    this.scene.speedLimitStation = station;
                    this.scene.signalLight.show(true);
                    this.scene.signalLight.setState('yellow');
                    this.scene.sfx.signal();
                } else if (this.scene.speedLimit === 80 && stationDist < 200) {
                    this.scene.speedLimit = 40;
                    this.scene.signalLight.setState('red');
                }
            }

            // 到站检测
            if (Math.abs(station.x - trainVisualCenterX) < 60 && !station.earned) {
                station.earned = true;
                this._showEarning(station);
                this.scene.sfx.whistle();
                this.scene.waitingToLoad = true;
                this.scene.waitingStation = station;
                this.scene.savedTargetSpeed = gameData.get('targetSpeed');
                gameData.data.targetSpeed = 0;
            }

            // 移除屏幕外的车站（用图片宽度确保完全离开屏幕）
            const stationW = station.displayWidth || 200;
            if (station.x < -stationW &&
                !(this.scene.isLoading && station === this.currentStation) &&
                !(this.scene.waitingToLoad && station === this.scene.waitingStation)) {
                station.destroy();
            }
        });
    }

}