// 火车模块：车头+车厢+蒸汽效果+起伏动画
class Train {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        const trainY = height * 0.65 + 21;
        const trainX = width * 0.5;

        // 火车容器
        this.container = this.scene.add.container(trainX, trainY);
        this.container.setDepth(10);

        this.baseY = trainY;
        this.bobTime = 0;
        this.centerX = 0;

        // 添加车头（使用当前皮肤）
        const skinConfig = gameData.getLocoSkinConfig();
        this.locomotive = this.scene.add.image(skinConfig.x, skinConfig.y, gameData.getLocoSkin());
        this.locomotive.setOrigin(0.5, 1);
        this.locomotive.setScale(skinConfig.scale);
        this.container.add(this.locomotive);
        this.skinConfig = skinConfig;

        // 蒸汽配置
        this.steamOffsetX = skinConfig.steamX;
        this.steamOffsetY = skinConfig.steamY;
        this.cylinderOffsetX = skinConfig.cylX;
        this.cylinderOffsetY = skinConfig.cylY;

        // 蒸汽粒子池
        this.steamPool = [];
        this.steamIndex = 0;
        this.steamTimer = 0;
        for (let i = 0; i < GAME_CONFIG.STEAM_POOL_SIZE; i++) {
            const puff = this.scene.add.image(0, 0, 'steam-particle');
            puff.setScale(0.8);
            puff.setAlpha(0);
            puff.setDepth(20);
            this.steamPool.push(puff);
        }

