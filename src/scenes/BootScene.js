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
        this.load.image('loco-steam', 'assets/loco/steam.png');
        this.load.image('loco-diesel', 'assets/loco/diesel.png');
        this.load.image('loco-electric', 'assets/loco/electric.png');
        this.load.image('loco-hexie', 'assets/loco/hexie.png');
        this.load.image('loco-fuxing', 'assets/loco/fuxing.png');

        this.load.image('locomotive', 'assets/loco/steam.png');
        this.load.image('carriage-freight', 'assets/carriage/freight.png');
        this.load.image('carriage-oil', 'assets/carriage/oil.png');
        this.load.image('carriage-passenger', 'assets/carriage/passenger.png');
        this.load.image('carriage-dining', 'assets/carriage/dining.png');

        // 铁轨
        this.load.image('rail', 'assets/rail.png');

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

        // 加载车站配置
        this.stationConfigs = {};
        this.load.json('stations-cfg', 'assets/station/stations.json');

        // 车站图片（直接在 preload 中加载，不依赖 JSON 回调）
        ['freight-1','freight-2','freight-3','freight-4'].forEach(f => {
            this.load.image(`station-${f}`, `assets/station/freight/${f}.png`);
        });
        ['passenger-1','passenger-2','passenger-3','passenger-4'].forEach(f => {
            this.load.image(`station-${f}`, `assets/station/passenger/${f}.png`);
        });
        ['mixed-1'].forEach(f => {
            this.load.image(`station-${f}`, `assets/station/mixed/${f}.png`);
        });

        // 创建非车厢的程序化纹理
        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
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

    createButtonTexture(key, width, height, color) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(color);
        graphics.fillRoundedRect(0, 0, width, height, 8);
        graphics.lineStyle(2, 0xFFFFFF, 0.3);
        graphics.strokeRoundedRect(0, 0, width, height, 8);
        graphics.generateTexture(key, width, height);
    }

    create() {
        // 读取车站配置，存入 registry 供 GameScene 使用
        const cfg = this.cache.json.get('stations-cfg');
        if (cfg) this.registry.set('stationConfigs', cfg);

        this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
        });
    }
}
