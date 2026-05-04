const { cmd, footer, getContextInfo } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "getdp",
    alias: ["dp", "pp", "profilepic", "getpp"],
    react: "🖼️",
    desc: "Get profile picture of a user or group",
    category: "tools",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    try {
        // Determine whose DP to get
        let target;
        
        // Check for mentioned user
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Check for replied message
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } 
        // Default to chat/group
        else {
            target = sender;
        }
        
        // Fetch profile picture
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(target, 'image');
        } catch (e) {
            return await sock.sendMessage(sender, {
                text: `❌ *NO PROFILE PICTURE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Could not fetch profile picture\n◈🌸 It might be private or not set\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // Send profile picture
        await sock.sendMessage(sender, {
            image: { url: ppUrl },
            caption: `🖼️ *PROFILE PICTURE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *User:* @${target.split('@')[0]}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [target],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        console.error("GetDP Error:", error);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to fetch profile picture\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
