// 游戏数据管理类
class GameData {
    constructor() {
        this.data = {
            gold: 100,           // 金币
            totalGold: 0,        // 总金币收入
            trainSpeed: 2,       // 火车速度
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
                speed: 2,
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

            // 收益倍率
            multipliers: {
                freight: 1.0,
                passenger: 1.0,
                dining: 1.2,
                oil: 1.0
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
        const baseEarning = this.getBaseEarning();
        const efficiency = 0.5; // 离线效率50%
        return Math.floor(baseEarning * seconds * efficiency);
    }

    // 获取基础收益（每秒）
    getBaseEarning() {
        const { carriages, multipliers } = this.data;
        let earning = 0;

        // 货车厢收益
        earning += carriages.freight * 5 * multipliers.freight;
        // 客车厢收益
        earning += carriages.passenger * 8 * multipliers.passenger;
        // 餐车加成
        earning *= (1 + carriages.dining * 0.2);
        // 油罐车降低油耗（增加有效收益）
        earning *= (1 + carriages.oil * 0.15);

        return earning;
    }

    // 到站收益
    getStationEarning(stationType) {
        const { carriages, multipliers } = this.data;
        let earning = 0;

        switch(stationType) {
            case 'freight':
                earning = carriages.freight * 20 * multipliers.freight;
                break;
            case 'passenger':
                earning = carriages.passenger * 30 * multipliers.passenger;
                break;
            case 'mixed':
                earning = carriages.freight * 15 + carriages.passenger * 20;
                break;
        }

        // 餐车加成
        earning *= (1 + carriages.dining * 0.2);

        return Math.floor(earning);
    }

    // 购买车厢
    buyCarriage(type) {
        const price = this.data.prices[type];
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.carriages[type]++;
            // 价格递增
            this.data.prices[type] = Math.floor(price * 1.5);
            this.save();
            return true;
        }
        return false;
    }

    // 升级车头
    upgradeLocomotive() {
        const price = this.data.prices.locomotive;
        if (this.data.gold >= price) {
            this.data.gold -= price;
            this.data.locomotive.level++;
            this.data.locomotive.speed += 0.5;
            this.data.locomotive.power += 20;
            this.data.trainSpeed = this.data.locomotive.speed;
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
        location.reload();
    }
}

// 全局游戏数据实例
const gameData = new GameData();
