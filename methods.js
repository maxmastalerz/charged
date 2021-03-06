var generateRandomUsername = require('./generateRandomUsername.js');
var sanitizeHtml = require('sanitize-html');

function getSlice(arr, upper, lower) { return arr.slice(upper[0], lower[0]).map(function(row) { return row.slice(upper[1], lower[1]); }); }
function componentToHex(c) { var hex = c.toString(16); return hex.length == 1 ? "0" + hex : hex; }
function rgbToHex(r, g, b) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); }

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
	updateRoomLists: function(g) {
		var ns = g.io.of("/");
		var roomsCensored = [];
		for(var room in g.rooms) {
			roomsCensored.push({
				roomName: room,
				playerCount: g.rooms[room].playerCount,
				maxPlayers: g.rooms[room].maxPlayers
			});
		}

		g.io.sockets.emit('updateRooms', roomsCensored);
	},
	clientFromUsername: function(g, username) {
		var ns = g.io.of("/");
		var clientsInRoom = [];

		for (var id in ns.connected) {
			clientsInRoom.push(ns.connected[id]);
		}

		for(var client=0;client<clientsInRoom.length;client++) {
			if(clientsInRoom[client].username===username) {
				return clientsInRoom[client];
			}
		}
	},
	usernameAvailable: function(g, username) {
		var ns = g.io.of("/");
		for (var id in ns.connected) {
			if(username===ns.connected[id].username) {
				return false;
			}
		}
		return true;
	},
	roomAvailable: function(g, c) {
		for(var iteratedRoom in g.rooms) {
			if(g.room===iteratedRoom) {
				return false;
			}
		}
		return true;
	},
	updateMiniMapsInRoom: function(g, room) {
		var ns = g.io.of("/");
		for(var username in g.rooms[room].players) {
			var iteratedClient = module.exports.clientFromUsername(g, username);

			var x1, y1, x2, y2;

			if(iteratedClient.yPos<((g.rooms[room].mapVisibility/2)-0.5)) {
				y1 = 0;
			} else if(iteratedClient.yPos>(g.rooms[room].mapSize-(((g.rooms[room].mapVisibility/2)-0.5)))-1) {
				y1 = g.rooms[room].mapSize-g.rooms[room].mapVisibility;
			} else {
				y1 = iteratedClient.yPos-((g.rooms[room].mapVisibility/2)-0.5);
			}

			if(iteratedClient.xPos<((g.rooms[room].mapVisibility/2)-0.5)) {
				x1 = 0;
			} else if(iteratedClient.xPos>(g.rooms[room].mapSize-(((g.rooms[room].mapVisibility/2)-0.5)))-1) {
				x1 = g.rooms[room].mapSize-g.rooms[room].mapVisibility;
			} else {
				x1 = iteratedClient.xPos-((g.rooms[room].mapVisibility/2)-0.5);
			}

			y2 = y1+g.rooms[room].mapVisibility;
			x2 = x1+g.rooms[room].mapVisibility;

			iteratedClient.miniMap = getSlice(g.rooms[iteratedClient.room].map, [y1,x1],[y2,x2]);
			iteratedClient.emit('updateMap', iteratedClient.miniMap);
			iteratedClient.offsetX = x1;
			iteratedClient.offsetY = y1;
		}
	},
	spawn: function(g, c) {
		c.xPos = Math.floor((Math.random() * (g.rooms[c.room].mapSize-3)) + 2);
		c.yPos = Math.floor((Math.random() * (g.rooms[c.room].mapSize-3)) + 2);

		//Sort of smart spawning makes sure you don't end up ontop of an emeny/bomb/blocked in.
		if(g.rooms[c.room].map[c.yPos][c.xPos].type==='air' && g.rooms[c.room].map[c.yPos+1][c.xPos].type==='air' && g.rooms[c.room].map[c.yPos+1][c.xPos+1].type==='air') {
			c.entityUnderneath = null;
			g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: c.username, colour: c.colour, entityUnderneath: null };
			module.exports.updateMiniMapsInRoom(g, c.room);
		} else {
			module.exports.spawn(g, c);	//Might recurse forever if no spawn point is found. Lol
		}
	},
	updatePlayersListIn: function(g, room) {
		var playersInRoom = [];
		for(var player in g.rooms[room].players) {
			playersInRoom.push(player);
		}
		g.io.sockets.in(room).emit('updatePlayersList', playersInRoom);
	},
	generateUsername: function(g, c) {
		var generated;
		while(true) {
			generated = generateRandomUsername();
			if(module.exports.usernameAvailable(g, generated)) {
				return generated;
			}
		}
	},
	changeName: function(g, c, newName) {
		newName = sanitizeHtml(newName);		//Must sanitize before & after checking emptiness of newName
		if(newName!=='null' && newName!=='undefined' && newName!=='' && !(/^\s+$/.test(newName))) {
			newName = sanitizeHtml(newName.replace(/\s+/g,' ')).trim();
			if(module.exports.usernameAvailable(g, newName) && newName.length<=20) {
				var oldName = c.username;
				c.username = newName;
				c.emit('updateChat', 'SERVER', '#00FFFF', 'Username was changed to: '+newName);
				if(c.room!==undefined) {
					delete g.rooms[c.room].players[oldName];
					g.rooms[c.room].players[newName] = c.id;
					g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: newName, colour: c.colour };
					module.exports.updatePlayersListIn(g, c.room);
					module.exports.updateMiniMapsInRoom(g, c.room);
				}
			} else {
				c.emit('usernameCreateError', 'Username restrictions: \n   1. Username must be unique \n   2. Username must not surpass 20 chars \nPlease try again: ');
			}
		}
	},
	sanitizeInput: function(input) {
		return sanitizeHtml(input);
	},
	mapAsNumbers: function(map) {
		var mapAsNumbers = [];
		for(var y=0;y<map.length;y++) {
			for(var x=0;x<map.length;x++) {
				if(map[y][x].type==='air') {
					mapAsNumbers[y][x] = 1;
				} else {
					mapAsNumbers[y][x] = 0;
				}
			}
		}
		return mapAsNumbers;
	},
	getRandColour: function() {
		var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
		var mix = [5*51, 5*51, 5*51];
		var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x) { return Math.round(x/2.0); });
		return rgbToHex(mixedrgb[0], mixedrgb[1], mixedrgb[2]);
	}
};