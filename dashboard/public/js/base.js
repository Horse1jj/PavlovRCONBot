$(document).ready(() => {
    var currentCmd = ''
    var players = []
    var validItems = []
    var currentUsers = []

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
        currentUsers = []
        $('#currentCmds').html(`Current selected users:`)
        $.post("/command", { cmd: "RefreshList" }, async (res, status) => {
            if (!res.passed) return console.log(res.res)
            setTimeout(() => {
                let data = res.res.PlayerList;
                if (data.length == 0) return alert("No players are online!")
                let html = ''
                players = []
                let i = 0;

                function doNext() {
                    if (i >= data.length) {
                        players.sort((a, b) => parseInt(a.TeamId) - parseInt(b.TeamId))
                        players.forEach(player => {
                            html = html + `<tr colspan="2" id="${player.UniqueId}" class="${player.TeamId == 0 ? "table-danger" : "table-info"}"><td class="text-center"><input class="playerSelectCheck" userName="${player.PlayerName}" userId="${player.UniqueId}" type="checkbox"></td><td colspan="2" class="openUserModule" userName="${player.PlayerName}" userId="${player.UniqueId}" scope="row">${player.PlayerName}</td><td>${player.Kills}</td><td>${player.Deaths}</td><td>${player.Cash}</td></tr>`
                        })
                        $('#playerTableBody').html(html)
                        $('#refreshList').addClass("btn-success").removeClass("btn-warning disabled")
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
    }

    function inputLog(res) {
        let data = JSON.stringify(res.res)
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

    fetchUsers()

    $(document).on('click', ".openUserModule", async (event) => {
        let target = $(event.currentTarget)
        let player = await getPlayer(target.attr('userId'))
        $('#modulePlayerName').html(player.PlayerName)
        $('#playerModuleBody').html(`<button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Kill ${player.UniqueId}" playerID="${player.UniqueId}">Kill Player</button><br> <button type="button" class="btn btn-info playerModuleCommand" style="width:100%;margin-bottom:10px;" value="GiveCash ${player.UniqueId} 10000" playerID="${player.UniqueId}">Give 10k Cash</button><br><button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Kick ${player.UniqueId}" playerID="${player.UniqueId}">Kick Player</button><br><button type="button" class="btn btn-danger playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Ban ${player.UniqueId}" playerID="${player.UniqueId}">Ban Player</button><div class="input-group col-form-label-sm mb-3"><div class="input-group-prepend"><button class="btn btn-primary btn-sm playerModuleCommand" id="plyGive" value="GiveItem ${player.UniqueId}" type="button">GiveItem</button></div><input type="text" list="cmdItems" style="height: 45px;" id="plyGiveVal" class="form-control form-control-sm"><datalist id="cmdItems"></datalist></div>`)
        if (validItems.length > 0) {
            let html = ''
            validItems.forEach(i => html = html + `<option value="${i}">${i}</option>`)
            $('#cmdItems').html(html)
        } else {
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
        if (target.prop('id') == "plyGive") {
            let item = $('#plyGiveVal').val()
            $('#playerModule').modal('hide');
            $.post("/command", { cmd: `${command} ${item}` }, (res, status) => {
                inputLog(res)
            })
        } else {
            $('#playerModule').modal('hide');
            $.post("/command", { cmd: command }, (res, status) => {
                inputLog(res)
            })
        }
    })
    $(document).on('click', ".issueCmdButton", async (event) => {
        let target = $(event.currentTarget)
        let command = target.prop('value')
        $.post("/command", { cmd: command }, (res, status) => {
            inputLog(res)
        })
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

    $('#SetPlayerSkin').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#SetPlayerSkin').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#SetPlayerSkin').addClass("btn-success").removeClass("btn-danger disabled") }, 1500)
            return;
        }

        $('#inputModuleName').html("Chose a Skin")
        $('#inputModuleBody').html(`<legend class="cmds-lgn">Skin List</legend><select class="form-select" style="width:100%;height:100%;" id="skinList"><option>clown</option><option>prisoner</option><option>naked</option><option>farmer</option><option>russian</option><option>nato</option><option>german</option><option>us</option><option>soviet</option></select><button type="button" id="refreshListSubmit" style="width:100%;" class="btn btn-primary">Set Skin(s)</button>`)
        $('#inputModule').modal('show');

        $(document).one('click', '#refreshListSubmit', (event) => {
            let skin = $('#skinList').val()
            $('#inputModule').modal('hide');
            let i = 0;
            async function doNext() {
                if (i < currentUsers.length) {
                    $.post("/command", { cmd: `SetPlayerSkin ${currentUsers[i].id} ${skin}` }, (res, status) => {
                        inputLog(res)
                        i++;
                        setTimeout(() => { doNext() }, 800)
                    })
                }
            }
            doNext()
        })
    })
    $('#Kill').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#Kill').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#Kill').addClass("btn-success").removeClass("btn-danger disabled") }, 1500)
            return;
        }

        let i = 0;
        async function doNext() {
            if (i < currentUsers.length) {
                $.post("/command", { cmd: `Kill ${currentUsers[i].id}` }, (res, status) => {
                    inputLog(res)
                    i++;
                    setTimeout(() => { doNext() }, 800)
                })
            }
        }
        doNext()
    })
    $('#GiveItem').on('click', async () => {
        if (currentUsers.length == 0) {
            $('#GiveItem').addClass("btn-danger disabled").removeClass("btn-success")
            setTimeout(() => { $('#GiveItem').addClass("btn-success").removeClass("btn-danger disabled") }, 1500)
            return;
        }

        $('#inputModuleHead').html("Chose Item(s) to Give")
        let items = await (await $.post("/valid-items")).items;
        let html = ''
        items.forEach(p => html = html + `<option>${p}</option>`)
        $('#inputModuleBody').html(`<legend class="cmds-lgn">Item List</legend><select multiple="" size="8" class="form-select" style="width:100%;height:100%;" id="itemList">${html}</select><button type="button" id="refreshListSubmit" style="width:100%;" class="btn btn-primary">Give Item(s)</button>`)
        $('#inputModule').modal('show');

        $(document).one('click', '#refreshListSubmit', (event) => {
            let item = $('#itemList').val()
            $('#inputModule').modal('hide');
            if (item.length > 1) {
                let i = 0;
                async function doNext() {
                    if (i < currentUsers.length) {
                        $.post("/queue-command", { cmd: "GiveItem", user: currentUsers[i].id, items: item }, (res, status) => {
                            inputLog(res)
                            i++;
                            setTimeout(() => { doNext() }, 800)
                        })
                    }
                }
                doNext()
            } else {
                let i = 0;
                async function doNext() {
                    if (i < currentUsers.length) {
                        $.post("/command", { cmd: `GiveItem ${currentUsers[i].id} ${item[0]}` }, (res, status) => {
                            inputLog(res)
                            i++;
                            setTimeout(() => { doNext() }, 800)
                        })
                    }
                }
                doNext()
            }

        })
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
        $('#fullModuleBody').html(`Welcome to your Pavlov RCON pannel. Here you can run varouis basic commands, or issue custom commands (at the bottom of the page). To begin:<br><br>Selecting a checkbox ( <input type="checkbox"> ) on the left side of a players name selects them to run a batch command with at the bottom of the player list. These command buttons are: <button type="button" class="btn btn-success btn-smlr">Set Player Skin</button> <button type="button" class="btn btn-success btn-smlr">Kill</button> and <button type="button" class="btn btn-success btn-smlr">Give Item(s)</button>.<br><br>Clicking the <button type="button" class="btn btn-success btn-smlr">Refresh List</button> on the top right will get all the current players and their data (kills, cash, etc.) again, then re-create the play table.<br><br>You may also click on a players name to open a list of commands that will run for that player (Kill, Kick, Give 10k, Ban, etc.). If you need any help feel free to join the Discord server (which is under Useful Links).`)
        $('#fullModule').modal('show');
    })

    $('#subit').on('click', (event) => {
        let cmd = $('#customRun').val()
        $.post("/command", { cmd: cmd }, (res, status) => {
            inputLog(res)
        })
    })
})