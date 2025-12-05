const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", //frontend
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));


  // Making 'io' accessible to routes
app.set('io', io);

//Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Event: Student joins rooms for clubs they follow
  socket.on("join_club_rooms", (clubIds) => {
    if (Array.isArray(clubIds)) {
        clubIds.forEach(clubId => {
            socket.join(clubId);
            console.log(`Socket ${socket.id} joined room: ${clubId}`);
        });
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// --- Routes ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend server!' });
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/feed', require('./routes/feed'));

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});