const { cmd, footer } = require('../sila/silafunctions');
const yts = require('yt-search');

module.exports = cmd({
    pattern: "yts",
    alias: ["ytsearch", "youtubesearch", "search"],
    react: "🔍",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!args[0]) return await sock.sendMessage(sender, { text: '*❌ Please provide a search query*\n*Usage:* .yts <search term>' }, { quoted: require('../sila/silafunctions').myquoted });

        const query = args.join(' ');
        await sock.sendMessage(sender, { react: { text: '🔍', key: m.key } });

        const searchResults = await yts(query);
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return await sock.sendMessage(sender, { text: `*❌ No results found for:* ${query}` }, { quoted: require('../sila/silafunctions').myquoted });
        }

        const videos = searchResults.videos.slice(0, 5);
        let resultText = `🌸 *YOUTUBE SEARCH RESULT* 🌸
◈━◈━◈━◈━◈━◈━◈━◈━◈━
◈🌸 *Query:* ${query}
◈🌸 *Found:* ${searchResults.videos.length} videos
◈━◈━◈━◈━◈━◈━◈━◈━◈━\n\n`;

        videos.forEach((video, index) => {
            resultText += `╭─────────────✑\n`;
            resultText += `◈🌸 *${index + 1}. ${video.title}*\n`;
            resultText += `│❯❯◦ Duration: ${video.timestamp}\n`;
            resultText += `│❯❯◦ Views: ${video.views ? video.views.toLocaleString() : 'N/A'}\n`;
            resultText += `│❯❯◦ Uploaded: ${video.ago}\n`;
            resultText += `│❯❯◦ Channel: ${video.author.name}\n`;
            resultText += `│❯❯◦ Link: ${video.url}\n`;
            resultText += `╰─────────────✑\n\n`;
        });

        resultText += `◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await sock.sendMessage(sender, { text: resultText, contextInfo: { externalAdReply: { title: videos[0].title, body: `${videos[0].author.name} • ${videos[0].timestamp}`, thumbnailUrl: videos[0].thumbnail, sourceUrl: videos[0].url, mediaType: 1, renderLargerThumbnail: true } } }, { quoted: require('../sila/silafunctions').myquoted });
        await sock.sendMessage(sender, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ YouTube search error:', error);
        await sock.sendMessage(sender, { text: `*❌ Search failed*\n*Error:* ${error.message}` }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
