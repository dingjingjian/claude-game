// 设置面板 + 重置确认 + 破产画面模块
class SettingsPanel {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        // 设置弹窗容器
        this.panel = this.scene.add.container(width / 2, height / 2);
        this.panel.setVisible(false);
        this.panel.setDepth(300);

        // 半透明遮罩
        const mask = this.scene.add.graphics();
        mask.fillStyle(0x000000, 0.7);
        mask.fillRect(-width / 2, -height / 2, width, height);
        mask.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
        this.panel.add(mask);

        // 面板背景
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(-150, -200, 300, 400, 16);
        panelBg.lineStyle(3, 0x5c6bc0);
        panelBg.strokeRoundedRect(-150, -200, 300, 400, 16);
        this.panel.add(panelBg);

        // 标题
        this.titleText = this.scene.add.text(0, -170, t('settingsTitle'), {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.panel.add(this.titleText);

        // 分隔线1
        const divider1 = this.scene.add.graphics();
        divider1.lineStyle(1, 0x334466);
        divider1.beginPath(); divider1.moveTo(-130, -135); divider1.lineTo(130, -135); divider1.strokePath();
        this.panel.add(divider1);

        // 语言选择
        this.langLabel = this.scene.add.text(0, -105, t('languageLabel'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#cccccc'
        }).setOrigin(0.5);
        this.panel.add(this.langLabel);

        this.langBtn = this.scene.add.image(0, -55, 'btn-sound')
            .setScale(1.2, 0.8)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.langBtn.setTexture('btn-sound-hover'))
            .on('pointerout', () => this.langBtn.setTexture('btn-sound'));
        this.panel.add(this.langBtn);

        this.langText = this.scene.add.text(0, -55, getLang() === 'zh' ? 'English' : '中文', {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.panel.add(this.langText);

        this.langBtn.on('pointerdown', () => {
            toggleLang();
            this.scene.refreshAllText();
        });

        // 分隔线2
        const divider2 = this.scene.add.graphics();
        divider2.lineStyle(1, 0x334466);
        divider2.beginPath(); divider2.moveTo(-130, 0); divider2.lineTo(130, 0); divider2.strokePath();
        this.panel.add(divider2);

        // 重置游戏
        this.resetLabel = this.scene.add.text(0, 30, t('reset'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#cccccc'
        }).setOrigin(0.5);
        this.panel.add(this.resetLabel);

        this.resetDesc = this.scene.add.text(0, 55, t('resetDesc'), {
            fontSize: '12px', fontFamily: 'Microsoft YaHei', color: '#888888'
        }).setOrigin(0.5);
        this.panel.add(this.resetDesc);

        const resetBtn = this.scene.add.image(0, 110, 'btn-reset')
            .setScale(1.2, 0.8)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => resetBtn.setTexture('btn-reset-hover'))
            .on('pointerout', () => resetBtn.setTexture('btn-reset'));
        this.panel.add(resetBtn);

        this.resetBtnText = this.scene.add.text(0, 110, t('reset'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.panel.add(this.resetBtnText);

        resetBtn.on('pointerdown', () => {
            this._showResetConfirm(width, height);
        });

        // 关闭按钮
        const closeBtn = this.scene.add.text(130, -180, '✕', {
            fontSize: '28px', fontFamily: 'Microsoft YaHei', color: '#e94560'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.panel.add(closeBtn);
        closeBtn.on('pointerdown', () => this.hide());
    }

    show() {
        this.panel.setVisible(true);
        this._refreshTexts();
    }

    hide() {
        this.panel.setVisible(false);
    }

    _refreshTexts() {
        this.titleText.setText(t('settingsTitle'));
        this.langLabel.setText(t('languageLabel'));
        this.langText.setText(getLang() === 'zh' ? 'English' : '中文');
        this.resetLabel.setText(t('reset'));
        this.resetDesc.setText(t('resetDesc'));
        this.resetBtnText.setText(t('reset'));
    }

    _showResetConfirm(width, height) {
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(300);

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width / 2 - 150, height / 2 - 60, 300, 120, 16);
        panel.lineStyle(3, 0xe94560);
        panel.strokeRoundedRect(width / 2 - 150, height / 2 - 60, 300, 120, 16);
        panel.setDepth(301);

        const title = this.scene.add.text(width / 2, height / 2 - 30, t('resetTitle'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(302);

        const desc = this.scene.add.text(width / 2, height / 2, t('resetDesc'), {
            fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(302);

        const cancelBtn = this.scene.add.text(width / 2 - 60, height / 2 + 35, t('cancel'), {
            fontSize: '16px', fontFamily: 'Microsoft YaHei', color: '#ffffff',
            backgroundColor: '#0f3460', padding: { x: 20, y: 6 }
        }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });

        const confirmBtn = this.scene.add.text(width / 2 + 60, height / 2 + 35, t('confirm'), {
            fontSize: '16px', fontFamily: 'Microsoft YaHei', color: '#ffffff',
            backgroundColor: '#e94560', padding: { x: 20, y: 6 }
        }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });

        const cleanup = () => {
            overlay.destroy(); panel.destroy(); title.destroy();
            desc.destroy(); cancelBtn.destroy(); confirmBtn.destroy();
        };

        cancelBtn.on('pointerdown', cleanup);
        confirmBtn.on('pointerdown', () => gameData.reset());
    }

    // 破产画面
    showBankrupt() {
        this.scene.isPaused = true;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 16);
        panel.lineStyle(3, 0xe94560);
        panel.strokeRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 16);
        panel.setDepth(501);

        this.scene.add.text(width / 2, height / 2 - 100, t('bankruptTitle'), {
            fontSize: '28px', fontFamily: 'Microsoft YaHei', color: '#e94560', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(502);

        this.scene.add.text(width / 2, height / 2 - 60, t('bankruptDesc'), {
            fontSize: '16px', fontFamily: 'Microsoft YaHei', color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(502);

        this.scene.add.text(width / 2, height / 2 - 10,
            `${t('bankruptStations')}${gameData.get('stationsVisited')}${t('stationSuffix')}\n${t('bankruptTotal')}${formatNumber(gameData.get('totalGold'))}`, {
            fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(502);

        const restartBtn = this.scene.add.text(width / 2, height / 2 + 60, t('restart'), {
            fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#ffffff',
            backgroundColor: '#e94560', padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setDepth(502).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => gameData.reset());
    }
}