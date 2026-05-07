const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const pino = require('pino');
const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');
const { sendTranslations } = require("./data/sendTranslations");

// LOAD ENV FIRST
if (fs.existsSync('2nd_dev_config.env')) {
    require('dotenv').config({ path: './2nd_dev_config.env' });
} else if (fs.existsSync('.env')) {
    require('dotenv').config();
}

const { sms } = require("./msg");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    jidNormalizedUser,
    jidDecode,
    downloadContentFromMessage,
    getContentType,
    makeInMemoryStore,
    generateForwardMessageContent,
    generateWAMessageFromContent,
} = require('@whiskeysockets/baileys');

// ===== IMPORT SILA FUNCTIONS =====
const {
    config, footer, logo, caption, botName, mainSite,
    activeSockets, socketCreationTime, disconnectionTime, sessionHealth,
    reconnectionAttempts, pendingSaves, restoringNumbers, sessionConnectionStatus,
    isSessionActive, formatMessage, getContextInfo,
    updateAboutStatus,
    loadUserConfig, updateUserConfig,
} = require('./sila/silafunctions');

// ===== IMPORT ANTILINK =====
const { setupAntilink, getAntilinkStatus, handleAntilink } = require('./sila/silalink');

// ===== MONGODB CONFIGURATION =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/';

console.log('🚀 SILA MD Bot Starting...');
process.env.NODE_ENV = 'production';

// ===== IN-MEMORY STORE (Prevents Sleep) =====
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// ===== VARIABLES =====
let autoSaveInterval;
let mongoSyncInterval;
let mongoConnected = false;

const RECONNECT_COOLDOWN = new Map();
const WELCOME_SENT = new Set();
const allSessions = new Map();

// ===== MONGODB SCHEMAS =====
const sessionSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    sessionData: { type: Object, required: true },
    status: { type: String, default: 'active', index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    health: { type: String, default: 'active' }
});

const userConfigSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    config: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

let Session, UserConfig;

// ===== HELPER FUNCTIONS =====
const createSerial = (size) => crypto.randomBytes(size).toString('hex').slice(0, size);

const getGroupAdmins = (participants) => {
    return participants.filter(p => p.admin).map(p => p.id);
};

// ===== MONGODB CONNECTION =====
async function connectMongoDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            mongoConnected = true;
            return true;
        }
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            w: 'majority',
            keepAlive: true,
            keepAliveInitialDelay: 300000,
        });
        mongoConnected = true;
        console.log('✅ MongoDB Connected');
        
        try { Session = mongoose.model('Session'); } 
        catch { Session = mongoose.model('Session', sessionSchema); }
        
        try { UserConfig = mongoose.model('UserConfig'); } 
        catch { UserConfig = mongoose.model('UserConfig', userConfigSchema); }
        
        await Session.createIndexes();
        await UserConfig.createIndexes();
        return true;
    } catch (error) {
        mongoConnected = false;
        console.error('❌ MongoDB Error:', error.message);
        setTimeout(connectMongoDB, 5000);
        return false;
    }
}

mongoose.connection.on('connected', () => { mongoConnected = true; });
mongoose.connection.on('error', () => { mongoConnected = false; });
mongoose.connection.on('disconnected', () => { mongoConnected = false; setTimeout(connectMongoDB, 5000); });

