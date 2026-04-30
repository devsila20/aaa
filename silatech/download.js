const { cmd, config, loadUserConfig } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "download",
    alias: ["dlmenu", "downmenu"],
    react: "📥",
    desc: "Show download commands menu",
    category: "menu",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try { await sock.sendMessage(sender, { react: { text: "📥", key: m.key } }); } catch(e){}

    try {
        let userCfg = {};
        try { userCfg = await loadUserConfig(number) || {}; } catch(e){ userCfg = {}; }
        const title = userCfg.botName || '𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸';

        const shonux = {
            key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_DOWNLOAD"
            },
            message: {
                contactMessage: {
                    displayName: title,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${title};;;;\nFN:${title}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=255789661031:+255 789 661 031\nEND:VCARD`
                }
            }
        };

        const text = `
🌸 *DOWNLOAD MENU* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.song* [query] — Download song
◈🌸 *.csong* [jid] [query] — Channel Song
◈🌸 *.ringtone* [name] — Ringtone
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *VIDEO DOWNLOADERS* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.tiktok* [url] — TikTok video
◈🌸 *.video* [query] — YouTube video
◈🌸 *.xvideo* [query] — XVideo
◈🌸 *.xnxx* [query] — XNXX
◈🌸 *.fb* [url] — Facebook video
◈🌸 *.ig* [url] — Instagram video
◈━◈━◈━◈━◈━◈━◈━◈━◈━

🌸 *APP & FILES* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *.apk* [app id] — Download APK
◈🌸 *.apksearch* [name] — Search APK
◈🌸 *.mediafire* [url] — MediaFire
◈🌸 *.gdrive* [url] — Google Drive
◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`.trim();

        const buttons = [
            { buttonId: `${config.PREFIX}menu`, buttonText: { displayText: "🔙 MAIN MENU" }, type: 1 },
            { buttonId: `${config.PREFIX}ping`, buttonText: { displayText: "🪄 PING" }, type: 1 }
        ];

        await sock.sendMessage(sender, { text, buttons }, { quoted: shonux });

    } catch (err) {
        console.error('download command error:', err);
        try { await sock.sendMessage(sender, { text: '❌ Failed to show download menu.' }, { quoted: m }); } catch(e){}
    }
});
