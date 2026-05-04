const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const axios = require('axios');

// ===== CHINESE BEAUTY =====
cmd({
    pattern: "china",
    alias: ["chinese"],
    react: "😍",
    desc: "Random Chinese beauty images",
    category: "fun",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        await sock.sendPresenceUpdate('composing', sender);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/r/cecan/china`, {
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            image: Buffer.from(response.data),
            caption: `😍 *CHINESE BEAUTY* 🇨🇳\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch image\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== INDONESIAN BEAUTY =====
cmd({
    pattern: "indonesia",
    alias: ["indo"],
    react: "😍",
    desc: "Random Indonesian beauty images",
    category: "fun",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        await sock.sendPresenceUpdate('composing', sender);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/r/cecan/indonesia`, {
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            image: Buffer.from(response.data),
            caption: `😍 *INDONESIAN BEAUTY* 🇮🇩\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch image\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== JAPANESE BEAUTY =====
cmd({
    pattern: "japan",
    alias: ["japanese", "jp"],
    react: "😍",
    desc: "Random Japanese beauty images",
    category: "fun",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        await sock.sendPresenceUpdate('composing', sender);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/r/cecan/japan`, {
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            image: Buffer.from(response.data),
            caption: `😍 *JAPANESE BEAUTY* 🇯🇵\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch image\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== KOREAN BEAUTY =====
cmd({
    pattern: "korea",
    alias: ["korean", "kr"],
    react: "😍",
    desc: "Random Korean beauty images",
    category: "fun",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        await sock.sendPresenceUpdate('composing', sender);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/r/cecan/korea`, {
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            image: Buffer.from(response.data),
            caption: `😍 *KOREAN BEAUTY* 🇰🇷\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch image\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== THAI BEAUTY =====
cmd({
    pattern: "thailand",
    alias: ["thai"],
    react: "😍",
    desc: "Random Thai beauty images",
    category: "fun",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        await sock.sendPresenceUpdate('composing', sender);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/r/cecan/thailand`, {
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            image: Buffer.from(response.data),
            caption: `😍 *THAI BEAUTY* 🇹🇭\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch image\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
