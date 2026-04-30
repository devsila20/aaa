const { cmd, footer, loadUserConfig, getContextInfo } = require('../sila/silafunctions');
const yts = require('yt-search');

const apikey = "dew_hFjyfoUDx5IFFLDMU9ljc3DEaDCCC9niVbWG78KU";

module.exports = cmd({
    pattern: "video",
    alias: ["ytmp4", "ytvideo", "vid"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "downloader",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const userConfig = await loadUserConfig(number);
    const useButton = userConfig.BUTTON === 'true';

    await sock.sendMessage(sender, { react: { text: '🎥', key: m.key } });

    function extractYouTubeId(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
    function convertYouTubeLink(input) {
        const videoId = extractYouTubeId(input);
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : input;
    }

    const q = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    if (!q || q.trim() === '') return await sock.sendMessage(sender, { text: '*Need YouTube URL or Title*' });

    const fixedQuery = convertYouTubeLink(q.trim());

    try {
        const search = await yts(fixedQuery);
        const data = search.videos[0];
        if (!data) return await sock.sendMessage(sender, { text: '*No results found*' });

        const url = data.url;
        const desc = `🌸 *VIDEO DOWNLOADER* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *Title:* ${data.title}
◈🌸 *Duration:* ${data.timestamp}
◈🌸 *Views:* ${data.views}
◈🌸 *Release:* ${data.ago}
◈━◈━◈━◈━◈━◈━◈━◈━◈━`;

        if (useButton) {
            const buttons = [
                { buttonId: `${prefix}downloadvid ${url}`, buttonText: { displayText: 'Download Video' }, type: 1 },
                { buttonId: `${prefix}downloaddoc ${url}`, buttonText: { displayText: 'Download Document' }, type: 1 },
            ];
            await sock.sendMessage(sender, { image: { url: data.thumbnail }, caption: `${desc}\n${footer}`, footer: 'Click to download', buttons, headerType: 4 }, { quoted: m });
        } else {
            const selection = `🔢 Reply below number\n\n1 │❯❯◦ Video File 🎶\n2 │❯❯◦ Document File 📂\n\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            const VidMsg = await sock.sendMessage(sender, { image: { url: data.thumbnail }, caption: `${desc}\n${selection}`, contextInfo: getContextInfo(sender) }, { quoted: require('../sila/silafunctions').myquoted });

            const res = await fetch(`https://api.srihub.store/download/ytmp4?apikey=${apikey}&url=${url}`);
            const deta = await res.json();
            if (!deta.success || !deta.result.download_url) return await sock.sendMessage(sender, { text: "❌ Download Failed. Try again later." });

            let downloadUrl = deta.result.download_url;

            sock.ev.on('messages.upsert', async (mUpdate) => {
                const rMsg = mUpdate.messages[0];
                if (!rMsg.message?.extendedTextMessage) return;
                if (rMsg.message.extendedTextMessage.contextInfo?.stanzaId !== VidMsg.key.id) return;
                const selected = rMsg.message.extendedTextMessage.text.trim();

                if (selected === '1') {
                    await sock.sendMessage(sender, { react: { text: '⬇️', key: m.key } });
                    await sock.sendMessage(sender, { video: { url: downloadUrl }, mimetype: "video/mp4", caption: `${footer}` }, { quoted: m });
                    await sock.sendMessage(sender, { react: { text: '✅', key: m.key } });
                } else if (selected === '2') {
                    await sock.sendMessage(sender, { react: { text: '⬇️', key: m.key } });
                    await sock.sendMessage(sender, { document: { url: downloadUrl }, mimetype: "video/mp4", fileName: data.title + ".mp4", caption: `${footer}` }, { quoted: m });
                    await sock.sendMessage(sender, { react: { text: '✅', key: m.key } });
                } else {
                    await sock.sendMessage(sender, { text: '❌ Invalid option. Please select 1 or 2.' }, { quoted: m });
                }
            });
        }
    } catch (err) {
        console.error(err);
        await sock.sendMessage(sender, { text: "*❌ Error occurred while fetching video info*" });
    }
});
