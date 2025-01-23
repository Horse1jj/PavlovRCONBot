exports.run = async (client, options, socket, message) => {
    try {
        const args = message.content.split(" ").slice(1); // Get the arguments after the command name
        if (!args.length) {
            return message.channel.send("Please provide a pin message.");
        }

        const pinMessage = args.join(" "); // Join the arguments into the pin message
        const serverId = options.serverId; // Assuming `options.serverId` contains the current server ID

        // Send the RCON command to update the pin
        const command = `setpin "${pinMessage}"`;
        socket.write(command, (err) => {
            if (err) {
                console.error("Failed to send RCON command:", err);
                return message.channel.send("Failed to update the pin. Please try again.");
            }
            message.channel.send(`Pin successfully updated to: "${pinMessage}"`);
        });
    } catch (error) {
        console.error("Error in setpin command:", error);
        message.channel.send("An error occurred while trying to set the pin. Please contact an administrator.");
    }
};

// conf (config) for the command
exports.conf = {
    enabled: true, // Enable the command on startup
    permLevel: 2,  // Minimum permission level required to use the command
    reqRoles: [""""] // Optional roles required to use this command
};

// Command metadata
exports.help = {
    type: "RCON",  // Command type
    name: "SetPin", // Command name
    view: "SetPin", // Display name for command (can be removed later)
    desc: "Sets a new pin message for the server.", // Command description
};
