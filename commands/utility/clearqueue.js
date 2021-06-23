exports.run = function(client, message, args) {
  client.queue = [];
  message.reply("Queue cleared!")
};
exports.conf = {
  enabled: true,
  permLevel: 1
};

exports.help = {
  type: 'utility',
  name: 'clearqueue',
  description: 'Clears the current RCON queue.',
  usage: 'clearqueue'
};
