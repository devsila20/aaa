const { logo, formatMessage } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        let replyJid = '';
        let caption = '';

        if (msg.message.extendedTextMessage?.contextInfo?.participant) replyJid = msg.message.extendedTextMessage.contextInfo.participant;
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;

        caption = formatMessage(
            '> ♱♱♱♱♱ 𝐏𝐨𝐰𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡 ♱♱♱♱ 𝐉𝐈𝐃 𝐈𝐍𝐅𝐎',
            `Connect - https://mini-bot-website.vercel.app/\n*Chat JID:* ${sender}\n${replyJid ? `*Replied User JID:* ${replyJid}\n` : ''}${mentionedJid?.length ? `*Mentioned JID:* ${mentionedJid.join('\n')}\n` : ''}${msg.key.remoteJid.endsWith('@g.us') ? `*Group JID:* ${msg.key.remoteJid}\n` : ''}\n*📝 Note:*\n• User JID Format: number@s.whatsapp.net\n• Group JID Format: number@g.us\n• Newsletter JID Format: number@newsletter`,
            'handler'
        );

        await socket.sendMessage(sender, { image: { url: logo }, caption, contextInfo: { mentionedJid: mentionedJid || [], forwardingScore: 999, isForwarded: true } }, { quoted: require('../sila/silafunctions').myquoted });
    } catch (error) {
        console.error('❌ GetJID error:', error);
        await socket.sendMessage(sender, { text: '*Error:* Failed to get JID information' }, { quoted: require('../sila/silafunctions').myquoted });
    }
};
