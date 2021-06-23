const Discord = require('discord.js')
const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const path = require('path')
module.exports = (client) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use("/public", express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res, next) => {
        res.sendFile(__dirname + "/pages/index.html")
    })

    app.post('/queue-command', (req, res, next) => {
        let opts = req.body
        client.queue.push({ cmd: opts.cmd.trim(), userID: opts.user.trim(), params: opts.items, repeat: true })
        res.send({ passed: true, cmd: opts.cmd, res: "batch command issued to queue" })
    })

    app.post('/command', (req, res, next) => {
        let opts = req.body
        client.RCONCommandHandler(client._socket, opts.cmd.trim()).then(r => {
            try {
                let dt = JSON.parse(r)
                res.send({ passed: true, cmd: opts.cmd, res: dt })
            } catch (e) {
                dt = JSON.parse(r+"]}") // this is a weird workaround for commands like ItemList, since it sometimes sends incomplete JSON 
                res.send({ passed: true, cmd: opts.cmd, res: dt })
            }
        }).catch(r => {
            res.send({ passed: false, cmd: opts.cmd, res: r })
        })
    })

    app.get('*', (req, res, next) => {
        res.send('OwO, an error');
    });

    app.post('*', (req, res, next) => {
        res.send('OwO, an error');
    });

    var server_port = process.env.PORT || client.conf.webPort;
    app.listen(server_port, () => {
        console.log('Listening on port %d', server_port);
    });
}