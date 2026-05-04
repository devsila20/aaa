const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const fetch = require("node-fetch");

module.exports = cmd({
    pattern: "tiktoksearch",
    alias: ["tiktoks", "tiks", "ttsearch"],
    react: "🔍",
    desc: "Search TikTok videos",
    category: "search",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    const query = args.join(' ');
    
    if (!query) {
        return await sock.sendMessage(sender, {
            text: `🔍 *TIKTOK SEARCH*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 What do you want to search on TikTok?\n◈🌸 *Example:* ${prefix}tiktoksearch dance\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    try {
        await sock.sendMessage(sender, {
            text: `🔍 *SEARCHING TIKTOK*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Searching for: *${query}*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
        const response = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!data || !data.data || data.data.length === 0) {
            return await sock.sendMessage(sender, {
                text: `❌ *NO RESULTS*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 No results found for "${query}"\n◈🌸 Please try a different keyword\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // Get up to 7 random results
        const results = data.data.slice(0, 7).sort(() => Math.random() - 0.5);
        
        for (const video of results) {
            const caption = `🎵 *TIKTOK RESULT*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Title:* ${video.title}\n◈🌸 *Author:* ${video.author || 'Unknown'}\n◈🌸 *Duration:* ${video.duration || 'N/A'}\n◈🌸 *URL:* ${video.link}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
            
            if (video.nowm) {
                await sock.sendMessage(sender, {
                    video: { url: video.nowm },
                    caption: caption,
                    contextInfo: getContextInfo(sender)
                }, { quoted: m });
            }
            
            // Small delay between videos
            await new Promise(r => setTimeout(r, 1000));
        }
        
    } catch (error) {
        console.error("TikTok Search Error:", error);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to search TikTok. Please try again.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
