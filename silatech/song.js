const { cmd, footer } = require('../sila/silafunctions');
const yts = require('yt-search');
const axios = require('axios');

const apikey = "dew_hFjyfoUDx5IFFLDMU9ljc3DEaDCCC9niVbWG78KU";
const apibase = "https://api.srihub.store";

module.exports = cmd({
    pattern: "song",
    alias: ["music", "mp3", "audio", "play"],
    react: "🎵",
    desc: "Download song from YouTube",
    category: "downloader",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const q = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || "";
    if (!q.trim()) return await sock.sendMessage(sender, { text: '*Need YouTube URL or Title.*' }, { quoted: m });

    const extractYouTubeId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };
    const normalizeYouTubeLink = (str) => {
        const id = extractYouTubeId(str);
        return id ? `https://www.youtube.com/watch?v=${id}` : null;
    };

    try {
        await sock.sendMessage(sender, { react: { text: "🔍", key: m.key } });
        let videoUrl = normalizeYouTubeLink(q.trim());
        if (!videoUrl) {
            const search = await yts(q.trim());
            const found = search?.videos?.[0];
            if (!found) return await sock.sendMessage(sender, { text: "*No results found.*" }, { quoted: m });
            videoUrl = found.url;
        }

        const api = `${apibase}/download/ytmp3?apikey=${apikey}&url=${encodeURIComponent(videoUrl)}`;
        const get = await axios.get(api).then(r => r.data).catch(() => null);
        if (!get?.result) return await sock.sendMessage(sender, { text: "*API Error. Try again later.*" }, { quoted: m });

        const { download_url, title, thumbnail, duration, quality } = get.result;

        const captionText = `🌸 *𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 ɑՍＤƖ૦ Ｄ૦𝓦𝑵𐐛𐐛Ｄ𝞔Ꮢ* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *Title:* \`${title}\`
◈🌸 *Duration:* ${duration || 'N/A'}
◈🌸 *Quality:* ${quality || '128kbps'}
◈━◈━◈━◈━◈━◈━◈━◈━◈━

*Reply with a number to download:*

1️⃣ Document
2️⃣ Audio (mp3)
3️⃣ Voice (ptt)

◈━◈━◈━◈━◈━◈━◈━◈━◈━
> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        const resMsg = await sock.sendMessage(sender, { image: { url: thumbnail }, caption: captionText }, { quoted: m });

        const handler = async (msgUpdate) => {
            try {
                const received = msgUpdate.messages && msgUpdate.messages[0];
                if (!received) return;
                const fromId = received.key.remoteJid || received.key.participant || (received.key.fromMe && sender);
                if (fromId !== sender) return;
                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;
                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId || received.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.id;
                if (!quotedId || quotedId !== resMsg.key.id) return;

                const choice = text.toString().trim().split(/\s+/)[0];
                await sock.sendMessage(sender, { react: { text: "📥", key: received.key } });

                switch (choice) {
                    case "1": await sock.sendMessage(sender, { document: { url: download_url }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }, { quoted: received }); break;
                    case "2": await sock.sendMessage(sender, { audio: { url: download_url }, mimetype: "audio/mpeg" }, { quoted: received }); break;
                    case "3": await sock.sendMessage(sender, { audio: { url: download_url }, mimetype: "audio/mpeg", ptt: true }, { quoted: received }); break;
                    default: await sock.sendMessage(sender, { text: "*Invalid option. Reply with 1, 2 or 3 (quote the card).*" }, { quoted: received }); return;
                }
                sock.ev.off('messages.upsert', handler);
            } catch (err) {
                console.error("Song handler error:", err);
                try { sock.ev.off('messages.upsert', handler); } catch (e) {}
            }
        };

        sock.ev.on('messages.upsert', handler);
        setTimeout(() => { try { sock.ev.off('messages.upsert', handler); } catch (e) {} }, 60 * 1000);
        await sock.sendMessage(sender, { react: { text: '🔎', key: m.key } });

    } catch (err) {
        console.error('Song case error:', err);
        await sock.sendMessage(sender, { text: "*`Error occurred while processing song request`*" }, { quoted: m });
    }
});
