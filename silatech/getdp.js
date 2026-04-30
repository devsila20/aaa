const { cmd, footer, formatMessage } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "getdp",
    alias: ["dp", "profilepic", "pp"],
    react: "🖼️",
    desc: "Get user's display picture",
    category: "tools",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        let targetJid;
        let profileName = "User";

        if (m.message.extendedTextMessage?.contextInfo?.participant) {
            targetJid = m.message.extendedTextMessage.contextInfo.participant;
            profileName = "Replied User";
        } else if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            profileName = "Mentioned User";
        } else {
            targetJid = sender;
            profileName = "Your";
        }

        const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
        if (!ppUrl) return await sock.sendMessage(sender, { text: `*❌ No profile picture found for ${profileName}*` }, { quoted: require('../sila/silafunctions').myquoted });

        await sock.sendMessage(sender, {
            image: { url: ppUrl },
            caption: `🌸 *PROFILE DOWNLOADER* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 ${profileName} Profile Picture
◈🌸 JID: ${targetJid}
◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
        }, { quoted: require('../sila/silafunctions').myquoted });

    } catch (error) {
        console.error('❌ GetDP error:', error);
        await sock.sendMessage(sender, { text: '*❌ Failed to get profile picture*' }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
