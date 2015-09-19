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
	clientFromUsername: function(ns, username, client) {
		var clientsInRoom = [client];

		for (var id in ns.connected) {
			var index = ns.connected[id].rooms.indexOf(client.room);
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
	updateMiniMapsInYourRoom: function(ns, rooms, client) {
		for(var username in rooms[client.room].players) {
			var iteratedClient = module.exports.clientFromUsername(ns, username, client);

			var x1, y1, x2, y2;

			if(iteratedClient.yPos<((rooms[client.room].mapVisibility/2)-0.5)) {
				y1 = 0;
			} else if(iteratedClient.yPos>(rooms[client.room].mapSize-(((rooms[client.room].mapVisibility/2)-0.5)))-1) {
				y1 = rooms[client.room].mapSize-rooms[client.room].mapVisibility;
			} else {
				y1 = iteratedClient.yPos-((rooms[client.room].mapVisibility/2)-0.5);
			}

			if(iteratedClient.xPos<((rooms[client.room].mapVisibility/2)-0.5)) {
				x1 = 0;
			} else if(iteratedClient.xPos>(rooms[client.room].mapSize-(((rooms[client.room].mapVisibility/2)-0.5)))-1) {
				x1 = rooms[client.room].mapSize-rooms[client.room].mapVisibility;
			} else {
				x1 = iteratedClient.xPos-((rooms[client.room].mapVisibility/2)-0.5);
			}

			y2 = y1+rooms[client.room].mapVisibility;
			x2 = x1+rooms[client.room].mapVisibility;

			iteratedClient.miniMap = getSlice(rooms[iteratedClient.room].map, [y1,x1],[y2,x2]);
			iteratedClient.emit('updateMap', iteratedClient.miniMap);
			iteratedClient.offsetX = x1;
			iteratedClient.offsetY = y1;
		}
	},
	spawn: function(ns, rooms, client) {
		client.colour = getRandColour();
		client.xPos = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
		client.yPos = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);

		//Sort of smart spawning makes sure you don't end up ontop of an emeny/bomb/blocked in.
		if(rooms[client.room].map[client.yPos][client.xPos]==='0' && rooms[client.room].map[client.yPos+1][client.xPos]==='0' && rooms[client.room].map[client.yPos+1][client.xPos+1]==='0') {
			client.bombUnderneath = false;
			rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: false };
			module.exports.updateMiniMapsInYourRoom(ns, rooms, client);
		} else {
			module.exports.spawn(ns,rooms, client);	//Might recurse forever if no spawn point is found. Lol
		}
	},
	updatePlayersListIn: function(io, rooms, room) {
		var playersInRoom = [];
		for(var player in rooms[room].players) {
			playersInRoom.push(player);
		}
		io.sockets.in(room).emit('updatePlayersList', playersInRoom);
	},
	joinRoom: function(io, rooms, client, newroom) {
		function connectToRoom() {
			if(client.room!==null) {
				module.exports.leaveRoom(io, rooms, client);
			}

			client.join(newroom);
			client.emit('joinedRoom');
			client.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + newroom+'\'');
			client.broadcast.to(newroom).emit('updateChat', 'SERVER', '#00FFFF', client.username + ' has joined this room');
			client.room = newroom;
			rooms[client.room].players[client.username] = client.id;
			module.exports.updatePlayersListIn(io, rooms, client.room);
			rooms[newroom].playerCount = Object.keys(rooms[newroom].players).length;
			module.exports.updateRoomLists(io.of("/"), rooms);

			client.bombs = 7;
			client.lives = 3;
			client.emit('updateLives', client.lives);
			client.emit('updateBombs', client.bombs);
			module.exports.spawn(io.of("/"), rooms, client);
		}

		if(rooms[newroom].playerCount!=rooms[newroom].maxPlayers) {
			if(rooms[newroom].roomPassword!==null) {
				client.emit('roomProtected', newroom);
				client.on('checkRoomPassword', function(room, passwordInput) {
					if(rooms[room].roomPassword===passwordInput) {
						connectToRoom();
					} else if(passwordInput!==null) {
						client.emit('roomProtected', newroom);
					}
				});
			} else {
				connectToRoom();
			}
		} else {
			client.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full rooms!');
		}
	},
	leaveRoom: function(io, rooms, client) {
		client.broadcast.to(client.room).emit('updateChat', 'SERVER', '#00FFFF', client.username+' chose to leave');

		rooms[client.room].map[client.yPos][client.xPos] = '0';

		for(var player in rooms[client.room].players) {
			if(player==client.username) {
				delete rooms[client.room].players[player];
				module.exports.updatePlayersListIn(io, rooms, client.room);
			}
		}

		module.exports.updateMiniMapsInYourRoom(io.of("/"), rooms, client);

		client.leave(client.room);
		client.emit('leftRoom');
		rooms[client.room].playerCount = Object.keys(rooms[client.room].players).length;
		if(rooms[client.room].playerCount===0) {
			delete rooms[client.room];
		}
		client.room = null;
		module.exports.updateRoomLists(io.of("/"), rooms);
	}
};