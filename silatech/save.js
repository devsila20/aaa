const { downloadAndSaveMedia } = require('../sila/silafunctions');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) return await socket.sendMessage(sender, { text: '*❌ Please reply to a status message to save*' }, { quoted: require('../sila/silafunctions').myquoted });

        await socket.sendMessage(sender, { react: { text: '💾', key: msg.key } });
        const userJid = jidNormalizedUser(socket.user.id);

        if (quotedMsg.imageMessage) {
            const buffer = await downloadAndSaveMedia(quotedMsg.imageMessage, 'image');
            await socket.sendMessage(userJid, { image: buffer, caption: quotedMsg.imageMessage.caption || '✅ *Status Saved*' });
        } else if (quotedMsg.videoMessage) {
            const buffer = await downloadAndSaveMedia(quotedMsg.videoMessage, 'video');
            await socket.sendMessage(userJid, { video: buffer, caption: quotedMsg.videoMessage.caption || '✅ *Status Saved*' });
        } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
            await socket.sendMessage(userJid, { text: `✅ *Status Saved*\n\n${text}` });
        } else {
            await socket.sendMessage(userJid, quotedMsg);
        }

        await socket.sendMessage(sender, { text: '✅ *Status saved successfully!*' }, { quoted: require('../sila/silafunctions').myquoted });
    } catch (error) {
        console.error('❌ Save error:', error);
        await socket.sendMessage(sender, { text: '*❌ Failed to save status*' }, { quoted: require('../sila/silafunctions').myquoted });
    }
};
