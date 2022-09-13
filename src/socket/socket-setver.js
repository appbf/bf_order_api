const ws = new require('ws');
const { createServer } = require('http');
const env = require('dotenv')
const server = createServer();
const wss = new ws.Server({ noServer: true });

env.config();

wss.on('connection', function connection(ws, request, client) {
    ws.on('message', function message(msg) {
        console.log(`Received message ${msg} from user ${client}`);
    });
});
server.on('upgrade', function upgrade(request, socket, head) {
    // This function is not defined on purpose. Implement it with your own logic.
    authenticate(request, (err, client) => {
        // if (err || !client) {
        //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        //     socket.destroy();
        //     return;
        // }

        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request, client);
        });
    });
});
server.listen(process.env.SOCKET_SERVER_PORT, () => {
    console.log(`socket server is running on port ${process.env.SOCKET_SERVER_PORT}`)
});