async function getChartDataByCurrency(currency_type, compare_currency) {
    if (currency_type && compare_currency) {
        const rp = require('request-promise');
        const c_date = new Date();
        c_date.setDate(c_date.getDate() + 1);
        const start_date = c_date.getFullYear() + "-" + c_date.getUTCMonth() + "-" + c_date.getDate();
        c_date.setMonth(c_date.getMonth() + 1);
        const now = c_date.getFullYear() + "-" + c_date.getMonth() + "-" + c_date.getDate();
        let dt;
        const requestOptions = {
            method: 'GET',
            uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical`,
            qs: {
                'symbol': Array.isArray(currency_type) ? currency_type.join(',') : currency_type,
                'time_start': start_date,
                'time_end': now,
                'interval': '1h',
                'convert': Array.isArray(compare_currency) ? compare_currency.join(',') : compare_currency
            },
            headers: {
                'X-CMC_PRO_API_KEY': '55223f08-515b-46d2-8874-ca54d263b848'
            },
            json: true,
            gzip: true
        };
        dt = await rp(requestOptions);
        const ohlc = await formateOHLC(dt.data);
        return { ohlc, currency_type, compare_currency };
    } else {
        return { ohlc:[], currency_type, compare_currency };
    }
    // return { o, h, l, c, v, t, currency_type, compare_currency };
}
async function formateOnlyOHLC(data) {
    const ohlc = {
        o: [],
        h: [],
        l: [],
        c: [],
        v: [],
        t: []
    };

    for (const v of data.quotes) {
        let _keys = Object.keys(v.quote);
        for (const k1 of _keys) {
            ohlc['o'].push(v.quote[k1].open);
            ohlc['h'].push(v.quote[k1].high);
            ohlc['l'].push(v.quote[k1].low);
            ohlc['c'].push(v.quote[k1].close);
            ohlc['v'].push(v.quote[k1].volume);
            ohlc['t'].push(new Date(v.quote[k1].timestamp) / 1000);
        }

    }
    return ohlc;
}
async function formateOHLCFromWazir(data,sy,updateprice) {
  const ohlc = {
      o: [],
      h: [],
      l: [],
      c: [],
      v: [],
      s: 'ok',
      y: sy,
      t: [],
      ls:'',
  };
  let ls = 0; 
  let _keys = Object.keys(data);
    for (const k1 of _keys) {
      ohlc['t'].push(data[k1][0]);
      ohlc['o'].push(data[k1][1]);
      ohlc['h'].push(data[k1][2]);
      ohlc['l'].push(data[k1][3]);
      ohlc['c'].push(data[k1][4]);
      ohlc['v'].push(data[k1][5]);
      ls = data[k1][4];
    }
    ohlc['ls'] = ls;
    if(updateprice){
      const Currency = require("../models/suppoted_currency");
      let update =  await Currency.updateOne({ symbol: sy }, {
          $set: {
            inr_price: ls
          }
      })
    }
  return ohlc;
}
async function formateOHLC(data) {
    const ohlc = {};
    if (data.id) {
        // console.log(Object.keys(data));
        await formateQuotes(data.quotes, data.symbol, ohlc);
    } else {
        const keys = Object.keys(data);
        // console.log("keys:", keys)
        for (const k of keys) {
            let val = data[k];
            if (val.quotes)
                await formateQuotes(val.quotes, k, ohlc);
        }
    }
    return ohlc;
}
async function formateQuotes(quotes, k, ohlc) {
    for (const v of quotes) {
        let _keys = Object.keys(v.quote);
        for (const k1 of _keys) {
            if (!ohlc[k + k1]) {
                ohlc[k + k1] = {
                    o: [],
                    h: [],
                    l: [],
                    c: [],
                    v: [],
                    t: []
                }
            }
            ohlc[k + k1]['o'].push(v.quote[k1].open);
            ohlc[k + k1]['h'].push(v.quote[k1].high);
            ohlc[k + k1]['l'].push(v.quote[k1].low);
            ohlc[k + k1]['c'].push(v.quote[k1].close);
            ohlc[k + k1]['v'].push(v.quote[k1].volume);
            ohlc[k + k1]['t'].push(new Date(v.quote[k1].timestamp) / 1000);
        }

    }
}
async function getHistory(currency, compare, resolution, from, to, limit) {
    const c_date = new Date();
    c_date.setDate(c_date.getDate() + 1);
    const start_date = c_date.getFullYear() + "-" + c_date.getUTCMonth() + "-" + c_date.getDate();
    c_date.setMonth(c_date.getMonth() + 1);
    const now = c_date.getFullYear() + "-" + c_date.getMonth() + "-" + c_date.getDate();
    try {
        if (currency && compare && resolution && from && to && limit) {
            const rp = require('request-promise');
            let dt;
            const requestOptions = {
                method: 'GET',
                uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical`,
                qs: {
                    'symbol': currency,
                    'time_start': start_date?start_date:from,
                    'time_end': now?now:to,
                    'interval': '1h',
                    'convert': compare
                },
                headers: {
                    'X-CMC_PRO_API_KEY': '3a8f1456-00eb-47e4-8729-12a30d22e4a8'
                },
                json: true,
                gzip: true
            };
            dt = await rp(requestOptions);
            // console.log("dt_data: ", dt.data);
            const ohlc = await formateOnlyOHLC(dt.data);
            return ohlc;
        } else {
            return {};
        }
    } catch (error) {
        // console.log("Error: from:utils>functions.chart.js>getHistory: ", error.message);
        return {};
    }    
}
async function getConfigExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": false,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "1",
          "5",
          "15",
          "30",
          "1H",
          "2H",
          "4H",
          "6H",
          "12H",
          "1D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "6M"
        ]
      };
    return config;
}
async function getMarkExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": true,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "1",
          "5",
          "15",
          "30",
          "1H",
          "2H",
          "4H",
          "6H",
          "12H",
          "1D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "6M"
        ]
      };
    return config;
}
async function getStudyTemplateExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": true,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "1",
          "5",
          "15",
          "30",
          "1H",
          "2H",
          "4H",
          "6H",
          "12H",
          "1D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "6M"
        ]
      };
    return config;
}
async function getTimeExchange(data) {
    const config = Date.now();
    return config;
}
async function timescale_marks(data) {
    const config = Date.now();
    return config;
}
async function getSymbolExchange(exName) {
    const config = {
        "name": "BITFLASH",
        "exchange-traded": "Bitcoin/Inr",
        "exchange-listed": "BITFLASH",
        "timezone": "IST",
        "minmov": 1,
        "minmov2": 0,
        "pointvalue": 1,
        "session": "0930-1630",
        "has_intraday": true,
        "has_no_volume": false,
        "compare_symbols":false,
        "description": exName,
        "supported_resolutions": [
          "1",
          "5",
          "15",
          "30",
          "1H",
          "2H",
          "4H",
          "6H",
          "12H",
          "1D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "6M"
        ],
        "pricescale": 10000,
        "ticker": exName
      };
    return config;
}
async function getsymbolInfoExchange(exName) {
    const config = {
        "name": "BITFLASH",
        "exchange-traded": "Bitcoin/Inr",
        "exchange-listed": "BITFLASH",
        "timezone": "IST",
        "minmov": 1,
        "minmov2": 0,
        "pointvalue": 1,
        "session": "0930-1630",
        "has_intraday": true,
        "has_no_volume": false,
        "has_weekly_and_monthly":false,
        "has_empty_bars":false,
        "description": exName,
        "compare_symbols":false,
        "supported_resolutions": [
          "1",
          "5",
          "15",
          "30",
          "1H",
          "2H",
          "4H",
          "6H",
          "12H",
          "1D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "6M"
        ],
        "pricescale": 10000,
        "ticker": exName
      };
    return config;
}

