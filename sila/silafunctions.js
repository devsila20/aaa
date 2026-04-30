const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const { jidNormalizedUser, proto, prepareWAMessageMedia, downloadContentFromMessage, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// ===== GLOBAL CONFIG =====
const footer = `> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
const logo = `https://i.ibb.co/gMVMsZ18/image.png`;
const caption = `𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸`; 
const botName = '𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸';
const mainSite = 'https://aaa-6f4l.onrender.com/';
const apibase = 'https://dew-api.vercel.app';
const apikey = `free`;

const config = {
    AUTO_VIEW_STATUS: 'true',
    AUTO_LIKE_STATUS: 'true',
    AUTO_RECORDING: 'true',
    AUTO_LIKE_EMOJI: ['💗', '🔥'],
    BUTTON: 'true',
    AUTO_REACT_NEWSLETTERS: 'true',
    NEWSLETTER_JIDS: ['120363402325089913@newsletter'],
    NEWSLETTER_REACT_EMOJIS: ['❤️', '😗', '🩷'],
    AUTO_SAVE_INTERVAL: 360000,
    AUTO_CLEANUP_INTERVAL: 1800000,
    AUTO_RECONNECT_INTERVAL: 300000,
    AUTO_RESTORE_INTERVAL: 360000,
    MONGODB_SYNC_INTERVAL: 600000,
    MAX_SESSION_AGE: 2592000000,
    DISCONNECTED_CLEANUP_TIME: 180000,
    MAX_FAILED_ATTEMPTS: 2,
    INITIAL_RESTORE_DELAY: 10000,
    IMMEDIATE_DELETE_DELAY: 600000,
    PREFIX: '.',
    MAX_RETRIES: 3,
    NEWSLETTER_JID: '120363402325089913@newsletter',
    ADMIN_LIST_PATH: './data/admin.json',
    NUMBER_LIST_PATH: './numbers.json',
    SESSION_STATUS_PATH: './session_status.json',
    SESSION_BASE_PATH: './session',
    OWNER_NUMBER: '255789661031',
};

// ===== SESSION MAPS =====
const activeSockets = new Map();
const socketCreationTime = new Map();
const disconnectionTime = new Map();
const sessionHealth = new Map();
const reconnectionAttempts = new Map();
const lastBackupTime = new Map();
const otpStore = new Map();
const pendingSaves = new Map();
const restoringNumbers = new Set();
const sessionConnectionStatus = new Map();

// ===== HELPERS =====
function isSessionActive(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const health = sessionHealth.get(sanitizedNumber);
    const connectionStatus = sessionConnectionStatus.get(sanitizedNumber);
    const socket = activeSockets.get(sanitizedNumber);
    return connectionStatus === 'open' && health === 'active' && socket && socket.user && !disconnectionTime.has(sanitizedNumber);
}

function isOwner(sender) {
    const senderNumber = sender.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    const ownerNumber = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
    return senderNumber === ownerNumber;
}

function formatMessage(title, content, footerText) {
    return `${title}\n\n${content}\n\n${footerText}`;
}

function getSriLankaTimestamp() {
    return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
}

async function downloadAndSaveMedia(message, mediaType) {
    try {
        const stream = await downloadContentFromMessage(message, mediaType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch (error) {
        console.error('Download Media Error:', error);
        throw error;
    }
}

function loadAdmins() {
    try {
        if (fs.existsSync(config.ADMIN_LIST_PATH)) return JSON.parse(fs.readFileSync(config.ADMIN_LIST_PATH, 'utf8'));
        return [];
    } catch (error) {
        console.error('❌ Failed to load admin list:', error);
        return [];
    }
}

async function sendAdminConnectMessage(socket, number) {
    const admins = loadAdmins();
    const text = formatMessage(
        '*𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 Whatsapp Bot Connected*',
        `Connect - ${mainSite}\n\n📞 Number: ${number}\n🟢 Status: Auto-Connected\n⏰ Time: ${getSriLankaTimestamp()}`,
        `${footer}`
    );
    for (const admin of admins) {
        try {
            await socket.sendMessage(`${admin}@s.whatsapp.net`, { image: { url: logo }, caption: text });
        } catch (error) {
            console.error(`❌ Failed to send admin message to ${admin}:`, error);
        }
    }
}

async function updateAboutStatus(socket) {
    try {
        await socket.updateProfileStatus(' һ𝖊𝑦 𝘣𝖊𝘣𝑦 ⅈ ｍ һ𝖊ɑ𝔯...♥︎');
        console.log(`✅ Auto-updated About status`);
    } catch (error) {
        console.error('❌ Failed to update About status:', error);
    }
}

// ===== MEDIA HELPERS =====
async function resize(image, width, height) {
    let oyy = await Jimp.read(image);
    return await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
}

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSerial = (size) => crypto.randomBytes(size).toString('hex').slice(0, size);

const myquoted = {
    key: {
        remoteJid: 'status@broadcast',
        participant: '0@s.whatsapp.net',
        fromMe: false,
        id: createSerial(16).toUpperCase()
    },
    message: {
        contactMessage: {
            displayName: botName,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nORG:𝚂𝙸𝙻𝙰 Coders;\nTEL;type=CELL;type=VOICE;waid=255789661031:255789661031\nEND:VCARD`,
            contextInfo: {
                stanzaId: createSerial(16).toUpperCase(),
                participant: "0@s.whatsapp.net",
                quotedMessage: { conversation: "𝚂𝙸𝙻𝙰 𝙰𝙸" }
            }
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    status: 1,
    verifiedBizName: "Meta"
};

async function SendSlide(socket, jid, newsItems) {
    let anu = [];
    for (let item of newsItems) {
        let imgBuffer;
        try {
            imgBuffer = await resize(item.thumbnail, 300, 200);
        } catch (error) {
            console.error(`❌ Failed to resize image for ${item.title}:`, error);
            imgBuffer = await Jimp.read(logo);
            imgBuffer = await imgBuffer.resize(300, 200).getBufferAsync(Jimp.MIME_JPEG);
        }
        let imgsc = await prepareWAMessageMedia({ image: imgBuffer }, { upload: socket.waUploadToServer });
        anu.push({
            body: proto.Message.InteractiveMessage.Body.fromObject({ text: `*${capital(item.title)}*\n\n${item.body}` }),
            header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: true, ...imgsc }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    { name: "cta_url", buttonParamsJson: `{"display_text":"𝐃𝙴𝙿𝙻𝙾𝚈","url":"https:/","merchant_url":"https://www.google.com"}` },
                    { name: "cta_url", buttonParamsJson: `{"display_text":"𝐂𝙾𝙽𝚃𝙰𝙲𝚃","url":"https","merchant_url":"https://www.google.com"}` }
                ]
            })
        });
    }
    const msgii = await generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: "*AUTO NEWS UPDATES*" }),
                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: anu })
                })
            }
        }
    }, { userJid: jid });
    return socket.relayMessage(jid, msgii.message, { messageId: msgii.key.id });
}

// ===== CONTEXT INFO =====
function getContextInfo(sender) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '𝚂𝙸𝙻𝙰 𝚃𝙴𝙲𝙷',
            serverMessageId: 143
        }
    };
}

function getContextInfo2(sender) {
    return { mentionedJid: [sender], forwardingScore: 999, isForwarded: true };
}

// ===== SESSION STATUS =====
async function updateSessionStatus(number, status, timestamp, extra = {}) {
    try {
        const sessionStatus = await loadSessionStatus();
        sessionStatus[number] = { status, timestamp, ...extra };
        await saveSessionStatus(sessionStatus);
    } catch (error) {
        console.error('❌ Failed to update session status:', error);
    }
}

async function loadSessionStatus() {
    try {
        if (fs.existsSync(config.SESSION_STATUS_PATH)) return JSON.parse(fs.readFileSync(config.SESSION_STATUS_PATH, 'utf8'));
        return {};
    } catch (error) {
        console.error('❌ Failed to load session status:', error);
        return {};
    }
}

async function saveSessionStatus(sessionStatus) {
    try {
        fs.writeFileSync(config.SESSION_STATUS_PATH, JSON.stringify(sessionStatus, null, 2));
    } catch (error) {
        console.error('❌ Failed to save session status:', error);
    }
}

// ===== USER CONFIG =====
async function loadUserConfig(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const localPath = `./setting/${sanitizedNumber}.json`;
        if (fs.existsSync(localPath)) {
            const localConfig = JSON.parse(fs.readFileSync(localPath, 'utf8'));
            console.log(`💾 Loaded local config for ${sanitizedNumber}`);
            applyConfigSettings(localConfig);
            return localConfig;
        }
        return { ...config };
    } catch (error) {
        console.error(`❌ loadUserConfig failed for ${number}:`, error);
        return { ...config };
    }
}

function applyConfigSettings(loadedConfig) {
    if (loadedConfig.NEWSLETTER_JIDS) config.NEWSLETTER_JIDS = loadedConfig.NEWSLETTER_JIDS;
    if (loadedConfig.NEWSLETTER_REACT_EMOJIS) config.NEWSLETTER_REACT_EMOJIS = loadedConfig.NEWSLETTER_REACT_EMOJIS;
    if (loadedConfig.AUTO_REACT_NEWSLETTERS !== undefined) config.AUTO_REACT_NEWSLETTERS = loadedConfig.AUTO_REACT_NEWSLETTERS;
}

async function updateUserConfig(number, newConfig) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        if (!isSessionActive(sanitizedNumber)) {
            console.log(`⏭️ Not saving config for inactive session: ${sanitizedNumber}`);
            return;
        }
        const localPath = `./setting/${sanitizedNumber}.json`;
        fs.ensureDirSync('./setting');
        fs.writeFileSync(localPath, JSON.stringify(newConfig, null, 2));
        console.log(`✅ Config updated locally: ${sanitizedNumber}`);
    } catch (error) {
        console.error('❌ Failed to update config:', error);
        throw error;
    }
}

// ===== CMD FUNCTION (NEW) =====
function cmd(options, handler) {
    return {
        pattern: options.pattern,
        alias: options.alias || [],
        react: options.react || '',
        desc: options.desc || '',
        category: options.category || 'misc',
        filename: options.filename || '',
        handler: handler
    };
}

// ===== EXPORTS =====
module.exports = {
    config, footer, logo, caption, botName, mainSite, apibase, apikey,
    activeSockets, socketCreationTime, disconnectionTime, sessionHealth,
    reconnectionAttempts, lastBackupTime, otpStore, pendingSaves, restoringNumbers, sessionConnectionStatus,
    isSessionActive, isOwner, formatMessage, getSriLankaTimestamp,
    downloadAndSaveMedia, loadAdmins, sendAdminConnectMessage, updateAboutStatus,
    resize, capital, createSerial, myquoted, SendSlide,
    getContextInfo, getContextInfo2,
    updateSessionStatus, loadSessionStatus, saveSessionStatus,
    loadUserConfig, applyConfigSettings, updateUserConfig,
    cmd  // NEW: Export cmd function
};
