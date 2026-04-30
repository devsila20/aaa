const { cmd, footer } = require('../sila/silafunctions');
const axios = require('axios');

module.exports = cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tiktokdl"],
    react: "💦",
    desc: "Download TikTok video",
    category: "downloader",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    await sock.sendMessage(sender, { react: { text: '💦', key: m.key } });

    const q = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    const link = q.replace(/^([./!]?(tiktok(dl)?|tt(dl)?))\s*/i, '').trim();

    if (!link) return await sock.sendMessage(sender, { text: '📌 *Usage:* .tiktok <link>' }, { quoted: m });
    if (!link.includes('tiktok.com')) return await sock.sendMessage(sender, { text: '❌ *Invalid TikTok link.*' }, { quoted: m });

    try {
        await sock.sendMessage(sender, { text: '⏳ Downloading video, please wait...' }, { quoted: m });
        const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(link)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.data) return await sock.sendMessage(sender, { text: '❌ Failed to fetch TikTok video.' }, { quoted: m });

        const { title, like, comment, share, author, meta } = data.data;
        const video = meta.media.find(v => v.type === "video");
        if (!video || !video.org) return await sock.sendMessage(sender, { text: '❌ No downloadable video found.' }, { quoted: m });

        const caption = `🌸 *TIK TOK DOWNLOADER* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *User:* ${author.nickname} (@${author.username})
◈🌸 *Title:* ${title}
◈🌸 *Likes:* ${like}
◈🌸 *Comments:* ${comment}
◈🌸 *Shares:* ${share}
◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await sock.sendMessage(sender, { video: { url: video.org }, caption, contextInfo: { mentionedJid: [m.key.participant || sender] } }, { quoted: m });

    } catch (err) {
        console.error("TikTok command error:", err);
        await sock.sendMessage(sender, { text: `❌ An error occurred:\n${err.message}` }, { quoted: m });
    }
});