// ===== MONGODB CRUD =====
async function saveSessionToMongoDB(number, sessionData) {
    if (!mongoConnected || !Session) return false;
    try {
        await Session.findOneAndUpdate(
            { number: number.replace(/[^0-9]/g, '') },
            { sessionData, status: 'active', updatedAt: new Date(), lastActive: new Date(), health: 'active' },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) { return false; }
}

async function loadSessionFromMongoDB(number) {
    if (!mongoConnected || !Session) return null;
    try {
        const session = await Session.findOne({ number: number.replace(/[^0-9]/g, '') });
        return session?.sessionData || null;
    } catch (error) { return null; }
}

async function updateSessionStatusInMongoDB(number, status, health = null) {
    if (!mongoConnected || !Session) return false;
    try {
        const updateData = { status, updatedAt: new Date() };
        if (health) updateData.health = health;
        if (status === 'active') updateData.lastActive = new Date();
        await Session.findOneAndUpdate({ number: number.replace(/[^0-9]/g, '') }, updateData);
        return true;
    } catch (error) { return false; }
}

async function deleteSessionFromMongoDB(number) {
    if (!mongoConnected || !Session) return false;
    try {
        const num = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: num });
        if (UserConfig) await UserConfig.deleteOne({ number: num });
        return true;
    } catch (error) { return false; }
}

// ===== COMMAND LOADER =====
const commands = new Map();

function loadCommands() {
    const commandsDir = path.join(__dirname, 'silatech');
    if (!fs.existsSync(commandsDir)) { fs.ensureDirSync(commandsDir); return; }
    
    commands.clear();
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
        try {
            const cmdPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(cmdPath)];
            const cmdModule = require(cmdPath);
            
            if (cmdModule?.pattern && typeof cmdModule.handler === 'function') {
                commands.set(cmdModule.pattern, cmdModule);
                if (cmdModule.alias?.length) {
                    cmdModule.alias.forEach(alias => commands.set(alias, cmdModule));
                }
                console.log(`✅ ${cmdModule.pattern}`);
            }
        } catch (e) { console.error(`❌ ${file}:`, e.message); }
    }
    console.log(`📦 ${commands.size} commands loaded`);
}

