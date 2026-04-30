const { cmd, logo, formatMessage } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "jid",
    alias: ["id", "myjid", "whoami"],
    react: "🆔",
    desc: "Get JID information",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        let replyJid = '';
        let caption = '';

        if (m.message.extendedTextMessage?.contextInfo?.participant) replyJid = m.message.extendedTextMessage.contextInfo.participant;
        const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid;

        caption = `🌸 *JID INFO* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *Chat JID:* ${sender}
${replyJid ? `◈🌸 *Replied User JID:* ${replyJid}\n` : ''}${mentionedJid?.length ? `◈🌸 *Mentioned JID:* ${mentionedJid.join('\n')}\n` : ''}${m.key.remoteJid.endsWith('@g.us') ? `◈🌸 *Group JID:* ${m.key.remoteJid}\n` : ''}
◈━◈━◈━◈━◈━◈━◈━◈━◈━

*📝 Note:*
• User JID Format: number@s.whatsapp.net
• Group JID Format: number@g.us
• Newsletter JID Format: number@newsletter

◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await sock.sendMessage(sender, { image: { url: logo }, caption, contextInfo: { mentionedJid: mentionedJid || [], forwardingScore: 999, isForwarded: true } }, { quoted: require('../sila/silafunctions').myquoted });
    } catch (error) {
        console.error('❌ GetJID error:', error);
        await sock.sendMessage(sender, { text: '*Error:* Failed to get JID information' }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
