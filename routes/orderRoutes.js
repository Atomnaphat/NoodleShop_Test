const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Customer page
router.get('/', (req, res) => {
    res.render('customer');
});

// Chef page
router.get('/chef', (req, res) => {
    res.render('chef');
});

// Cashier page
router.get('/cashier', (req, res) => {
    res.render('cashier');
});

// API Routes
router.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 