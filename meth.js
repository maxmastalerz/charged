var sillyName = require('sillyname');
var sanitizeHtml = require('sanitize-html');
var leave = require('./leave.js');

function getSlice(arr, upper, lower) { return arr.slice(upper[0], lower[0]).map(function(row) { return row.slice(upper[1], lower[1]); }); }
function componentToHex(c) { var hex = c.toString(16); return hex.length == 1 ? "0" + hex : hex; }
function rgbToHex(r, g, b) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); }
function getRandColour() {
	var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
	var mix = [5*51, 5*51, 5*51];
	var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x) { return Math.round(x/2.0); });
	return rgbToHex(mixedrgb[0], mixedrgb[1], mixedrgb[2]);
}

module.exports = {
	Create2DArray: function(rows) {
		var arr = [];
		for(var i=0;i<rows;i++) {
			arr[i] = [];
		}
		return arr;
	},
	dist: function(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow((x2-x1),2) + Math.pow((y2-y1),2));
	},
	updateRoomLists: function(ns, rooms) {
		var roomsCensored = [];
		for(var room in rooms) {
			roomsCensored.push({
				roomName: room,
				playerCount: rooms[room].playerCount,
				maxPlayers: rooms[room].maxPlayers
			});
		}

		for (var id in ns.connected) {
			if(id!==undefined) {
				var iteratedClient = ns.connected[id];
				iteratedClient.emit('updateRooms', roomsCensored);
			}
		}
	},
	clientFromUsername: function(ns, username, cli) {
		var clientsInRoom = [cli];

		for (var id in ns.connected) {
			var index = ns.connected[id].rooms.indexOf(cli.room);
			if(index !== -1) {
				clientsInRoom.push(ns.connected[id]);
			}
		}

		for(var c=0;c<clientsInRoom.length;c++) {
			if(clientsInRoom[c].username===username) {
				return clientsInRoom[c];
			}
		}
	},
	usernameAvailable: function(ns, username) {
		for (var id in ns.connected) {
			if(username===ns.connected[id].username) {
				return false;
			}
		}
		return true;
	},
	roomAvailable: function(rooms, room) {
		for(var iteratedRoom in rooms) {
			if(room===iteratedRoom) {
				return false;
			}
		}
		return true;
	},
	updateMiniMapsInYourRoom: function(ns, rooms, cli) {
		for(var username in rooms[cli.room].players) {
			var iteratedClient = module.exports.clientFromUsername(ns, username, cli);

			var x1, y1, x2, y2;

			if(iteratedClient.yPos<((rooms[cli.room].mapVisibility/2)-0.5)) {
				y1 = 0;
			} else if(iteratedClient.yPos>(rooms[cli.room].mapSize-(((rooms[cli.room].mapVisibility/2)-0.5)))-1) {
				y1 = rooms[cli.room].mapSize-rooms[cli.room].mapVisibility;
			} else {
				y1 = iteratedClient.yPos-((rooms[cli.room].mapVisibility/2)-0.5);
			}

			if(iteratedClient.xPos<((rooms[cli.room].mapVisibility/2)-0.5)) {
				x1 = 0;
			} else if(iteratedClient.xPos>(rooms[cli.room].mapSize-(((rooms[cli.room].mapVisibility/2)-0.5)))-1) {
				x1 = rooms[cli.room].mapSize-rooms[cli.room].mapVisibility;
			} else {
				x1 = iteratedClient.xPos-((rooms[cli.room].mapVisibility/2)-0.5);
			}

			y2 = y1+rooms[cli.room].mapVisibility;
			x2 = x1+rooms[cli.room].mapVisibility;

			iteratedClient.miniMap = getSlice(rooms[iteratedClient.room].map, [y1,x1],[y2,x2]);
			iteratedClient.emit('updateMap', iteratedClient.miniMap);
			iteratedClient.offsetX = x1;
			iteratedClient.offsetY = y1;
		}
	},
	spawn: function(ns, rooms, cli) {
		if(rooms[cli.room].gameMode==='ffa') { cli.colour = getRandColour(); }
		cli.emit('updateColour', cli.colour);
		cli.xPos = Math.floor((Math.random() * (rooms[cli.room].mapSize-3)) + 2);
		cli.yPos = Math.floor((Math.random() * (rooms[cli.room].mapSize-3)) + 2);

		//Sort of smart spawning makes sure you don't end up ontop of an emeny/bomb/blocked in.
		if(rooms[cli.room].map[cli.yPos][cli.xPos].type==='air' && rooms[cli.room].map[cli.yPos+1][cli.xPos].type==='air' && rooms[cli.room].map[cli.yPos+1][cli.xPos+1].type==='air') {
			cli.entityUnderneath = null;
			rooms[cli.room].map[cli.yPos][cli.xPos] = { type: 'player', id: cli.id, username: cli.username, colour: cli.colour, entityUnderneath: null };
			module.exports.updateMiniMapsInYourRoom(ns, rooms, cli);
		} else {
			module.exports.spawn(ns,rooms, cli);	//Might recurse forever if no spawn point is found. Lol
		}
	},
	updatePlayersListIn: function(io, rooms, room) {
		var playersInRoom = [];
		for(var player in rooms[room].players) {
			playersInRoom.push(player);
		}
		io.sockets.in(room).emit('updatePlayersList', playersInRoom);
	},
	generateUsername: function(io, cli) {
		var generated;
		while(true) {
			generated = sillyName();
			if(module.exports.usernameAvailable(io.of("/"), generated)) {
				return generated;
			}
		}
	},
	changeName: function(io, cli, rooms, newName) {
		newName = sanitizeHtml(newName);		//Must sanitize before & after checking emptiness of newName
		if(newName!=='null' && newName!=='undefined' && newName!=='' && !(/^\s+$/.test(newName))) {
			newName = sanitizeHtml(newName.replace(/\s+/g,' ')).trim();
			if(module.exports.usernameAvailable(io.of("/"), newName) && newName.length<=20) {
				var oldName = cli.username;
				cli.username = newName;
				cli.emit('updateChat', 'SERVER', '#00FFFF', 'Username was changed to: '+newName);
				if(cli.room!==null) {
					delete rooms[cli.room].players[oldName];
					rooms[cli.room].players[newName] = cli.id;
					rooms[cli.room].map[cli.yPos][cli.xPos] = { type: 'player', id: cli.id, username: newName, colour: cli.colour };
					module.exports.updatePlayersListIn(io, rooms, cli.room);
					module.exports.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
				}
			} else {
				cli.emit('usernameCreateError', 'Username restrictions: \n   1. Username must be unique \n   2. Username must not surpass 20 chars \nPlease try again: ');
			}
		}
	},
	sanitizeInput: function(input) {
		return sanitizeHtml(input);
	}
};