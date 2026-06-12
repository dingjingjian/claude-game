// 视差滚动背景模块
class Background {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        // 天空渐变（固定）
        const skyGradient = this.scene.add.graphics();
        skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FA, 0xE0F7FA, 1);
        skyGradient.fillRect(0, 0, width, height * 0.6);

        // 远山（视差背景，绘制足够宽以便无缝循环）
        this.mountainWidth = 20 * 250;
        this.mountains = this.scene.add.container(0, 0);
        const mountainsGfx = this.scene.add.graphics();
        mountainsGfx.fillStyle(0x228B22, 0.6);
        const mountainPeaks = [];
        for (let i = 0; i < 20; i++) {
            const x = i * 250 - 50;
            const peakHeight = 100 + Math.random() * 80;
            mountainPeaks.push({ x, peakHeight });
            mountainsGfx.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - peakHeight, x + 250, height * 0.45);
        }
        // 第二套山：偏移 mountainWidth，在 wrap 点与第一套重叠衔接
        for (let i = 0; i < mountainPeaks.length; i++) {
            const src = mountainPeaks[i];
            const x = src.x + this.mountainWidth;
            mountainsGfx.fillTriangle(x, height * 0.45, x + 125, height * 0.45 - src.peakHeight, x + 250, height * 0.45);
        }
        this.mountains.add(mountainsGfx);

        // 云朵（视差移动）
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            const cloud = this.scene.add.graphics();
            const cloudX = i * 200 + Math.random() * 100;
            const cloudY = 50 + Math.random() * 100;
            cloud.fillStyle(0xFFFFFF, 0.8);
            cloud.fillCircle(0, 0, 25);
            cloud.fillCircle(20, -10, 20);
            cloud.fillCircle(40, 0, 25);
            cloud.x = cloudX;
            cloud.y = cloudY;
            this.clouds.push(cloud);
        }

        // 树木（视差背景，双sprite无缝平铺）
        const treeStripWidth = 1500;
        const treeCount = 25;
        const treeGfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
        for (let i = 0; i < treeCount; i++) {
            const treeX = i * 60 + Math.random() * 20;
            const treeHeight = 30 + Math.random() * 40;
            treeGfx.fillStyle(0x8B4513);
            treeGfx.fillRect(treeX, height * 0.55 - treeHeight, 8, treeHeight);
            treeGfx.fillStyle(0x228B22);
            treeGfx.fillCircle(treeX + 4, height * 0.55 - treeHeight - 15, 20);
        }
        treeGfx.generateTexture('trees-strip', treeStripWidth, height);
        treeGfx.destroy();

        this.trees1 = this.scene.add.image(0, 0, 'trees-strip').setOrigin(0, 0);
        this.trees2 = this.scene.add.image(treeStripWidth, 0, 'trees-strip').setOrigin(0, 0).setFlipX(true);
        this.treeStripWidth = treeStripWidth;

        // 地面和草地（视差背景）
        this.ground = this.scene.add.container(0, 0);
        const groundGfx = this.scene.add.graphics();
        groundGfx.fillStyle(0x8B4513);
        groundGfx.fillRect(-width, height * 0.65, width * 3, height * 0.35);
        groundGfx.fillStyle(0x228B22);
        groundGfx.fillRect(-width, height * 0.62, width * 3, 15);
        this.ground.add(groundGfx);
    }

    createRails(width, height) {
        const railY = height * 0.697;
        const railScale = 0.4;
        const railOverlap = 2; // 重叠像素数，消除浮点精度导致的细缝

        // 铁轨（图片平铺，三sprite无缝循环）
        const railImg = this.scene.textures.get('rail');
        this.railTileWidth = railImg.getSourceImage().width * railScale;
        this.railSpacing = this.railTileWidth - railOverlap; // 实际间距（减去重叠）

        this.rails = [];
        for (let i = 0; i < 3; i++) {
            const rail = this.scene.add.image(this.railSpacing * i, railY, 'rail').setOrigin(0, 0.5).setScale(railScale);
            this.rails.push(rail);
        }
    }

    update(speed, deltaSeconds, width) {
        if (speed <= 0) return;

        const visualMul = 0.8 + speed / 120;

        // 远山（最慢）
        this.mountains.x -= speed * deltaSeconds * 0.25 * visualMul;
        if (this.mountains.x < -this.mountainWidth) {
            this.mountains.x += this.mountainWidth;
        }

        // 树木（中速，双sprite平铺循环）
        const treeDelta = speed * deltaSeconds * 0.6 * visualMul;
        this.trees1.x -= treeDelta;
        this.trees2.x -= treeDelta;
        if (this.trees1.x < -this.treeStripWidth) {
            this.trees1.x = this.trees2.x + this.treeStripWidth;
        }
        if (this.trees2.x < -this.treeStripWidth) {
            this.trees2.x = this.trees1.x + this.treeStripWidth;
        }

        // 云朵（慢速视差）
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                cloud.x -= speed * deltaSeconds * 0.45 * visualMul;
                if (cloud.x < -100) {
                    cloud.x = width + 100;
                }
            });
        }

        // 地面和草地（与车站同速）
        this.ground.x -= speed * deltaSeconds * 1.5 * visualMul;
        if (this.ground.x < -width) {
            this.ground.x += width;
        }

        // 铁轨（与车站同速，三sprite循环）
        const railDelta = speed * deltaSeconds * 1.5 * visualMul;
        this.rails.forEach(r => {
            r.x -= railDelta;
        });
        const maxX = Math.max(...this.rails.map(r => r.x));
        this.rails.forEach(r => {
            if (r.x < -this.railTileWidth) {
                r.x = maxX + this.railSpacing;
            }
        });
    }
}