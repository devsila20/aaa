const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = cmd({
    pattern: "story",
    alias: ["gcstory", "groupstory", "poster"],
    react: "📖",
    desc: "Create group story with image",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const groupName = metadata.subject;
        const memberCount = metadata.participants.length;
        const createdDate = new Date(metadata.creation * 1000).toLocaleDateString();
        const groupOwner = metadata.owner || 'Unknown';
        
        // Get group admins
        const admins = metadata.participants
            .filter(p => p.admin)
            .map(p => `@${p.id.split('@')[0]}`)
            .join(', ');
        
        // Check for replied image
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo;
        let imageBuffer = null;
        
        if (quotedMsg?.quotedMessage?.imageMessage) {
            const stream = await downloadContentFromMessage(
                quotedMsg.quotedMessage.imageMessage, 
                'image'
            );
            imageBuffer = Buffer.from([]);
            for await (const chunk of stream) {
                imageBuffer = Buffer.concat([imageBuffer, chunk]);
            }
        }
        
        // Story text
        const storyText = args.join(' ') || 'Welcome to our group!';
        
        const caption = `📖 *GROUP STORY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 *Name:* ${groupName}\n◈🌸 *Owner:* @${groupOwner.split('@')[0]}\n◈🌸 *Admins:* ${admins}\n◈🌸 *Members:* ${memberCount}\n◈🌸 *Created:* ${createdDate}\n\n◈📝 *Story:*\n◈🌸 ${storyText}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        
        const mentions = [
            groupOwner,
            ...metadata.participants.filter(p => p.admin).map(p => p.id)
        ];
        
        if (imageBuffer) {
            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: caption,
                mentions: mentions,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        } else {
            // Default: send with group icon
            try {
                const ppUrl = await sock.profilePictureUrl(m.key.remoteJid, 'image');
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: ppUrl },
                    caption: caption,
                    mentions: mentions,
                    contextInfo: getContextInfo(sender)
                }, { quoted: m });
            } catch {
                await sock.sendMessage(m.key.remoteJid, {
                    text: caption,
                    mentions: mentions,
                    contextInfo: getContextInfo(sender)
                }, { quoted: m });
            }
        }
        
    } catch (error) {
        console.error("Story Error:", error);
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 ${error.message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
