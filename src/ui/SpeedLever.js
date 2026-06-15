// 速度控制杆模块
class SpeedLever {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        const maxSpeed = gameData.get('locomotive').speed;
        const targetSpeed = gameData.get('targetSpeed');

        const leverX = width - 35;
        const leverTop = 110;
        const leverBottom = height - 110;
        const leverHeight = leverBottom - leverTop;
        const trackWidth = 18;

        this.x = leverX;
        this.top = leverTop;
        this.bottom = leverBottom;
        this.height = leverHeight;

        // 控制杆容器
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(20);

        // 轨道凹槽背景
        const trackBg = this.scene.add.graphics();
        trackBg.fillStyle(0x111122, 0.9);
        trackBg.fillRoundedRect(leverX - trackWidth / 2, leverTop, trackWidth, leverHeight, 9);
        trackBg.lineStyle(2, 0x334466);
        trackBg.strokeRoundedRect(leverX - trackWidth / 2, leverTop, trackWidth, leverHeight, 9);
        this.container.add(trackBg);

        // 填充条
        this.fill = this.scene.add.graphics();
        this.container.add(this.fill);

        // 刻度线
        const tickCount = 6;
        for (let i = 0; i <= tickCount; i++) {
            const y = leverBottom - (i / tickCount) * leverHeight;
            const tickW = (i % 3 === 0) ? 10 : 6;
            const tick = this.scene.add.graphics();
            tick.lineStyle(1, 0x556688);
            tick.beginPath();
            tick.moveTo(leverX - trackWidth / 2 - 3, y);
            tick.lineTo(leverX - trackWidth / 2 - 3 - tickW, y);
            tick.strokePath();
            this.container.add(tick);
        }

        // "0" 标签
        this.container.add(
            this.scene.add.text(leverX, leverBottom + 16, '0', {
                fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#FFFFFF'
            }).setOrigin(0.5).setStroke(0x000000, 3)
        );

        // 极速标签
        this.maxLabel = this.scene.add.text(leverX, leverTop - 16, `${maxSpeed}`, {
            fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#FFFFFF'
        }).setOrigin(0.5).setStroke(0x000000, 3);
        this.container.add(this.maxLabel);

        // 手柄
        this.handle = this.scene.add.graphics();
        this.container.add(this.handle);

        // 手柄初始位置
        this.handleY = this._speedToY(targetSpeed);
        this._drawHandle(this.handleY);
        this._drawFill(this.handleY);

        // 交互区域
        const hitZone = this.scene.add.rectangle(leverX, leverTop + leverHeight / 2, trackWidth + 30, leverHeight + 20)
            .setInteractive({ useHandCursor: true, draggable: true })
            .setDepth(21)
            .setAlpha(0.001);

        this.dragging = false;
        this.userTargetY = undefined;

        hitZone.on('pointerdown', (pointer) => {
            if (this.scene.waitingToLoad || this.scene.isLoading) return;
            this.dragging = true;
            this._updateFromPointer(pointer);
        });

        hitZone.on('drag', (pointer) => {
            if (this.scene.waitingToLoad || this.scene.isLoading) return;
            this._updateFromPointer(pointer);
        });

        hitZone.on('pointerup', () => { this.dragging = false; });
        hitZone.on('pointerupoutside', () => { this.dragging = false; });
    }

    _speedToY(speed) {
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
        return this.bottom - ratio * this.height;
    }

    _yToSpeed(y) {
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = Math.max(0, Math.min(1, (this.bottom - y) / this.height));
        return ratio * maxSpeed;
    }

    _drawHandle(y) {
        this.handle.clear();
        const speed = this._yToSpeed(y);
        const maxSpeed = gameData.get('locomotive').speed;
        const ratio = speed / maxSpeed;
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

        this.handle.fillStyle(0x000000, 0.3);
        this.handle.fillRoundedRect(this.x - 15, y - 8 + 2, 30, 16, 6);
        this.handle.fillStyle(handleColor);
        this.handle.fillRoundedRect(this.x - 15, y - 8, 30, 16, 6);
        this.handle.lineStyle(1, 0xffffff, 0.4);
        this.handle.strokeRoundedRect(this.x - 15, y - 8, 30, 16, 6);
        this.handle.lineStyle(1, 0x000000, 0.2);
        this.handle.beginPath();
        this.handle.moveTo(this.x - 6, y - 2); this.handle.lineTo(this.x - 6, y + 2);
        this.handle.moveTo(this.x, y - 2);     this.handle.lineTo(this.x, y + 2);
        this.handle.moveTo(this.x + 6, y - 2); this.handle.lineTo(this.x + 6, y + 2);
        this.handle.strokePath();
    }

    _drawFill(handleY) {
        this.fill.clear();
        const fillBottom = this.bottom;
        const fillHeight = fillBottom - handleY;
        if (fillHeight > 0) {
            this.fill.fillStyle(0x2196F3, 0.25);
            this.fill.fillRoundedRect(this.x - 6, handleY, 12, fillHeight, 3);
        }
    }

    _updateFromPointer(pointer) {
        const y = Math.max(this.top, Math.min(this.bottom, pointer.y));
        const newSpeed = this._yToSpeed(y);
        gameData.data.targetSpeed = newSpeed;
        this.userTargetY = y;
    }

    // 每帧更新控制杆外观
    update(deltaSeconds) {
        if (this.handleY === undefined) return;

        const speed = gameData.get('trainSpeed');
        const maxSpeed = gameData.get('locomotive').speed;

        if (this.scene.waitingToLoad || this.scene.isLoading) {
            // 装卸中：吸到实际速度位置
            const expectedY = this._speedToY(speed);
            this.handleY = expectedY;
            this._drawHandle(expectedY);
            this._drawFill(expectedY);
        } else if (this.dragging && this.userTargetY !== undefined) {
            // 拖拽中：平滑过渡到用户目标
            let targetY = this.userTargetY;
            if (this.scene.speedLimit !== null) {
                const limitY = this._speedToY(this.scene.speedLimit);
                targetY = Math.max(targetY, limitY);
            }
            this.handleY += (targetY - this.handleY) * Math.min(1, 15 * deltaSeconds);
            this._drawHandle(this.handleY);
            this._drawFill(this.handleY);
        } else {
            // 正常/限速：跟随 targetSpeed
            const effectiveTarget = this.scene.speedLimit !== null
                ? Math.min(gameData.get('targetSpeed'), this.scene.speedLimit)
                : gameData.get('targetSpeed');
            const targetRatio = Math.max(0, Math.min(1, effectiveTarget / maxSpeed));
            const expectedY = this.bottom - targetRatio * this.height;
            if (Math.abs(this.handleY - expectedY) > 0.5) {
                this.handleY += (expectedY - this.handleY) * Math.min(1, 15 * deltaSeconds);
                this._drawHandle(this.handleY);
                this._drawFill(this.handleY);
            }
        }
    }

    // 升级车头后刷新极速标签和手柄位置
    refresh() {
        const maxSpeed = gameData.get('locomotive').speed;
        this.maxLabel.setText(`${maxSpeed}`);
        const targetSpeed = gameData.get('targetSpeed');
        this.handleY = this._speedToY(targetSpeed);
        this._drawHandle(this.handleY);
        this._drawFill(this.handleY);
    }
}