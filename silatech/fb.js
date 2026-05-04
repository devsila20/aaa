const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const getFBInfo = require("@xaviabot/fb-downloader");

module.exports = cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl", "fbvid"],
    react: "📽️",
    desc: "Download Facebook videos",
    category: "download",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    
    const fbUrl = args.join(' ').trim();
    
    if (!fbUrl) {
        return await sock.sendMessage(sender, {
            text: `📽️ *FACEBOOK DOWNLOADER*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please send a Facebook video link!\n◈🌸 Example: ${prefix}fb https://facebook.com/...\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    if (!fbUrl.includes("facebook.com") && !fbUrl.includes("fb.watch")) {
        return await sock.sendMessage(sender, {
            text: `❌ *INVALID LINK*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please send a valid Facebook link\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
    
    try {
        // Fetch video info
        const videoData = await getFBInfo(fbUrl);
        
        if (!videoData || !videoData.sd) {
            return await sock.sendMessage(sender, {
                text: `❌ *DOWNLOAD FAILED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Could not fetch video. Link might be private or invalid.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        // Send video info with options
        const caption = `📽️ *FACEBOOK VIDEO*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Title:* ${videoData.title || 'No title'}\n\n◈🎬 *Reply with number:*\n◈🌸 1 - SD Video\n◈🌸 2 - HD Video\n◈🌸 3 - Audio Only\n◈🌸 4 - As Document\n◈🌸 5 - Voice Message\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        
        const sentMsg = await sock.sendMessage(sender, {
            image: { url: videoData.thumbnail || "https://files.catbox.moe/98k75b.jpeg" },
            caption: caption,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
        // Listen for reply
        const replyHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg.message?.extendedTextMessage) return;
                
                const text = msg.message.extendedTextMessage.text.trim();
                const quotedMsgId = msg.message.extendedTextMessage.contextInfo?.stanzaId;
                
                if (quotedMsgId === sentMsg.key.id) {
                    const replySender = msg.key.participant || msg.key.remoteJid;
                    
                    await sock.sendMessage(sender, { react: { text: "⬇️", key: msg.key } });
                    
                    switch (text) {
                        case "1":
                            await sock.sendMessage(sender, {
                                video: { url: videoData.sd },
                                caption: `📹 *SD Quality*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                            
                        case "2":
                            const hdUrl = videoData.hd || videoData.sd;
                            await sock.sendMessage(sender, {
                                video: { url: hdUrl },
                                caption: `📹 *${videoData.hd ? 'HD' : 'SD'} Quality*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                            
                        case "3":
                            await sock.sendMessage(sender, {
                                audio: { url: videoData.sd },
                                mimetype: "audio/mpeg",
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                            
                        case "4":
                            await sock.sendMessage(sender, {
                                document: { url: videoData.sd },
                                mimetype: "video/mp4",
                                fileName: `SILA_MD_${Date.now()}.mp4`,
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                            
                        case "5":
                            await sock.sendMessage(sender, {
                                audio: { url: videoData.sd },
                                mimetype: "audio/ogg; codecs=opus",
                                ptt: true,
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                            
                        default:
                            await sock.sendMessage(sender, {
                                text: `❌ *INVALID OPTION*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please reply with 1, 2, 3, 4, or 5\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                                contextInfo: getContextInfo(replySender)
                            }, { quoted: msg });
                            break;
                    }
                    
                    await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } });
                    
                    // Remove listener after processing
                    sock.ev.off("messages.upsert", replyHandler);
                }
            } catch (e) {
                console.error("FB Reply Error:", e);
            }
        };
        
        sock.ev.on("messages.upsert", replyHandler);
        
        // Remove listener after 2 minutes
        setTimeout(() => {
            sock.ev.off("messages.upsert", replyHandler);
        }, 120000);
        
    } catch (error) {
        console.error("FB Error:", error);
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${error.message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
