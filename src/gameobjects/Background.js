// 视差滚动背景模块
class Background {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        // === 1. 天空（固定背景，PNG 拉伸铺满） ===
        this.sky = this.scene.add.image(0, 0, 'sky').setOrigin(0, 0);
        this.sky.setDisplaySize(width, height);

        // === 2a. 远云（山后面，3 朵） ===
        this.clouds = [];
        this._addClouds(3, width, 0.6);

        // === 2b. 远山（最慢视差，三 sprite 无缝循环） ===
        this.mtnScale = 0.32;
        this.mountainWidth = 2604 * this.mtnScale;
        const mtnDisplayH = 360 * this.mtnScale;
        const mtnY = Math.round(height * 0.5 - mtnDisplayH);
        this.mountains = this.scene.add.container(0, 0);
        this.mtn1 = this.scene.add.image(0, mtnY, 'mountain').setOrigin(0, 0).setScale(this.mtnScale);
        this.mtn2 = this.scene.add.image(this.mountainWidth, mtnY, 'mountain').setOrigin(0, 0).setScale(this.mtnScale);
        this.mtn3 = this.scene.add.image(this.mountainWidth * 2, mtnY, 'mountain').setOrigin(0, 0).setScale(this.mtnScale);
        this.mountains.add([this.mtn1, this.mtn2, this.mtn3]);

        // === 2c. 近云（山前面，3 朵） ===
        this._addClouds(3, width, 0.85);

        // === 3. 中景草地（与近景树木同速 0.6x，ground.png 缩小） ===
        this.createMidgroundGrass(width, height);

        // === 4. 近景树木（原始速度 0.6x，双 sprite 循环） ===
        this.createTreeStrip(width, height);

