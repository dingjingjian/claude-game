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
        const loadingText = this.add.text(width / 2, height / 2 - 50, t('loading'), {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.width = 396 * value;
        });

        this.load.on('complete', () => {
            loadingText.setText(t('loadComplete'));
        });

        // 加载真实美术资源
        // 车头皮肤
        this.load.image('loco-steam', 'assets/images/loco-steam.png');
        this.load.image('loco-diesel', 'assets/images/loco-diesel.png');
        this.load.image('loco-electric', 'assets/images/loco-electric.png');
        this.load.image('loco-hexie', 'assets/images/loco-hexie.png');
        this.load.image('loco-fuxing', 'assets/images/loco-fuxing.png');
        // 兼容旧引用（车厢等）
        this.load.image('locomotive', 'assets/images/loco-steam.png');
        this.load.image('freight-car', 'assets/images/freight-car.png');
        this.load.image('oil-car', 'assets/images/oil-car.png');
        this.load.image('passenger-car', 'assets/images/passenger-car.png');
        this.load.image('dining-car', 'assets/images/dining-car.png');

        // 音效
        this.load.audio('sfx-click', 'assets/sfx/click.mp3');
        this.load.audio('sfx-buy', 'assets/sfx/buy.mp3');
        this.load.audio('sfx-gold', 'assets/sfx/gold.mp3');
        this.load.audio('sfx-uncouple', 'assets/sfx/uncouple.mp3');
        this.load.audio('sfx-buy-carriage', 'assets/sfx/buy-carriage.mp3');
        this.load.audio('sfx-signal', 'assets/sfx/signal.mp3');
        this.load.audio('sfx-whistle', 'assets/sfx/whistle.mp3');
        this.load.audio('sfx-train-run', 'assets/sfx/train-run.mp3');
        this.load.audio('bgm', 'assets/sfx/bgm.ogg');

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
        this.createButtonTexture('btn-buy', 200, 50, 0x3c89e8);
        this.createButtonTexture('btn-buy-hover', 200, 50, 0x5da6f2);
        this.createButtonTexture('btn-locomotive', 200, 50, 0x6abe39);
        this.createButtonTexture('btn-locomotive-hover', 200, 50, 0x8cd44f);
        this.createButtonTexture('btn-disabled', 200, 50, 0x555555);
        this.createButtonTexture('btn-danger', 120, 50, 0xe94560);
        this.createButtonTexture('btn-danger-hover', 120, 50, 0xff6b81);
        // 升级按钮（金色/橙色渐变）
        this.createButtonTexture('btn-upgrade', 200, 50, 0xE8A317);
        this.createButtonTexture('btn-upgrade-hover', 200, 50, 0xFFD54F);
        // 暂停按钮
        this.createButtonTexture('btn-pause', 120, 44, 0x3c89e8);
        this.createButtonTexture('btn-pause-hover', 120, 44, 0x5da6f2);
        // 音效按钮
        this.createButtonTexture('btn-sound', 120, 44, 0x3c89e8);
        this.createButtonTexture('btn-sound-hover', 120, 44, 0x5da6f2);
        // 重置按钮（红色警告风格）
        this.createButtonTexture('btn-reset', 120, 44, 0xe94560);
        this.createButtonTexture('btn-reset-hover', 120, 44, 0xff6b81);
        // 设置按钮（齿轮风格）
        this.createButtonTexture('btn-settings', 44, 44, 0x5c6bc0);
        this.createButtonTexture('btn-settings-hover', 44, 44, 0x7986cb);

        // 创建蒸汽粒子纹理（不用 generateTexture，直接用 CanvasTexture 更可靠）
        const canvas = this.textures.createCanvas('steam-particle', 32, 32);
        const ctx = canvas.context;
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        canvas.refresh();
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
