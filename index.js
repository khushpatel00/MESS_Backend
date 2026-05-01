require('dotenv').config()
const express = require('express');
const database = require('./Config/databaseconfig');
const server = express();
const socketio = require('socket.io');
const socketServer = require('http').createServer(server);
const io = socketio(socketServer, {
    cors: {
        origin: "*", // for depelopment stages only (for localhost, and github.io), will be changed to frontend url, in future
        methods: ["GET", "POST"]
    }
})

database(); // establishing database connection

server.use(express.urlencoded());
server.use(express.json());
server.use('/', require('./Routes/index.routes'))
server.use('/auth', require('./Routes/auth.routes'))

// the same thing that is being used at frontend (web)
function formatPlatform(platform) {
    if (!platform) return 'unknown device';
    if (typeof platform === 'string') return platform;
    if (typeof platform === 'object') {
        const label = `${platform.platform ?? ''}${platform.platform && platform.model ? ' ' : ''}${platform.model ?? ''}`.trim();
        return label || JSON.stringify(platform);
    }
    return String(platform);
}

// keeping the socket connection on root server file for reducing the jumping in files
// and increasing efficiency on a smaller scale 
io.on('connection', (socket) => {
    console.log('connected with: ', socket.id, socket.handshake.auth);
    socket.broadcast.emit('user-connected', { id: socket.id, platform: formatPlatform(socket?.handshake?.auth?.platformInfo) });
    socket.on('send-devinfo', (data) => {
        console.log(data);
    })
    socket.on('send-message', (data) => {
        console.log(data);
        socket.broadcast.emit('recieve-new-message', data);
    });
    socket.on('disconnect', (reas) => {
        console.log(`disconnected to: ${socket.id} ${reas} `)
        socket.broadcast.emit('user-left', { id: socket.id, platform: formatPlatform(socket?.handshake?.auth?.platformInfo), reason: reas });
    })
});

socketServer.listen(8080, () => {
    console.log('listening on port 8080');
})
