// 游戏常量配置
const GAME_CONFIG = {
    // 画布尺寸
    WIDTH: 960,
    HEIGHT: 540,

    // 速度系统
    ACCEL_UP: 50,       // 加速度 km/h/s
    ACCEL_DOWN: 100,    // 减速度 km/h/s
    MAX_SPEED: 300,     // 车头最高速度 km/h

    // 车厢上限
    MAX_CARRIAGES: 5,

    // 车站
    STATION_INTERVAL: 35,   // 生成间隔（秒）
    LOADING_DURATION: 5,    // 装卸时间（秒）

    // 离线
    OFFLINE_EFFICIENCY: 0.5,
    OFFLINE_MIN_SECONDS: 60,

    // 存档间隔
    SAVE_INTERVAL: 30000,   // 30秒

    // 维护费
    MAINTENANCE_MIN: 3,
    MAINTENANCE_RATE: 0.05,

    // 蒸汽
    STEAM_POOL_SIZE: 40,

    // 信号灯
    SIGNAL_HIDE_DELAY: 3000, // 出站后信号灯隐藏延迟（ms）

    // 皮肤等级阈值
    SKIN_THRESHOLDS: {
        steam:    { min: 1,  max: 5  },
        diesel:   { min: 6,  max: 10 },
        electric: { min: 11, max: 15 },
        hexie:    { min: 16, max: 20 },
        fuxing:   { min: 21, max: Infinity }
    }
};