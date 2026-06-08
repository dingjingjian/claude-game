// 轻量国际化模块
const LANG_KEYS = {
    zh: {
        // 页面
        pageTitle: '中国铁路 - 火车挂机游戏',
        rotateHint: '请旋转手机至横屏模式',

        // UI 顶部
        earningPrefix: '每秒: ',
        speedText: '🚂 当前时速: ',
        carriageText: '🚃 车厢: ',
        stationText: '📍 到站: ',
        stationSuffix: '次',

        // 按钮
        upgrade: '升级',
        pause: '⏸ 暂停',
        resume: '▶ 继续',
        soundOn: '🔊 音效',
        soundOff: '🔇 静音',
        reset: '↻ 重置',
        settings: '⚙ 设置',

        // 装卸货
        loading: '装卸货中...',

        // 升级面板
        upgradeCenter: '升级中心',
        locomotive: '升级车头',
        freight: '货车厢',
        oil: '油罐车',
        passenger: '客车厢',
        dining: '餐车',
        detach: '脱钩',

        // 浮动文字
        locoUpgrade: '车头升级!',
        buySuccess: '购买成功!',
        detachSuccess: '脱钩成功!',

        // 描述
        descLocomotive: '',
        descLocomotiveMax: '已满速',
        descFreight: '到站高收益',
        descOil: '货运到站+200%',
        descPassenger: '每秒高收益',
        descDining: '客运每秒+40%',

        // 动态描述模板
        descLocoSpeed: '极速 {from}→{to} km/h',
        descFreightDetail: '+{perSec} 金/秒  到站+{perStation}{bonus}',
        descOilDetail: '到站+{perStation}金/节  货运+{bonus}%',
        descPassengerDetail: '+{perSec} 金/秒{bonus}  到站+10',
        descDiningDetail: '客运每秒+40%/节  当前客运 {perSec} 金/秒',
        oilBonusPrefix: ' (油罐+',
        diningBonusPrefix: ' (餐车+',

        // 收入/维护
        income: '收入:',
        maintenance: '维护:',

        // 满载/满速
        maxCarriage: '已满',
        maxSpeed: '已满速',

        // 车站名称
        stationFreight1: '货物集散中心',
        stationFreight2: '煤炭转运站',
        stationFreight3: '木材仓库',
        stationPassenger1: '中央车站',
        stationPassenger2: '城市客运站',
        stationPassenger3: '高铁站',
        stationMixed1: '综合枢纽站',
        stationMixed2: '城际车站',
        stationMixed3: '联合车站',

        // 车站类型
        typeFreight: '货运站',
        typePassenger: '客运站',
        typeMixed: '综合站',

        // 弹窗
        welcomeBack: '欢迎回来！',
        offlineEarnings: '离线收益: +',
        confirm: '确定',
        resetTitle: '确定要重置游戏吗？',
        resetDesc: '所有进度将丢失！',
        cancel: '取消',
        settingsTitle: '设置',
        languageLabel: '语言:',
        bankruptTitle: '💥 破产了！',
        bankruptDesc: '资金链断裂，铁路公司倒闭...',
        bankruptStations: '到站: ',
        bankruptTotal: '总金币: ',
        restart: '重新开始',
    },
    en: {
        // Page
        pageTitle: 'China Railway - Idle Train Game',
        rotateHint: 'Please rotate your phone to landscape mode',

        // UI top bar
        earningPrefix: '/s: ',
        speedText: '🚂 Speed: ',
        carriageText: '🚃 Cars: ',
        stationText: '📍 Stops: ',
        stationSuffix: '',

        // Buttons
        upgrade: 'Upgrade',
        pause: '⏸ Pause',
        resume: '▶ Resume',
        soundOn: '🔊 Sound',
        soundOff: '🔇 Mute',
        reset: '↻ Reset',
        settings: '⚙ Settings',

        // Loading
        loading: 'Loading...',

        // Upgrade panel
        upgradeCenter: 'Upgrade Center',
        locomotive: 'Locomotive',
        freight: 'Freight Car',
        oil: 'Oil Tanker',
        passenger: 'Passenger Car',
        dining: 'Dining Car',
        detach: 'Detach',

        // Floating text
        locoUpgrade: 'Upgraded!',
        buySuccess: 'Purchased!',
        detachSuccess: 'Detached!',

        // Descriptions
        descLocomotive: '',
        descLocomotiveMax: 'Max Speed',
        descFreight: 'High station income',
        descOil: 'Freight station +200%',
        descPassenger: 'High per-sec income',
        descDining: 'Passenger per-sec +40%',

        // Dynamic description templates
        descLocoSpeed: 'Speed {from}→{to} km/h',
        descFreightDetail: '+{perSec}/s  Station +{perStation}{bonus}',
        descOilDetail: 'Station +{perStation}/ea  Freight +{bonus}%',
        descPassengerDetail: '+{perSec}/s{bonus}  Station +10',
        descDiningDetail: 'Passenger per-sec +40%/ea  Total {perSec}/s',
        oilBonusPrefix: ' (Oil+',
        diningBonusPrefix: ' (Diner+',

        // Income / maintenance
        income: 'Income:',
        maintenance: 'Maint:',

        // Full
        maxCarriage: 'Full',
        maxSpeed: 'Max',

        // Station names
        stationFreight1: 'Freight Hub',
        stationFreight2: 'Coal Terminal',
        stationFreight3: 'Lumber Yard',
        stationPassenger1: 'Central Station',
        stationPassenger2: 'City Terminal',
        stationPassenger3: 'HSR Station',
        stationMixed1: 'Grand Junction',
        stationMixed2: 'InterCity Stop',
        stationMixed3: 'Union Station',

        // Station types
        typeFreight: 'Freight',
        typePassenger: 'Passenger',
        typeMixed: 'Mixed',

        // Dialogs
        welcomeBack: 'Welcome Back!',
        offlineEarnings: 'Offline earnings: +',
        confirm: 'OK',
        resetTitle: 'Reset the game?',
        resetDesc: 'All progress will be lost!',
        cancel: 'Cancel',
        settingsTitle: 'Settings',
        languageLabel: 'Language:',
        bankruptTitle: '💥 Bankrupt!',
        bankruptDesc: 'The railway company went bankrupt...',
        bankruptStations: 'Stops: ',
        bankruptTotal: 'Total gold: ',
        restart: 'Restart',
    }
};

// 当前语言（从存档读取，默认中文）
let currentLang = 'zh';
try {
    const saved = localStorage.getItem('trainIdleLang');
    if (saved && LANG_KEYS[saved]) {
        currentLang = saved;
    }
} catch (e) {}

// 翻译函数
function t(key, params) {
    const dict = LANG_KEYS[currentLang];
    let text = dict[key] || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
        }
    }
    return text;
}

// 切换语言
function setLang(lang) {
    if (!LANG_KEYS[lang]) return;
    currentLang = lang;
    try {
        localStorage.setItem('trainIdleLang', lang);
    } catch (e) {}
}

// 获取当前语言
function getLang() {
    return currentLang;
}

// 获取语言切换后的另一个语言
function toggleLang() {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    return newLang;
}

// 车站名称获取
function getStationName(type) {
    const idx = Math.floor(Math.random() * 3) + 1;
    const key = `station${type.charAt(0).toUpperCase() + type.slice(1)}${idx}`;
    return t(key);
}

// 车站类型名称
function getStationTypeName(type) {
    const key = `type${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return t(key);
}
