const express = require('express');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const { sendTranslations } = require("./data/sendTranslations");

if (fs.existsSync('2nd_dev_config.env')) require('dotenv').config({ path: './2nd_dev_config.env' });

const { sms } = require("./msg");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    proto,
    prepareWAMessageMedia,
    downloadContentFromMessage,
    getContentType,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

// ===== IMPORT SILA FUNCTIONS =====
const {
    config, footer, logo, caption, botName, mainSite, apibase, apikey,
    activeSockets, socketCreationTime, disconnectionTime, sessionHealth,
    reconnectionAttempts, lastBackupTime, otpStore, pendingSaves, restoringNumbers, sessionConnectionStatus,
    isSessionActive, isOwner, formatMessage, getSriLankaTimestamp,
    downloadAndSaveMedia, updateAboutStatus,
    resize, capital, createSerial, myquoted, SendSlide,
    getContextInfo, getContextInfo2,
    updateSessionStatus, loadSessionStatus, saveSessionStatus,
    loadUserConfig, applyConfigSettings, updateUserConfig
} = require('./sila/silafunctions');

// ===== IMPORT ANTILINK =====
const { setupAntilink, getAntilinkStatus } = require('./sila/silalink');

// MongoDB Configuration - UPDATED
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/?retryWrites=true&w=majority';

process.env.NODE_ENV = 'production';

console.log('🚀 SILA MD Bot Starting...');

// Auto-management intervals
let autoSaveInterval;
let autoCleanupInterval;
let mongoSyncInterval;

// MongoDB Connection
let mongoConnected = false;

// PREVENT RECONNECTION LOOP
const RECONNECT_COOLDOWN = new Map();
const WELCOME_SENT = new Set();

// MongoDB Schemas
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

let Session;
let UserConfig;

try {
    Session = mongoose.model('Session');
} catch {
    Session = mongoose.model('Session', sessionSchema);
}

try {
    UserConfig = mongoose.model('UserConfig');
} catch {
    UserConfig = mongoose.model('UserConfig', userConfigSchema);
}

// ===== COMMAND LOADER =====
const commands = new Map();

function loadCommands() {
    const commandsDir = path.join(__dirname, 'silatech');
    if (!fs.existsSync(commandsDir)) {
        console.warn('⚠️ silatech/ folder not found, creating...');
        fs.ensureDirSync(commandsDir);
        return;
    }

    commands.clear();
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
        try {
            const cmdPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(cmdPath)];
            const cmdModule = require(cmdPath);
            
            if (cmdModule && cmdModule.pattern && typeof cmdModule.handler === 'function') {
                commands.set(cmdModule.pattern, cmdModule);
                
                if (cmdModule.alias && Array.isArray(cmdModule.alias)) {
                    cmdModule.alias.forEach(alias => {
                        commands.set(alias, cmdModule);
                    });
                }
                
                console.log(`✅ Loaded: ${cmdModule.pattern}`);
            }
        } catch (e) {
            console.error(`❌ Failed: ${file}:`, e.message);
        }
    }
    console.log(`📦 Commands: ${commands.size}`);
}

loadCommands();

// ===== MONGODB FUNCTIONS =====

async function initializeMongoDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            mongoConnected = true;
            return true;
        }
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });
        mongoConnected = true;
        console.log('✅ MongoDB Connected');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Error:', error.message);
        mongoConnected = false;
        return false;
    }
}

async function saveSessionToMongoDB(number, sessionData) {
    if (!mongoConnected) return false;
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            {
                sessionData: sessionData,
                status: 'active',
                updatedAt: new Date(),
                lastActive: new Date(),
                health: 'active'
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error(`❌ Save failed for ${number}:`, error.message);
        return false;
    }
}

async function loadSessionFromMongoDB(number) {
    if (!mongoConnected) return null;
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: sanitizedNumber, status: { $ne: 'deleted' } });
        return session ? session.sessionData : null;
    } catch (error) {
        return null;
    }
}