// ===== INITIALIZE =====
['session', 'temp', 'setting', 'silatech'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

loadCommands();

// ===== MAIN BOT FUNCTION (NO SLEEP) =====
async function EmpirePair(number, res = null) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
    
    // Cooldown check
    const cooldown = RECONNECT_COOLDOWN.get(sanitizedNumber);
    if (cooldown && Date.now() - cooldown < 15000) {
        if (res && !res.headersSent) res.send({ status: 'cooldown' });
        return null;
    }
    
    // Already connected
    if (activeSockets.has(sanitizedNumber) && activeSockets.get(sanitizedNumber)?.user) {
        if (res && !res.headersSent) res.send({ status: 'connected' });
        return activeSockets.get(sanitizedNumber);
    }
    
    RECONNECT_COOLDOWN.set(sanitizedNumber, Date.now());
    console.log(`🔄 Connecting: ${sanitizedNumber}`);
    
    try {
        fs.ensureDirSync(sessionDir);
        
        // Restore session
        if (mongoConnected) {
            const savedSession = await loadSessionFromMongoDB(sanitizedNumber);
            if (savedSession) {
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(savedSession, null, 2));
            }
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        // CRITICAL: Use Browsers for stable connection
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            browser: Browsers.macOS('Safari'),
            syncFullHistory: false,
            logger: pino({ level: 'silent' }),
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 25000, // CRITICAL: Prevents sleep
            retryRequestDelayMs: 250,
            maxRetries: 5,
        });
        
        // Bind store (prevents sleep)
        store.bind(socket.ev);
        
        socketCreationTime.set(sanitizedNumber, Date.now());
        activeSockets.set(sanitizedNumber, socket);
        sessionHealth.set(sanitizedNumber, 'connecting');
        
        allSessions.set(sanitizedNumber, {
            number: sanitizedNumber,
            status: 'connecting',
            connectedAt: new Date().toISOString(),
            health: 'connecting'
        });
        
        // Setup all handlers
        setupCommandHandler(socket, sanitizedNumber);
        setupMessageHandlers(socket, sanitizedNumber);
        setupStatusHandlers(socket, sanitizedNumber);
        setupStatusSavers(socket);
        setupNewsletterHandlers(socket);
        setupAntilink(socket);
        
        // Generate pairing code if needed
        if (!state.creds.registered) {
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await socket.requestPairingCode(sanitizedNumber);
                    console.log(`📱 Code: ${code}`);
                    if (res && !res.headersSent) res.send({ code });
                } catch (error) {
                    if (res && !res.headersSent) res.status(500).send({ error: error.message });
                }
            }, 3000);
        } else if (res && !res.headersSent) {
            res.send({ status: 'reconnecting' });
        }
        
        // Save creds
        socket.ev.on('creds.update', async () => {
            await saveCreds();
            if (mongoConnected) {
                try {
                    const credsPath = path.join(sessionDir, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const data = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                        await saveSessionToMongoDB(sanitizedNumber, data);
                    }
                } catch (e) {}
            }
        });
        
        // Connection update - CRITICAL for no sleep
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ Connected: ${sanitizedNumber}`);
                
                activeSockets.set(sanitizedNumber, socket);
                sessionHealth.set(sanitizedNumber, 'active');
                sessionConnectionStatus.set(sanitizedNumber, 'open');
                disconnectionTime.delete(sanitizedNumber);
                reconnectionAttempts.delete(sanitizedNumber);
                RECONNECT_COOLDOWN.delete(sanitizedNumber);
                
                allSessions.set(sanitizedNumber, {
                    number: sanitizedNumber,
                    status: 'active',
                    connectedAt: allSessions.get(sanitizedNumber)?.connectedAt || new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    health: 'active'
                });
                
                // Follow newsletters
                for (const jid of config.NEWSLETTER_JIDS || []) {
                    try { await socket.newsletterFollow(jid); } catch (e) {}
                }
                
                // Update about
                try { await updateAboutStatus(socket); } catch (e) {}
                
                // Welcome message (once)
                if (!WELCOME_SENT.has(sanitizedNumber)) {
                    WELCOME_SENT.add(sanitizedNumber);
                    try {
                        const userJid = jidNormalizedUser(socket.user.id);
                        await socket.sendMessage(userJid, {
                            image: { url: logo },
                            caption: `🌸 *SILA MD CONNECTED* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Number:* ${sanitizedNumber}\n◈🌸 *Status:* Active ✅\n◈🌸 *Storage:* MongoDB ✅\n◈🌸 *Antilink:* ${config.ANTILINK_ENABLED === 'true' ? 'ON 🛡️' : 'OFF'}\n\n◈🌸 *.menu* - Commands\n◈🌸 *.alive* - Status\n◈🌸 *.ping* - Speed\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
                        });
                        setTimeout(() => WELCOME_SENT.delete(sanitizedNumber), 3600000);
                    } catch (e) {}
                }
                
                // Auto-save
                if (mongoConnected) {
                    setTimeout(async () => {
                        const credsPath = path.join(sessionDir, 'creds.json');
                        if (fs.existsSync(credsPath)) {
                            const data = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                            await saveSessionToMongoDB(sanitizedNumber, data);
                        }
                    }, 5000);
                }
                
            } else if (connection === 'close') {
                console.log(`🔌 Disconnected: ${sanitizedNumber}`);
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                sessionHealth.set(sanitizedNumber, 'disconnected');
                
                allSessions.set(sanitizedNumber, {
                    ...allSessions.get(sanitizedNumber),
                    status: 'disconnected',
                    lastDisconnect: new Date().toISOString(),
                    health: 'disconnected'
                });
                
                if (mongoConnected) {
                    await updateSessionStatusInMongoDB(sanitizedNumber, 'disconnected', 'disconnected');
                }
                
                // CRITICAL: Proper reconnection logic
                if (statusCode !== 401 && statusCode !== DisconnectReason.loggedOut) {
                    const attempts = reconnectionAttempts.get(sanitizedNumber) || 0;
                    if (attempts < 5) {
                        reconnectionAttempts.set(sanitizedNumber, attempts + 1);
                        const delayTime = Math.min(10000 * (attempts + 1), 60000);
                        console.log(`🔄 Reconnect ${attempts + 1}/5 in ${delayTime/1000}s...`);
                        
                        setTimeout(async () => {
                            activeSockets.delete(sanitizedNumber);
                            RECONNECT_COOLDOWN.delete(sanitizedNumber);
                            await EmpirePair(number, { headersSent: true });
                        }, delayTime);
                    }
                }
            }
        });
        
        return socket;
        
    } catch (error) {
        console.error(`❌ ${sanitizedNumber}:`, error.message);
        sessionHealth.set(sanitizedNumber, 'failed');
        RECONNECT_COOLDOWN.delete(sanitizedNumber);
        if (res && !res.headersSent) res.status(503).send({ error: error.message });
        return null;
    }
}

