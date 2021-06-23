exports.run = async (client, opt, soc, msg) => {
    client.RCONCommandHandler(soc, 'RefreshList', [], msg.author).then(res => {
        let PLAYERS = JSON.parse(res).PlayerList
        let PLS = PLAYERS.map(p => `${p.Username}${" ".repeat(25 - p.Username.length)}: ${p.UniqueId}`)
        msg.channel.send(`\`\`\`\nONLINE PLAYERS (Username : ID)\n${PLS.join("\n")}\n\`\`\``)
    })
}

exports.conf = {
    enabled: true,
    permLevel: 0
};

exports.help = {
    type: "RCON",
    name: "Refresh",
    view: "Refresh",
    desc: "Fetches the current players connected to the server."
};