        // 添加初始车厢
        this.updateCarriages();
    }

    updateCarriages() {
        // 清除现有车厢（保留车头）
        while (this.container.length > 1) {
            this.container.getAt(1).destroy();
        }

        const carriages = gameData.get('carriages');
        let offsetX = -72;

        // 添加客车厢
        for (let i = 0; i < carriages.passenger; i++) {
            const cfg = gameData.getCarriageConfig('carriage-passenger');
            const car = this.scene.add.image(offsetX, cfg.y, 'carriage-passenger');
            car.setOrigin(0.5, 1);
            car.setScale(cfg.scale);
            this.container.add(car);
            offsetX -= cfg.spacing;
        }

        // 添加餐车
        for (let i = 0; i < carriages.dining; i++) {
            const cfg = gameData.getCarriageConfig('carriage-dining');
            const car = this.scene.add.image(offsetX, cfg.y, 'carriage-dining');
            car.setOrigin(0.5, 1);
            car.setScale(cfg.scale);
            this.container.add(car);
            offsetX -= cfg.spacing;
        }

        // 添加货车厢
        for (let i = 0; i < carriages.freight; i++) {
            const cfg = gameData.getCarriageConfig('carriage-freight');
            const car = this.scene.add.image(offsetX, cfg.y, 'carriage-freight');
            car.setOrigin(0.5, 1);
            car.setScale(cfg.scale);
            this.container.add(car);
            offsetX -= cfg.spacing;
        }

        // 添加油罐车
        for (let i = 0; i < carriages.oil; i++) {
            const cfg = gameData.getCarriageConfig('carriage-oil');
            const car = this.scene.add.image(offsetX, cfg.y, 'carriage-oil');
            car.setOrigin(0.5, 1);
            car.setScale(cfg.scale);
            this.container.add(car);
            offsetX -= cfg.spacing;
        }

        this._center();
    }

    _center() {
        const totalCarriages = this.container.length - 1;
        if (totalCarriages <= 0) {
            this.container.x = this.scene.cameras.main.width * 0.5;
            return;
        }

        const locoRight = this.locomotive.x + this.locomotive.displayWidth * 0.5;
        const lastCar = this.container.getAt(this.container.length - 1);
        const lastCarLeft = lastCar.x - lastCar.displayWidth * 0.5;

        const trainWidth = locoRight - lastCarLeft;
        this.centerX = (locoRight + lastCarLeft) * 0.5;

        this.container.x = this.scene.cameras.main.width * 0.5 - this.centerX;
    }

    // 切换车头皮肤（升级时自动调用，返回是否切换了）
    swapSkin() {
        const newSkin = gameData.getLocoSkin();
        const oldTexture = this.locomotive.texture.key;
        if (oldTexture === newSkin) return false;

        const skinConfig = gameData.getLocoSkinConfig();
        this.locomotive.setTexture(newSkin);
        this.locomotive.setPosition(skinConfig.x, skinConfig.y);
        this.locomotive.setScale(skinConfig.scale);
        this.skinConfig = skinConfig;
        this.steamOffsetX = skinConfig.steamX;
        this.steamOffsetY = skinConfig.steamY;
        this.cylinderOffsetX = skinConfig.cylX;
        this.cylinderOffsetY = skinConfig.cylY;
        this._center();
        return true;
    }

    // 发射单个蒸汽泡
    emitSteamPuff(speed, offsetX, offsetY, scaleMul, tint, driftMul, durationMul) {
        const puff = this.steamPool[this.steamIndex];
        this.steamIndex = (this.steamIndex + 1) % this.steamPool.length;

        if (puff._tween) {
            puff._tween.stop();
        }

        const locoWorldX = this.container.x + this.locomotive.x;
        const locoWorldY = this.container.y + this.locomotive.y;
        const startX = locoWorldX + offsetX + (Math.random() - 0.5) * 10;
        const startY = locoWorldY + offsetY + (Math.random() - 0.5) * 5;

        puff.setPosition(startX, startY);
        puff.setScale(0.6 * scaleMul);
        puff.setAlpha(1);
        puff.setTint(tint);
        puff.setVisible(true);

        const speedFactor = 400 / (1 + Math.exp(-(speed - 80) / 30));
        const driftX = -(50 + speedFactor + Math.random() * 60) * driftMul;
        const driftY = -(60 + Math.random() * 80);

        puff._tween = this.scene.tweens.add({
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

    // 更新蒸汽效果
    updateSteam(speed, deltaSeconds) {
        if (!this.steamPool || !this.skinConfig || !this.skinConfig.steam) return;

        this.steamTimer += deltaSeconds;
        const interval = Math.max(0.03, 0.1 - speed * 0.0005);
        if (this.steamTimer >= interval) {
            this.steamTimer = 0;
            // 运行时：烟囱蒸汽（深灰色）
            if (speed > 0) {
                this.emitSteamPuff(speed, this.steamOffsetX, this.steamOffsetY, 1.2, 0x999999, 1, 1);
            }
            // 气缸蒸汽（停车和运行都有）
            if (speed > 0 ? Math.random() < 0.4 : Math.random() < 0.15) {
                this.emitSteamPuff(speed, this.cylinderOffsetX, this.cylinderOffsetY, 0.6, 0xdddddd, 2, 2);
            }
        }
    }

    // 更新火车起伏动画
    updateBob(speed, deltaSeconds) {
        const isFuxing = this.locomotive.texture.key === 'loco-fuxing';
        if (isFuxing) return; // 复兴号平稳无抖动

        this.bobTime += deltaSeconds * speed * 0.06;
        const bobAmount = 0.5 + speed * 0.003;
        for (let i = 0; i < this.container.length; i++) {
            const child = this.container.getAt(i);
            if (typeof child._origY === 'undefined') {
                child._origY = child.y;
            }
            child.y = child._origY + Math.sin(this.bobTime - i * 0.6) * bobAmount;
        }
    }

    // 同步蒸汽泡的参考位置
    syncSteamPosition() {
        const locoWorldX = this.container.x + this.locomotive.x;
        const locoWorldY = this.container.y + this.locomotive.y;
        for (let i = 0; i < this.steamPool.length; i++) {
            this.steamPool[i]._trainRef = { x: locoWorldX, y: locoWorldY };
        }
    }
}