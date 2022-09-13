const socket = io('wss://streamer.cryptocompare.com');

socket.on('connect', () => {
    console.log('[socket] Connected');
});

socket.on('disconnect', (reason) => {
    console.log('[socket] Disconnected:', reason);
});

socket.on('error', (error) => {
    console.log('[socket] Error:', error);
});

export function subscribeOnStream() {
    // todo
}

export function unsubscribeFromStream() {
    // todo
}