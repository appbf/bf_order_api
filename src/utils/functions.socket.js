// "kujgwvfq-z-ghosttown-z-1fhhup0p6"
function createSocketClient(access_token) {
    const io = require("socket.io-client");
    const socket = io('wss://socket.bitflash.finance', {
        auth: {
            token: access_token
        }
    });
    return socket;
}
module.exports = {
    createSocketClient
}