async function getHistoryExchangeDummy(currency_type,price, update_price,inrgraph,usdtgraph,btcgraph) {
  try{
    // graph = graph.replace("-", "").toLowerCase();
    // graph = 'usdt'; 
    const Currency = require("../models/suppoted_currency");
    currency_type =  currency_type.toUpperCase();
    let  dt = requestOptions = lt = {};
    let chart = {};
    // if(resolution && (resolution.indexOf("D") > 0) || (resolution.indexOf("W") > 0) || resolution.indexOf("M") > 0){
    //   resolution = 1440;
    // }else{
      resolution = 60;
    // }
    const rp = require('request-promise');

    let fs = require('fs');
    latestPrice = JSON.parse(fs.readFileSync('./src/json/latest_coin_price.json', 'utf8'))
    let usdttoINR = latestPrice.data.USDT.quote.INR.price;
    let btctoINR = latestPrice.data.BTC.quote.INR.price;

    // for INR chart 
    requestOptions = {
      method: 'GET',
      uri: `https://x.wazirx.com/api/v2/k`,
      qs: {
          'market': inrgraph,
          'period': parseInt(resolution),
          'limit': 2000,
      },
    };
    dt = await rp(requestOptions);
    let inrPrice = arrangeData(JSON.parse(dt),price) 
    chart[currency_type+'INR'] = lt =  await formateOHLCFromWazir(inrPrice,currency_type,false);
    if(update_price){
      await Currency.updateOne({ symbol: currency_type }, {
          $set: {
            inr_price: lt.ls
          }
      })
    }
    // for USDT chart  
    requestOptions = {
      method: 'GET',
      uri: `https://x.wazirx.com/api/v2/k`,
      qs: {
          'market': usdtgraph,
          'period': parseInt(resolution),
          'limit': 2000,
      },
    };
    dt = await rp(requestOptions);
    price = price/usdttoINR;
    let usdtPrice = arrangeData(JSON.parse(dt),price) 
    chart[currency_type+'USDT'] = lt = await formateOHLCFromWazir(usdtPrice,currency_type,false);
    if(update_price){
      await Currency.updateOne({ symbol: currency_type }, {
          $set: {
            usdt_price: lt.ls
          }
      })
    }
    // for BTC chart  
    requestOptions = {
      method: 'GET',
      uri: `https://x.wazirx.com/api/v2/k`,
      qs: {
          'market': btcgraph,
          'period': parseInt(resolution),
          'limit': 2000,
      },
    };
    // console.log("data is ", inrgraph,usdtgraph,btcgraph,price,currency_type)
    dt = await rp(requestOptions);
    price = price/btctoINR;
    let btcPrice = arrangeData(JSON.parse(dt),price) 
    chart[currency_type+'BTC'] = lt = await formateOHLCFromWazir(btcPrice,currency_type,false);
    if(update_price){
      await Currency.updateOne({ symbol: currency_type }, {
          $set: {
            btc_price: lt.ls
          }
      })
    }
    return chart;
  }catch(e){
    console.log("Error in getHistoryExchangeDummy", e.message)
  }
}
function arrangeData(result,price){
  try{
    let ct  = 86400;
    let limit = 1000;
    if( result.length > 0) {
      let i      = 0;
      let rt     = price; 
      let nowt   = Date.now();
      let time   = nowt - (ct * limit);
      let mt = Math.round(result[i][1]- rt);
      let ttime = 0;
      const newresult = result.map( (rs) => {
        let time   = rs[0];
        let open   = rs[1] - mt;
        let high   = rs[2] - mt;
        let low    = rs[3] - mt;
        let close  = rs[4] - mt;
        let volume  = rs[5];
        i++
        return [time,open,high,low,close,volume]
      })
      return newresult;
    }
  }catch(error){
    // console.log("error in function.chart.js > arrangeData.js "+error.message)
  }
}
async function gettimeScaleExchange(symbol,resolution, from, to, countback) {
  const config2 = {"s":"no_data","nextTime":1522108800};  
    // window.localStorage.setItem(symbol, 0);
    // if(window.localStorage.getItem(symbol) == 1){
      const sy =  symbol.replace("-", "").toLowerCase();
      const rp = require('request-promise');
      const requestOptions = {
          method: 'GET',
          uri: `https://x.wazirx.com/api/v2/k`,
          qs: {
              'market': sy,
              'period': parseInt(resolution),
              'limit': 1000,
          },
      };
    //   console.log("requestOptions",requestOptions);
      dt = await rp(requestOptions);
      return formateOHLCFromWazir(JSON.parse(dt),sy);
    // }else{
    //   return config2;
    // }
}
async function updateGraphData(currency_type, compare_currency, price, volume) {
    const { injectInGraph } = require('./functions');
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        // console.log("akrsingh: ", currency_type, compare_currency, price, volume)
        if (currency_type && compare_currency && price && volume) {
            let currency_data = await SupportedCurrency.findOne({symbol: currency_type.toUpperCase(), token_type: { $eq: 'self' } });
            // console.log('currency_type_ankur: ', currency_type, currency_data)
            if (currency_data) {
                let ohlcvt = await injectInGraph(currency_type, compare_currency, price, volume);
                // console.log('ohlcvt: ', ohlcvt)
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.log("Error in updategraph: ", error.message)
        return false;
    }
}

async function getHistoryFROMCMC(symbol,resolution, from, to, countback) {
  
  try{
    let fs = require('fs');
    let sy = symbol.replace(/-/i, '').toUpperCase();
    let wallet_type = symbol.split('-')[0].toUpperCase()
    // const data = fs.readFileSync('./src/json/ohlc_1h.json', {encoding:'utf8', flag:'r'});
    let path = require('path')
    let dirname = path.join(__dirname, `../json/ohlc_1h.json`);
    const data = JSON.parse(fs.readFileSync(dirname, 'utf8'));
    let chartData = {};
    if(data[sy]){
      chartData = data[sy]
    }else{
        const Remote = require("../models/remote_trading");
        let remotetrade = await Remote.findOne({currency_type: wallet_type,status : true})
        if(remotetrade){
            let chartData = getHistoryExchange(symbol,resolution, from, to, countback) 
            return chartData    
        }else{
          let rFile = fs.readFileSync('./src/json/ohlc_custom.json', 'utf8');
          if(rFile){
            let fl =  JSON.parse(rFile);
            return fl[sy]
          }
        }
        
    }
    return chartData
  }catch(e){
    let chartData = getHistoryExchange(symbol,resolution, from, to, countback) 
    return chartData
  }
}

async function getHistoryExchange(symbol,resolution, from, to, countback) {
    const remote_trade = require("../models/remote_trading");
    const config2 = {"s":"no_data","nextTime":1522108800};  
    // window.localStorage.setItem(symbol, 0);
    // if(window.localStorage.getItem(symbol) == 1){
    let sy = symbol.replace("-", "").toLowerCase();;  
    let currency =  symbol.split('-')
    let price = usdt_inr = 0;
    let dt = {};
    let remoteTrade = false;
    const walletsymbol = currency[0].toUpperCase();
    const CR = currency[1].toUpperCase();
      let find_remote = await remote_trade.findOne({currency_type:walletsymbol})
      if(find_remote){
        if(find_remote.status){
          if(CR == 'USDT'){
            let fs = require('fs')
            let path = require('path') 
            let dirname = path.join(__dirname, `../json/latest_coin_price.json`);
            const latest_price = JSON.parse(fs.readFileSync(dirname, 'utf8'));
            usdt_inr = latest_price.data[CR] ? latest_price.data[CR].quote.INR.price : 0;
          }
          sy = find_remote.graph;
          price= find_remote.price;
          remoteTrade = true;
        }else{
    
        }
      }
      if((resolution.indexOf("D") > 0) || (resolution.indexOf("W") > 0) || resolution.indexOf("M") > 0){
        resolution = 1440;
      }
      const rp = require('request-promise');
      const requestOptions = {
          method: 'GET',
          uri: `https://x.wazirx.com/api/v2/k`,
          qs: {
              'market': sy,
              'period': parseInt(resolution),
              'limit': 2000,
          },
      };
      dt = await rp(requestOptions);
      if(remoteTrade){
        if(usdt_inr){
          dt = arrangeDataper(JSON.parse(dt),price,usdt_inr) 
        }else{
          dt = arrangeData(JSON.parse(dt),price) 
        }
      }else{
        dt = JSON.parse(dt);
      }
      let gggh = formateOHLCFromWazir(dt,walletsymbol,find_remote?find_remote.update_price:false);
      return gggh;
    // }else{
    //   return config2;
    // }
}
function arrangeDataper(result,price,usdtprice,avg,high,low){
  try{
    let ct  = 86400;
    let limit = 1000;
    if( result.length > 0) {
      let i      = 0;
      let rt     = price; 
      let nowt   = Date.now();
      let time   = nowt - (ct * limit);
      let mt = Math.round(result[i][1]- rt);
      let ttime = 0;
      let init_price = result[0][1];
      const newresult = result.map( (rs) => {
        let time   = rs[0];
        let open   = (price/usdtprice)*(rs[1]/init_price);
        let high   = (price/usdtprice)*(rs[2]/init_price);
        let low    = (price/usdtprice)*(rs[3]/init_price);
        let close  = (price/usdtprice)*(rs[4]/init_price);
        let volume  = rs[5];
        i++
        return [time,open,high,low,close,volume]
      })
      
      return newresult;
    }
  }catch(error){
    console.log("error in function.chart.js > arrangeDataper.js "+error.message)
  }
}
module.exports = {
    getChartDataByCurrency,
    getHistory,
    getConfigExchange,
    getMarkExchange, 
    getStudyTemplateExchange, 
    getTimeExchange, 
    getSymbolExchange, 
    getHistoryExchange,
    getsymbolInfoExchange,
    gettimeScaleExchange,
    updateGraphData,
    getHistoryFROMCMC,
    getHistoryExchange
}