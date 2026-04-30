const { footer } = require('../sila/silafunctions');
const yts = require('yt-search');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        if (!args[0]) return await socket.sendMessage(sender, { text: '*❌ Please provide a search query*\n*Usage:* .yts <search term>' }, { quoted: require('../sila/silafunctions').myquoted });

        const query = args.join(' ');
        await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } });

        const searchResults = await yts(query);
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return await socket.sendMessage(sender, { text: `*❌ No results found for:* ${query}` }, { quoted: require('../sila/silafunctions').myquoted });
        }

        const videos = searchResults.videos.slice(0, 5);
        let resultText = `*🔍 YOUTUBE SEARCH RESULT*\n*Query:* ${query}\n*Found:* ${searchResults.videos.length} videos\n━━━━━━━━━━━━━━━━━━━━\n\n`;

        videos.forEach((video, index) => {
            resultText += `╭─────────────✑\n◉ *${index + 1}. ${video.title}*\n│❯❯◦ Duration: ${video.timestamp}\n│❯❯◦ Views: ${video.views ? video.views.toLocaleString() : 'N/A'}\n│❯❯◦ Uploaded: ${video.ago}\n│❯❯◦ Channel: ${video.author.name}\n│❯❯◦ Link: ${video.url}\n╰─────────────✑\n\n`;
        });
        resultText += `${footer}`;

        await socket.sendMessage(sender, { text: resultText, contextInfo: { externalAdReply: { title: videos[0].title, body: `${videos[0].author.name} • ${videos[0].timestamp}`, thumbnailUrl: videos[0].thumbnail, sourceUrl: videos[0].url, mediaType: 1, renderLargerThumbnail: true } } }, { quoted: require('../sila/silafunctions').myquoted });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        console.error('❌ YouTube search error:', error);
        await socket.sendMessage(sender, { text: `*❌ Search failed*\n*Error:* ${error.message}` }, { quoted: require('../sila/silafunctions').myquoted });
    }
};
