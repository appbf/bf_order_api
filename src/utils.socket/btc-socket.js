function createBTCSocketClient() {
    const io = require("socket.io-client");
    const socket = io('wss://ws.blockchain.info/inv');
    return socket;
}
module.exports = {
    createBTCSocketClient
}