async function deleteSessionFromMongoDB(number) {
    if (!mongoConnected) return;
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: sanitizedNumber });
        await UserConfig.deleteOne({ number: sanitizedNumber });
    } catch (error) {}
}

// ===== DIRECTORY INITIALIZATION =====

function initializeDirectories() {
    const dirs = [config.SESSION_BASE_PATH, './temp', './setting', './silatech'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

initializeDirectories();

// ===== SESSION MANAGEMENT =====

async function saveSessionLocally(number, sessionData) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const sessionPath = path.join(config.SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(sessionData, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

async function deleteSessionImmediately(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    console.log(`🗑️ Deleting: ${sanitizedNumber}`);

    const sessionPath = path.join(config.SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    if (fs.existsSync(sessionPath)) {
        fs.removeSync(sessionPath);
    }

    await deleteSessionFromMongoDB(sanitizedNumber);

    pendingSaves.delete(sanitizedNumber);
    sessionConnectionStatus.delete(sanitizedNumber);
    disconnectionTime.delete(sanitizedNumber);
    sessionHealth.delete(sanitizedNumber);
    reconnectionAttempts.delete(sanitizedNumber);
    socketCreationTime.delete(sanitizedNumber);
    restoringNumbers.delete(sanitizedNumber);
    activeSockets.delete(sanitizedNumber);
    RECONNECT_COOLDOWN.delete(sanitizedNumber);
    WELCOME_SENT.delete(sanitizedNumber);
}

// ===== EVENT HANDLERS =====

function setupNewsletterHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key) return;
        const isNewsletter = config.NEWSLETTER_JIDS.some(jid =>
            message.key.remoteJid === jid || message.key.remoteJid?.includes(jid)
        );
        if (!isNewsletter || config.AUTO_REACT_NEWSLETTERS !== 'true') return;
        try {
            const randomEmoji = config.NEWSLETTER_REACT_EMOJIS[Math.floor(Math.random() * config.NEWSLETTER_REACT_EMOJIS.length)];
            const messageId = message.newsletterServerId;
            if (!messageId) return;
            await socket.newsletterReactMessage(message.key.remoteJid, messageId.toString(), randomEmoji);
        } catch (error) {}
    });
}

async function setupStatusHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant) return;
        try {
            if (config.AUTO_VIEW_STATUS === 'true') {
                await socket.readMessages([message.key]);
            }
            if (config.AUTO_LIKE_STATUS === 'true') {
                const randomEmoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
                await socket.sendMessage(message.key.remoteJid, { react: { text: randomEmoji, key: message.key } }, { statusJidList: [message.key.participant] });
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
                if (sendTranslations.includes(replyText) && quotedInfo?.participant?.endsWith('@s.whatsapp.net') && quotedInfo?.remoteJid === "status@broadcast") {
                    const senderJid = message.key?.remoteJid;
                    if (!senderJid || !senderJid.includes('@')) return;
                    const quotedMsg = quotedInfo.quotedMessage;
                    if (!quotedMsg) return;
                    const mediaType = Object.keys(quotedMsg || {})[0];
                    if (!mediaType || !quotedMsg[mediaType]) return;
                    let statusCaption = "";
                    if (quotedMsg[mediaType]?.caption) statusCaption = quotedMsg[mediaType].caption;
                    else if (quotedMsg?.conversation) statusCaption = quotedMsg.conversation;
                    const stream = await downloadContentFromMessage(quotedMsg[mediaType], mediaType.replace("Message", ""));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    if (mediaType === "imageMessage") {
                        await socket.sendMessage(senderJid, { image: buffer, caption: statusCaption || "" });
                    } else if (mediaType === "videoMessage") {
                        await socket.sendMessage(senderJid, { video: buffer, caption: statusCaption || "" });
                    } else if (mediaType === "audioMessage") {
                        await socket.sendMessage(senderJid, { audio: buffer, mimetype: 'audio/mp4' });
                    }
                }
            }
        } catch (error) {}
    });
}

