const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { startScoreRecalculationJob } = require('./jobs/scoreJob');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO Server
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://dev-metrics-8tuo.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Expose socketio instance to express app and globally
app.set('socketio', io);
global.io = io;

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Initialize Database connection
connectDB().then(() => {
  // Start background cron jobs
  startScoreRecalculationJob();

  // Start server listening
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database connection:', err);
  process.exit(1);
});

