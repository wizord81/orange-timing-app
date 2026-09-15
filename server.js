const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/conseiller.html'));

const DUREES = {
  '2 min': 120,
  '5 min': 300,
  '10 min': 600,
  '20 min': 1200,
  '30 min': 1800,
  '45 min': 2700
};

// clientId -> { id, name, timing, endsAt, online, updatedAt }
const conseillers = new Map();

function snapshot() {
  return { now: Date.now(), conseillers: [...conseillers.values()] };
}

function broadcast() {
  io.to('accueil').emit('state', snapshot());
}

// Purge les conseillers déconnectés dont le timing est terminé depuis > 30 min
setInterval(() => {
  const limite = Date.now() - 30 * 60 * 1000;
  let modifie = false;
  for (const [id, c] of conseillers) {
    if (!c.online && c.endsAt && c.endsAt < limite) {
      conseillers.delete(id);
      modifie = true;
    }
  }
  if (modifie) broadcast();
}, 60 * 1000);

io.on('connection', (socket) => {
  socket.on('register', ({ role, name, clientId }) => {
    socket.data.role = role;
    socket.data.clientId = clientId;
    socket.join(role);

    if (role === 'conseiller' && clientId) {
      const c = conseillers.get(clientId) || { id: clientId, timing: null, endsAt: null };
      c.name = (name || '').trim() || 'Anonyme';
      c.online = true;
      conseillers.set(clientId, c);
      broadcast();
    }

    if (role === 'accueil') {
      socket.emit('state', snapshot());
    }
  });

  // L'agent d'accueil demande leur timing aux conseillers
  socket.on('askTiming', () => {
    io.to('conseiller').emit('askTiming');
  });

  // Un conseiller renvoie son timing
  socket.on('response', ({ clientId, name, timing }) => {
    if (!clientId) return;
    const c = conseillers.get(clientId) || { id: clientId };
    c.name = (name || '').trim() || c.name || 'Anonyme';
    c.timing = timing;
    c.online = true;
    c.updatedAt = Date.now();
    c.endsAt = timing === 'Disponible' ? null : Date.now() + (DUREES[timing] || 0) * 1000;
    conseillers.set(clientId, c);
    broadcast();
    io.to('accueil').emit('maj', { name: c.name, timing });
  });

  socket.on('remove', ({ id }) => {
    if (conseillers.delete(id)) broadcast();
  });

  socket.on('resetAll', () => {
    conseillers.clear();
    broadcast();
  });

  socket.on('disconnect', () => {
    const { role, clientId } = socket.data || {};
    if (role !== 'conseiller' || !clientId) return;
    // Ne pas marquer hors ligne s'il reste un autre onglet du même conseiller
    const encoreConnecte = [...io.sockets.sockets.values()].some(
      (s) => s.id !== socket.id && s.data && s.data.clientId === clientId
    );
    if (!encoreConnecte && conseillers.has(clientId)) {
      conseillers.get(clientId).online = false;
      broadcast();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Serveur démarré sur le port ' + PORT));
