function _(e) {
    return document.getElementById(e);
}

gogame = {
    _init: function() {
        console.log("inicializing...");
        gogame.resize();
        //document.addEventListener("resize", gogame.resize);
        $(window).resize(gogame.resize);
        gogame.resetboard();
        gogame.connection._init();
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
        console.log("resizing...");
        var sw = _("main").offsetWidth;
        var sh = _("main").offsetHeight;
        var br = _("board");
        
        if (sw > sh) {
            // szeles
            br.style.width = sh - 40;
            br.style.height = sh - 40;
            br.style.marginLeft = - (sh/2 - 20) + "px";
        } else {
            // magas
            br.style.width = sw - 40;
            br.style.height = sw - 40;
            br.style.marginLeft = - (sw/2 - 20) + "px";
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
        //alert(x + " " + y);
        var cell = _("cell-"+x+"-"+y);
        var celltype = gogame.getCell(x, y);
        
        if (celltype === "empty") {
            gogame.setCell(x, y, "white");
        } else {
            gogame.setCell(x, y, "empty");
        }
    },
    connection: {
        connectionType: "none",
        client: null,
        errorcount: 0,
        test: function() {
            if (!!window.EventSource) {
                return "EventSource";
            } else {
                return "xhr";
            }
        },
        _init: function() {
            if (gogame.connection.test() === "EventSource") {
                // eventsource
                gogame.connection.connectionType = "EventSource";
                gogame.connection.client = new EventSource("http://domain.host.csfcloud.com/learndb/stream.php");
                gogame.connection.client.addEventListener("open", gogame.connection.events.open);
                gogame.connection.client.addEventListener("error", gogame.connection.events.error);
                gogame.connection.client.addEventListener("message", gogame.connection.events.message);
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
            },
            error: function(e) {
                // connection closed
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
                    // valaki belepett
                }
                if (data.type === "step") {
                    gogame.setCell(data.cell.x, data.cell.y, data.cell.value);
                }
                if (data.type === "reset") {
                    gogame.resetboard();
                }
            }
        }
    }
};

//document.onload = gogame._init();
$(function() {
    gogame._init();
});