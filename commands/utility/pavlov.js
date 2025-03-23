const { EmbedBuilder } = require('discord.js');

exports.run = async (client, message, args) => {
  let soc = client._socket;
  if (soc && soc.readyState) {
    if (['open', 'readOnly', 'writeOnly'].includes(soc.readyState)) {
      client.RCONCommandHandler(soc, `ServerInfo`, [], message.author).then((res) => {
        res = JSON.parse(res).ServerInfo;
        const embed = new EmbedBuilder()
          .setTitle(`Server Info: ${res.ServerName}`)
          .setDescription(`The server is currently on **${res.MapLabel.split("_")[2]}**, and **${res.PlayerCount.split("/")[0]}** players are currently playing. The server's gamemode is **${res.GameMode}**, with the round state **${res.RoundState}**.`)
          .setColor(0x0099ff);

        message.reply({ embeds: [embed] });
      }).catch((res) => {
        console.log(res);
        message.reply("Couldn't fetch server data, if this persists let Darko know!");
      });
    }
  } else {
    message.reply("Couldn't fetch server data!");
  }
};

exports.conf = {
  enabled: true,
  serverOnly: false,
  allowedServers: [],
  aliases: [],
  permLevel: 0,
  canDM: true
};

exports.help = {
  type: 'utility',
  name: 'pavlov',
  requireLog: false,
  description: 'Shows stats from the Pavlov server.',
  usage: 'pavlov'
};

