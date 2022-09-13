function getRoomByAccessToken(access_token) {
    try {
        /**
         * category**
         * a: forever
         * b: 1 year
         * c: 6 months
         * d: 3 months
         * e: 1 month
         * f: 1 week
         * g: 2 year
         * h: 3 year
         * i: 5 year
         * z: forever with update permission
         */
        const token_arr = access_token.split('-');
        token_permission = token_arr[1];
        let room_name = 'romio';
        switch (token_permission) {
            case 'a':
                room_name = 'eater';
                break;
            case 'b':
                room_name = 'eater';
                break;
            case 'c':
                room_name = 'eater';
                break;
            case 'd':
                room_name = 'eater';
                break;
            case 'e':
                room_name = 'eater';
                break;
            case 'f':
                room_name = 'eater';
                break;
            case 'g':
                room_name = 'eater';
                break;
            case 'h':
                room_name = 'eater';
                break;
            case 'i':
                room_name = 'eater';
                break;
            case 'z':
                room_name = 'feeder';
                break;
            default:
                break;
        }
        return room_name;
    } catch (error) {
        console.log("Err from: utils > validator > validateUniqueAccessToken > try: ", error.message)
        return false;
    }
    return true;
}
function getArrayFromMapObjectArray(mapObjectArray) {
    return Object.fromEntries(mapObjectArray);
}
function emmitPing(socket) {
    socket.emit('ping', { "status": "connected", "port": "5007", "ping": new Date(), "socket": socket.id });
}
function emmitPingToRoom(socket, room, time_object) {
    let new_time = new Date();
    let date_diff = new_time - time_object.time;
    if (canCallAtTime(time_object)) {
        socket.to(room).emit('ping', { "status": "connected", "port": "5007", "ping": time_object.time, "socket": socket.id });
    }
}
async function fetchCoinData(time_object, previous_size) {
    if (!time_object) return [];
    if (!previous_size) return [];
    const rp = require('request-promise');
    let new_time = new Date();
    let date_diff = new_time - time_object.time;
    if (previous_size <= 0 || canCallAtTime(time_object)) {
        const requestOptions = {
            method: 'GET',
            uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map`,
            qs: { },
            headers: {
                'X-CMC_PRO_API_KEY': '3a8f1456-00eb-47e4-8729-12a30d22e4a8'
            },
            json: true,
            gzip: true
        };
        try {
            const data = await rp(requestOptions);
            
            return data.data;
        } catch (error) {
            console.log(`Error: from : utild.socket>function>fetchCoin`, error.message);
            return [];
        }
    } else {
        return [];
    }
}
async function fetchCoinOHLC(time_object, previous_size, currency_list, compare_currency_list) {
    try {
        const { getChartDataByCurrency } = require('../utils/functions.chart');
        if (!time_object) return [];
        if (!currency_list || !Array.isArray(currency_list) || currency_list.length <= 0) return [];
        if (!compare_currency_list || !Array.isArray(compare_currency_list) || compare_currency_list.length <= 0) return [];

        if (previous_size <= 0 || canCallAtTime(time_object)) {
            const ohlc = previous_size<=0?await getChartDataByCurrency(currency_list, compare_currency_list):[];
            if (!ohlc || Object.keys(ohlc).length <= 0) { return []; }
            return ohlc;
        } else {
            return [];
        }
    } catch (error) {
        console.log(`Error: from: utils.socket>functions.js>fetchCoinOHLC: `, error.message);
        return [];
    }
    
}
function canCallAtTime(time_object) {
    let new_time = new Date();
    let date_diff = new_time - time_object.time;
    if (date_diff / (1000 * (60 * time_object.interval)) > time_object.interval) {
        time_object.time = new_time;
        return true;
    }
    return false;
}

module.exports = {
    getRoomByAccessToken,
    getArrayFromMapObjectArray,
    emmitPingToRoom,
    emmitPing,
    fetchCoinData,
    fetchCoinOHLC,
}