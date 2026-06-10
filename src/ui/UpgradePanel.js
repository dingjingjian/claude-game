// 升级面板模块
class UpgradePanel {
    constructor(scene) {
        this.scene = scene;
    }

    create(width, height) {
        this.panel = this.scene.add.container(width / 2, height / 2);
        this.panel.setVisible(false);
        this.panel.setDepth(100);

        // 面板背景
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(-320, -230, 640, 460, 16);
        panelBg.lineStyle(3, 0x0f3460);
        panelBg.strokeRoundedRect(-320, -230, 640, 460, 16);
        this.panel.add(panelBg);

        // 标题
        this.titleText = this.scene.add.text(0, -190, t('upgradeCenter'), {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.panel.add(this.titleText);

        // 升级选项
        this.options = [];
        const options = [
            { key: 'locomotive', nameKey: 'locomotive', descKey: 'descLocomotive', icon: 'locomotive' },
            { key: 'freight', nameKey: 'freight', descKey: 'descFreight', icon: 'freight-car' },
            { key: 'oil', nameKey: 'oil', descKey: 'descOil', icon: 'oil-car' },
            { key: 'passenger', nameKey: 'passenger', descKey: 'descPassenger', icon: 'passenger-car' },
            { key: 'dining', nameKey: 'dining', descKey: 'descDining', icon: 'dining-car' }
        ];

        options.forEach((opt, index) => {
            const y = -160 + index * 76;

            // 选项背景
            const optBg = this.scene.add.graphics();
            optBg.fillStyle(0x16213e, 0.8);
            optBg.fillRoundedRect(-300, y, 600, 68, 8);
            this.panel.add(optBg);

            // 图标
            const icon = this.scene.add.image(-230, y + 34, opt.icon).setScale(0.17);
            this.panel.add(icon);

            // 名称
            const nameText = this.scene.add.text(-160, y + 14, t(opt.nameKey), {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.panel.add(nameText);

            // 描述
            const descText = this.scene.add.text(-160, y + 40, t(opt.descKey), {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#aaaaaa'
            });
            this.panel.add(descText);

            // 数量/等级
            const countText = this.scene.add.text(-30, y + 24, '', {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#87CEEB'
            }).setOrigin(0, 0.5);
            this.panel.add(countText);

            // 解挂按钮
            const uncoupleBtn = this.scene.add.image(110, y + 34, 'btn-danger')
                .setScale(0.6)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => uncoupleBtn.setTexture('btn-danger-hover'))
                .on('pointerout', () => uncoupleBtn.setTexture('btn-danger'));
            this.panel.add(uncoupleBtn);

            const uncoupleText = this.scene.add.text(110, y + 34, t('uncouple'), {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.panel.add(uncoupleText);

            // 购买按钮
            const btnTexture = opt.key === 'locomotive' ? 'btn-locomotive' : 'btn-buy';
            const btnHoverTexture = opt.key === 'locomotive' ? 'btn-locomotive-hover' : 'btn-buy-hover';
            const buyBtn = this.scene.add.image(220, y + 34, btnTexture)
                .setScale(0.6)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (buyBtn.texture.key !== 'btn-disabled') buyBtn.setTexture(btnHoverTexture);
                })
                .on('pointerout', () => {
                    if (buyBtn.texture.key === btnHoverTexture) buyBtn.setTexture(btnTexture);
                });
            this.panel.add(buyBtn);

            const priceText = this.scene.add.text(220, y + 34, '', {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#FFD700'
            }).setOrigin(0.5);
            this.panel.add(priceText);

            // 购买逻辑
            buyBtn.on('pointerdown', () => {
                if (opt.key === 'locomotive') {
                    if (gameData.upgradeLocomotive()) {
                        this.scene.speedLever.userTargetY = undefined;
                        this.scene.speedLever.dragging = false;
                        this.scene.train.updateCarriages();
                        this.scene.speedLever.refresh();
                        this.scene.showFloatingText(t('locoUpgrade'), 220, y + 34, '#00FF00');
                        this.scene.sfx.buy();
                        if (this.scene.train.swapSkin()) {
                            this.scene.showFloatingText('🚄 ' + gameData.getLocoSkinName(), 0, -100, '#FFD700');
                        }
                    }
                } else {
                    if (gameData.buyCarriage(opt.key)) {
                        this.scene.train.updateCarriages();
                        this.scene.showFloatingText(t('buySuccess'), 220, y + 34, '#00FF00');
                        this.scene.sfx.buyCarriage();
                    }
                }
                this.refresh();
                this.scene.hud.refresh();
            });

            // 解挂逻辑
            uncoupleBtn.on('pointerdown', () => {
                if (opt.key !== 'locomotive' && gameData.uncoupleCarriage(opt.key)) {
                    this.scene.train.updateCarriages();
                    this.scene.showFloatingText(t('uncoupleSuccess'), -55, y + 34, '#FF6347');
                    this.scene.sfx.uncouple();
                    this.refresh();
                    this.scene.hud.refresh();
                }
            });

            this.options.push({
                key: opt.key, nameKey: opt.nameKey, descKey: opt.descKey,
                icon, nameText, countText, priceText, descText, buyBtn, uncoupleBtn, uncoupleText
            });
        });

        // 关闭按钮
        const closeBtn = this.scene.add.text(300, -210, '✕', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            color: '#e94560'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.panel.add(closeBtn);
        closeBtn.on('pointerdown', () => { this.scene.sfx.click(); this.toggle(); });
    }

    toggle() {
        this.panel.setVisible(!this.panel.visible);
        if (this.panel.visible) {
            this.refresh();
        }
    }

    refresh() {
        const carriages = gameData.get('carriages');
        const prices = gameData.get('prices');
        const gold = gameData.get('gold');
        const totalCarriages = carriages.freight + carriages.passenger + carriages.dining + carriages.oil;
        const maxSpeed = GAME_CONFIG.MAX_SPEED;
        const isSpeedMaxed = gameData.get('locomotive').speed >= maxSpeed;

        this.titleText.setText(t('upgradeCenter'));

        this.options.forEach(opt => {
            let count, price;

            opt.nameText && opt.nameText.setText(t(opt.nameKey));

            if (opt.key === 'locomotive') {
                count = `Lv.${gameData.get('locomotive').level}`;
                price = prices.locomotive;
                if (opt.icon) opt.icon.setTexture(gameData.getLocoSkin());
                const nextLocoSpeed = Math.min(gameData.get('locomotive').speed + 10, maxSpeed);
                const skinName = gameData.getLocoSkinName();
                if (isSpeedMaxed) {
                    opt.descText.setText(`${skinName} | ${t('descLocomotiveMax')}`);
                } else {
                    const currentLocoSpeed = gameData.get('locomotive').speed;
                    opt.descText.setText(`${skinName} | ${t('descLocoSpeed', { from: currentLocoSpeed, to: nextLocoSpeed })}`);
                }
                opt.uncoupleBtn.setVisible(false);
                opt.uncoupleText.setVisible(false);
            } else {
                count = `x${carriages[opt.key]}`;
                price = prices[opt.key];
                const hasCarriage = carriages[opt.key] > 0;
                opt.uncoupleBtn.setVisible(hasCarriage);
                opt.uncoupleText.setVisible(hasCarriage);
                opt.uncoupleText.setText(t('uncouple'));

                switch (opt.key) {
                    case 'freight': {
                        const oilBonus = carriages.oil * 200;
                        const perSec = 6;
                        const perStation = 120 * (1 + carriages.oil * 2);
                        const bonusText = oilBonus > 0 ? `${t('oilBonusPrefix')}${oilBonus}%)` : '';
                        opt.descText.setText(t('descFreightDetail', { perSec, perStation: perStation.toFixed(0), bonus: bonusText }));
                        break;
                    }
                    case 'oil': {
                        const oilStationIncome = 30 * (1 + carriages.oil * 2);
                        opt.descText.setText(t('descOilDetail', { perStation: oilStationIncome.toFixed(0), bonus: carriages.oil * 200 }));
                        break;
                    }
                    case 'passenger': {
                        const diningBonus = carriages.dining * 40;
                        const perSec = 10 * (1 + carriages.dining * 0.4);
                        const bonusText = diningBonus > 0 ? `${t('diningBonusPrefix')}${diningBonus}%)` : '';
                        opt.descText.setText(t('descPassengerDetail', { perSec: perSec.toFixed(1), bonus: bonusText }));
                        break;
                    }
                    case 'dining': {
                        const totalPassengerEarning = carriages.passenger * 10 * (1 + carriages.dining * 0.4);
                        opt.descText.setText(t('descDiningDetail', { perSec: totalPassengerEarning.toFixed(1) }));
                        break;
                    }
                }
            }

            opt.countText.setText(count);
            opt.priceText.setText(`💰 ${price}`);

            const isCarriageFull = opt.key !== 'locomotive' && totalCarriages >= GAME_CONFIG.MAX_CARRIAGES;

            if (isCarriageFull) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText(t('maxCarriage'));
                opt.priceText.setColor('#333');
            } else if (opt.key === 'locomotive' && isSpeedMaxed) {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setText(t('maxSpeed'));
                opt.priceText.setColor('#333');
            } else if (gold >= price) {
                const activeTexture = opt.key === 'locomotive' ? 'btn-locomotive' : 'btn-buy';
                opt.buyBtn.setTexture(activeTexture);
                opt.priceText.setColor('#FFD700');
            } else {
                opt.buyBtn.setTexture('btn-disabled');
                opt.priceText.setColor('#333');
            }
        });
    }
}