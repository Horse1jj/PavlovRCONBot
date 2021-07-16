const Discord = require('discord.js')
const express = require("express");
const app = express();
const FormData = require('form-data');
const fetch = require('node-fetch');
const bodyParser = require('body-parser')
const path = require('path')
module.exports = (client) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use("/public", express.static(path.join(__dirname, 'public')));
    app.use(require('express-session')(client.conf.session))
    const rejectPage = `<!DOCTYPE html><head></head><body><div style="height:100vh;width:100vw;background-image:url('https://www.reactiongifs.com/r/hhn.gif');background-size:cover;background-position:center;"></div></body>`;
    function checkAuth(session) {
        return new Promise(async (resolve, reject) => {
            if (!session || !session.bearer_token) reject(false)
            const data = await fetch(`https://discord.com/api/users/@me`, { headers: { Authorization: `Bearer ${session.bearer_token}` } })
            const json = await data.json()
            if (json.username) resolve(json)
            else reject(false)
        })
    }

    app.get('/', async (req, res, next) => {
        if (!req.session.bearer_token) return res.redirect('/verify')
        let user = await checkAuth(req.session)
        if (!user.username) return res.redirect('/verify')
        if (!client.conf.allowedUsers.filter(p => p == user.id || p == user.username)[0]) res.send(rejectPage)
        else res.sendFile(__dirname + "/pages/index.html")
    })

    app.get('/verify/callback', async (req, res, next) => {
        const accessCode = req.query.code;
        if (!accessCode) return res.send('No access code specified');

        const data = new FormData();
        data.append('client_id', client.conf.oauth2.client_id);
        data.append('client_secret', client.conf.oauth2.secret);
        data.append('grant_type', 'authorization_code');
        data.append('redirect_uri', client.conf.oauth2.redirect_uri);
        data.append('scope', 'identify');
        data.append('code', accessCode);

        const json = await (await fetch('https://discord.com/api/oauth2/token', { method: 'POST', body: data })).json();
        req.session.bearer_token = json.access_token;

        res.redirect('/');
    })

    app.get('/verify', (req, res, next) => {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${client.conf.oauth2.client_id}&redirect_uri=${encodeURIComponent(client.conf.oauth2.redirect_uri)}&response_type=code&scope=${encodeURIComponent(client.conf.oauth2.scopes.join(" "))}`)
    })

    app.post('/getdata', (req, res, next) => {
        let query = req.body.query;
        if (!query) return res.send({status: "error", error: "no query passed"})
        let data = req.session[query]
        if (!data) return res.send({status: "failed", reason: "no matching data found"})
        res.send({status: "success", data: data})
    })

    app.post('/setdata', (req, res, next) => {
        if (!req.body.prop || !req.body.value) return res.send({status: "error", error: "one or more params not passed"})
        req.session[req.body.prop] = req.body.value
        res.send({status: "success", data: req.session[req.body.prop]})
    })

    app.post('/queue-command', (req, res, next) => {
        checkAuth(req.session).then(user => {
            let opts = req.body
            client.queue.push({ cmd: opts.cmd.trim(), userID: opts.user.trim(), params: opts.items, repeat: true, ranBy: user })
            res.send({ passed: true, cmd: opts.cmd, res: "batch command issued to queue" })
        }).catch(() => {
            res.redirect('/verify');
        })
    })

    app.get('/setmap', async (req, res, next) => {
        let q = req.query
        if (!q || !q.user || !q.mapID || !q.mapMode) return res.send('Invalid data passed '+JSON.stringify(req.query))
        let cmd = `SwitchMap ${q.mapID} ${q.mapMode}`
        let user = await client.users.fetch(q.user, true, true)
        if (!user || !user.id) user = q.user;
        if (!client.conf.allowedUsers.includes(q.user)) return res.send(rejectPage)
        client.RCONCommandHandler(client._socket, cmd, [], user).then(r => {
            res.redirect('/')
        }).catch(e => res.send(e.toString ? e.toString() : e))
    })

    app.post('/command', (req, res, next) => {
        let opts = req.body
        checkAuth(req.session).then(user => {
            client.RCONCommandHandler(client._socket, opts.cmd.trim(), [], user).then(r => {
                try {
                    let dt = JSON.parse(r)
                    res.send({ passed: true, cmd: opts.cmd, res: dt })
                } catch (e) {
                    dt = JSON.parse(r + "]}")
                    res.send({ passed: true, cmd: opts.cmd, res: dt })
                }
            }).catch(r => {
                res.send({ passed: false, cmd: opts.cmd, res: r })
            })
        }).catch(() => {
            res.redirect('/verify');
        })

    })

    app.post('/valid-items', (req, res, next) => {
        res.send({ items: client.VALID_ITEMS })
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