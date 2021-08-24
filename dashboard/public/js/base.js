$(document).ready(() => {
    var currentCmd = ''
    var players = []
    var validItems = []
    var currentUsers = []
    var speed = 500;
    var lastRan = new Date()
    $.post('/getdata', { query: "speed" }, res => {
        if (res.status == "success") speed = parseInt(res.data)
        else $.post('/setdata', { prop: "speed", value: "500" })
    })

    function getPlayer(id) {
        return new Promise(async (resolve, rej) => {
            if (id == 'null') resolve({ TeamId: 0, UniqueId: "NULL_USER", PlayerName: "NULL_USER", Kills: 'NULL', Deaths: 'NULL', Assists: 'NULL', Cash: 'NULL' })
            $.post("/command", { cmd: `InspectPlayer ${id}` }, async (res, status) => {
                res = res.res.PlayerInfo
                res.Kills = res.KDA.split("/")[0]
                res.Deaths = res.KDA.split("/")[1]
                res.Assists = res.KDA.split("/")[2]
                resolve(res)
            })
        })
    }

    function fetchUsers() {
        return new Promise((resolve, reject) => {
            lastRan = new Date()
            currentUsers = []
            $('#currentCmds').html(`Current selected users:`)
            $('#selectAll').prop('checked', false)
            $("#playerTableBody").find('input[type=checkbox]').each((i, e) => {
                $(e).prop('checked', false)
            })
            $.post("/command", { cmd: "RefreshList" }, async (res, status) => {
                if (!res.passed) reject(res.res)
                setTimeout(() => {
                    let data = res.res.PlayerList;
                    if (data.length == 0) {
                        $('#playerTableBody').html("")
                        $('#refreshList').addClass("btn-danger").removeClass("btn-warning")
                        setTimeout(() => {
                            $('#refreshList').addClass("btn-success").removeClass("btn-danger disabled")
                        }, 2500)
                        resolve(false)
                    }
                    let html = ''
                    players = []
                    let i = 0;

                    function doNext() {
                        if (i >= data.length) {
                            players.sort((a, b) => parseInt(a.TeamId) - parseInt(b.TeamId))
                            players.forEach(player => {
                                html = html + `<tr colspan="1" id="${player.UniqueId}" class="${player.TeamId == 0 ? "table-danger" : "table-info"}"><td class="text-center"><input class="playerSelectCheck" userName="${player.PlayerName}" userId="${player.UniqueId}" type="checkbox"></td><td colspan="1" class="openUserModule" userName="${player.PlayerName}" userId="${player.UniqueId}" scope="row">${player.PlayerName}</td><td>${player.Kills}</td><td>${player.Deaths}</td><td>${player.Cash}</td></tr>`
                            })
                            $('#playerTableBody').html(html)
                            $('#refreshList').addClass("btn-success").removeClass("btn-warning disabled")
                            resolve(true)
                        } else {
                            getPlayer(data[i].UniqueId ? data[i].UniqueId : "null").then(r => {
                                players.push(r)
                                i++;
                                doNext()
                            })
                        }
                    }
                    doNext()
                }, 2000)
            })
        })

    }

    function inputLog(res) {
        let data = JSON.stringify(res.res ? res.res : res, null, 2)
        let outPutElmt = $('#outputText')
        outPutElmt.animate({ scrollTop: $('#outputText')[0].scrollHeight }, 500)
        outPutElmt.append("\n--> " + res.cmd + "\n" + data)
    }

    async function updateCommandSel() {
        $("#playerTableBody").find('input[type=checkbox]').each((i, e) => {
            if ($(e).prop('checked') && !currentUsers.filter(p => p.id == $(e).attr('userId'))[0]) currentUsers.push({ name: $(e).attr("userName"), id: $(e).attr("userId") })
            else if (!$(e).prop("checked")) currentUsers = currentUsers.filter(p => p.id != $(e).attr('userId'))
        })
        $('#currentCmds').html(`Current selected users: ${currentUsers.map(p => p.name).join(", ")}`)
    }

    fetchUsers().then(() => {
        $.post("/get-maps", (res, status) => {
            console.log(res)
            if (!res) alert("No maps from serverside")
            if (res.MapList) res = res.MapList
            let i = 0
            let html = ''
            function doNextMap() {
                let map = res[i]
                if (map) {
                    html = html + `<a class="dropdown-item switchmap" value="SwitchMap ${map.MapId} ${map.GameMode}" href="#">${map.MapId.split("_").pop()} ${map.GameMode}</a>`
                    i++;
                    doNextMap()
                } else {
                    $("#mapList").html(html)
                }
            }
            doNextMap()
        })
    })
    setInterval(() => {
        let now = new Date()
        if (parseInt(now.getTime() - lastRan.getTime()) > 10000 && currentUsers.length <= 0) fetchUsers()
    }, 120000)

    $(document).on('click', ".switchmap", async (event) => {
        event.preventDefault()
        let target = $(event.currentTarget)
        target.addClass("disabled")
        console.log(target.attr("value"))
        $.post("/command", { cmd: target.attr("value") }, (res, status) => {
            if (res.res) res = res.res
            res.cmd = target.attr("value")
            inputLog(res)
            target.removeClass("disabled")
            if (!res.Successful) alert("Something went wrong!")
        })
    })
    $(document).on('click', ".openUserModule", async (event) => {
        let target = $(event.currentTarget)
        let player = await getPlayer(target.attr('userId'))
        $('#modulePlayerName').html(player.PlayerName)
        $('#playerModuleBody').html(`<button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Kill ${player.UniqueId}" playerID="${player.UniqueId}">Kill Player</button><br> <button type="button" class="btn btn-info playerModuleCommand" style="width:100%;margin-bottom:10px;" value="GiveCash ${player.UniqueId} 10000" playerID="${player.UniqueId}">Give 10k Cash</button><br><button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="SwitchTeam ${player.UniqueId} ${player.TeamId == 0 ? 1 : 0}" playerID="${player.UniqueId}">Switch Team</button><br><button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Kick ${player.UniqueId}" playerID="${player.UniqueId}">Kick Player</button><br><button type="button" class="btn btn-danger playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Ban ${player.UniqueId}" playerID="${player.UniqueId}">Ban Player</button><div class="input-group col-form-label-sm mb-3"><div class="input-group-prepend"><button class="btn btn-primary btn-sm playerModuleCommand" id="plyGive" value="GiveItem ${player.UniqueId}" type="button">GiveItem</button></div><input type="text" list="cmdItems" style="height: 45px;" id="plyGiveVal" class="form-control form-control-sm"><datalist id="cmdItems"></datalist></div>`)
        if (validItems.length > 0) {
            let html = ''
            validItems.forEach(i => html = html + `<option value="${i}">${i}</option>`)
            $('#cmdItems').html(html)
        } else {
            lastRan = new Date()
            $.post("/command", { cmd: "ItemList" }, (res, status) => {
                validItems = res.res.ItemList;
                let html = ''
                validItems.forEach(i => html = html + `<option value="${i}">${i}</option>`)
                $('#cmdItems').html(html)
            })
        }
        $('#playerModule').modal('show');
    })
    $(document).on('click', ".playerModuleCommand", async (event) => {
        let target = $(event.currentTarget)
        let command = target.prop('value')
        lastRan = new Date()
        if (target.prop('id') == "plyGive") {
            let item = $('#plyGiveVal').val()
            $('#playerModule').modal('hide');
            $.post("/command", { cmd: `${command} ${item}` }, (res, status) => {
                inputLog(res)
                fetchUsers()
            })
        } else {
            $('#playerModule').modal('hide');
            $.post("/command", { cmd: command }, (res, status) => {
                inputLog(res)
                fetchUsers()
            })
        }
    })
    $(document).on('click', ".issueCmdButton", async (event) => {
        lastRan = new Date()
        let target = $(event.currentTarget)
        let command = target.prop('value')
        $.post("/command", { cmd: command }, (res, status) => {
            inputLog(res)
        })
    })
    $(document).on('click', "#runSpeed", async (event) => {
        lastRan = new Date()
        let target = $('#runSpeedInt')
        speed = parseInt(target.prop('value'))
        $.post('/setdata', { prop: "speed", value: parseInt(target.prop('value')) })
        $('#inputModule').modal('hide')
        if (speed <= 250) alert(`Lower speeds (<250) may cause inccorect responses from the server! Speed set to ${speed}ms.`)
        else alert(`Speed set to ${speed}!`)
    })

    $(document).on('change', '.playerSelectCheck', (event) => {
        updateCommandSel()
    })
    $('#selectAll').on('click', async (event) => {
        $("#playerTableBody").find('input[type=checkbox]').each((i, e) => {
            $(e).prop('checked', $('#selectAll').prop('checked'))
        })
        updateCommandSel()
    })

    $('#refreshList').on('click', async () => {
        $('#refreshList').addClass("btn-warning disabled").removeClass("btn-success")
        fetchUsers()
    })

    $('#setSpeed').on('click', async () => {
        lastRan = new Date()
        $('#inputModuleName').html("Set Speed")
        $('#inputModuleBody').html(`<legend class="cmds-lgn">Set Speed</legend><p>Sets how fast/slow functions and intervals run, in milliseconds. Setting this below 350 may cause invalid responses for some features.</p><br><input type="text" style="width:100%;height:45px;" id="runSpeedInt" placeholder="${speed}"><button type="button" id="runSpeed" style="width:100%;" class="btn btn-primary">Set Speed</button>`)
        $('#inputModule').modal('show');
    })

    $('#SetPlayerSkin').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#SetPlayerSkin').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#SetPlayerSkin').addClass("btn-success").removeClass("btn-danger disabled") }, 2000)
            return;
        }

        $('#inputModuleName').html("Chose a Skin")
        $('#inputModuleBody').html(`<legend class="cmds-lgn">Skin List</legend><select class="form-select" style="width:100%;height:100%;" id="skinList"><option>clown</option><option>prisoner</option><option>cop</option><option>infinitum</option><option>naked</option><option>hidden</option><option>farmer</option><option>russian</option><option>nato</option><option>german</option><option>us</option><option>soviet</option></select><button type="button" id="refreshListSubmit" style="width:100%;" class="btn btn-primary">Set Skin(s)</button>`)
        $('#inputModule').modal('show');

        $(document).one('click', '#refreshListSubmit', (event) => {
            lastRan = new Date()
            const users = currentUsers;
            let skin = $('#skinList').val()
            $('#inputModule').modal('hide');
            let i = 0;
            async function doNext() {
                if (i < users.length) {
                    $.post("/command", { cmd: `SetPlayerSkin ${users[i].id} ${skin}` }, (res, status) => {
                        inputLog(res)
                        i++;
                        setTimeout(() => { doNext() }, speed)
                    })
                }
            }
            doNext()
        })
    })
    $('#Kill').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#Kill').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#Kill').addClass("btn-success").removeClass("btn-danger disabled") }, 2000)
            return;
        }

        const users = currentUsers
        let i = 0
        async function doNext() {
            lastRan = new Date()
            if (i < users.length) {
                $.post("/command", { cmd: `Kill ${users[i].id}` }, (res, status) => {
                    inputLog(res)
                    i++;
                    setTimeout(() => { doNext() }, speed)
                })
            }
        }
        doNext()
    })
    $('#GiveItem').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#GiveItem').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#GiveItem').addClass("btn-success").removeClass("btn-danger disabled") }, 2000)
            return;
        }

        $('#inputModuleHead').html("Chose Item(s) to Give")
        let items = []
        let html = ''
        async function doNext() {
            items.forEach(p => html = html + `<option>${p}</option>`)
            $('#inputModuleBody').html(`<legend class="cmds-lgn">Item List</legend><select multiple="" size="8" class="form-select" style="width:100%;height:100%;" id="itemList">${html}</select><button type="button" id="refreshListSubmit" style="width:100%;" class="btn btn-primary">Give Item(s)</button>`)
            $('#inputModule').modal('show');

            $(document).one('click', '#refreshListSubmit', (event) => {
                lastRan = new Date()
                const users = currentUsers
                let item = $('#itemList').val()
                $('#inputModule').modal('hide');
                if (item.length > 1) {
                    let i = 0;
                    async function doNext() {
                        if (i < users.length) {
                            $.post("/queue-command", { cmd: "GiveItem", user: users[i].id, items: item }, (res, status) => {
                                inputLog(res)
                                i++;
                                setTimeout(() => { doNext() }, speed)
                            })
                        }
                    }
                    doNext()
                } else {
                    let i = 0;
                    async function doNext() {
                        if (i < users.length) {
                            $.post("/command", { cmd: `GiveItem ${users[i].id} ${item[0]}` }, (res, status) => {
                                inputLog(res)
                                i++;
                                setTimeout(() => { doNext() }, speed)
                            })
                        }
                    }
                    doNext()
                }

            })
        }
        if (validItems.length > 0) {
            items = validItems
            doNext()
        } else {
            $.post("/command", { cmd: "ItemList" }, (res, status) => {
                items = res.res.ItemList
                validItems = res.res.ItemList
                doNext()
            })
        }
    })
    $('#GiveLoadout').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#GiveLoadout').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#GiveLoadout').addClass("btn-success").removeClass("btn-danger disabled") }, 2000)
            return;
        }
        const LOADOUTS = {
            trait: ["newtonlauncher", "tttknife", "Syringe", "Syringe", "Painkillers", "taser", "Armour", "kevlarhelmet"],
            detective: ["detectivesmg", "Armour", "kevlarhelmet", "Painkillers", "ammo_special", "ammo_special", "ammo_smg", "ammo_smg"],
            cletus: ["newtonlauncher", "goldengun", "Knife", "Armour", "tttc4", "tttc4", "tttc4"],
            troll: ["Syringe", "Syringe", "Syringe", "goldengun", "bayonet_mosin"],
            kar: ["kar98", "scope_kar98", "bayonet_kar98", "Syringe", "Syringe", "Painkillers", "ammo_sniper", "ammo_rifle", "webley"],
            mos: ["mosin", "scope_mosin", "bayonet_mosin"],
            sword: ["bayonet_mosin", "bayonet_mosin", "bayonet_mosin", "bayonet_mosin", "bayonet_mosin"]
        }

        $('#inputModuleHead').html("Chose Item(s) to Give")
        let items = []
        let html = ''
        async function doNext() {
            lastRan = new Date()
            Object.keys(LOADOUTS).forEach(p => html = html + `<option>${p}</option>`)
            $('#inputModuleBody').html(`<legend class="cmds-lgn">Item List</legend><select multiple="" size="8" class="form-select" style="width:100%;height:100%;" id="itemList">${html}</select><button type="button" id="refreshListSubmit" style="width:100%;" class="btn btn-primary">Give Item(s)</button>`)
            $('#inputModule').modal('show');

            $(document).one('click', '#refreshListSubmit', (event) => {
                const users = currentUsers
                let item = LOADOUTS[$('#itemList').val()]
                $('#inputModule').modal('hide');
                let i = 0;
                async function doNext() {
                    if (i < users.length) {
                        $.post("/queue-command", { cmd: "GiveItem", user: users[i].id, items: item }, (res, status) => {
                            inputLog(res)
                            i++;
                            setTimeout(() => { doNext() }, speed)
                        })
                    }
                }
                doNext()
            })
        }
        if (validItems.length > 0) {
            items = validItems
            doNext()
        } else {
            $.post("/command", { cmd: "ItemList" }, (res, status) => {
                items = res.res.ItemList
                validItems = res.res.ItemList
                doNext()
            })
        }
    })

    $('#serverInfo').on('click', (event) => {
        event.preventDefault();
        $.post("/command", { cmd: "ServerInfo" }, (res, status) => {
            if (!res.res || !res.res.ServerInfo) return; // need double checking fix later
            res = res.res.ServerInfo;
            $('#modulePlayerName').html(res.ServerName)
            $('#playerModuleBody').html(`<h3>Server Map</h3><p style="width:100%;padding:5px;background-color:#99ffbb">${res.MapLabel}</p><h3>Server Gamemode</h3><p style="width:100%;padding:5px;background-color:#99ffbb">${res.GameMode}</p><h3>Server Round State</h3><p style="width:100%;padding:5px;background-color:#99ffbb">${res.RoundState}</p><h3>Server Player Count</h3><p style="width:100%;padding:5px;background-color:#99ffbb">${res.PlayerCount.split("/")[0]} out of ${res.PlayerCount.split("/")[1]} players.</p>`)
            $('#playerModule').modal('show');
        })
    })

    $('#helpText').on('click', (event) => {
        event.preventDefault();
        $('#fullModuleHead').html("Help Text")
        $('#fullModuleBody').html(`Welcome to your Pavlov RCON pannel. Here you can run various basic commands, or issue custom commands (at the bottom of the page). To begin:<br><br>Selecting a checkbox ( <input type="checkbox"> ) on the left side of a players name selects them to run a batch command with at the bottom of the player list. These command buttons are: <button type="button" class="btn btn-success btn-smlr">Set Player Skin</button> <button type="button" class="btn btn-success btn-smlr">Kill</button> and <button type="button" class="btn btn-success btn-smlr">Give Item(s)</button>.<br><br>Clicking the <button type="button" class="btn btn-success btn-smlr">Refresh List</button> on the top right will get all the current players and their data (kills, cash, etc.) again, then re-create the play table.<br><br>You may also click on a players name to open a list of commands that will run for that player (Kill, Kick, Give 10k, Ban, etc.). If you need any help feel free to join the Discord server (which is under Useful Links).`)
        $('#fullModule').modal('show');
    })

    $('#subit').on('click', (event) => {
        let cmd = $('#customRun').val()
        $('#customRun').val("")
        lastRan = new Date()
        $.post("/command", { cmd: cmd }, (res, status) => {
            inputLog(res)
        })
    })
})