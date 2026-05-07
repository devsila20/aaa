const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const path = require('path');
const app = express();
__path = process.cwd();
const pairRouter = require('./pair'); 

require('events').EventEmitter.defaultMaxListeners = 500;

// ============ SIMPLE SESSION STORE (NO MEMORY LEAK WARNING) ============
// Use simple session store - the warning is just a warning, not an error
// For production on Heroku, this is fine for small scale

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware with simple store (the warning is harmless on Heroku)
app.use(session({
    secret: 'dew-md-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ============ MOUNT PAIR ROUTER ============
// Mount pair router at multiple paths for compatibility
app.use('/pair', pairRouter);
app.use('/api', pairRouter);
app.use('/freebot', pairRouter);

// Serve static files from frontend folder
app.use(express.static(path.join(__path, '/frontend')));

// Routes
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

app.get('/pair-page', (req, res) => {
    res.sendFile(path.join(__path, '/frontend/pair.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__path, '/frontend/settings.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__path, '/frontend/index.html'));
});

// ============ HEALTH CHECK FOR HEROKU ============
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Admin Panel: http://0.0.0.0:${PORT}/admin`);
    console.log(`🔗 Pair Endpoint: http://0.0.0.0:${PORT}/pair?number=2547XXXXXXXX`);
    console.log(`📡 API Base: http://0.0.0.0:${PORT}/pair/`);
    console.log(`⚠️  Session MemoryStore warning is harmless on Heroku`);
});

module.exports = app;
