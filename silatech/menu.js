const { cmd, footer, logo } = require('../sila/silafunctions');
const fs = require('fs');
const path = require('path');

module.exports = cmd({
    pattern: "menu",
    alias: ["help", "commands", "cmds"],
    react: "🌸",
    desc: "Show all available commands",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const commandsDir = path.join(__dirname);
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    
    const categories = {};
    
    for (const file of files) {
        try {
            const cmdPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(cmdPath)];
            const cmdModule = require(cmdPath);
            
            if (cmdModule && cmdModule.pattern) {
                const category = cmdModule.category || 'misc';
                if (!categories[category]) categories[category] = [];
                categories[category].push(cmdModule.pattern);
            }
        } catch (e) {}
    }
    
    let menuText = `🌸 *MENU* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n`;
    
    for (const [category, cmds] of Object.entries(categories)) {
        menuText += `\n📂 *${category.toUpperCase()}*\n`;
        cmds.forEach(cmd => {
            menuText += `◈🌸 *${prefix}${cmd}*\n`;
        });
    }
    
    menuText += `\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
    
    await sock.sendMessage(sender, {
        image: { url: logo },
        caption: menuText
    });
});