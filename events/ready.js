const Discord = require('discord.js');
module.exports = async (client) => {
    await client.wait(2500);
    console.log(`PavlovBot online and ready`);
    client.user.setPresence({ activity: { name: `${client.conf.prefix}help | ${client.conf.prefix}pavlov` } });

    if (client.conf.hostWeb) {
        require("../dashboard/dash.js")(client)
    }
    client.spinServer().then(res => {
        client._socket = res;
        console.log("RCON Socket Connected")
    }).catch(res => console.log("RCON Socket Startup Error: ", res))
}