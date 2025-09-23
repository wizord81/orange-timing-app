const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let clients = [];

io.on('connection', (socket) => {
  console.log('Nouvelle connexion');

  // Envoi initial
  socket.emit('updateClients', clients);

  // Ajout client
  socket.on('addClient', (client) => {
    clients.push(client);
    io.emit('updateClients', clients);
  });

  // Suppression client
  socket.on('removeClient', (id) => {
    clients = clients.filter(c => c.id !== id);
    io.emit('updateClients', clients);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
  });
});

http.listen(3000, () => {
  console.log('Serveur lancé sur le port 3000');
});