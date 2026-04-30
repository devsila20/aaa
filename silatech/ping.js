const { footer } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix) {
    const start = Date.now();
    const tempMsg = await socket.sendMessage(sender, { text: '```Pinging...```' });
    const end = Date.now();
    const ping = end - start;
    await socket.sendMessage(sender, {
        text: `*♻️ Speed... : ${ping} ms*`,
        edit: tempMsg.key
    });
};
