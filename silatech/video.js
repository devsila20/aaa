const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const axios = require('axios');
const yts = require('yt-search');

module.exports = cmd({
    pattern: "video",
    alias: ["ytmp4", "mp4", "ytv", "silavideo"],
    react: "🎥",
    desc: "Download YouTube videos",
    category: "download",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    const query = args.join(' ');
    
    if (!query) {
        return await sock.sendMessage(sender, {
            text: `🎥 *VIDEO DOWNLOADER*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please provide a video name or link\n◈🌸 Example: ${prefix}video Cristiano Ronaldo Goal\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    try {
        // Search YouTube
        const search = await yts(query);
        
        if (!search.videos || search.videos.length === 0) {
            return await sock.sendMessage(sender, {
                text: `❌ *NO VIDEOS FOUND*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Could not find any videos for "${query}"\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const videoData = search.videos[0];
        const ytUrl = videoData.url;
        
        // Fetch download link
        const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
        const response = await axios.get(api);
        const apiRes = response.data;
        
        if (!apiRes?.status || !apiRes.result?.media?.video_url) {
            return await sock.sendMessage(sender, {
                text: `❌ *DOWNLOAD FAILED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Video download failed. Please try again.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const result = apiRes.result.media;
        
        // Send info with options
        const caption = `🎥 *VIDEO FOUND*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Title:* ${videoData.title}\n◈🌸 *Views:* ${videoData.views}\n◈🌸 *Duration:* ${videoData.timestamp}\n◈🌸 *URL:* ${videoData.url}\n\n◈🎬 *Reply with:*\n◈🌸 1 - Simple Video\n◈🌸 2 - Document File\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        
        const sentMsg = await sock.sendMessage(sender, {
            image: { url: result.thumbnail || videoData.thumbnail },
            caption: caption,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
        const messageID = sentMsg.key.id;
        
        // Reply handler
        const messageHandler = async (msgData) => {
            if (!msgData.messages) return;
            
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;
            
            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            const replySender = receivedMsg.key.remoteJid;
            
            if (isReplyToBot && replySender === sender) {
                const choice = receivedText.trim();
                
                try {
                    if (choice === "1") {
                        // Send as video
                        await sock.sendMessage(sender, {
                            video: { url: result.video_url },
                            mimetype: "video/mp4",
                            caption: `🎥 *${videoData.title}*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                            contextInfo: getContextInfo(sender)
                        }, { quoted: receivedMsg });
                        
                    } else if (choice === "2") {
                        // Send as document
                        await sock.sendMessage(sender, {
                            document: { url: result.video_url },
                            mimetype: "video/mp4",
                            fileName: `${videoData.title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp4`,
                            caption: `🎥 *${videoData.title}*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                            contextInfo: getContextInfo(sender)
                        }, { quoted: receivedMsg });
                        
                    } else {
                        await sock.sendMessage(sender, {
                            text: `❌ *INVALID CHOICE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please reply with 1 or 2\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                            contextInfo: getContextInfo(sender)
                        }, { quoted: receivedMsg });
                    }
                } catch (err) {
                    console.error("Video send error:", err.message);
                    await sock.sendMessage(sender, {
                        text: `❌ *SEND FAILED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Failed to send video\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                        contextInfo: getContextInfo(sender)
                    }, { quoted: receivedMsg });
                }
                
                // Remove listener
                sock.ev.off('messages.upsert', messageHandler);
            }
        };
        
        // Add listener
        sock.ev.on('messages.upsert', messageHandler);
        
        // Auto remove after 60 seconds
        setTimeout(() => {
            sock.ev.off('messages.upsert', messageHandler);
        }, 60000);
        
    } catch (error) {
        console.error("Video Error:", error.message);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Video download failed!\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
