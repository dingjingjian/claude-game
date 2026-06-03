// 启动场景 - 加载资源
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 显示加载进度
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 进度条背景
        const progressBg = this.add.rectangle(width / 2, height / 2, 400, 30, 0x16213e);
        progressBg.setStrokeStyle(2, 0x0f3460);

        // 进度条
        const progressBar = this.add.rectangle(width / 2 - 198, height / 2, 0, 26, 0xe94560);
        progressBar.setOrigin(0, 0.5);

        // 加载文字
        const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.width = 396 * value;
        });

        this.load.on('complete', () => {
            loadingText.setText('加载完成！');
        });

        // 创建临时占位图（后续替换为真实美术资源）
        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
        // 创建车头占位图
        const locomotiveGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.drawLocomotive(locomotiveGraphics);
        locomotiveGraphics.generateTexture('locomotive', 120, 60);

        // 创建货车厢占位图
        const freightGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.drawFreightCar(freightGraphics);
        freightGraphics.generateTexture('freight-car', 100, 50);

        // 创建客车厢占位图
        const passengerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.drawPassengerCar(passengerGraphics);
        passengerGraphics.generateTexture('passenger-car', 100, 50);

        // 创建餐车占位图
        const diningGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.drawDiningCar(diningGraphics);
        diningGraphics.generateTexture('dining-car', 100, 50);

        // 创建油罐车占位图
        const oilGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.drawOilCar(oilGraphics);
        oilGraphics.generateTexture('oil-car', 100, 50);

        // 创建车站占位图
        this.createStationTexture('station-freight', 0x8B4513, '货运站');
        this.createStationTexture('station-passenger', 0x2E8B57, '客运站');
        this.createStationTexture('station-mixed', 0x4169E1, '综合站');

        // 创建金币图标
        const coinGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        coinGraphics.fillStyle(0xFFD700);
        coinGraphics.fillCircle(16, 16, 14);
        coinGraphics.lineStyle(2, 0xDAA520);
        coinGraphics.strokeCircle(16, 16, 14);
        coinGraphics.fillStyle(0xDAA520);
        coinGraphics.textStyle = { fontSize: '16px', color: '#8B6914' };
        coinGraphics.generateTexture('coin', 32, 32);

        // 创建按钮纹理
        this.createButtonTexture('btn-buy', 150, 40, 0x0f3460);
        this.createButtonTexture('btn-buy-hover', 150, 40, 0x1a5276);
        this.createButtonTexture('btn-disabled', 150, 40, 0x555555);
    }

    drawLocomotive(graphics) {
        // 车身主体
        graphics.fillStyle(0x333333);
        graphics.fillRect(10, 15, 80, 35);

        // 驾驶室
        graphics.fillStyle(0x444444);
        graphics.fillRect(70, 10, 35, 40);

        // 烟囱
        graphics.fillStyle(0x222222);
        graphics.fillRect(20, 5, 15, 15);

        // 车轮
        graphics.fillStyle(0x111111);
        graphics.fillCircle(30, 52, 8);
        graphics.fillCircle(55, 52, 8);
        graphics.fillCircle(85, 52, 8);

        // 车窗
        graphics.fillStyle(0x87CEEB);
        graphics.fillRect(78, 18, 18, 15);

        // 前灯
        graphics.fillStyle(0xFFFF00);
        graphics.fillCircle(12, 30, 5);
    }

    drawFreightCar(graphics) {
        // 车身
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(5, 10, 90, 35);

        // 货物
        graphics.fillStyle(0xA0522D);
        graphics.fillRect(10, 15, 80, 25);

        // 车轮
        graphics.fillStyle(0x333333);
        graphics.fillCircle(20, 48, 7);
        graphics.fillCircle(80, 48, 7);

        // 连接器
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 25, 5, 5);
        graphics.fillRect(95, 25, 5, 5);
    }

    drawPassengerCar(graphics) {
        // 车身
        graphics.fillStyle(0x2E8B57);
        graphics.fillRect(5, 10, 90, 35);

        // 车窗
        graphics.fillStyle(0x87CEEB);
        for (let i = 0; i < 5; i++) {
            graphics.fillRect(12 + i * 17, 15, 12, 12);
        }

        // 车顶
        graphics.fillStyle(0x228B22);
        graphics.fillRect(5, 8, 90, 5);

        // 车轮
        graphics.fillStyle(0x333333);
        graphics.fillCircle(20, 48, 7);
        graphics.fillCircle(80, 48, 7);

        // 连接器
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 25, 5, 5);
        graphics.fillRect(95, 25, 5, 5);
    }

    drawDiningCar(graphics) {
        // 车身
        graphics.fillStyle(0xDC143C);
        graphics.fillRect(5, 10, 90, 35);

        // 车窗
        graphics.fillStyle(0xFFFFE0);
        for (let i = 0; i < 4; i++) {
            graphics.fillRect(12 + i * 22, 15, 15, 12);
        }

        // 车顶
        graphics.fillStyle(0xB22222);
        graphics.fillRect(5, 8, 90, 5);

        // 车轮
        graphics.fillStyle(0x333333);
        graphics.fillCircle(20, 48, 7);
        graphics.fillCircle(80, 48, 7);

        // 连接器
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 25, 5, 5);
        graphics.fillRect(95, 25, 5, 5);
    }

    drawOilCar(graphics) {
        // 车身（油罐形状）
        graphics.fillStyle(0x4169E1);
        graphics.fillRoundedRect(5, 12, 90, 30, 10);

        // 油罐顶部
        graphics.fillStyle(0x34495E);
        graphics.fillRect(10, 10, 80, 5);

        // 车轮
        graphics.fillStyle(0x333333);
        graphics.fillCircle(20, 48, 7);
        graphics.fillCircle(80, 48, 7);

        // 连接器
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 25, 5, 5);
        graphics.fillRect(95, 25, 5, 5);

        // 危险标志
        graphics.fillStyle(0xFFFF00);
        graphics.fillRect(40, 20, 20, 15);
        graphics.fillStyle(0x000000);
        graphics.fillRect(45, 22, 10, 11);
    }

    createStationTexture(key, color, name) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // 站台基础
        graphics.fillStyle(0x808080);
        graphics.fillRect(0, 60, 150, 20);

        // 建筑主体
        graphics.fillStyle(color);
        graphics.fillRect(20, 20, 110, 45);

        // 屋顶
        graphics.fillStyle(0x333333);
        graphics.fillRect(15, 15, 120, 10);

        // 门
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(65, 40, 20, 25);

        // 窗户
        graphics.fillStyle(0xFFFFE0);
        graphics.fillRect(30, 30, 15, 15);
        graphics.fillRect(105, 30, 15, 15);

        // 站牌
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(55, 5, 40, 15);

        graphics.generateTexture(key, 150, 80);
    }

    createButtonTexture(key, width, height, color) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(color);
        graphics.fillRoundedRect(0, 0, width, height, 8);
        graphics.lineStyle(2, 0xFFFFFF, 0.3);
        graphics.strokeRoundedRect(0, 0, width, height, 8);
        graphics.generateTexture(key, width, height);
    }

    create() {
        // 延迟一下让用户看到加载完成
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
        });
    }
}
