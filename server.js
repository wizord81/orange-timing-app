const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.redirect('/maitre.html');
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        socket.role = data.role;
        socket.name = data.name;
    });

    socket.on('askTiming', () => {
        io.emit('askTiming');
    });

    socket.on('response', (data) => {
        io.emit('response', data);
    });
});

server.listen(3000, () => {
    console.log('Serveur Socket.IO en ligne sur http://localhost:3000');
});