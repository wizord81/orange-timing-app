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
        if (data.role === 'accueil') {
            const stored = Object.values(lastResponses);
            const now = Date.now();
            const timed = stored.map(r => {
                const elapsed = Math.floor((now - r.timestamp) / 1000);
                const total = r.duration || 0;
                const remaining = Math.max(0, total - elapsed);
                return { ...r, remaining };
            });
            socket.emit('storedResponses', timed);
        }
    });

    socket.on('askTiming', () => {
        io.emit('askTiming');
    });

    socket.on('response', (msg) => {
        const map = {
            '2 min': 120, '5 min': 300, '10 min': 600,
            '20 min': 1200, '30 min': 1800, '45 min': 2700
        };
        const duration = map[msg.timing] || 0;
        lastResponses[msg.name] = {
            name: msg.name,
            timing: msg.timing,
            timestamp: Date.now(),
            duration
        };
        io.emit('response', {
            name: msg.name,
            timing: msg.timing,
            remaining: duration
        });
    });
});

http.listen(PORT, () => {
    console.log('Serveur lancé sur le port', PORT);
});