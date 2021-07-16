const Discord = require('discord.js')
const klaw = require('klaw')
const path = require('path')
const net = require('net')
class RCON extends Discord.Client {
    constructor(options) {
        super(options);
        this._socket = null;
        this.isAuth = false;
        this.isWaitingInput = new Set();
        this.queue = [];
        this.intervals = {};
        this.VALID_CMDS = [];
        this.VALID_ITEMS = [];
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
        this.wait = require("util").promisify(setTimeout);
        this.conf = require('./config.json')
    }

    RCON_INTER_FUNCTION(cli) {
        if (cli && cli.queue) {
            if (cli.queue.length > 0) {
                cli.RCON_READ_ORDER()
            }
        }
    }

    RCON_READ_ORDER() {
        const cli = this;
        if (cli.queue.length > 0) {
            clearInterval(cli.intervals.QUEUE_INTER)
            let THIS_ORDER = cli.queue[0]
            cli.queue.shift()
            console.log(`Shifted, running issued queue order: ${THIS_ORDER.cmd} ${THIS_ORDER.userID} (${THIS_ORDER.params ? THIS_ORDER.params.join(" ") : "NOPARAMS"})`)

            if (THIS_ORDER.params) {
                if (THIS_ORDER.params.length > 1) {
                    let items = THIS_ORDER.params
                    var inter = 0

                    function next() {
                        if (inter !== items.length) {
                            let item = items[inter]
                            if (cli.VALID_ITEMS.includes(item)) cli.RCONCommandHandler(cli._socket, `${THIS_ORDER.cmd} ${THIS_ORDER.userID} ${item}`, [], THIS_ORDER.ranBy).catch(res => console.log('Problem running queue order: ' + res.stack ? res.stack : res))
                            inter = inter + 1
                            setTimeout(() => { next() }, 200)
                        } else {
                            cli.intervals.QUEUE_INTER = setInterval(() => cli.RCON_INTER_FUNCTION(cli), cli.conf.intervalSpeed)
                        }
                    }
                    next()
                } else {
                    cli.RCONCommandHandler(cli._socket, `${THIS_ORDER.cmd} ${THIS_ORDER.userID} ${THIS_ORDER.params[0]}`, [], THIS_ORDER.ranBy).catch(res => console.log('Problem running queue order: ' + res.stack ? res.stack : res))
                    cli.intervals.QUEUE_INTER = setInterval(() => cli.RCON_INTER_FUNCTION(cli), cli.conf.intervalSpeed)
                }
            } else {
                cli.RCONCommandHandler(cli._socket, `${THIS_ORDER.cmd} ${THIS_ORDER.userID}`, [], THIS_ORDER.ranBy).catch(res => console.log('Problem running queue order: ' + res.stack ? res.stack : res))
                cli.intervals.QUEUE_INTER = setInterval(() => cli.RCON_INTER_FUNCTION(cli), cli.conf.intervalSpeed)
            }
        }
    }

