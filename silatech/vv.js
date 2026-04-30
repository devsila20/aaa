const { cmd, downloadAndSaveMedia } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "vv",
    alias: ["viewonce", "view", "unlock"],
    react: "👁️",
    desc: "Unlock and view ViewOnce messages",
    category: "tools",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return await sock.sendMessage(sender, { text: '❌ *Please reply to a ViewOnce message!*\n\n📌 Usage: Reply to a viewonce message with `.vv`' }, { quoted: require('../sila/silafunctions').myquoted });
        }

        await sock.sendMessage(sender, { react: { text: '✨', key: m.key } });

        let mediaData = null;
        let mediaType = null;
        let caption = '';

        if (quotedMsg.imageMessage?.viewOnce) { mediaData = quotedMsg.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.videoMessage?.viewOnce) { mediaData = quotedMsg.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessage?.message?.imageMessage) { mediaData = quotedMsg.viewOnceMessage.message.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessage?.message?.videoMessage) { mediaData = quotedMsg.viewOnceMessage.message.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessageV2?.message?.imageMessage) { mediaData = quotedMsg.viewOnceMessageV2.message.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessageV2?.message?.videoMessage) { mediaData = quotedMsg.viewOnceMessageV2.message.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else return await sock.sendMessage(sender, { text: '❌ *This is not a ViewOnce message or it has already been viewed!*' }, { quoted: require('../sila/silafunctions').myquoted });

        if (mediaData && mediaType) {
            await sock.sendMessage(sender, { text: '⏳ *Retrieving ViewOnce media...*' }, { quoted: require('../sila/silafunctions').myquoted });
            const buffer = await downloadAndSaveMedia(mediaData, mediaType);
            const messageContent = caption ? `🌸 *ViewOnce ${mediaType} Retrieved* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n\n📝 Caption: ${caption}\n\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡` : `🌸 *ViewOnce ${mediaType} Retrieved* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

            if (mediaType === 'image') await sock.sendMessage(sender, { image: buffer, caption: messageContent }, { quoted: require('../sila/silafunctions').myquoted });
            else if (mediaType === 'video') await sock.sendMessage(sender, { video: buffer, caption: messageContent }, { quoted: require('../sila/silafunctions').myquoted });

            await sock.sendMessage(sender, { react: { text: '✅', key: m.key } });
            console.log(`✅ ViewOnce ${mediaType} retrieved for ${sender}`);
        }
    } catch (error) {
        console.error('ViewOnce Error:', error);
        await sock.sendMessage(sender, { text: `❌ *Failed to retrieve ViewOnce*\n\nError: ${error.message}` }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
