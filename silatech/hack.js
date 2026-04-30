module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        const steps = [
            '💻 *𝚂𝙸𝙻𝙰-𝙼𝙳 HACK STARTING...* 💻', '', '*Initializing hacking tools...* 🛠️', '*Connecting to remote servers...* 🌐', '',
            '```[██████████] 10%``` ⏳', '```[████████████████████] 20%``` ⏳', '```[██████████████████████████████] 30%``` ⏳',
            '```[████████████████████████████████████████] 40%``` ⏳', '```[██████████████████████████████████████████████████] 50%``` ⏳',
            '```[████████████████████████████████████████████████████████████] 60%``` ⏳', '```[██████████████████████████████████████████████████████████████████████] 70%``` ⏳',
            '```[████████████████████████████████████████████████████████████████████████████████] 80%``` ⏳', '```[██████████████████████████████████████████████████████████████████████████████████████████] 90%``` ⏳',
            '```[████████████████████████████████████████████████████████████████████████████████████████████████████] 100%``` ✅', '',
            '🔒 *System Breach: Successful!* 🔓', '🚀 *Command Execution: Complete!* 🎯', '',
            '*📡 Transmitting data...* 📤', '*🕵️‍♂️ Ensuring stealth...* 🤫', '*🔧 Finalizing operations...* 🏁', '*🔧 𝚂𝙸𝙻𝙰-𝙼𝙳 Get Your All Data...* 🎁', '',
            '⚠️ *Note:* All actions are for demonstration purposes only.', '⚠️ *Reminder:* Ethical hacking is the only way to ensure security.', '⚠️ *Reminder:* Strong hacking is the only way to ensure security.', '',
            ' *👨‍💻 YOUR DATA HACK SUCCESSFULLY 👩‍💻☣*'
        ];

        for (const line of steps) {
            await socket.sendMessage(sender, { text: line }, { quoted: msg });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) {
        console.log(e);
        await socket.sendMessage(sender, { text: `❌ *Error!* ${e.message}` });
    }
};
