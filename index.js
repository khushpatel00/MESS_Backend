require('dotenv').config()
const express = require('express');
const database = require('./Config/databaseconfig');
const server = express();
const cors = require('cors');
const cookie = require('cookie');
const socketio = require('socket.io');
const { instrument } = require('@socket.io/admin-ui')
const socketServer = require('http').createServer(server);
const messagesModel = require('./Model/messages.model');
const { verify } = require('jsonwebtoken');
const PORT = process.env.PORT || 8080;
const io = socketio(socketServer, {
    cors: {
        // origin: ['http://localhost:3000', 'https://admin.socket.io', 'http://192.168.5.182:3000'],
        origin: '*',
        methods: ["GET", "POST"],
        // credentials: true
    }
})
server.use(cors({
    origin: '*',
    // credentials: true
}));

instrument(io, {
    auth: {
        type: 'basic',
        username: 'khushcodes',
        password: '$2a$12$/IOHn.9MzzZ2S3UoaFdM5OhYHopkFqNin6EibPKyyBy/IROeZZgkG'
    },
    mode: 'development'
})

database();

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

    // cause [] === [] returns false, so need to convert it to string and then compare
    if (JSON.stringify(users) === '[]') return res.json(null);

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

io.use((socket, next) => {
    try {
        // const rawCookies = socket.handshake.headers.cookie
        // const cookies = cookie.parse(rawCookies || '');
        // console.log('cookie: ', cookies);
        // if (!cookies.token)
        //     return next(new Error("Unauthorized"));

        let token = socket?.handshake?.auth?.token
        socket.user = verify(token, process.env.JWT_SECRET);
        console.log('authorized user:', socket.user)
        next();
    } catch (error) {
        console.log(error.message);
        return next(new Error("Unauthorized"));
    }
})

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
        // console.log(data);
        let responseJSON = {
            isSent: data.isSent || data.IsSent || false, // client (web and iOS) expects false as default value
            displayName: data.displayName,
            message: data.message,
            uid: data.uid
        }
        // iOS may pass nil (null in swift) if users hasent provided username
        // webclient and iOS side validation required to filter specifiv names, to not mess up on server side
        if (responseJSON.displayName == 'nil') {
            responseJSON.displayName = 'iOS / iPadOS'
        }

        console.log(responseJSON);

        socket.broadcast.emit('recieve-new-message', responseJSON);
    });

    socket.on('am-typing', () => {
        socket.broadcast.emit('is-typing', { id: socket.id, username: socket?.handshake?.auth?.username })
    })

    socket.on('disconnect', (reas) => {
        console.log(`disconnected to: ${socket.id} ${reas} `)
        socket.broadcast.emit('user-left', { id: socket.id, platform: formatPlatform(socket?.handshake?.auth?.platformInfo), reason: reas });
    })
    // socket.on()
});


// io.of('/DM').on('connection', (socket) => {
//     console.log(` ${socket.handshake.auth.username} connected to DM`)
//     socket.broadcast.emit('userconnected', { username: socket.handshake.auth.username })
//     socket.on('connectToRoom', ({ room, username }) => {
//         if (typeof room == 'string') {
//             socket.join(room)
//             socket.emit('currentroom', { room: room }) // to check on frontend
//         }
//         else
//             console.log(typeof room);

//         socket.on('send-message', (data) => {
//             socket.to(room).emit('recieve-new-message', data);
//         });

//     })
// })

// YEAH, i know that was a dumb mistake
io.of('/DM').on('connection', (socket) => {
    console.log(`DM: ${socket.handshake.auth.username} connected`);

    socket.broadcast.emit('userconnected', {
        username: socket.handshake.auth.username
    });

    let currentRoom = null; // track active room

    socket.on('connectToRoom', ({ room }) => {
        if (typeof room === 'string') {

            // leave previous room/chat if exists
            if (currentRoom)
                socket.leave(currentRoom);
            socket.join(room);
            currentRoom = room;

            socket.emit('currentroom', { room });
        }
    });
    socket.on('get-all-messages', async () => {
        if (!currentRoom)
            socket.to(currentRoom).emit('get-all-messages', [])

        // will add pagination later (get messages as user scrolls up)
        let messages = await messagesModel.find({ chatId: currentRoom }).sort({ createdAt: 1 }).limit(50)
        socket.emit('get-all-messages', messages)
    })


    socket.on('send-message', async (data) => {
        if (!currentRoom)
            return;

        socket.to(currentRoom).emit('recieve-new-message', data);
        await messagesModel.create({
            chatId: currentRoom,
            senderId: socket.handshake.auth.username,
            content: data.message,
        })
    });

    socket.on('am-typing', () => {
        socket.to(currentRoom).emit('is-typing', { id: socket.id, username: socket?.handshake?.auth?.username })
    })
});


process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

socketServer.listen(PORT, "0.0.0.0", () => {
    console.log(`listening on port ${PORT}`);
})
