const { cmd, downloadAndSaveMedia } = require('../sila/silafunctions');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = cmd({
    pattern: "save",
    alias: ["send", "statussave", "ss"],
    react: "💾",
    desc: "Save status messages",
    category: "tools",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) return await sock.sendMessage(sender, { text: '*❌ Please reply to a status message to save*' }, { quoted: require('../sila/silafunctions').myquoted });

        await sock.sendMessage(sender, { react: { text: '💾', key: m.key } });
        const userJid = jidNormalizedUser(sock.user.id);

        if (quotedMsg.imageMessage) {
            const buffer = await downloadAndSaveMedia(quotedMsg.imageMessage, 'image');
            await sock.sendMessage(userJid, { image: buffer, caption: quotedMsg.imageMessage.caption || '🌸 *Status Saved* 🌸' });
        } else if (quotedMsg.videoMessage) {
            const buffer = await downloadAndSaveMedia(quotedMsg.videoMessage, 'video');
            await sock.sendMessage(userJid, { video: buffer, caption: quotedMsg.videoMessage.caption || '🌸 *Status Saved* 🌸' });
        } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
            await sock.sendMessage(userJid, { text: `🌸 *Status Saved* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n\n${text}\n\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡` });
        } else {
            await sock.sendMessage(userJid, quotedMsg);
        }

        await sock.sendMessage(sender, { text: '✅ *Status saved successfully!*' }, { quoted: require('../sila/silafunctions').myquoted });
    } catch (error) {
        console.error('❌ Save error:', error);
        await sock.sendMessage(sender, { text: '*❌ Failed to save status*' }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
