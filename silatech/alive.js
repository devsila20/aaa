const { cmd, footer, logo, mainSite, activeSockets, sessionHealth } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "alive",
    alias: ["status", "online"],
    react: "🟢",
    desc: "Check bot alive status",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage().rss;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const health = sessionHealth.get(sanitizedNumber) || 'unknown';
    const activeCount = activeSockets.size;
    
    const aliveMsg = `🌸 *BOT STATUS* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Status*: Online\n◈🌸 *Session*: ${sanitizedNumber}\n◈🌸 *Health*: ${health}\n◈🌸 *Uptime*: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s\n◈🌸 *Memory*: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB\n◈🌸 *Active Sessions*: ${activeCount}\n◈🌸 *Website*: ${mainSite}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
    
    await sock.sendMessage(sender, {
        image: { url: logo },
        caption: aliveMsg
    });
});