    RCONCommandHandler(socket, command, params, user) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.VALID_CMDS.includes(command.split(" ")[0]) && command != 'Help') throw new Error("invalid command " + command)
                if (socket.destroyed || !socket.readyState) {
                    await this._socket.connect(this.conf.server.port, this.conf.server.serverIP, () => {});
                    await this.wait(2000)
                }
                socket.write(command)
                socket.once('data', async (data) => {
                    try {
                        if (data.toString().startsWith('Password:')) {
                            await this.wait(1200)
                            socket.write(command)
                            socket.once('data', async (data) => {
                                if (user) this.RCONLog(data.toString(), { cmd: command, cmdName: command.split(" ")[0], user: { name: user.username, avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` } });
                                else this.RCONLog(data.toString(), { cmd: command })
                                resolve(data.toString())
                            })
                        } else {
                            if (command == "RefreshList") {
                                let d = JSON.parse(data.toString())
                                this.channels.fetch("854005255644905532", true, true).then((res) => {
                                    res.edit({ name: `Players: ${d.PlayerList.length}/${res.name.split("/")[1]}` }).catch(console.log)
                                }).catch(console.log)
                            }
                            if (user) this.RCONLog(data.toString(), { cmd: command, cmdName: command.split(" ")[0], user: { name: user.username, avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` } });
                            else this.RCONLog(data.toString(), { cmd: command })
                            resolve(data.toString())
                        }
                    } catch (e) {
                        if (e.toString().includes('Unexpected end of JSON') || e.toString().includes('Unexpected token')) {
                            this.sentData = true
                            console.log(data)
                        }
                        console.log("RCONHANDLE", e)
                    }

                });
            } catch (e) {
                console.log(e)
                reject(e)
            }
        })
    }

    async spinServer() {
        return new Promise((resolve, reject) => {
            let CLI = this;
            let socket = net.Socket();
            socket.connect(this.conf.server.port, this.conf.server.serverIP, () => {});
            socket.on('error', (err) => {
                if (err.toString().includes('This socket has been ended by the other party')) {
                    this.authServer(socket).then(console.log).catch(console.log)
                } else {
                    console.log(err)
                    reject(err)
                }
            });
            socket.on('data', async (data) => {
                if (data.toString().startsWith('Password:')) {
                    let password = require('crypto').createHash('md5').update(this.conf.server.password).digest('hex');
                    socket.write(password)
                    console.log(data.toString())
                }
                if (data.toString().startsWith('Authenticated=1')) {
                    this.isAuth = true;
                    socket.emit("authServer", true)
                    console.log('Logged in!')
                    resolve(socket)
                    if (!this.intervals.QUEUE_INTER) this.intervals.QUEUE_INTER = setInterval(() => this.RCON_INTER_FUNCTION(CLI), CLI.conf.intervalSpeed);
                    this.RCONCommandHandler(socket, `Help`).then(res => {
                        res = JSON.parse(res)
                        let mds = res.Help.split(", ").map(c => c.split(" ")[0])
                        this.VALID_CMDS = mds;
                        this.started = true;
                    })
                    if (this.VALID_ITEMS.length == 0) {
                        if (this.VALID_CMDS.length == 0) await this.wait(1000)
                        this.RCONCommandHandler(socket, 'ItemList').then(r => {
                            try {
                                let dt = JSON.parse(r)
                                this.VALID_ITEMS = dt.ItemList
                            } catch (e) {
                                if (r.trim().endsWith("}")) {
                                    if (r.ItemList) this.VALID_ITEMS = r.ItemList
                                    else {
                                        let dt = JSON.parse(JSON.stringify(r))
                                        this.VALID_ITEMS = dt.ItemList
                                    }
                                } else {
                                    let dt = JSON.parse(r + "]}")
                                    this.VALID_ITEMS = dt.ItemList
                                }
                            }
                        })
                    }
                    if (!this.intervals.playerRefreshInter || this.intervals.playerRefreshInter._destroyed) this.intervals.playerRefreshInter = setInterval(async () => {
                        if (CLI.isWaitingInput.size == 0 && CLI.queue.length == 0) {
                            if (CLI.logging) console.log("Checking for players")
                            CLI.RCONCommandHandler(socket, 'RefreshList').then((res) => {
                                res = JSON.parse(res).PlayerList;
                                if (res.length == 0) {
                                    socket.destroy()
                                    console.log("No players, socket destroyed")
                                    clearInterval(CLI.intervals.playerRefreshInter)
                                    Object.entries(CLI.intervals).forEach(int => {
                                        if (!int._destroyed) clearInterval(int)
                                    })
                                }
                            }).catch(console.log)
                        }
                    }, 60000)
                }
                if (data.toString().startsWith('Authenticated=0')) {
                    this.isAuth = false;
                    socket.emit("authServer", false)
                    reject(new Error("login wrong, couldnt auth"))
                }
            })
            socket.on('authServer', r => {
                this.isAuth = r
            })
        })
    }

    authServer(socket) {
        return new Promise(async (resolve, reject) => {
            if (!socket || socket.pending || !socket.readyState || socket.connecting) {
                await this.wait(1000)
                if (!socket || socket.connecting) reject("socket either doesnt exist or isnt ready yet")
            }
            if (socket.destroyed) {
                socket.connect(this.conf.server.port, this.conf.server.serverIP, () => {});
                socket.once("authServer", async (state) => resolve(state))
            } else {
                if (this.conf.extraLogging) console.log("Forcing re-auth in authServer...")
                await socket.write("disconnect")
                await socket.destroy()
                await this.wait(1000)
                socket.connect(this.conf.server.port, this.conf.server.serverIP, () => {});
                socket.once("authServer", async (state) => resolve(state))
            }
        })
    }

    RCONCmd(cmd, options, socket, message) {
        return new Promise(async (resolve, reject) => {
            if (this.isWaitingInput.has(message.author.id)) reject("isWaitingInput")
            let c = this.commands.filter(c => c.help.type == 'RCON' && c.help.name == cmd).first()
            if (!c) reject("noCmd")
            try {
                c.run(this, options, socket, message)
                resolve()
            } catch (e) {
                reject("CMD Failed: ", e)
            }
        })
    }

    RCONLog(message, options = {}) {
        return new Promise(async (res, rej) => {
            if (!message) rej(new Error("no message passed"))
            if (typeof message == 'string' && message.startsWith("Password:")) {
                this.isAuth = false;
                let password = require('crypto').createHash('md5').update(this.conf.server.password).digest('hex');
                await this._socket.write(password)
            }
            if (this.conf.extraLogging) console.log("[RCON]", message.stack ? message.stack : message)
            try {
                if (!this.conf.loggingChannel) return;
                let c = await this.channels.fetch(this.conf.loggingChannel)
                if (c) {
                    let embed = new Discord.MessageEmbed()
                        .setColor(options.color ? options.color : "GREEN")
                        .setTitle('RCON Log');
                    // this is kind of sloppy butttttt
                    embed.setDescription(`\`\`\`json\n${message}\n\`\`\``)
                    if (options.cmd) embed.addField('Command', options.cmd)
                    if (options.user && options.cmdName) embed.setFooter(`${options.cmdName} ran by ${options.user.name}`, options.user.avatar)
                    c.send({ embed: embed })
                    res(false)
                }
            } catch (e) {
                res(false)
                console.log("[RCONLog] ", e.stack)
            }
        })
    }

    elevation(msg) {
        if (msg.channel.type === 'dm') return 4
        let permlvl = 0

        if (msg.member.permissions.has("KICK_MEMBERS")) permlvl = 1
        if (msg.member.permissions.has("BAN_MEMBERS")) permlvl = 2
        if (msg.member.permissions.has("ADMINISTRATOR")) permlvl = 3
        if (msg.member.id === msg.member.guild.ownerID) permlvl = 4
        return permlvl
    }
}

