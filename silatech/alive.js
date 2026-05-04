
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

    // Calculate time in days, hours, minutes, and seconds
    const days = Math.floor(uptime / (3600 * 24));  // Days
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);  // Hours
    const minutes = Math.floor((uptime % 3600) / 60);  // Minutes
    const seconds = Math.floor(uptime % 60);  // Seconds

    const aliveMsg = `🌸 *BOT STATUS* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Status*: Online\n◈🌸 *Session*: ${sanitizedNumber}\n◈🌸 *Health*: ${health}\n◈🌸 *Uptime*: ${days}d ${hours}h ${minutes}m ${seconds}s\n◈🌸 *Memory*: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB\n◈🌸 *Active Sessions*: ${activeCount}\n◈🌸 *Website*: ${mainSite}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;

    // Add a button for the owner command
    const button = {
        buttonText: { displayText: 'Owner Command' },
        buttonId: `${prefix}owner`
    };

    // Send the reply message to the person who sent the command
    await sock.sendMessage(sender, {
        image: { url: logo },
        caption: aliveMsg,
        buttons: [button],
        footer: footer,
        quoted: m // This makes the reply to the original message
    });
});