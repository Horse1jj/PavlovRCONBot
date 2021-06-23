exports.run = async (client, options, socket, message) => {
	/* What is passed to a custom command:
	 *	client: the Discord.js client (https://discord.js.org/#/docs/main/stable/class/Client)
	 *	options: an Object containing any optional options needed
	 *	socket: the created socket in <Client>.spinServer() (https://nodejs.org/api/net.html#net_class_net_socket)
	 *	message: the message recived in the message event (/events/message.js, https://discord.js.org/#/docs/main/stable/class/Message)
	 *	
	 * These are always passed to the command, the only thing that may change is the options passed based on your changes or
	 * future updates
	 * If you want more examples, you can see /commands/rcon for custom commands that come with the bot
	*/
}

// conf (config) for the command
exports.conf = {
    enabled: true, // whether or not to enable the command on startup
    permLevel: 0,  // the permission level for the command
    reqRoles: []   // an Array of role ID or names to look for (if used in a server, not DM's) to allow usage of the command, this is optional
};

exports.help = {
    type: "RCON", // type of the command, this must always be 'RCON' for rcon commands
    name: "Map", // name of the command, used to look for it when running commands
    view: "Map", // bassically the same thing as name, this will be removed later on
    desc: "Gives a list of maps to choose to change from (used the servers map rotation)."
    // general desciption of the command, and what it does (used in the commands RCON command)
};