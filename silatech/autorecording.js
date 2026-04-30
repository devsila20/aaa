const { config, loadUserConfig, updateUserConfig } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
        return await socket.sendMessage(sender, { text: `*Current:* ${config.AUTO_RECORDING}\n*Usage:* ${config.PREFIX}autorecording [on/off]` }, { quoted: msg });
    }
    config.AUTO_RECORDING = args[0].toLowerCase() === 'on' ? 'true' : 'false';
    const userConfig = await loadUserConfig(number);
    userConfig.AUTO_RECORDING = config.AUTO_RECORDING;
    await updateUserConfig(number, userConfig);
    await socket.sendMessage(sender, { text: `✅ *Auto Recording:* ${config.AUTO_RECORDING === 'true' ? '✅ ON' : '❌ OFF'}` }, { quoted: msg });
};
