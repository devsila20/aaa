const { cmd, footer, logo, formatMessage, mainSite, activeSockets, sessionHealth } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "alive",
    alias: ["status", "online"],
    react: "🟢",
    desc: "Check if bot is alive and session status",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage().rss;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const health = sessionHealth.get(sanitizedNumber) || 'unknown';
    const activeCount = activeSockets.size;
    
    const aliveMsg = `*🤖 𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 Status*\n\n` +
        `🟢 *Status*: Online & Active\n` +
        `📱 *Session*: ${sanitizedNumber}\n` +
        `💚 *Health*: ${health}\n` +
        `⏱️ *Uptime*: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s\n` +
        `💾 *Memory*: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB\n` +
        `🔌 *Active Sessions*: ${activeCount}\n` +
        `🌐 *Site*: ${mainSite}\n\n` +
        `${footer}`;
    
    await sock.sendMessage(sender, {
        image: { url: logo },
        caption: aliveMsg
    });
});