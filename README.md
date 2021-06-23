# PavlovRCONBot
A Discord.js bot that sends RCON commands to a Pavlov server, without any install server side. Also comes with a simple 'dashboard' website to interact with the bot. Everything here is a very simple version of the bot and dashboard, and will be heavily reworked. This is also orignially based off another repo by vankruptgames, which you can view here [by clicking here](https://github.com/vankruptgames/PavlovVR-Rcon). 

# Questions or Problems
If you have an error with the code in the repo, you can open an issue and I'll look at it as soon as possible. However, if you just have a general question or problem you're welcome to join my Discord server and ping me (Darko Pendragon#3219, I likely won't respond to direct messages). Invite link: https://discord.gg/EnrxfERX8T

# Install
* Download the project as a `.zip` or clone it using `git clone https://github.com/DarkoPendragon/PavlovRCONBot`
* Run `npm i` from your console in the bots working directory (main folder with `package.json` in it)
* If you haven't, create a bot application with Discord here: https://discord.com/developers/applications
* Configure `config.json` with your bot token and other settings
* Launch the bot by running `node index.js` or `npm start` in your console

# Features
The RCON bot automatically connects to your Pavlov server and runs RCON commands sent to it (by channel or direct messages, specified in the config). You can also:
* Create custom commands (loaded from the `/commands` folder)
* Use the built in website to run commands and view online players (preview below)
![DashboardPreview](https://i.imgur.com/RQ5MmPC.png)

# Config
`config.json` (default):
```json
{
    "prefix": "d!",
    "token": "bottoken",
    "webPort": 80,
    "hostWeb": true,
    "server": {
        "port": "serverPort",
        "serverIP": "serverIp",
        "password": "serverPassword"
    },
    "extraLogging": false,
    "loggingChannel": false,
    "runningChannel": "DM",
    "allowAllUsers": true,
    "allowedUsers": []
}
```
| Option | Type | Description |  
| --- | --- | --- |
| prefix | String | Prefix to run normal commands with (e.g `d!help`) |
| token | String | Bot auth token provided by Discord |
| webPort | Intager | Port to listen to for the webserver |
| hostWeb | Boolean | Enables/disabled running the webserver/dashboard |
| server.port | String/Intiger | RCON port set in your servers RconSettings.txt |
| server.serverIP | String | Your Pavlov servers web-address |
| server.password | String | Your Pavlov servers RCON password (normal string, not md5 encypted) |
| extraLogging | Boolean | Enables a lot of useless console logging, meant for simple debugging |
| loggingChanel | String/Boolean | If set to a String, the bot will log RCON commands ran in this Discord channel (this is a channel ID) |
| runningChannel | String | Can either be a Discord channel ID or "DM," id set to DM the bot listens for commands in it's direct messages |
| allowAllUsers | Boolean | Whether to allow anyone to run RCON commands (heavily advised against when using DM's for commands) |
| allowedUsers | Array | An Array of Discord User ID's to allow when `allowAllUsers` is `false` |  

# Custom Commands
See `/_examples/example rcon command.js`.

# Sidenotes/Warnings
## The Dashboard
There currently isn't any measure to limit who can access the dashboard. I'll be adding a Discord login to verify if a user can run command once I make the dashboard actually look somewhat decent. So with this in mind, **DO NOT** share your projects website link publicly. Anyone can run any RCON command on your server, like kicking or banning users. Or, even overloading the server by spawning an insane amount of items/changing maps constantly.  

## Default Config
It is highly recommended you change `allowedUsers` to `false` and enter your own user ID, or changing `runningChannel` to a channel ID only the bot, you and trusted users can see.  

## Limiting Commands
Custom commands can be limited to permission levels or roles, but the base commands cannot (yet). This means anyone can could run `Ban YourName` and ban you from your own server. Of course you could just remove the ban or delete the log file for bans, but you should avoid giving access to the bot to people who aren't a moderator or trusted friend regardless.

## Flexability & Documnetation
Better and more user friendly usage of the bot along with more documentation will come with future updates.