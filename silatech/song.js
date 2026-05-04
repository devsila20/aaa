const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const axios = require('axios');
const yts = require('yt-search');

module.exports = cmd({
    pattern: "song",
    alias: ["mp3", "play", "music"],
    react: "🎵",
    desc: "Download songs from YouTube",
    category: "download",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    const query = args.join(' ');
    
    if (!query) {
        return await sock.sendMessage(sender, {
            text: `🎵 *SONG DOWNLOAD*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Usage:* ${prefix}song shape of you\n◈🌸 *Or:* ${prefix}song https://youtube.com/...\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        });
    }
    
    try {
        // Search YouTube
        await sock.sendMessage(sender, {
            text: `🔍 *Searching for "${query}"...*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        });
        
        const search = await yts(query);
        
        if (!search || !search.all || search.all.length === 0) {
            return await sock.sendMessage(sender, {
                text: `❌ *No results found for "${query}"*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
            });
        }
        
        const video = search.all[0];
        const videoUrl = video.url;
        const title = video.title || 'Unknown';
        const thumbnail = video.thumbnail || video.image;
        const duration = video.timestamp || 'N/A';
        const views = video.views ? video.views.toLocaleString() : 'N/A';
        
        // Send song info with thumbnail
        await sock.sendMessage(sender, {
            image: { url: thumbnail },
            caption: `🎵 *SONG INFO*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Title:* ${title}\n◈🌸 *Duration:* ${duration}\n◈🌸 *Views:* ${views}\n◈🌸 *URL:* ${videoUrl}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n⏳ *Downloading MP3...*\n${footer}`
        });
        
        // Download audio
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;
        
        if (data?.status && data.audio) {
            // Send as audio
            await sock.sendMessage(sender, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
            });
            
            // Send as document
            await sock.sendMessage(sender, {
                document: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
            });
            
        } else {
            // Fallback API
            const api2 = `https://meta-api.zone.id/downloader/youtube?url=${encodeURIComponent(videoUrl)}`;
            const res2 = await axios.get(api2, { timeout: 30000 });
            const audioUrl = res2.data?.result?.audio || res2.data?.result?.url;
            
            if (audioUrl) {
                await sock.sendMessage(sender, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
                });
                
                await sock.sendMessage(sender, {
                    document: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
                });
            } else {
                throw new Error('No audio URL found');
            }
        }
        
    } catch (error) {
        console.error('Song error:', error.message);
        await sock.sendMessage(sender, {
            text: `❌ *DOWNLOAD FAILED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${error.message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        });
    }
});