// ===== COMMAND HANDLER =====
function setupCommandHandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg?.message) return;
            
            const from = msg.key.remoteJid;
            if (!from || from === 'status@broadcast') return;
            
            // Skip newsletters
            const newsletterJids = config.NEWSLETTER_JIDS || [];
            if (newsletterJids.includes(from)) return;
            
            // Handle antilink
            await handleAntilink(socket, msg);
            
            const m = sms(socket, msg);
            const sender = from;
            const prefix = config.PREFIX || '.';
            
            let text = '';
            if (msg.message?.conversation) text = msg.message.conversation;
            else if (msg.message?.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
            else if (msg.message?.imageMessage?.caption) text = msg.message.imageMessage.caption;
            else if (msg.message?.videoMessage?.caption) text = msg.message.videoMessage.caption;
            
            if (!text.startsWith(prefix)) return;
            
            const parts = text.slice(prefix.length).trim().split(/\s+/);
            if (!parts[0]) return;
            
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            const cmdModule = commands.get(command);
            
            if (cmdModule?.handler) {
                await cmdModule.handler(socket, m, sender, args, prefix, number);
                console.log(`✅ .${command}`);
            }
        } catch (error) {
            console.error('Command error:', error.message);
        }
    });
}

// ===== MESSAGE HANDLERS =====
function setupMessageHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return;
        
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        sessionHealth.set(sanitizedNumber, 'active');
        
        if (config.AUTO_RECORDING === 'true') {
            try { await socket.sendPresenceUpdate('recording', msg.key.remoteJid); } catch (e) {}
        }
    });
}

// ===== STATUS HANDLERS =====
async function setupStatusHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant) return;
        
        try {
            if (config.AUTO_VIEW_STATUS === 'true') {
                await socket.readMessages([message.key]);
            }
            if (config.AUTO_LIKE_STATUS === 'true') {
                const emoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
                await socket.sendMessage(
                    message.key.remoteJid,
                    { react: { text: emoji, key: message.key } },
                    { statusJidList: [message.key.participant] }
                );
            }
        } catch (error) {}
    });
}

async function setupStatusSavers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        try {
            if (message.message?.extendedTextMessage?.contextInfo) {
                const replyText = message.message.extendedTextMessage.text?.trim().toLowerCase();
                const quotedInfo = message.message.extendedTextMessage.contextInfo;
                
                if (sendTranslations.includes(replyText) && 
                    quotedInfo?.participant?.endsWith('@s.whatsapp.net') && 
                    quotedInfo?.remoteJid === "status@broadcast") {
                    
                    const senderJid = message.key?.remoteJid;
                    if (!senderJid?.includes('@')) return;
                    
                    const quotedMsg = quotedInfo.quotedMessage;
                    if (!quotedMsg) return;
                    
                    const mediaType = Object.keys(quotedMsg)[0];
                    if (!mediaType || !quotedMsg[mediaType]) return;
                    
                    let caption = quotedMsg[mediaType]?.caption || quotedMsg?.conversation || "";
                    const stream = await downloadContentFromMessage(quotedMsg[mediaType], mediaType.replace("Message", ""));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    
                    if (mediaType === "imageMessage") {
                        await socket.sendMessage(senderJid, { image: buffer, caption });
                    } else if (mediaType === "videoMessage") {
                        await socket.sendMessage(senderJid, { video: buffer, caption });
                    } else if (mediaType === "audioMessage") {
                        await socket.sendMessage(senderJid, { audio: buffer, mimetype: 'audio/mp4' });
                    }
                }
            }
        } catch (error) {}
    });
}

function setupNewsletterHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || config.AUTO_REACT_NEWSLETTERS !== 'true') return;
        
        const newsletterJids = config.NEWSLETTER_JIDS || [];
        const isNewsletter = newsletterJids.some(jid =>
            message.key.remoteJid === jid || message.key.remoteJid?.includes(jid)
        );
        if (!isNewsletter) return;
        
        try {
            const emoji = config.NEWSLETTER_REACT_EMOJIS[
                Math.floor(Math.random() * config.NEWSLETTER_REACT_EMOJIS.length)
            ];
            const msgId = message.newsletterServerId;
            if (msgId) await socket.newsletterReactMessage(message.key.remoteJid, msgId.toString(), emoji);
        } catch (error) {}
    });
}

// ===== AUTO MANAGEMENT =====
function initializeAutoManagement() {
    autoSaveInterval = setInterval(async () => {
        for (const [number, socket] of activeSockets) {
            if (socket?.user && mongoConnected) {
                try {
                    const credsPath = path.join(__dirname, 'session', `session_${number}`, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const data = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                        await saveSessionToMongoDB(number, data);
                    }
                } catch (e) {}
            }
        }
    }, 360000);
    
    mongoSyncInterval = setInterval(async () => {
        if (!mongoConnected) await connectMongoDB();
    }, 300000);
    
    // PING TO KEEP AWAKE
    setInterval(() => {
        const http = require('http');
        if (process.env.RENDER_EXTERNAL_URL) {
            http.get(process.env.RENDER_EXTERNAL_URL, () => {});
        }
        console.log(`💓 Alive - ${activeSockets.size} sessions`);
    }, 600000); // Every 10 minutes
}

// ===== API ROUTES =====
router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number required' });
    await EmpirePair(number, res);
});

router.get('/all-sessions', async (req, res) => {
    const sessions = [];
    for (const [number, data] of allSessions) {
        sessions.push({
            number,
            status: data.status,
            connectedAt: data.connectedAt,
            lastActive: data.lastActive,
            health: activeSockets.has(number) ? 'active' : data.health,
            isActive: activeSockets.has(number) && activeSockets.get(number)?.user ? true : false
        });
    }
    
    if (mongoConnected && Session) {
        try {
            const mongoSessions = await Session.find({});
            for (const s of mongoSessions) {
                if (!sessions.find(x => x.number === s.number)) {
                    sessions.push({
                        number: s.number,
                        status: s.status,
                        lastActive: s.lastActive,
                        health: s.health,
                        isActive: false,
                        source: 'mongodb'
                    });
                }
            }
        } catch (e) {}
    }
    
    res.send({ total: sessions.length, active: sessions.filter(s => s.isActive).length, sessions });
});

router.get('/active', (req, res) => {
    const active = [];
    for (const [number, socket] of activeSockets) {
        if (socket?.user) {
            active.push({
                number,
                uptime: socketCreationTime.get(number) ? 
                    Math.floor((Date.now() - socketCreationTime.get(number)) / 1000) : 0,
                health: sessionHealth.get(number)
            });
        }
    }
    res.send({ count: active.length, sessions: active, antilink: getAntilinkStatus() });
});

router.get('/inactive', (req, res) => {
    const inactive = [];
    for (const [number, data] of allSessions) {
        if (!activeSockets.has(number) || !activeSockets.get(number)?.user) {
            inactive.push({ number, status: data.status, lastActive: data.lastActive, health: data.health });
        }
    }
    res.send({ count: inactive.length, sessions: inactive });
});

