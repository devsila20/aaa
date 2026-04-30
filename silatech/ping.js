const { cmd, footer } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "ping",
    alias: ["speed", "pong", "latency"],
    react: "⚡",
    desc: "Check bot speed/latency",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const start = Date.now();
    const tempMsg = await sock.sendMessage(sender, { text: '```Pinging...```' });
    const end = Date.now();
    const ping = end - start;
    await sock.sendMessage(sender, {
        text: `*♻️ Speed... : ${ping} ms*`,
        edit: tempMsg.key
    });
});
