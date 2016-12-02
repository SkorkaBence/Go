function _(e) {
    return document.getElementById(e);
}

gogame = {
    _init: function() {
        console.log("inicializing...");
        $('#joinbox').hide();
        $('#connectingtext').hide();
        gogame.resize();
        //document.addEventListener("resize", gogame.resize);
        $(window).resize(gogame.resize);
        gogame.resetboard();
        gogame.player.generateNewId();
    },
    resetboard: function() {
        var br = _("board");
        br.innerHTML = "";
        for (var y = 0; y < 19; y++) {
            var row = document.createElement("div");
            row.className = "row";
            row.id = "row-"+y;
            br.appendChild(row);
            for (var x = 0; x < 19; x++) {
                var cell = document.createElement("div");
                cell.className = "cell";
                cell.id = "cell-"+x+"-"+y;
                cell.setAttribute("onclick", "gogame.clickCell(this, "+x+","+y+")");
                row.appendChild(cell);
                
                gogame.setCell(x, y, "empty");
            }
        }
    },
    resize: function() {
        var sw = _("main").offsetWidth;
        var sh = _("main").offsetHeight;
        var br = _("board");
        
        if (sw > sh) {
            // szeles
            br.style.width = sh - 40;
            br.style.height = sh - 40;
            br.style.marginLeft = - (sh/2 - 20) + "px";
            br.style.marginTop = - (br.offsetHeight / 2) + "px";
        } else {
            // magas
            br.style.width = sw - 40;
            br.style.height = sw - 40;
            br.style.marginLeft = - (sw/2 - 20) + "px";
            br.style.marginTop = - (br.offsetHeight / 2) + "px";
        }
    },
    getCell: function(x, y) {
        var cell = _("cell-"+x+"-"+y);
        var c = cell.getAttribute("go-value");
        if (c === "empty" || c === "white" || c === "black") {
            return c;
        }
        console.error("Wrong cell value");
    },
    setCell: function(x, y, c) {
        var cell = _("cell-"+x+"-"+y);
        cell.innerHTML = "";
        if (c === "empty") {
            cell.setAttribute("go-value", "empty");
        } else if (c === "white") {
            var w = document.createElement("div");
            w.className = "piece white";
            cell.appendChild(w);
            cell.setAttribute("go-value", "white");
        } else if (c === "black") {
            var w = document.createElement("div");
            w.className = "piece black";
            cell.appendChild(w);
            cell.setAttribute("go-value", "black");
        } else {
            console.error("Wrong cell value: " + c);
            return;
        }
    },
    clickCell: function(o, x, y) {
        if (!gogame.game.isPlaying) {
            return;
        }
        if (gogame.player.color === "empty") {
            return;
        }
        if (gogame.player.color === gogame.game.currentColor) {
            gogame.connection.sender.step(x, x, gogame.player.color);
        }
    },
    connection: {
        connectionType: "none",
        client: null,
        errorcount: 0,
        isOpen: false,
        test: function() {
            if (!!window.EventSource) { // TODO: Use SSE instead of EentSource, for two-way socket communication
                return "EventSource";
            } else {
                return "xhr";
            }
        },
        _init: function() {
            console.log("Connection init...");
            if (gogame.game.gameId === "none") {
                console.error("Nem indult meg jatek!");
                return;
            }
            if (gogame.connection.test() === "EventSource") {
                // eventsource
                gogame.connection.connectionType = "EventSource";
                gogame.connection.client = new EventSource("http://domain.host.csfcloud.com/learndb/stream.php?gameid=" + gogame.game.gameId + "&playerid=" + gogame.player.player_id + "&playersecret=" + gogame.player.player_secret);
                gogame.connection.client.addEventListener("open", gogame.connection.events.open);
                gogame.connection.client.addEventListener("error", gogame.connection.events.error);
                gogame.connection.client.addEventListener("message", gogame.connection.events.message);
                $('#connectingtext').show();
            } else if (gogame.connection.test() === "xhr") {
                // xhr
                gogame.connection.connectionType = "xhr";
                alert("xhr");
            }
        },
        events: {
            open: function(e) {
                // connection opened
                console.log("Connection opened!");
                gogame.connection.errorcount = 0;
                gogame.connection.isOpen = true;
                $('#connectingtext').hide();
            },
            error: function(e) {
                // connection closed
                gogame.connection.isOpen = false;
                if (e.readyState !== EventSource.CLOSED) {
                    gogame.connection.errorcount++;
                    console.error("Connection error");
                    if (gogame.connection.errorcount < 5) {
                        setTimeout(gogame.connection._init, 1000);
                    } else {
                        alert("Nem sikerult megnyitni a kapcsolatot!");
                    }
                }
            },
            message: function(e) {
                // message recieved
                var data = JSON.parse(e.data);
                if (data.type === undefined) {
                    console.error("Wrong data: " + JSON.stringify(data));
                    return;
                }
                if (data.type === "join") {
                    // new player joined
                    gogame.game.players.append(data.playerid);
                } else if (data.type === "step") {
                    gogame.setCell(data.cell.x, data.cell.y, data.cell.value);
                    gogame.game.currentColor = data.next;
                } else if (data.type === "reset") {
                    gogame.resetboard();
                }
            }
        },
        sender: {
            step: function(x, y, v) {
                if (!gogame.game.isPlaying) {
                    return;
                }
                if (!gogame.connection.isOpen) {
                    alert("Nincs kapcsolat a játékszerverrel! Kérlek várj az újrakapcsolódásra!");
                    return;
                }
                
                var data = gogame.connection.sender.buildQuery({
                    type: "step",
                    cell: {
                        x: x,
                        y: y,
                        value: v
                    }
                });
            },
            reset: function() {
                if (!gogame.game.isPlaying) {
                    return;
                }
                if (!gogame.connection.isOpen) {
                    alert("Nincs kapcsolat a játékszerverrel! Kérlek várj az újrakapcsolódásra!");
                    return;
                }
            },
            buildQuery: function(data) {
                data["playerid"] = gogame.player.player_id;
                data["playersecret"] = gogame.player.player_secret;
            }
        }
    },
    player: {
        color: "none",
        player_id: "none",
        player_secret: "none",
        generateNewId: function() {
            gogame.player.player_id = gogame.randomId(32);
            gogame.player.player_secret = gogame.randomId(64);
        }
    },
    game: {
        isPlaying: false,
        currentColor: "none",
        gameId: "none",
        players: [],
        startNew: function() {
            gogame.resetboard();
            gogame.game.isPlaying = true;
            gogame.game.gameId = gogame.randomId(64);
            $("#optscreen").hide();
            gogame.connection._init();
        },
        joinGame: function(gameid) {
            gogame.resetboard();
            gogame.game.isPlaying = true;
            gogame.game.gameId = gameid;
            $("#optscreen").hide();
            gogame.connection._init();
        }
    },
    randomId: function(l) {
        var arr = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var res = "";
        for (var i = 0; i < l; i++){
            var r = Math.floor(Math.random() * arr.length);
            res += arr[r];
        }
        return res;
    }
};

//document.onload = gogame._init();
$(function() {
    gogame._init();
});