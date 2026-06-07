// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: [BootScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 等待游戏就绪后绑定事件
game.events.once('ready', () => {
    // 移动端优化：阻止触摸时页面滚动/缩放
    game.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    game.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    // 禁用长按菜单
    game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
});

// 页面关闭前保存
window.addEventListener('beforeunload', () => {
    gameData.save();
});

// 页面可见性变化时保存
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gameData.save();
    }
});