// ===== COMMAND HANDLER (FIXED) =====

function setupCommandHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg?.message) return;
            
            const from = msg.key.remoteJid;
            if (!from || from === 'status@broadcast') return;
            
            // Skip newsletters
            const isNewsletter = config.NEWSLETTER_JIDS.includes(from);
            if (isNewsletter) return;
            
            const m = sms(socket, msg);
            let sender = from;
            
            // Get prefix from config
            const prefix = config.PREFIX || '.';
            
            let command = null;
            let args = [];
            
            // Get message text
            let text = '';
            if (msg.message?.conversation) {
                text = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage?.caption) {
                text = msg.message.imageMessage.caption;
            } else if (msg.message?.videoMessage?.caption) {
                text = msg.message.videoMessage.caption;
            }
            
            // Must start with prefix
            if (!text.startsWith(prefix)) return;
            
            // Parse command
            const parts = text.slice(prefix.length).trim().split(/\s+/);
            if (parts.length === 0 || !parts[0]) return;
            
            command = parts[0].toLowerCase();
            args = parts.slice(1);
            
            if (!command) return;
            
            // Look for command
            const cmdModule = commands.get(command);
            
            if (cmdModule && typeof cmdModule.handler === 'function') {
                try {
                    await cmdModule.handler(socket, m, sender, args, prefix, number);
                    console.log(`✅ Command: .${command} from ${sender.split('@')[0]}`);
                } catch (error) {
                    console.error(`❌ Command .${command} error:`, error.message);
                    await socket.sendMessage(sender, {
                        text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${error.message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
                    });
                }
            }
        } catch (error) {
            console.error('Command handler error:', error.message);
        }
    });
}

// ===== MAIN PAIRING FUNCTION (FIXED) =====

