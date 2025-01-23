exports.run = async (client, options, socket, message) => {
    try {
        // Extract the content of the message after the command
        const args = message.content.split(" ").slice(1).join(" ");

        // Check if there's anything to send
        if (!args) {
            return message.reply("You need to provide a command to send to the RCON server.");
        }

        // Send the custom command to the RCON server
        socket.write(`${args}\n`, (err) => {
            if (err) {
                console.error(`Error sending command to RCON: ${err.message}`);
                return message.reply("There was an error sending your command to the RCON server.");
            }

            message.reply(`Command sent to RCON: \`${args}\``);
        });
    } catch (err) {
        console.error(`Error in custom RCON command: ${err.message}`);
        message.reply("An error occurred while processing your command.");
    }
};

// Configuration for the command
exports.conf = {
    enabled: true, // Enable the command on startup
    permLevel: 2,  // Minimum permission level required to run the command
    reqRoles: []   // Role IDs/names required to use the command (optional)
};

exports.help = {
    type: "RCON", // This must always be 'RCON' for RCON commands
    name: "Custom", // Name of the command
    view: "Custom", // Optional; can be removed later
    desc: "Send a custom command with arguments to the RCON server." // Description of the command
};
