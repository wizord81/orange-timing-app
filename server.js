const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const PORT = process.env.PORT || 3000;

let lastResponses = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        socket.role = data.role;
        socket.name = data.name;
        if (data.role === 'accueil') {
            const now = Date.now();
            const stored = Object.values(lastResponses).map(r => {
                const elapsed = Math.floor((now - r.timestamp) / 1000);
                const remaining = r.duration ? Math.max(0, r.duration - elapsed) : 0;
                return { name: r.name, timing: r.timing, timestamp: r.timestamp, remaining };
            });
            socket.emit('storedResponses', stored);
        }
    });

    socket.on('askTiming', () => {
        io.emit('askTiming');
    });

    socket.on('response', (msg) => {
        const map = { '2 min': 120, '5 min': 300, '10 min': 600, '20 min': 1200, '30 min': 1800, '45 min': 2700 };
        const duration = map[msg.timing] || 0;
        lastResponses[msg.name] = { name: msg.name, timing: msg.timing, timestamp: Date.now(), duration };
        io.emit('response', { name: msg.name, timing: msg.timing, timestamp: lastResponses[msg.name].timestamp, remaining: duration });
    });

    socket.on('deleteResponse', (data) => {
        delete lastResponses[data.name];
        io.emit('deleteResponse', data.name);
    });
});

http.listen(PORT, () => {
    console.log('Serveur en écoute sur le port', PORT);
});