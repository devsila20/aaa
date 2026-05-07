const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const path = require('path');
const app = express();
__path = process.cwd();
const pairRouter = require('./pair'); 

require('events').EventEmitter.defaultMaxListeners = 500;

// ============ FIX MEMORYSTORE WARNING ============
// Create a proper session store
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// MongoDB URI - same as in pair.js
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session store with MongoDB to fix MemoryStore warning
app.use(session({
    secret: 'dew-md-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'native'
    }),
    cookie: { 
        secure: false, // set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ============ IMPORTANT: Make sure pair.js routes are mounted correctly ============
// Mount pair router at /pair (this will handle /pair, /pair/active, /pair/ping, etc.)
app.use('/pair', pairRouter);

// Also mount at /api for backward compatibility with admin panel
app.use('/api', pairRouter);

// Routes
app.use('/freebot', pairRouter);

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__path, '/frontend/login.html'));
});

// Multiple users
const ADMINS = [
  { username: 'silatech', password: '22' },
];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = ADMINS.find(u => u.username === username && u.password === password);
  if(user){
    req.session.loggedIn = true;
    req.session.user = username;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Middleware to protect admin
function authMiddleware(req, res, next) {
    if(req.session.loggedIn){
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/api/check-session', (req, res) => {
  if(req.session && req.session.user) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Admin panel routes
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(path.join(__path, '/frontend/admin.html'));
});

app.get('/pair-page', async (req, res, next) => {
    res.sendFile(path.join(__path, '/frontend/pair.html'));
});

app.get('/settings', async (req, res, next) => {
    res.sendFile(path.join(__path, '/frontend/settings.html'));
});

app.get('/', async (req, res, next) => {
    res.sendFile(path.join(__path, '/frontend/index.html'));
});

// ============ Add direct endpoints for admin panel (backup) ============
// These will be handled by pairRouter but adding here for safety
app.get('/pair/mongodb-status', async (req, res) => {
    try {
        const fetch = await import('node-fetch');
        const response = await fetch.default(`http://localhost:${process.env.PORT || 8000}/pair/mongodb-status`);
        const data = await response.json();
        res.json(data);
    } catch(e) {
        res.json({ mongodb: { status: 'Error', connected: false, sessionCount: 0, uri: 'Not available' } });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Admin Panel: http://0.0.0.0:${PORT}/admin`);
    console.log(`🔗 Pair Endpoint: http://0.0.0.0:${PORT}/pair?number=2547XXXXXXXX`);
    console.log(`📡 API Base: http://0.0.0.0:${PORT}/pair/`);
});

module.exports = app;