async function EmpirePair(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    // PREVENT RECONNECTION LOOP
    const cooldown = RECONNECT_COOLDOWN.get(sanitizedNumber);
    if (cooldown && Date.now() - cooldown < 30000) {
        console.log(`⏭️ Skipping reconnect for ${sanitizedNumber} (cooldown)`);
        if (res && !res.headersSent) res.send({ status: 'cooldown', message: 'Please wait before reconnecting' });
        return null;
    }
    
    // Check if already connected
    if (activeSockets.has(sanitizedNumber) && isSessionActive(sanitizedNumber)) {
        console.log(`✅ ${sanitizedNumber} already connected`);
        if (res && !res.headersSent) res.send({ status: 'already_connected' });
        return activeSockets.get(sanitizedNumber);
    }
    
    RECONNECT_COOLDOWN.set(sanitizedNumber, Date.now());
    const sessionPath = path.join(config.SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    console.log(`🔄 Connecting: ${sanitizedNumber}`);

    try {
        fs.ensureDirSync(sessionPath);
        
        // Try restore from MongoDB
        if (mongoConnected) {
            const restoredCreds = await loadSessionFromMongoDB(sanitizedNumber);
            if (restoredCreds) {
                fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(restoredCreds, null, 2));
            }
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const logger = pino({ level: 'fatal' });

        const socket = makeWASocket({
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
            printQRInTerminal: false,
            logger,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
        });

        socketCreationTime.set(sanitizedNumber, Date.now());
        sessionHealth.set(sanitizedNumber, 'connecting');
        sessionConnectionStatus.set(sanitizedNumber, 'connecting');

        // Setup handlers
        setupCommandHandlers(socket, sanitizedNumber);
        setupStatusHandlers(socket);
        setupStatusSavers(socket);
        setupNewsletterHandlers(socket);
        setupAntilink(socket);

        // Handle pairing code
        if (!socket.authState.creds.registered) {
            try {
                await delay(2000);
                const code = await socket.requestPairingCode(sanitizedNumber, "SILAMINI");
                console.log(`📱 Pairing code: ${code}`);
                if (res && !res.headersSent) res.send({ code });
            } catch (error) {
                console.error(`❌ Pairing failed:`, error.message);
                if (res && !res.headersSent) res.status(500).send({ error: 'Failed to generate pairing code' });
                RECONNECT_COOLDOWN.delete(sanitizedNumber);
                return null;
            }
        }

        // Save credentials
        socket.ev.on('creds.update', async () => {
            await saveCreds();
            if (mongoConnected && isSessionActive(sanitizedNumber)) {
                try {
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const credData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                        await saveSessionToMongoDB(sanitizedNumber, credData);
                    }
                } catch (error) {}
            }
        });

        // Connection update - FIXED
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            sessionConnectionStatus.set(sanitizedNumber, connection);
            
            if (connection === 'open') {
                console.log(`✅ Connected: ${sanitizedNumber}`);
                
                try {
                    activeSockets.set(sanitizedNumber, socket);
                    sessionHealth.set(sanitizedNumber, 'active');
                    sessionConnectionStatus.set(sanitizedNumber, 'open');
                    disconnectionTime.delete(sanitizedNumber);
                    reconnectionAttempts.delete(sanitizedNumber);
                    restoringNumbers.delete(sanitizedNumber);
                    
                    // Auto-follow newsletters
                    for (const newsletterJid of config.NEWSLETTER_JIDS) {
                        try {
                            await socket.newsletterFollow(newsletterJid);
                        } catch (error) {}
                    }
                    
                    // Update about
                    try {
                        await updateAboutStatus(socket);
                    } catch (error) {}
                    
                    // Send welcome ONLY ONCE
                    if (!WELCOME_SENT.has(sanitizedNumber)) {
                        WELCOME_SENT.add(sanitizedNumber);
                        try {
                            const userJid = jidNormalizedUser(socket.user.id);
                            await socket.sendMessage(userJid, {
                                text: `🌸 *SILA MD CONNECTED* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Number*: ${sanitizedNumber}\n◈🌸 *Status*: Active ✅\n◈🌸 *Antilink*: ${config.ANTILINK_ENABLED === 'true' ? 'ON 🛡️' : 'OFF'}\n\n◈🌸 *.menu* - Commands list\n◈🌸 *.alive* - Bot status\n◈🌸 *.ping* - Speed test\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
                            });
                            // Clear welcome flag after 1 hour
                            setTimeout(() => WELCOME_SENT.delete(sanitizedNumber), 3600000);
                        } catch (error) {}
                    }
                    
                    // Save session
                    if (mongoConnected) {
                        setTimeout(async () => {
                            try {
                                const credsPath = path.join(sessionPath, 'creds.json');
                                if (fs.existsSync(credsPath)) {
                                    const credData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                                    await saveSessionToMongoDB(sanitizedNumber, credData);
                                }
                            } catch (error) {}
                        }, 5000);
                    }
                    
                    RECONNECT_COOLDOWN.delete(sanitizedNumber);
                    
                } catch (error) {
                    console.error(`❌ Setup error:`, error.message);
                }
                
            } else if (connection === 'close') {
                console.log(`🔌 Disconnected: ${sanitizedNumber}`);
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                sessionHealth.set(sanitizedNumber, 'disconnected');
                
                // 401 = Session invalid
                if (statusCode === 401) {
                    console.log(`❌ Session expired: ${sanitizedNumber}`);
                    sessionHealth.set(sanitizedNumber, 'invalid');
                    await deleteSessionImmediately(sanitizedNumber);
                    return;
                }
                
                // Only reconnect if not intentional close
                if (statusCode !== 428) {
                    const attempts = reconnectionAttempts.get(sanitizedNumber) || 0;
                    
                    if (attempts < 3) {
                        reconnectionAttempts.set(sanitizedNumber, attempts + 1);
                        console.log(`🔄 Reconnect attempt ${attempts + 1}/3 for ${sanitizedNumber}`);
                        
                        setTimeout(async () => {
                            if (!activeSockets.has(sanitizedNumber)) {
                                RECONNECT_COOLDOWN.delete(sanitizedNumber);
                                await EmpirePair(number, { headersSent: true });
                            }
                        }, 10000 * (attempts + 1));
                    } else {
                        console.log(`❌ Max reconnection attempts: ${sanitizedNumber}`);
                        await deleteSessionImmediately(sanitizedNumber);
                    }
                }
            }
        });

        return socket;
        
    } catch (error) {
        console.error(`❌ Connection error for ${sanitizedNumber}:`, error.message);
        sessionHealth.set(sanitizedNumber, 'failed');
        RECONNECT_COOLDOWN.delete(sanitizedNumber);
        if (res && !res.headersSent) res.status(503).send({ error: error.message });
        return null;
    }
}

// ===== AUTO MANAGEMENT (SIMPLIFIED) =====

function initializeAutoManagement() {
    // Auto-save every 6 minutes
    autoSaveInterval = setInterval(async () => {
        for (const [number, socket] of activeSockets) {
            if (isSessionActive(number) && mongoConnected) {
                try {
                    const sessionPath = path.join(config.SESSION_BASE_PATH, `session_${number}`);
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const credData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                        await saveSessionToMongoDB(number, credData);
                    }
                } catch (error) {}
            }
        }
    }, 360000);

    // Cleanup inactive every 30 minutes
    autoCleanupInterval = setInterval(async () => {
        for (const [number, socket] of activeSockets) {
            if (!isSessionActive(number)) {
                await deleteSessionImmediately(number);
            }
        }
    }, 1800000);

    // MongoDB sync every 10 minutes
    mongoSyncInterval = setInterval(async () => {
        if (!mongoConnected) await initializeMongoDB();
    }, 600000);
}

// ===== API ROUTES =====

router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number required' });
    
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (activeSockets.has(sanitizedNumber) && isSessionActive(sanitizedNumber)) {
        return res.send({ status: 'connected', number: sanitizedNumber });
    }
    
    await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
    const active = [];
    for (const [number] of activeSockets) {
        if (isSessionActive(number)) active.push(number);
    }
    res.send({ count: active.length, numbers: active, antilink: getAntilinkStatus() });
});

router.get('/status', (req, res) => {
    const uptime = process.uptime();
    res.send({
        online: true,
        sessions: activeSockets.size,
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        antilink: getAntilinkStatus()
    });
});

router.get('/ping', (req, res) => {
    res.send({ status: 'active', sessions: activeSockets.size, mongodb: mongoConnected ? 'connected' : 'disconnected' });
});

router.get('/antilink-status', (req, res) => {
    res.send({ antilink: getAntilinkStatus() });
});

router.delete('/session/:number', async (req, res) => {
    const sanitizedNumber = req.params.number.replace(/[^0-9]/g, '');
    if (activeSockets.has(sanitizedNumber)) {
        const socket = activeSockets.get(sanitizedNumber);
        try { socket.ws.close(); } catch (e) {}
    }
    await deleteSessionImmediately(sanitizedNumber);
    res.send({ status: 'deleted', number: sanitizedNumber });
});

// ===== PROCESS HANDLERS =====

process.on('SIGINT', async () => {
    console.log('🛑 Shutting down...');
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (autoCleanupInterval) clearInterval(autoCleanupInterval);
    if (mongoSyncInterval) clearInterval(mongoSyncInterval);
    activeSockets.forEach((socket) => { try { socket.ws.close(); } catch (e) {} });
    await mongoose.connection.close();
    process.exit(0);
});

// ===== STARTUP =====

(async () => {
    await initializeMongoDB();
    initializeAutoManagement();
    console.log('✅ SILA MD Bot Ready');
    console.log(`📊 MongoDB: ${mongoConnected ? 'Connected' : 'Failed'}`);
    console.log(`🛡️ Antilink: ${config.ANTILINK_ENABLED === 'true' ? 'ON' : 'OFF'}`);
    console.log(`📦 Commands: ${commands.size}`);
})();

module.exports = router;
