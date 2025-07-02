const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', function connection(ws) {
    clients.push(ws);

    ws.on('message', function incoming(message) {
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });
});

app.get('/', (req, res) => {
    res.redirect('/maitre.html');
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});