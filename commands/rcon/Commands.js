const { EmbedBuilder } = require('discord.js');

exports.run = async (client, opt, soc, msg) => {
    let args = msg.content.split(" ");
    function send() {
        let embed = new EmbedBuilder()
            .setTitle("RCON Custom Commands")
            .setColor(0x0099ff)
            .setDescription(`${client.commands.map(c => `\`${c.help.name}\``).join(", ")}`)
            .setFooter({ text: "These run without a prefix, in the RCON channel(s)!" });
        msg.channel.send({ embeds: [embed] });
    }
    if (args[1]) {
        let cmd = client.commands.find(c => c.help.name === args[1] || c.help.view === args[1]);
        if (!cmd) return send();
        let embed = new EmbedBuilder()
            .setTitle(`RCON Custom - ${cmd.help.name}`)
            .setColor(0x0099ff)
            .setDescription(cmd.help.desc)
            .setFooter({ text: "This runs without a prefix, in the RCON channel(s)!" });
        
        Object.entries(cmd.help).forEach(([key, value]) => {
            key = key.replace(/"/g, "");
            if (key !== "desc") embed.addFields({ name: key, value: typeof value === 'string' ? value : JSON.stringify(value), inline: true });
        });
        
        msg.reply({ embeds: [embed] });
    } else {
        send();
    }
};

exports.conf = {
    enabled: true,
    permLevel: 0
};

exports.help = {
    type: "RCON",
    name: "Commands",
    view: "Commands",
    desc: "Lists custom commands loaded."
};