        // === 5. 地面（快速视差，双 sprite 无缝循环） ===
        this.groundScale = 0.355;
        this.groundWidth = 2732 * this.groundScale;
        const groundOpaqueStart = 850;
        const groundY = Math.round(height * 0.68 - groundOpaqueStart * this.groundScale);
        this.ground1 = this.scene.add.image(0, groundY, 'ground').setOrigin(0, 0).setScale(this.groundScale);
        this.ground2 = this.scene.add.image(this.groundWidth, groundY, 'ground').setOrigin(0, 0).setScale(this.groundScale);
    }

    // 生成一组云朵，alpha 控制远近感
    _addClouds(count, width, baseAlpha) {
        const cloudKeys = ['cloud-1', 'cloud-2', 'cloud-3', 'cloud-4'];
        const cloudScales = [0.22, 0.12, 0.28, 0.20];
        for (let i = 0; i < count; i++) {
            const key = cloudKeys[this.clouds.length % cloudKeys.length];
            const baseScale = cloudScales[this.clouds.length % cloudScales.length];
            const s = baseScale * (0.85 + Math.random() * 0.3);
            const cloud = this.scene.add.image(
                this.clouds.length * 220 + Math.random() * 100,
                30 + Math.random() * 150,
                key
            ).setScale(s).setAlpha(baseAlpha * (0.85 + Math.random() * 0.15));
            this.clouds.push(cloud);
        }
    }

    // 中景草地：ground.png 缩小，填充远山与地面之间的空间
    createMidgroundGrass(width, height) {
        this.mgGrassScale = 0.2;
        this.mgGrassWidth = 2732 * this.mgGrassScale;
        const mgOpaqueStart = 800;
        const mgGrassY = Math.round(height * 0.48 - mgOpaqueStart * this.mgGrassScale);

        this.mgGrass1 = this.scene.add.image(0, mgGrassY, 'ground').setOrigin(0, 0).setScale(this.mgGrassScale).setAlpha(0.7);
        this.mgGrass2 = this.scene.add.image(this.mgGrassWidth, mgGrassY, 'ground').setOrigin(0, 0).setScale(this.mgGrassScale).setAlpha(0.7);
        this.mgGrass3 = this.scene.add.image(this.mgGrassWidth * 2, mgGrassY, 'ground').setOrigin(0, 0).setScale(this.mgGrassScale).setAlpha(0.7);
    }

    // 近景树木：near-trees.png 盖章生成条带，随机大小
    createTreeStrip(width, height) {
        const treeImg = this.scene.textures.get('near-trees').getSourceImage();
        const stripWidth = 1500;
        const treeScale = 0.08;
        const treeW = 863 * treeScale;
        const treeH = 1148 * treeScale;
        const treeCount = 22;

        const canvas = this.scene.textures.createCanvas('trees-strip', stripWidth, height);
        const ctx = canvas.context;
        for (let i = 0; i < treeCount; i++) {
            const x = i * (stripWidth / treeCount) + (Math.random() - 0.5) * 20;
            const s = 0.7 + Math.random() * 0.6;
            const w = treeW * s;
            const h = treeH * s;
            const y = Math.round(height * 0.62 - h - Math.random() * 20);
            ctx.drawImage(treeImg, x, y, w, h);
        }
        canvas.refresh();

        this.trees1 = this.scene.add.image(0, 0, 'trees-strip').setOrigin(0, 0);
        this.trees2 = this.scene.add.image(stripWidth, 0, 'trees-strip').setOrigin(0, 0).setFlipX(true);
        this.treeStripWidth = stripWidth;
    }

    createRails(width, height) {
        const railY = height * 0.697;
        const railScale = 0.4;
        const railOverlap = 2;

        const railImg = this.scene.textures.get('rail');
        this.railTileWidth = railImg.getSourceImage().width * railScale;
        this.railSpacing = this.railTileWidth - railOverlap;

        this.rails = [];
        for (let i = 0; i < 3; i++) {
            const rail = this.scene.add.image(this.railSpacing * i, railY, 'rail').setOrigin(0, 0.5).setScale(railScale);
            this.rails.push(rail);
        }
    }

    update(speed, deltaSeconds, width) {
        if (speed <= 0) return;
        const visualMul = 0.8 + speed / 120;

        // 远山（最慢，三 sprite 循环）
        const mtnDelta = speed * deltaSeconds * 0.25 * visualMul;
        this.mtn1.x -= mtnDelta;
        this.mtn2.x -= mtnDelta;
        this.mtn3.x -= mtnDelta;
        const maxMtnX = Math.max(this.mtn1.x, this.mtn2.x, this.mtn3.x);
        [this.mtn1, this.mtn2, this.mtn3].forEach(m => {
            if (m.x < -this.mountainWidth) {
                m.x = maxMtnX + this.mountainWidth;
            }
        });

        // 中景草地（与近景树木同速 0.6x，三 sprite 循环）
        const mgDelta = speed * deltaSeconds * 0.6 * visualMul;
        this.mgGrass1.x -= mgDelta;
        this.mgGrass2.x -= mgDelta;
        this.mgGrass3.x -= mgDelta;
        const maxMgX = Math.max(this.mgGrass1.x, this.mgGrass2.x, this.mgGrass3.x);
        [this.mgGrass1, this.mgGrass2, this.mgGrass3].forEach(g => {
            if (g.x < -this.mgGrassWidth) {
                g.x = maxMgX + this.mgGrassWidth;
            }
        });

        // 云朵（慢速视差）
        this.clouds.forEach(cloud => {
            cloud.x -= speed * deltaSeconds * 0.45 * visualMul;
            if (cloud.x < -200) {
                cloud.x = width + 100 + Math.random() * 100;
            }
        });

        // 近景树木（原始 0.6x）
        const treeDelta = speed * deltaSeconds * 0.6 * visualMul;
        this.trees1.x -= treeDelta;
        this.trees2.x -= treeDelta;
        if (this.trees1.x < -this.treeStripWidth) {
            this.trees1.x = this.trees2.x + this.treeStripWidth;
        }
        if (this.trees2.x < -this.treeStripWidth) {
            this.trees2.x = this.trees1.x + this.treeStripWidth;
        }

        // 地面（与车站同速 1.5x）
        const groundDelta = speed * deltaSeconds * 1.5 * visualMul;
        this.ground1.x -= groundDelta;
        this.ground2.x -= groundDelta;
        if (this.ground1.x < -this.groundWidth) {
            this.ground1.x = this.ground2.x + this.groundWidth;
        }
        if (this.ground2.x < -this.groundWidth) {
            this.ground2.x = this.ground1.x + this.groundWidth;
        }

        // 铁轨（与车站同速，三 sprite 循环）
        const railDelta = speed * deltaSeconds * 1.5 * visualMul;
        this.rails.forEach(r => { r.x -= railDelta; });
        const maxX = Math.max(...this.rails.map(r => r.x));
        this.rails.forEach(r => {
            if (r.x < -this.railTileWidth) {
                r.x = maxX + this.railSpacing;
            }
        });
    }
}
