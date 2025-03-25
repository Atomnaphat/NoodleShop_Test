//My Code JS
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/noodle-restaurant', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Routes
const orderRoutes = require('./routes/orderRoutes');
app.use('/', orderRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('newOrder', (order) => {
        io.emit('orderReceived', order);
    });

    socket.on('orderCompleted', (order) => {
        io.emit('orderReady', order);
    });

    socket.on('orderPaid', (order) => {
        io.emit('orderRemoved', order);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 