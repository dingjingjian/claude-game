// 游戏数据管理类
class GameData {
    constructor() {
        this.data = {
            gold: 100,           // 金币
            totalGold: 0,        // 总金币收入
            trainSpeed: 60,      // 火车速度 (km/h)
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
                freight: 50,
                passenger: 80,
                dining: 150,
                oil: 200,
                locomotive: 500
            },

            // 离线时间
            lastSaveTime: Date.now(),
            offlineEarnings: 0
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

            // 计算离线收益
            const offlineTime = (Date.now() - this.data.lastSaveTime) / 1000;
            if (offlineTime > 60) {
                this.data.offlineEarnings = this.calculateOfflineEarnings(offlineTime);
                this.data.gold += this.data.offlineEarnings;
                this.data.totalGold += this.data.offlineEarnings;
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

    // 获取每秒维护费（等于车头等级）
    getMaintenanceCost() {
        return this.data.locomotive.level;
    }

    // 获取纯车厢收入（不含维护费，用于UI显示）
    getCarriageEarning() {
        const { carriages } = this.data;
        let earning = 0;
        // 货运收益（油罐车加成货运）
        earning += carriages.freight * 5 * (1 + carriages.oil * 0.15);
        // 客运收益（餐车加成客运）
        earning += carriages.passenger * 8 * (1 + carriages.dining * 0.2);
        return earning;
    }

    // 破产检测
    checkBankrupt() {
        return this.data.gold < 0;
    }

    // 获取基础收益（每秒）
    getBaseEarning() {
        const { carriages } = this.data;
        let earning = 0;

        // 货运收益（油罐车加成货运）
        earning += carriages.freight * 5 * (1 + carriages.oil * 0.15);
        // 客运收益（餐车加成客运）
        earning += carriages.passenger * 8 * (1 + carriages.dining * 0.2);

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
                // 油罐车加成货运到站收益
                earning = carriages.freight * 20 * (1 + carriages.oil * 0.15);
                break;
            case 'passenger':
                // 餐车加成客运到站收益
                earning = carriages.passenger * 30 * (1 + carriages.dining * 0.2);
                break;
            case 'mixed':
                // 综合站：货运和客运各自受对应加成
                earning = carriages.freight * 15 * (1 + carriages.oil * 0.15)
                        + carriages.passenger * 20 * (1 + carriages.dining * 0.2);
                break;
        }

        return Math.floor(earning);
    }

    // 购买车厢
    buyCarriage(type) {
        const price = this.data.prices[type];
        const totalCarriages = this.data.carriages.freight + this.data.carriages.passenger + this.data.carriages.dining + this.data.carriages.oil;
        
        // 最多5节车厢
        if (totalCarriages >= 5) {
            return false;
        }
        
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.carriages[type]++;
            // 价格递增（向上取整到10的倍数，保持数字整洁）
            this.data.prices[type] = Math.ceil(price * 1.5 / 10) * 10;
            this.save();
            return true;
        }
        return false;
    }

    // 脱钩车厢
    detachCarriage(type) {
        if (this.data.carriages[type] > 0) {
            this.data.carriages[type]--;
            // 返还部分金币（50%）
            const refund = Math.floor(this.data.prices[type] / 3);
            this.data.gold += refund;
            // 价格回退（与购买时的1.5倍递增对称，取整到10的倍数）
            this.data.prices[type] = Math.max(
                this.getDefaultPrice(type),
                Math.floor(this.data.prices[type] / 1.5 / 10) * 10
            );
            this.save();
            return true;
        }
        return false;
    }

    // 获取车厢默认价格（价格下限）
    getDefaultPrice(type) {
        const defaults = { freight: 50, passenger: 80, dining: 150, oil: 200, locomotive: 500 };
        return defaults[type] || 0;
    }

    // 升级车头
    upgradeLocomotive() {
        const price = this.data.prices.locomotive;
        const maxSpeed = 300; // 最高速度限制 300 km/h（高铁速度）
        
        if (this.data.trainSpeed >= maxSpeed) {
            return false;
        }
        
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.locomotive.level++;
            this.data.locomotive.speed += 10;
            this.data.locomotive.power += 20;
            this.data.trainSpeed = Math.min(this.data.locomotive.speed, maxSpeed);
            // 价格递增
            this.data.prices.locomotive = Math.floor(price * 2);
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
            gold: 100,
            totalGold: 0,
            trainSpeed: 60,
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
                freight: 50,
                passenger: 80,
                dining: 150,
                oil: 200,
                locomotive: 500
            },
            lastSaveTime: Date.now(),
            offlineEarnings: 0
        };
        this.save();
        location.reload();
    }
}

// 全局游戏数据实例
const gameData = new GameData();
