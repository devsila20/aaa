const { cmd, config, loadUserConfig } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "tools",
    alias: ["toolmenu", "creative", "creatmenu"],
    react: "🎨",
    desc: "Show creative/tools menu",
    category: "menu",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try { await sock.sendMessage(sender, { react: { text: "🎨", key: m.key } }); } catch(e){}

    try {
        let userCfg = {};
        try { userCfg = await loadUserConfig(number) || {}; } catch(e){ userCfg = {}; }
        const title = userCfg.botName || '𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸';

        const shonux = {
            key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_CREATIVE"
            },
            message: {
                contactMessage: {
                    displayName: title,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${title};;;;\nFN:${title}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=255789661031:+255 789 661 031\nEND:VCARD`
                }
            }
        };

        const text = `
🌸 *CREATIVE MENU* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *AI FEATURES* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.ai* [message] — AI Chat
◈🌸 *.aiimg* [prompt] — AI Image
◈🌸 *.aiimg2* [prompt] — AI Image 2
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *TEXT TOOLS* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.font* [text] — Fancy font
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *IMAGE TOOLS* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.getdp* [number] — Get display picture
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *MEDIA SAVER* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.save* — Reply to status to save
◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`.trim();

        const buttons = [
            { buttonId: `${config.PREFIX}menu`, buttonText: { displayText: "🔙 MAIN MENU" }, type: 1 },
            { buttonId: `${config.PREFIX}download`, buttonText: { displayText: "📥 DOWNLOAD" }, type: 1 }
        ];

        await sock.sendMessage(sender, { text, buttons }, { quoted: shonux });

    } catch (err) {
        console.error('creative command error:', err);
        try { await sock.sendMessage(sender, { text: '❌ Failed to show creative menu.' }, { quoted: m }); } catch(e){}
    }
});
