const {MessageEmbed} = require('discord.js')
exports.run = async (client, message, args) => {
  let soc = client._socket;
  if (soc && soc.readyState) {
    if (soc.readyState == "open" || soc.readyState == "readOnly" || soc.readyState == "writeOnly") {
      client.RCONCommandHandler(soc, `ServerInfo`, [], message.author).then((res) => {
        res = JSON.parse(res).ServerInfo
        message.reply(`The server (\`${res.ServerName}\`) is currently on **${res.MapLabel.split("_")[2]}**, and **${res.PlayerCount.split("/")[0]}** players are currently playing. The servers gamemode is **${res.GameMode}**, with the round state **${res.RoundState}**.`)
      }).catch((res) => {
        console.log(res)
        message.reply("Couldn't fetch server data, if this persists let Darko know!")
      })
    }
  } else {
    message.reply("Couldn't fetch server data!")
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
