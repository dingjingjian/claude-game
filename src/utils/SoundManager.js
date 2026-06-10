// 音效管理器
class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;
        this.bgmPlaying = false;
        this.runPlaying = false;
    }

    // 播放一次性音效
    play(key, config) {
        if (!this.enabled) return;
        try {
            this.scene.sound.play(key, config);
        } catch (e) {
            // 音效文件缺失时静默
        }
    }

    // 按钮点击
    click() {
        this.play('sfx-click', { volume: 0.5 });
    }

    // 购买/升级成功
    buy() {
        this.play('sfx-buy', { volume: 0.6 });
    }

    // 解挂车厢
    uncouple() {
        this.play('sfx-uncouple', { volume: 0.6 });
    }

    // 金币入账（到站）
    gold() {
        this.play('sfx-gold', { volume: 0.5 });
    }

    // 购买车厢
    buyCarriage() {
        this.play('sfx-buy-carriage', { volume: 0.6 });
    }

    // 信号灯亮起
    signal() {
        this.play('sfx-signal', { volume: 0.5 });
    }

    // 火车汽笛（停车/开车）
    whistle() {
        this.play('sfx-whistle', { volume: 0.6 });
    }

    // 开始行驶循环音
    startRun() {
        if (this.runPlaying || !this.enabled) return;
        try {
            this.runSound = this.scene.sound.add('sfx-train-run', { volume: 0.2, loop: true });
            this.runSound.play();
            this.runPlaying = true;
        } catch (e) {}
    }

    // 根据速度调整行驶音速率（0.7 ~ 1.6）
    updateRunRate(speed) {
        if (!this.runSound) return;
        const rate = 0.7 + (speed / 300) * 0.9;
        this.runSound.setRate(Math.max(0.7, Math.min(1.6, rate)));
    }

    // 停止行驶循环音
    stopRun() {
        if (this.runSound) {
            this.runSound.stop();
            this.runSound.destroy();
            this.runSound = null;
        }
        this.runPlaying = false;
    }

    // 开始播放 BGM
    startBGM() {
        if (this.bgmPlaying) return;
        try {
            this.bgm = this.scene.sound.add('bgm', { volume: 0.5, loop: true });
            this.bgm.play();
            this.bgmPlaying = true;
        } catch (e) {}
    }

    // 停止 BGM
    stopBGM() {
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
            this.bgm = null;
        }
        this.bgmPlaying = false;
    }

    // 切换总开关
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBGM();
            this.stopRun();
        } else {
            this.startBGM();
        }
        return this.enabled;
    }

    // 设置开关（外部同步用）
    setEnabled(val) {
        this.enabled = val;
        if (!val) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
    }
}
