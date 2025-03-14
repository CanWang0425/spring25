const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let users = {}; // Stores socket.id -> nickname mapping

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Assign a default nickname
  users[socket.id] = `User_${Math.floor(Math.random() * 1000)}`;
  socket.emit("nickname", users[socket.id]);
  io.emit("user list", users); // Broadcast updated user list

  // Handle nickname changes
  socket.on("set nickname", (nickname) => {
    users[socket.id] = nickname;
    io.emit("user list", users); // Send updated user list
  });

  // Handle incoming chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', { nickname: users[socket.id], message: msg });
  });

  // Handle typing event
  socket.on("typing", () => {
    socket.broadcast.emit("typing", users[socket.id]); // Notify others
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit("user list", users);
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
