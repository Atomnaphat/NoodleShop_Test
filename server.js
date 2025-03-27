const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/noodleShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Order Schema
const orderSchema = new mongoose.Schema({
    id: Number,
    items: [{
        name: String,
        price: Number,
        timeAdded: String
    }],
    total: Number,
    tableNumber: {
        type: String,
        required: true
    },
    status: String,
    orderTime: String,
    timestamp: String
});

const Order = mongoose.model('Order', orderSchema);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    // Handle new order
    socket.on('newOrder', async (order) => {
        try {
            // Ensure tableNumber is present
            if (!order.tableNumber) {
                console.error('No table number provided');
                return;
            }

            const newOrder = new Order({
                ...order,
                tableNumber: order.tableNumber.toString() // Ensure tableNumber is a string
            });
            await newOrder.save();
            io.emit('orderStatusUpdate', order);
        } catch (error) {
            console.error('Error saving order:', error);
        }
    });

    // Handle get pending orders
    socket.on('getPendingOrders', async (callback) => {
        try {
            const orders = await Order.find({ status: 'pending' }).sort({ orderTime: 1 });
            callback(orders);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            callback([]);
        }
    });

    // Handle get completed orders
    socket.on('getCompletedOrders', async (callback) => {
        try {
            const orders = await Order.find({ status: 'completed' }).sort({ orderTime: 1 });
            callback(orders);
        } catch (error) {
            console.error('Error fetching completed orders:', error);
            callback([]);
        }
    });

    // Handle mark order as complete
    socket.on('markOrderComplete', async (orderId) => {
        try {
            await Order.findOneAndUpdate(
                { id: orderId },
                { status: 'completed' }
            );
            io.emit('orderStatusUpdate');
        } catch (error) {
            console.error('Error marking order as complete:', error);
        }
    });

    // Handle delete order
    socket.on('deleteOrder', async (orderId) => {
        try {
            await Order.findOneAndDelete({ id: orderId });
            io.emit('orderStatusUpdate');
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 