const { cmd, socketCreationTime, footer, logo, botName } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "alive",
    alias: ["a", "online", "status"],
    react: "✅",
    desc: "Show bot alive status",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        const startTime = socketCreationTime.get(number) || Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const metaQuote = {
            key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "𝚂𝙸𝙻𝙰 𝙰𝙸 𝙰𝙻𝙸𝚅𝙴 🪄" },
            message: { contactMessage: { displayName: botName, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${botName};;;;\nFN:${botName}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=255789661031:+255 789 661 031\nEND:VCARD` } }
        };

        const text = `
🌸 *𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 ᗩᒪIᐯE ᑎOᗯ..!* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *Owner:* 𝚂𝙸𝙻𝙰
◈🌸 *ᑌptime:* ${hours}h ${minutes}m ${seconds}s
◈🌸 *ᑭlatform:* ${process.env.PLATFORM || 'Heroku'}
◈🌸 *ᑭrefix:* ${prefix}
◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        const buttons = [
            { buttonId: `${prefix}menu`, buttonText: { displayText: "📋 ᗰEᑎᑌ" }, type: 1 },
            { buttonId: `${prefix}ping`, buttonText: { displayText: "⚡ ᑭIᑎG" }, type: 1 }
        ];

        let imagePayload = String(logo).startsWith('http') ? { url: logo } : require('fs').readFileSync(logo);

        await sock.sendMessage(sender, {
            image: imagePayload,
            caption: text,
            buttons,
            headerType: 4
        }, { quoted: metaQuote });

    } catch(e) {
        console.error('alive error', e);
        await sock.sendMessage(sender, { text: '❌ Failed to send alive status.' }, { quoted: m });
    }
});
