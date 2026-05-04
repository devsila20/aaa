const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const { igdl } = require("ruhend-scraper");

const processedMessages = new Set();

module.exports = cmd({
    pattern: "ig",
    alias: ["insta", "instagram", "reels", "igdl"],
    react: "📸",
    desc: "Download Instagram media",
    category: "download",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    // Prevent duplicate processing
    if (processedMessages.has(m.key.id)) return;
    processedMessages.add(m.key.id);
    setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);
    
    const igUrl = args.join(' ').trim();
    
    if (!igUrl) {
        return await sock.sendMessage(sender, {
            text: `📸 *INSTAGRAM DOWNLOADER*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please provide an Instagram link\n◈🌸 Example: ${prefix}ig https://www.instagram.com/...\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    try {
        // React loading
        await sock.sendMessage(sender, { react: { text: "⏳", key: m.key } });
        
        const downloadData = await igdl(igUrl);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            return await sock.sendMessage(sender, {
                text: `❌ *NO MEDIA FOUND*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Make sure the link is public\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // Remove duplicates
        const uniqueMedia = [];
        const seenUrls = new Set();
        for (const media of downloadData.data) {
            if (media.url && !seenUrls.has(media.url)) {
                seenUrls.add(media.url);
                uniqueMedia.push(media);
            }
        }
        
        // Send each media
        for (let i = 0; i < uniqueMedia.length; i++) {
            const media = uniqueMedia[i];
            
            const isVideo = 
                /\.(mp4|mov|avi|mkv|webm)/i.test(media.url) || 
                media.type === 'video' || 
                igUrl.includes('/reel/') || 
                igUrl.includes('/tv/');
            
            if (isVideo) {
                await sock.sendMessage(sender, {
                    video: { url: media.url },
                    caption: `📸 *INSTAGRAM VIDEO*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Video ${i + 1} of ${uniqueMedia.length}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                    contextInfo: getContextInfo(sender)
                }, { quoted: m });
            } else {
                await sock.sendMessage(sender, {
                    image: { url: media.url },
                    caption: `📸 *INSTAGRAM IMAGE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Image ${i + 1} of ${uniqueMedia.length}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                    contextInfo: getContextInfo(sender)
                }, { quoted: m });
            }
            
            // Delay between multiple files
            if (uniqueMedia.length > 1 && i < uniqueMedia.length - 1) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        
        // React done
        await sock.sendMessage(sender, { react: { text: "✅", key: m.key } });
        
    } catch (error) {
        console.error("IG Error:", error);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${error.message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
