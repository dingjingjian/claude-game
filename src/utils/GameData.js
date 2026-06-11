// 游戏数据管理类
class GameData {
    constructor() {
        this.data = {
            gold: 0,             // 金币
            totalGold: 0,        // 总金币收入
            trainSpeed: 60,      // 当前实际速度 (km/h)
            targetSpeed: 60,     // 目标速度（玩家设定）
            trainX: 0,           // 火车位置

            // 车厢系统
            carriages: {
                freight: 1,      // 货车厢数量
                passenger: 0,    // 客车厢数量
                dining: 0,       // 餐车数量
                oil: 0           // 油罐车数量
            },

            // 车头系统
            locomotive: {
                level: 1,
                speed: 60,
                power: 100
            },

            // 车站系统
            stationsVisited: 0,
            currentStationIndex: 0,

            // 升级价格
            prices: {
                freight: 100,
                passenger: 100,
                dining: 200,
                oil: 200,
                locomotive: 100
            },

            // 离线时间
            lastSaveTime: Date.now(),
            offlineEarnings: 0,

            // 运行里程（公里）
            totalDistance: 0
        };

        this.load();
    }

    // 保存游戏
    save() {
        this.data.lastSaveTime = Date.now();
        localStorage.setItem('trainIdleGame', JSON.stringify(this.data));
    }