router.delete('/session/:number', async (req, res) => {
    try {
        const sanitizedNumber = req.params.number.replace(/[^0-9]/g, '');
        if (activeSockets.has(sanitizedNumber)) {
            try { activeSockets.get(sanitizedNumber).ws.close(); } catch (e) {}
        }
        
        const sessionPath = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
        if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath);
        
        await deleteSessionFromMongoDB(sanitizedNumber);
        
        activeSockets.delete(sanitizedNumber);
        allSessions.delete(sanitizedNumber);
        sessionHealth.delete(sanitizedNumber);
        sessionConnectionStatus.delete(sanitizedNumber);
        WELCOME_SENT.delete(sanitizedNumber);
        
        const configPath = path.join('./setting', `${sanitizedNumber}.json`);
        if (fs.existsSync(configPath)) fs.removeSync(configPath);
        
        console.log(`🗑️ Deleted: ${sanitizedNumber}`);
        res.send({ status: 'deleted', number: sanitizedNumber });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.delete('/inactive-sessions', async (req, res) => {
    try {
        const deleted = [];
        for (const [number] of allSessions) {
            if (!activeSockets.has(number) || !activeSockets.get(number)?.user) {
                const sessionPath = path.join(__dirname, 'session', `session_${number}`);
                if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath);
                await deleteSessionFromMongoDB(number);
                allSessions.delete(number);
                sessionHealth.delete(number);
                activeSockets.delete(number);
                deleted.push(number);
            }
        }
        res.send({ status: 'completed', deleted: deleted.length, numbers: deleted });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/status', (req, res) => {
    res.send({
        online: true,
        activeSessions: activeSockets.size,
        totalSessions: allSessions.size,
        uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        antilink: getAntilinkStatus(),
        commands: commands.size
    });
});

router.get('/ping', (req, res) => {
    res.send({ status: 'active', mongodb: mongoConnected ? 'connected' : 'disconnected', sessions: activeSockets.size });
});

router.get('/antilink-status', (req, res) => {
    res.send({ antilink: getAntilinkStatus() });
});

// ===== STARTUP =====
(async () => {
    console.log('🔌 Connecting MongoDB...');
    await connectMongoDB();
    initializeAutoManagement();
    
    console.log('\n✅ SILA MD Bot Ready');
    console.log(`📊 MongoDB: ${mongoConnected ? 'CONNECTED' : 'FAILED'}`);
    console.log(`🛡️ Antilink: ${config.ANTILINK_ENABLED === 'true' ? 'ON' : 'OFF'}`);
    console.log(`📦 Commands: ${commands.size}`);
    console.log(`💡 No-Sleep Mode: ACTIVE\n`);
    
    // Auto-reconnect from MongoDB
    if (mongoConnected && Session) {
        setTimeout(async () => {
            try {
                const sessions = await Session.find({ status: 'active' });
                for (const s of sessions) {
                    if (!activeSockets.has(s.number)) {
                        console.log(`🔄 Auto-reconnect: ${s.number}`);
                        await EmpirePair(s.number, { headersSent: true });
                        await delay(2000);
                    }
                }
            } catch (e) { console.error('Auto-reconnect error:', e.message); }
        }, 5000);
    }
})();

// ===== CLEANUP =====
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (mongoSyncInterval) clearInterval(mongoSyncInterval);
    
    for (const [number, socket] of activeSockets) {
        if (mongoConnected && socket?.user) {
            try {
                const credsPath = path.join(__dirname, 'session', `session_${number}`, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    const data = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                    await saveSessionToMongoDB(number, data);
                }
            } catch (e) {}
        }
        try { socket?.ws?.close(); } catch (e) {}
    }
    
    await mongoose.connection.close();
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught:', err.message);
});

module.exports = router;