const client = new RCON({
    messageCacheMaxSize: 450,
    disabledEvents: ['TYPING_START']
})

async function init() {
    klaw("./commands").on("data", (item) => {
        const cmdFile = path.parse(item.path)
        if (!cmdFile.ext || cmdFile.ext !== ".js") return;
        try {
            let props = require(`${cmdFile.dir}${path.sep}${cmdFile.name}${cmdFile.ext}`)
            console.log(`[R] Loading Command: ${props.help.name}${" ".repeat(25 - props.help.name.length)}♥`)
            client.commands.set(props.help.name, props)
            if (props.conf.aliases) props.conf.aliases.forEach(alias => {
                client.aliases.set(alias, props.help.name)
            })
        } catch (e) {
            return console.log(new Error(`FAIL: ${cmdFile.name}: ${e.stack}`))
        }
    })

    klaw("./events").on("data", (item) => {
        const evtFile = path.parse(item.path)
        try {
            if (!evtFile.ext || evtFile.ext !== ".js") return;
            console.log(`[R] Loading Event: ${evtFile.base}${" ".repeat(27 - evtFile.base.length)}♥`);
            const event = require(`./events/${evtFile.name}${evtFile.ext}`)
            client.on(evtFile.name, event.bind(null, client))
        } catch (e) {
            console.log(new Error(`EVENT_FAIL: ${evtFile.name}: ${e.stack}`))
        }
    })

    client.login(client.conf.token)
}
init();