// 铁路信号灯模块
class SignalLight {
    constructor(scene) {
        this.scene = scene;
    }

    create() {
        // 铁路信号机容器（左侧）
        this.container = this.scene.add.container(55, 165);
        this.container.setDepth(25);
        this.container.setVisible(false);

        const boxW = 32;
        const boxH = 54;
        const botBoxH = 32;
        const lightR = 8;
        const lightSpacing = 20;
        const startY = -boxH / 2 + 17;
        const gap = 4;

        // 绘制单个机构灯箱（胶囊形状）
        const drawBox = (yOffset, h) => {
            const box = this.scene.add.graphics();
            box.fillStyle(0x111111);
            box.fillRoundedRect(-boxW / 2, yOffset - h / 2, boxW, h, boxW / 2);
            box.lineStyle(2, 0x999999);
            box.strokeRoundedRect(-boxW / 2, yOffset - h / 2, boxW, h, boxW / 2);
            this.container.add(box);
        };

        // 上方机构：黄、绿
        const topY = -boxH - gap;
        drawBox(topY, boxH);

        // 中间机构：红、黄
        const midY = 0;
        drawBox(midY, boxH);

        // 下方引导机构：月白（单灯位，高度更小）
        const botY = boxH / 2 + gap + botBoxH / 2;
        drawBox(botY, botBoxH);

        // 绘制单个灯位（带银色边框的圆形）
        const drawLight = (y, color, alpha = 1) => {
            const g = this.scene.add.graphics();
            g.lineStyle(2, 0x888888, alpha);
            g.strokeCircle(0, y, lightR);
            g.fillStyle(color, alpha);
            g.fillCircle(0, y, lightR - 1);
            return g;
        };

        // 灯位定义
        const lightDefs = [
            { name: 'yellow1', y: topY + startY,           offColor: 0x332200, onColor: 0xFFCC00 },
            { name: 'green',   y: topY + startY + lightSpacing, offColor: 0x002200, onColor: 0x00FF00 },
            { name: 'red',     y: midY + startY,           offColor: 0x330000, onColor: 0xFF0000 },
            { name: 'yellow2', y: midY + startY + lightSpacing, offColor: 0x332200, onColor: 0xFFCC00 },
            { name: 'white',   y: botY,                    offColor: 0x222222, onColor: 0xFFFFDD }
        ];

        const lights = {};
        lightDefs.forEach(def => {
            const off = drawLight(def.y, def.offColor);
            this.container.add(off);

            const on = drawLight(def.y, def.onColor);
            on.fillStyle(def.onColor, 0.25);
            on.fillCircle(0, def.y, lightR + 5);
            on.setVisible(false);
            this.container.add(on);

            lights[def.name] = { on, off };
        });

        this.lights = lights;
    }

    show(visible) {
        if (this.container) {
            this.container.setVisible(visible);
        }
    }

    setState(state) {
        if (!this.lights) return;
        // 关闭所有灯
        Object.values(this.lights).forEach(l => l.on.setVisible(false));
        // 按状态亮灯
        if (state === 'yellow') {
            this.lights.yellow1.on.setVisible(true);
        } else if (state === 'red') {
            this.lights.red.on.setVisible(true);
        } else if (state === 'green') {
            this.lights.green.on.setVisible(true);
        }
    }
}