    // 加载游戏
    load() {
        const saved = localStorage.getItem('trainIdleGame');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.data = { ...this.data, ...parsed };
            // 迁移：旧存档没有 targetSpeed
            if (this.data.targetSpeed === undefined) {
                this.data.targetSpeed = this.data.trainSpeed;
            }
            // 迁移：旧存档价格取整到整齐数字
            if (parsed.prices) {
                const defaultPrices = { freight: 100, passenger: 100, dining: 200, oil: 200, locomotive: 100 };
                Object.keys(this.data.prices).forEach(key => {
                    this.data.prices[key] = Math.max(defaultPrices[key] || 0, this.roundToNiceNumber(this.data.prices[key]));
                });
            }

            // 计算离线收益
            const offlineTime = (Date.now() - this.data.lastSaveTime) / 1000;
            if (offlineTime > 60) {
                this.data.offlineEarnings = this.calculateOfflineEarnings(offlineTime);
                this.data.gold += this.data.offlineEarnings;
                this.data.totalGold += this.data.offlineEarnings;
                // 离线里程（按最后速度计算）
                if (this.data.trainSpeed > 0) {
                    this.data.totalDistance += this.data.trainSpeed * offlineTime / 3600;
                }
            }
        }
    }

    // 计算离线收益
    calculateOfflineEarnings(seconds) {
        // 离线收益只算车厢收入，不扣维护费（离线不扣钱）
        const carriageEarning = this.getCarriageEarning();
        const efficiency = 0.5; // 离线效率50%
        return Math.max(0, Math.floor(carriageEarning * seconds * efficiency));
    }

    // 获取每秒维护费（最低3金/秒，速度越高越贵）
    getMaintenanceCost() {
        return Math.max(3, Math.floor(this.data.trainSpeed * 0.05));
    }

    // 获取纯车厢收入（不含维护费，用于UI显示）
    getCarriageEarning() {
        const { carriages } = this.data;
        let earning = 0;
        // 货运每秒收益（低，油罐车不加成每秒）
        earning += carriages.freight * 6;
        // 客运每秒收益（高，餐车加成客运每秒）
        earning += carriages.passenger * 10 * (1 + carriages.dining * 0.4);
        return earning;
    }

    // 获取车头皮肤（根据等级自动切换）
    getLocoSkin() {
        const level = this.data.locomotive.level;
        if (level >= 21) return 'loco-fuxing';   // 250-300
        if (level >= 16) return 'loco-hexie';     // 210-240
        if (level >= 11) return 'loco-electric';  // 160-200
        if (level >= 6)  return 'loco-diesel';    // 110-150
        return 'loco-steam';                      // 60-100
    }

    // 获取车头皮肤配置（蒸汽偏移、缩放等）
    getLocoSkinConfig() {
        const skin = this.getLocoSkin();
        const configs = {
            'loco-steam':    { scale: 0.22, x: 60, y: 0, steam: true,  steamX: 48, steamY: -50, cylX: 36, cylY: -10 },
            'loco-diesel':   { scale: 0.25, x: 70, y: 0, steam: false, steamX: 0,  steamY: 0,   cylX: 0,  cylY: 0   },
            'loco-electric': { scale: 0.22, x: 60, y: 0, steam: false, steamX: 0,  steamY: 0,   cylX: 0,  cylY: 0   },
            'loco-hexie':    { scale: 0.22, x: 65, y: 0, steam: false, steamX: 0,  steamY: 0,   cylX: 0,  cylY: 0   },
            'loco-fuxing':   { scale: 0.25, x: 75, y: 0, steam: false, steamX: 0,  steamY: 0,   cylX: 0,  cylY: 0   }
        };
        return configs[skin] || configs['loco-steam'];
    }

    // 获取皮肤名称（国际化）
    getLocoSkinName() {
        const skin = this.getLocoSkin();
        const names = {
            'loco-steam':    t('skinSteam'),
            'loco-diesel':   t('skinDiesel'),
            'loco-electric': t('skinElectric'),
            'loco-hexie':    t('skinHexie'),
            'loco-fuxing':   t('skinFuxing')
        };
        return names[skin] || '';
    }

    // 获取车厢配置（缩放、间距、Y偏移等）
    getCarriageConfig(type) {
        const configs = {
            'carriage-passenger': { scale: 0.22, y: 0, spacing: 130 },
            'carriage-dining':    { scale: 0.22, y: 0, spacing: 130 },
            'carriage-freight':   { scale: 0.22, y: 0, spacing: 130 },
            'carriage-oil':       { scale: 0.22, y: 0, spacing: 130 }
        };
        return configs[type] || configs['carriage-freight'];
    }

    // 获取金币
    getGold() {
        return this.data.gold;
    }

    // 破产检测
    checkBankrupt() {
        return this.data.gold < 0;
    }

    // 获取基础收益（每秒）
    getBaseEarning() {
        const { carriages } = this.data;
        let earning = 0;

        // 货运每秒收益（低，油罐车不加成每秒）
        earning += carriages.freight * 6;
        // 客运每秒收益（高，餐车加成客运每秒）
        earning += carriages.passenger * 10 * (1 + carriages.dining * 0.4);

        // 减去维护费
        earning -= this.getMaintenanceCost();

        return earning;
    }

    // 到站收益
    getStationEarning(stationType) {
        const { carriages } = this.data;
        let earning = 0;

        switch(stationType) {
            case 'freight':
                // 货运到站爆发收益，油罐车加成到站
                earning = carriages.freight * 120 * (1 + carriages.oil * 2)
                        + carriages.oil * 30 * (1 + carriages.oil * 2);
                break;
            case 'passenger':
                // 客运到站低收益，餐车不加成到站
                earning = carriages.passenger * 10;
                break;
            case 'mixed':
                // 综合站
                earning = carriages.freight * 100 * (1 + carriages.oil * 2)
                        + carriages.oil * 30 * (1 + carriages.oil * 2)
                        + carriages.passenger * 8;
                break;
        }

        return Math.floor(earning);
    }

    // 购买车厢
    buyCarriage(type) {
        const price = this.data.prices[type];
        const totalCarriages = this.data.carriages.freight + this.data.carriages.passenger + this.data.carriages.dining + this.data.carriages.oil;
        
        // 车厢上限随车头等级解锁
        if (totalCarriages >= this.getMaxCarriages()) {
            return false;
        }
        
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.carriages[type]++;
            // 价格递增（向上取整到整齐数字）
            this.data.prices[type] = this.roundToNiceNumber(price * 2);
            this.save();
            return true;
        }
        return false;
    }

    // 脱钩车厢
    uncoupleCarriage(type) {
        if (this.data.carriages[type] > 0) {
            this.data.carriages[type]--;
            // 价格回退（向上取整到整齐数字）
            this.data.prices[type] = Math.max(
                this.getDefaultPrice(type),
                this.roundToNiceNumber(this.data.prices[type] / 2)
            );
            this.save();
            return true;
        }
        return false;
    }

    // 获取车厢上限（随车头等级解锁）
    getMaxCarriages() {
        const level = this.data.locomotive.level;
        if (level >= 15) return 5;
        if (level >= 10) return 4;
        if (level >= 5) return 3;
        return 2;
    }

    // 获取车厢默认价格（价格下限）
    getDefaultPrice(type) {
        const defaults = { freight: 100, passenger: 100, dining: 200, oil: 200, locomotive: 100 };
        return defaults[type] || 0;
    }

    // 向上取整到最近的整齐数（1×10^n, 2×10^n, 5×10^n）
    roundToNiceNumber(num) {
        if (num <= 0) return 0;
        const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
        const normalized = num / magnitude;
        
        if (normalized <= 1) return Math.ceil(1 * magnitude);
        if (normalized <= 2) return Math.ceil(2 * magnitude);
        if (normalized <= 5) return Math.ceil(5 * magnitude);
        return Math.ceil(10 * magnitude);
    }

    // 升级车头
    upgradeLocomotive() {
        const price = this.data.prices.locomotive;
        const maxSpeed = 300; // 最高速度限制 300 km/h（高铁速度）
        
        if (this.data.locomotive.speed >= maxSpeed) {
            return false;
        }
        
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.locomotive.level++;
            this.data.locomotive.speed = Math.min(this.data.locomotive.speed + 10, maxSpeed);
            this.data.locomotive.power += 20;
            // 不再自动改变 trainSpeed，由玩家通过控制杆调节
            // 价格递增（向上取整到整齐数字）
            this.data.prices.locomotive = this.roundToNiceNumber(price * 1.5);
            this.save();
            return true;
        }
        return false;
    }

    // 添加金币
    addGold(amount) {
        this.data.gold += amount;
        this.data.totalGold += amount;
    }

    // 获取数据
    get(key) {
        return this.data[key];
    }

    // 重置游戏
    reset() {
        localStorage.removeItem('trainIdleGame');
        // 直接重置数据
        this.data = {
            gold: 0,
            totalGold: 0,
            trainSpeed: 60,
            targetSpeed: 60,
            trainX: 0,
            carriages: {
                freight: 1,
                passenger: 0,
                dining: 0,
                oil: 0
            },
            locomotive: {
                level: 1,
                speed: 60,
                power: 100
            },
            stationsVisited: 0,
            currentStationIndex: 0,
            prices: {
                freight: 100,
                passenger: 100,
                dining: 200,
                oil: 200,
                locomotive: 100
            },
            lastSaveTime: Date.now(),
            offlineEarnings: 0,
            totalDistance: 0
        };
        this.save();
        location.reload();
    }
}

// 全局游戏数据实例
const gameData = new GameData();
