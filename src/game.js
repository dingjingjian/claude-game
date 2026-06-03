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
