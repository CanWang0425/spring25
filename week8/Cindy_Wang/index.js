const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://cwang0425:Cindy20050425@cluster0.yxng44i.mongodb.net/chatdb?retryWrites=true&w=majority&appName=Cluster0');


mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
});



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

  socket.on('chat message', async (msg) => {
    const newMessage = await messageModel.create({
      nickname: users[socket.id],
      message: msg,
    });
  
    io.emit('chat message', {
      nickname: newMessage.nickname,
      message: newMessage.message,
      timestamp: newMessage.timestamp,
    });
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

app.get('/messages', async function (req, res) {
  res.json(await messageModel.find());
});

const messageModel = require('./models/Message');
