const { socketCreationTime, footer, logo, botName, config, loadUserConfig } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        await socket.sendMessage(sender, { react: { text: "📋", key: msg.key } });
    } catch(e){}

    try {
        const startTime = socketCreationTime.get(number) || Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let userCfg = {};
        try { userCfg = await loadUserConfig(number) || {}; } catch(e){ userCfg = {}; }

        const title = userCfg.botName || '𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 🥂';

        const shonux = {
            key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_MENU"
            },
            message: {
                contactMessage: {
                    displayName: title,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${title};;;;\nFN:${title}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=255789661031:+255 789 661 031\nEND:VCARD`
                }
            }
        };

        const text = `
╭───❏ *BOT STATUS* ❏
│ ♠️ *𝗕ot Name*: ${title}
│ ♠️ *𝗢wner*: ${config.OWNER_NAME || '𝚂𝙸𝙻𝙰'}
│ ♠️ *𝗩ersion*: ${config.BOT_VERSION || '0.0.1'}
│ ♠️ *𝗣latform*: ${process.env.PLATFORM || 'Heroku'}
│ ♠️ *𝗨ptime*: ${hours}h ${minutes}m ${seconds}s
╰───────────────❏

➤ 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝛯 𝐂𝐎𝛭𝐌Ҩ𝚴𝐃𝐒
┏━━━━━━ ❍ ━━━━━━┓
🛠️ *SY𝑆TE𝛭 CO𝛭MA𝚴DS*
• 🟢 \`.alive\` — Show bot status
• 🔌 \`.system\` — Bot System
• 🧪 \`.ping\` — Check speed
• 🆔 \`.jid\` — Get your JID

🖼️ *MEDIA TOOLS*
• 👁‍🗨 \`.vv\` — View once unlock
• ⭐ \`.getdp\` — Downlode Dp
• 👀 \`.cinfo\` — Get Channel Info
• 💾 \`.save / send\` — Status saver
• 🍭 \`.yts\` — Youtube search
• 📋 \`.tiktoksearch\` — tiktoksearch

📥 *DOWNLOADERS*
• 🎧 \`.song\` — Download song
• 📂 \`.csend\` — Channel Song Send
• 🎥 \`.tiktok\` — TikTok video
• 📸 \`.facebook\`  — Video Facebook
• 🎬 \`.video\` — Video
> © ${config.BOT_FOOTER || '> ♱♱♱♱♱ 𝐏𝐨𝐰𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡 ♱♱♱♱'}
`.trim();

        const buttons = [
            { buttonId: `${prefix}download`, buttonText: { displayText: "📥 ᗪOᗯᑎᒪOᗪ ᗰEᑎᑌ" }, type: 1 },
            { buttonId: `${prefix}tools`, buttonText: { displayText: "🎨 TOOᒪ ᗰEᑎᑌ" }, type: 1 },
            { buttonId: `${prefix}settings`, buttonText: { displayText: "🪄 SETTIᑎG" }, type: 1 }
        ];
        
        const defaultImg = 'https://files.catbox.moe/0k6zv8.jpg';
        const useLogo = userCfg.logo || defaultImg;

        let imagePayload;
        if (String(useLogo).startsWith('http')) imagePayload = { url: useLogo };
        else {
            try { imagePayload = require('fs').readFileSync(useLogo); } catch(e){ imagePayload = { url: defaultImg }; }
        }

        await socket.sendMessage(sender, {
            image: imagePayload,
            caption: text,
            footer: "> ♱♱♱♱♱ 𝐏𝐨𝐰𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡 ♱♱♱♱",
            buttons,
            headerType: 4
        }, { quoted: shonux });

    } catch (err) {
        console.error('menu command error:', err);
        try { await socket.sendMessage(sender, { text: '❌ Failed to show menu.' }, { quoted: msg }); } catch(e){}
    }
};
