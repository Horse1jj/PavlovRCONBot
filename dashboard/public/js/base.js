$(document).ready(() => {
    function getPlayer(id) {
        return new Promise((resolve, rej) => {
            $.post("/command", { cmd: `InspectPlayer ${id}` }, (res, status) => {
                res = res.res.PlayerInfo
                res.Kills = res.KDA.split("/")[0]
                res.Deaths = res.KDA.split("/")[1]
                res.Assists = res.KDA.split("/")[2]
                resolve(res)
            })
        })
    }

    function inputLog(res) {
        let data = JSON.stringify(res.res)
        let outPutElmt = $('#outputText')
        outPutElmt.animate({ scrollTop: $('#outputText')[0].scrollHeight }, 500)
        outPutElmt.append("\n--> " + res.cmd + "\n" + data)
    }

    var currentCmd = '';
    var players = [];

    $.post("/command", { cmd: "RefreshList" }, async (res, status) => {
        if (!res.passed) return console.log(res.res)
        let data = res.res.PlayerList;
        if (data.length == 0) return alert("No players are online!")
        let html = ''
        players = []
        for (var i = 0; i < data.length + 1; i++) {
            if (i == data.length) {
                players.sort((a, b) => parseInt(a.TeamId) - parseInt(b.TeamId))
                players.forEach(player => {
                    html = html + `<tr id="${player.UniqueId}" class="${player.TeamId == 0 ? "table-danger" : "table-info"}"><td scope="row">${player.PlayerName}</td><td>${player.Kills}</td><td>${player.Deaths}</td><td>${player.Cash}</td></tr>`
                })
                $('#playerTableBody').html(html)
            } else {
                let player = await getPlayer(data[i].UniqueId)
                players.push(player)
            }
        }
    })

    $(document).on('click', "tr", async (event) => {
        let target = $(event.currentTarget)
        let player = await getPlayer(target.prop('id'))
        $('#modulePlayerName').html(player.PlayerName)
        $('#playerModuleBody').html(`<button type="button" class="btn btn-info playerModuleCommand" style="width:100%;margin-bottom:10px;" value="GiveCash ${player.UniqueId} 10000" playerID="${player.UniqueId}">Give 10k Cash</button><br><button type="button" class="btn btn-warning playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Kick ${player.UniqueId}" playerID="${player.UniqueId}">Kick Player</button><br><button type="button" class="btn btn-danger playerModuleCommand" style="width:100%;margin-bottom:10px;" value="Ban ${player.UniqueId}" playerID="${player.UniqueId}">Ban Player</button>`)
    	$('#playerModule').modal('show');
    })
    $(document).on('click', ".playerModuleCommand", async (event) => {
        let target = $(event.currentTarget)
        let command = target.prop('value')
        $('#playerModule').modal('hide');
        $.post("/command", { cmd: command }, (res, status) => {
        	inputLog(res)
        })
    })

    $('#runBasicCmd').on('click', (event) => {
    	console.log(currentCmd)
        switch (currentCmd) {
            case "GiveItem":
                {
                    let item = $('#itemSelect').val()
                    console.log(item)
                    let player = $('#playerSelect').val()
                    player = $(`option:contains("${player}")`)[0]
                    $.post("/queue-command", { cmd: "GiveItem", user: $(player).prop('value'), items: item }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "Kill":
                {
                    let player = $('#playerSelect').val()
                    player = $(`option:contains("${player}")`)[0]
                    $.post("/command", { cmd: `Kill ${$(player).prop('value')}` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "Kick":
                {
                    let player = $('#playerSelect').val()
                    player = $(`option:contains("${player}")`)[0]
                    $.post("/command", { cmd: `Kick ${$(player).prop('value')}` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "RotateMap":
                {
                    $.post("/command", { cmd: `RotateMap` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "GiveCash":
                {
                    let player = $('#playerSelect').val()
                    player = $(`option:contains("${player}")`)[0]
                    let cash = $('#cashAdd').val()
                    $.post("/command", { cmd: `SetCash ${$(player).prop('value')} ${parseInt(cash)}` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "ResetSND":
                {
                    $.post("/command", { cmd: `ResetSND` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
            case "SetPlayerSkin":
                {
                    let player = $('#playerSelect').val()
                    player = $(`option:contains("${player}")`)[0]
                    let skin = $('#skinList').val()[0]
                    $.post("/command", { cmd: `SetPlayerSkin ${$(player).prop('value')} ${skin}` }, (res, status) => {
                        inputLog(res)
                    })
                    break;
                }
        }
    })

    $("input[type='radio']").on('click', async (event) => {
        let target = $(event.currentTarget);
        currentCmd = target.prop('value')
        switch (currentCmd) {
            case "GiveItem":
                {
                    $.post("/command", { cmd: "ItemList" }, (res, status) => {
                        let validItems = res.res.ItemList;
                        let html = ''
                        validItems.forEach(i => html = html + `<option value="${i}">${i}</option>`)
                        $('#secondParam').html(`<legend class="cmds-lgn">Item List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="itemSelect">${html}</select>`)

                        html = ''
                        players.forEach(p => html = html + `<option value="${p.UniqueId}">${p.PlayerName}</option>`)
                        $('#thirdParam').html(`<legend class="cmds-lgn">Player List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="playerSelect">${html}</select>`)
                    })
                    break;
                }
            case "Kill":
                {
                    let html = ''
                    players.forEach(p => html = html + `<option value="${p.UniqueId}">${p.PlayerName}</option>`)
                    $('#secondParam').html(`<legend class="cmds-lgn">Player List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="playerSelect">${html}</select>`)
                    $('#thirdParam').html('')
                	break;
                }
            case "Kick":
                {
                    let html = ''
                    players.forEach(p => html = html + `<option value="${p.UniqueId}">${p.PlayerName}</option>`)
                    $('#secondParam').html(`<legend class="cmds-lgn">Player List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="playerSelect">${html}</select>`)
                	$('#thirdParam').html('')
                	break;
                }
            case "GiveCash":
                {
                    let html = ''
                    players.forEach(p => html = html + `<option value="${p.UniqueId}">${p.PlayerName}</option>`)
                    $('#secondParam').html(`<legend class="cmds-lgn">Player List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="playerSelect">${html}</select>`)
                    html = ''
                    $('#thirdParam').html(`<legend class="cmds-lgn">Cash Amount</legend><textarea type="text" id="cashAdd" rows="1" class="form-control">  `)
                	break;
                }
            case "SetPlayerSkin":
                {
                    let html = ''
                    players.forEach(p => html = html + `<option value="${p.UniqueId}">${p.PlayerName}</option>`)
                    $('#secondParam').html(`<legend class="cmds-lgn">Player List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="playerSelect">${html}</select>`)
                    $('#thirdParam').html(`<legend class="cmds-lgn">Skin List</legend><select multiple="" size="7" class="form-select" style="width:100%;height:100%;" id="skinList"><option>clown</option><option>prisoner</option><option>naked</option><option>farmer</option><option>russian</option><option>nato</option><option>german</option><option>us</option><option>soviet</option></select>`)
                	break;
                }
            case "ResetSND":
                {
                    $('#secondParam').html(``)
                    $('#thirdParam').html(``)
                	break;
                }
            case "RotateMap":
                {
                	$('#secondParam').html(``)
                    $('#thirdParam').html(``)
                	break;
                }
        }
    })

    $('#subit').on('click', (event) => {
        let cmd = $('#customRun').val()
        $.post("/command", { cmd: cmd }, (res, status) => {
            inputLog(res)
        })
    })
})