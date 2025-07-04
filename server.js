const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const path = require('path');
const PORT = process.env.PORT || 3000;

// Stockage temporaire en mémoire
let lastResponses = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    let currentUser = null;

    socket.on('register', (data) => {
        currentUser = data;
        socket.role = data.role;
        socket.name = data.name;

        if (data.role === 'accueil') {
            // Envoie toutes les dernières réponses à l'accueil nouvellement connecté
            const stored = Object.values(lastResponses);
            socket.emit('storedResponses', stored);
        }
    });

    socket.on('askTiming', () => {
        io.emit('askTiming');
    });

    socket.on('response', (msg) => {
        lastResponses[msg.name] = {
            name: msg.name,
            timing: msg.timing,
            timestamp: Date.now()
        };
        io.emit('response', msg);
    });

    socket.on('disconnect', () => {
        // Déconnexion silencieuse, on garde les réponses
    });
});

http.listen(PORT, () => {
    console.log('Serveur lancé sur le port', PORT);
});