// 顶部信息栏 + 底部按钮模块
class HUD {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        // 顶部信息栏背景
        const uiBg = this.scene.add.graphics();
        uiBg.fillStyle(0x1a1a2e, 0.9);
        uiBg.fillRect(0, 0, width, 60);
        uiBg.lineStyle(2, 0x0f3460);
        uiBg.strokeRect(0, 0, width, 60);
        uiBg.setDepth(20);

        // 金币图标
        const coinIcon = this.scene.add.image(30, 30, 'coin');
        coinIcon.setDepth(20);

        // 金币文字
        this.goldText = this.scene.add.text(55, 24, '0', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 前缀
        this.earningPrefixText = this.scene.add.text(55, 44, t('earningPrefix'), {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 净收入
        this.earningNetText = this.scene.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 收入部分
        this.earningIncomeText = this.scene.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#00FF00'
        }).setOrigin(0, 0.5).setDepth(20);

        // 收益/秒 - 维护部分
        this.earningMaintText = this.scene.add.text(55, 44, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#FF6347'
        }).setOrigin(0, 0.5).setDepth(20);

        // 速度显示
        this.speedText = this.scene.add.text(width / 2, 30, '', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            color: '#87CEEB'
        }).setOrigin(0.5).setDepth(20);

        // 车厢统计
        this.carriageText = this.scene.add.text(width - 20, 12, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 到站统计
        this.stationText = this.scene.add.text(width - 20, 36, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#aaaaaa',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // 运行里程
        this.distanceText = this.scene.add.text(width - 20, 36, '', {
            fontSize: '11px',
            fontFamily: 'Microsoft YaHei',
            color: '#88aacc',
            align: 'right'
        }).setOrigin(1, 0).setDepth(20);

        // === 底部按钮 ===

        // 升级按钮
        this.upgradeBtn = this.scene.add.image(width / 2, height - 45, 'btn-upgrade')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => this.upgradeBtn.setTexture('btn-upgrade-hover'))
            .on('pointerout', () => this.upgradeBtn.setTexture('btn-upgrade'))
            .on('pointerdown', () => this.scene.upgradePanel.toggle());
        this.upgradeBtn.on('pointerdown', () => this.scene.sfx.click());

        this.upgradeBtnText = this.scene.add.text(width / 2, height - 45, t('upgrade'), {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20);

        // 设置按钮（左下角）
        const settingsBtn = this.scene.add.image(50, height - 40, 'btn-settings')
            .setInteractive({ useHandCursor: true })
            .setDepth(20)
            .on('pointerover', () => settingsBtn.setTexture('btn-settings-hover'))
            .on('pointerout', () => settingsBtn.setTexture('btn-settings'));

        this.scene.add.text(50, height - 40, '⚙', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        settingsBtn.on('pointerdown', () => {
            this.scene.settingsPanel.show();
            this.scene.sfx.click();
        });
    }

    refresh() {
        const gold = gameData.get('gold');
        const carriages = gameData.get('carriages');
        const stationsVisited = gameData.get('stationsVisited');
        const speed = gameData.get('trainSpeed');

        this.goldText.setText(formatNumber(gold));
        const carriageEarning = gameData.getCarriageEarning();
        const maintenance = gameData.getMaintenanceCost();
        const net = gameData.getBaseEarning();
        const netStr = net >= 0 ? `+${formatNumber(net)}` : formatNumber(net);

        let netColor = '#aaaaaa';
        if (net > 0) netColor = '#00FF00';
        else if (net < 0) netColor = '#FF6347';

        this.earningPrefixText.setText(t('earningPrefix'));
        this.earningNetText.setText(netStr + '  ');
        this.earningNetText.setColor(netColor);
        this.earningIncomeText.setText(`(${t('income')}${formatNumber(carriageEarning)}, `);
        this.earningMaintText.setText(`${t('maintenance')}${maintenance})`);

        const baseX = 55;
        this.earningPrefixText.setX(baseX);
        this.earningNetText.setX(baseX + this.earningPrefixText.width);
        this.earningIncomeText.setX(baseX + this.earningPrefixText.width + this.earningNetText.width);
        this.earningMaintText.setX(baseX + this.earningPrefixText.width + this.earningNetText.width + this.earningIncomeText.width);

        this.carriageText.setText(
            `${t('carriageText')}${carriages.freight + carriages.passenger + carriages.dining + carriages.oil}/${gameData.getMaxCarriages()}`
        );

        const width = this.scene.cameras.main.width;
        const dist = gameData.get('totalDistance');
        let distStr;
        if (dist >= 1000) {
            distStr = (dist / 1000).toFixed(1) + 'k';
        } else if (dist >= 100) {
            distStr = Math.floor(dist).toString();
        } else {
            distStr = dist.toFixed(1);
        }
        this.distanceText.setText(`${t('distanceText')}${distStr}${t('distanceUnit')}`);

        const stationY = 36;
        this.stationText.setText(`${t('stationText')}${stationsVisited}${t('stationSuffix')}`);
        this.stationText.setPosition(width - 20 - this.distanceText.width - 10, stationY);

        // 如果升级面板打开，同步更新
        if (this.scene.upgradePanel && this.scene.upgradePanel.panel && this.scene.upgradePanel.panel.visible) {
            this.scene.upgradePanel.refresh();
        }
    }

    refreshText() {
        if (this.soundBtnText) {
            this.soundBtnText.setText(this.scene.soundEnabled ? t('soundOn') : t('soundOff'));
        }
    }
}

// 全局格式化数字函数（供多模块使用）
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
}