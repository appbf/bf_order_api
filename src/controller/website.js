const WebsiteData = require("../models/website_data");
const { validateUserId } = require("../utils/validator");

async function getWebsiteData(req, res) {
    try{
        const website = await WebsiteData.findOne();
        if(website) {
            return res.json({
                status: 200,
                error: false,
                params:{
                    website:website
                }
            })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    }catch(error) {
        return res.json({
            status: 400,
            error: true,
            message: "Somthing went wrong, Please try again",
            err: error.message
        })
    }
}

async function activityLog(req, res) {
    const ActivityLog = require("../models/activity_log");
    try{
        const {user_id, action} = req.body;

        // var ua = req.headers['user-agent'],
        // $ = {};

        // if (/mobile/i.test(ua))
        //     $.Mobile = true;

        // if (/like Mac OS X/.test(ua)) {
        //     $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
        //     $.iPhone = /iPhone/.test(ua);
        //     $.iPad = /iPad/.test(ua);
        // }

        // if (/Android/.test(ua))
        //     $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];


        // if (/webOS\//.test(ua))
        //     $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

        // if (/(Intel|PPC) Mac OS X/.test(ua))
        //     $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

        // if (/Windows NT/.test(ua))
        //     $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];
        if(user_id && validateUserId(user_id) && action) {
            if(action == 'set_report') {
                const ipaddr = req.header('x-forwarded-for') || req.connection.remoteAddress;
                // console.log("user_agent2", req.headers['sec-ch-ua-platform']);
                const sys_info = req.headers['sec-ch-ua-platform'];
                const dat = req.headers['sec-ch-ua'];
                const reg = /"[a-zA-Z "]*/i;
                const browser_info = dat.match(reg).toString();
                await ActivityLog.create({user_id: user_id, sys_info:sys_info.split("\"").join(""), browser_info:browser_info.split("\"").join(""), ip_address:ipaddr});
                return res.json({
                    status: 200,
                    error: false,
                    message: "insert successfully"
                })
            }
            if(action == 'get_report') {
                // const activity_log = await ActivityLog.find({user_id:user_id}, {limit:2,sort:{ createdAt: -1 } });
                // Find First 10 News Items
                ActivityLog.find({
                    user_id:user_id // Search Filters
                },
                ['sys_info', 'browser_info', 'ip_address','createdAt'], // Columns to Return
                {
                    skip:0, // Starting Row
                    limit:10, // Ending Row
                    sort:{
                        createdAt: -1 //Sort by Date Added DESC
                    }
                },
                function(err,activity_log){
                    return res.json({
                        status: 200,
                        error: false,
                        params:{
                            activity_log: activity_log
                        }
                    })
                })
            }
           
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    }catch(error) {
        return res.json({
            status: 400,
            error: true,
            message: "Somthing Went Wrong, Please try again",
            err: error.message
        })
    }
}

async function notificationDetails(req, res) {
    const NotificationInfo = require("../models/notification");
    try {
        const { user_id, action, name, msg, table_name } = req.body;
        if(user_id && validateUserId(user_id) && action) {
            if(action == 'set' && name && msg && table_name) {
                await NotificationInfo.create({user_id: user_id, name: name, msg: msg, table_name: table_name});
                return res.json({
                    status: 200,
                    error: false,
                    message: "Insert Successfully!"
                })
            }
            if(action == 'update') {
                await NotificationInfo.updateMany({user_id: user_id},{
                    $set: {
                        seen_status: 1,
                      },
                });
                return res.json({
                    status: 200,
                    error: false,
                    message: "updated Successfully!"
                })
            }
            if(action == 'get') {
                 await NotificationInfo.updateMany({user_id: user_id},{
                    $set: {
                        seen_status: 1,
                      },
                });
                const notification_data = await NotificationInfo.find({user_id: user_id});
                if(notification_data) {
                    return res.json({
                        status: 200,
                        error: false,
                        params:{
                            notification: notification_data
                        },
                        message: "data fetch!"
                    })
                } else {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "data Not fetch!"
                    })
                }
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    }catch(error) {
    return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong, Please try again",
        err: error.message
    })
    }
}

module.exports = {
    getWebsiteData,
    activityLog,
    notificationDetails
}