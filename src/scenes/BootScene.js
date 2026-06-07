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

        // 加载真实美术资源
        this.load.image('locomotive', 'assets/locomotive.png');
        this.load.image('freight-car', 'assets/freight-car.png');
        this.load.image('oil-car', 'assets/oil-car.png');
        this.load.image('passenger-car', 'assets/passenger-car.png');
        this.load.image('dining-car', 'assets/dining-car.png');

        // 创建非车厢的程序化纹理
        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
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
        coinGraphics.generateTexture('coin', 32, 32);

        // 创建按钮纹理
        this.createButtonTexture('btn-buy', 200, 50, 0x0f3460);
        this.createButtonTexture('btn-buy-hover', 200, 50, 0x1a5276);
        this.createButtonTexture('btn-disabled', 200, 50, 0x555555);
        this.createButtonTexture('btn-danger', 200, 50, 0xe94560);
        this.createButtonTexture('btn-danger-hover', 200, 50, 0xff6b81);
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
