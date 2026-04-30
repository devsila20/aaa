const { downloadAndSaveMedia } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return await socket.sendMessage(sender, { text: '❌ *Please reply to a ViewOnce message!*\n\n📌 Usage: Reply to a viewonce message with `.vv`' }, { quoted: require('../sila/silafunctions').myquoted });
        }

        await socket.sendMessage(sender, { react: { text: '✨', key: msg.key } });

        let mediaData = null;
        let mediaType = null;
        let caption = '';

        if (quotedMsg.imageMessage?.viewOnce) { mediaData = quotedMsg.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.videoMessage?.viewOnce) { mediaData = quotedMsg.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessage?.message?.imageMessage) { mediaData = quotedMsg.viewOnceMessage.message.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessage?.message?.videoMessage) { mediaData = quotedMsg.viewOnceMessage.message.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessageV2?.message?.imageMessage) { mediaData = quotedMsg.viewOnceMessageV2.message.imageMessage; mediaType = 'image'; caption = mediaData.caption || ''; }
        else if (quotedMsg.viewOnceMessageV2?.message?.videoMessage) { mediaData = quotedMsg.viewOnceMessageV2.message.videoMessage; mediaType = 'video'; caption = mediaData.caption || ''; }
        else return await socket.sendMessage(sender, { text: '❌ *This is not a ViewOnce message or it has already been viewed!*' }, { quoted: require('../sila/silafunctions').myquoted });

        if (mediaData && mediaType) {
            await socket.sendMessage(sender, { text: '⏳ *Retrieving ViewOnce media...*' }, { quoted: require('../sila/silafunctions').myquoted });
            const buffer = await downloadAndSaveMedia(mediaData, mediaType);
            const messageContent = caption ? `✅ *ViewOnce ${mediaType} Retrieved*\n\n📝 Caption: ${caption}` : `✅ *ViewOnce ${mediaType} Retrieved*`;

            if (mediaType === 'image') await socket.sendMessage(sender, { image: buffer, caption: messageContent }, { quoted: require('../sila/silafunctions').myquoted });
            else if (mediaType === 'video') await socket.sendMessage(sender, { video: buffer, caption: messageContent }, { quoted: require('../sila/silafunctions').myquoted });

            await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
            console.log(`✅ ViewOnce ${mediaType} retrieved for ${sender}`);
        }
    } catch (error) {
        console.error('ViewOnce Error:', error);
        await socket.sendMessage(sender, { text: `❌ *Failed to retrieve ViewOnce*\n\nError: ${error.message}` }, { quoted: require('../sila/silafunctions').myquoted });
    }
};
