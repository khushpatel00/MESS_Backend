require('dotenv').config()
const express = require('express');
const database = require('./Config/databaseconfig');
const server = express();
const cors = require('cors'); // for express REST endpoints
const socketio = require('socket.io');
const { instrument } = require('@socket.io/admin-ui')
const socketServer = require('http').createServer(server);
const io = socketio(socketServer, {
    cors: {
        // origin: ['http://localhost:3000', 'https://admin.socket.io', 'http://192.168.5.182:3000'], // for depelopment stages only (for localhost, and github.io), will be changed to frontend url, in future
        origin: '*', // for depelopment stages only (for localhost, and github.io), will be changed to frontend url, in future
        methods: ["GET", "POST"],
        // credentials: true
    }
})
server.use(cors({
    // origin: ['http://localhost:3000', 'https://admin.socket.io', 'http://192.168.5.182:3000'],
    origin: '*',
    // credentials: true
}));

instrument(io, {
    auth: false, // for development only
    mode: 'development'
})

database(); // establishing database connection

server.use(express.urlencoded());
server.use(express.json());
server.use('/', require('./Routes/index.routes'))
server.use('/auth', require('./Routes/auth.routes'))

server.get('/dmusers', async (req, res) => {
    const sockets = await io.of('/DM').fetchSockets();
    const users = sockets.map(socket => ({
        id: socket.id,
        userId: socket.handshake.auth || null,
        username: socket.handshake.auth.username || 'Anonymous'
    }));

    return res.json(users);
})



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
    socket.broadcast.emit('user-connected', {
        id: socket.id,
        platform: formatPlatform(socket?.handshake?.auth?.platformInfo),
        username: socket?.handshake?.auth?.username,
        displayName: socket?.handshake?.auth?.displayName,
    });
    socket.on('send-devinfo', (data) => {
        console.log(data);
    });
    socket.on('send-message', (data) => {
        console.log(data);
        socket.broadcast.emit('recieve-new-message', data);
    });
    socket.on('disconnect', (reas) => {
        console.log(`disconnected to: ${socket.id} ${reas} `)
        socket.broadcast.emit('user-left', { id: socket.id, platform: formatPlatform(socket?.handshake?.auth?.platformInfo), reason: reas });
    })
    // socket.on()
});


io.of('/DM').on('connection', (socket) => {
    console.log(` ${socket.handshake.auth.username} connected to DM`)
    socket.broadcast.emit('userconnected', { username: socket.handshake.auth.username })
    socket.on('connectToRoom', ({ room, username }) => {
        if (typeof room == 'string' || 'String')
            socket.join(room)
        else
            console.log(typeof room);

        socket.on('send-message', (data) => {
            socket.broadcast.emit('recieve-new-message', data);
        });

    })
})



socketServer.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
})
