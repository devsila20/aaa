const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const axios = require('axios');

const processedMessages = new Set();

module.exports = cmd({
    pattern: "tiktok",
    alias: ["tt", "tiktokdl", "tiktokvideo", "ttdl"],
    react: "🎵",
    desc: "Download TikTok videos without watermark",
    category: "download",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    // Prevent duplicate processing
    if (processedMessages.has(m.key.id)) return;
    processedMessages.add(m.key.id);
    setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);
    
    const query = args.join(' ').trim();
    
    if (!query) {
        return await sock.sendMessage(sender, {
            text: `🎵 *TIKTOK DOWNLOADER*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please provide a TikTok link\n◈🌸 *Example:* ${prefix}tiktok https://vm.tiktok.com/...\n◈🌸 *Options:* ${prefix}tiktok hd/audio/wm link\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    try {
        await sock.sendMessage(sender, { react: { text: "⏳", key: m.key } });
        
        // Parse quality option
        let quality = "no_watermark";
        let url = query;
        
        const parts = query.split(' ');
        if (parts.length > 1) {
            const possibleQuality = parts[0].toLowerCase();
            if (['hd', 'nowm', 'wm', 'watermark', 'audio'].includes(possibleQuality)) {
                quality = possibleQuality === 'nowm' ? 'no_watermark' : possibleQuality;
                url = parts.slice(1).join(' ');
            }
        }
        
        const tiktokUrl = url.trim();
        
        // Validate URL
        if (!tiktokUrl.includes('tiktok.com')) {
            return await sock.sendMessage(sender, {
                text: `❌ *INVALID URL*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please provide a valid TikTok link\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // API request
        const apiUrl = `https://api.bk9.dev/download/tiktok3?url=${encodeURIComponent(tiktokUrl)}`;
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.status) {
            return await sock.sendMessage(sender, {
                text: `❌ *DOWNLOAD FAILED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${response.data?.message || 'Invalid URL or video not found'}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const tiktokData = response.data.BK9;
        
        // Find requested quality
        let selectedFormat = null;
        let qualityDisplay = "";
        
        switch(quality) {
            case 'hd':
                selectedFormat = tiktokData.formats.find(f => f.quality === 'hd_no_watermark');
                qualityDisplay = "HD (No Watermark)";
                break;
            case 'no_watermark':
                selectedFormat = tiktokData.formats.find(f => f.quality === 'no_watermark');
                qualityDisplay = "No Watermark";
                break;
            case 'wm':
            case 'watermark':
                selectedFormat = tiktokData.formats.find(f => f.quality === 'watermark');
                qualityDisplay = "With Watermark";
                break;
            case 'audio':
                selectedFormat = tiktokData.formats.find(f => f.type === 'audio');
                qualityDisplay = "Audio Only";
                break;
            default:
                selectedFormat = tiktokData.formats[1] || tiktokData.formats[0];
                qualityDisplay = "No Watermark";
        }
        
        if (!selectedFormat) {
            selectedFormat = tiktokData.formats[0];
            qualityDisplay = "Default";
        }
        
        // Send thumbnail with info
        if (tiktokData.thumbnail) {
            await sock.sendMessage(sender, {
                image: { url: tiktokData.thumbnail },
                caption: `🎵 *TIKTOK VIDEO*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Title:* ${tiktokData.title || 'N/A'}\n◈🌸 *Author:* ${tiktokData.author || 'N/A'}\n◈🌸 *Duration:* ${tiktokData.duration || 'N/A'}\n◈🌸 *Quality:* ${qualityDisplay}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n⏳ Downloading...\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // Send media
        if (selectedFormat.type === 'audio') {
            await sock.sendMessage(sender, {
                audio: { url: selectedFormat.url },
                mimetype: "audio/mpeg",
                fileName: `tiktok_audio_${Date.now()}.mp3`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        } else {
            await sock.sendMessage(sender, {
                video: { url: selectedFormat.url },
                caption: `✅ *DOWNLOAD COMPLETE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Quality:* ${qualityDisplay}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                mimetype: "video/mp4",
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.sendMessage(sender, { react: { text: "✅", key: m.key } });
        
    } catch (error) {
        console.error("TikTok Error:", error);
        
        let errorMsg = error.message;
        if (error.response?.status === 404) {
            errorMsg = "Video not found. Make sure the URL is correct.";
        } else if (error.code === 'ECONNREFUSED') {
            errorMsg = "Connection to server failed.";
        }
        
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${errorMsg}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
