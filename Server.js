var express 		= require('express'),						//Express module
	http 			= require('http'),							//Http module
	mongoose 		= require('mongoose'),						//Mongoose module
	env 			= process.env.NODE_ENV || 'development',	//Get NodeJS environment
	config 			= require('./mongoDBConfig.js')[ env ],		//MongoDB databases config
	socket 			= require('socket.io'),
	sanitizeHtml 	= require('sanitize-html'),
	generateName 	= require('sillyname');

//mongoose.connect(config.db);								//MONGODB connection
var app = module.exports = express();						//Create app
require('./express-settings.js')(app);						//Express settings
require('./express-routes.js')(app);						//Express routing

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port') + ' under ' + env + ' environment');
});

var rooms = {};

var io = socket.listen(server);

io.sockets.on('connection', function(client) {
	client.room = null;
	while(true) {
		var generated = generateName();
		if(usernameAvailable(generated)) {
			client.username = generated;
			break;
		}
	}
	client.emit('updateRooms', rooms, client.room);
	client.emit('updateChat', 'SERVER', '#00FFFF', 'Welcome '+client.username+'. Join a room to begin.');

	client.on('changeName', function(newName) {
		if(newName!==null && newName!=='' && !(/^\s+$/.test(newName))) {
			newName = sanitizeHtml(newName.replace(/\s+/g,' ')).trim();
			if(usernameAvailable(newName) && newName.length<=20) {
				var oldName = client.username;
				client.username = newName;
				client.emit('updateChat', 'SERVER', '#00FFFF', 'Username was changed to: '+newName);
				if(client.room!==null) {
					delete rooms[client.room].players[oldName];
					rooms[client.room].players[newName] = client.id;
					rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: newName, colour: client.colour };
					updatePlayersListIn(client.room);
					updateMiniMapsInYourRoom(client);
				}
			} else {
				client.emit('usernameCreateError', 'Username restrictions: \n   1. Username must be unique \n   2. Username must not surpass 20 chars \nPlease try again: ');
			}
		}
	});

	client.on('createRoom', function(room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword) {
		maxPlayers = parseInt(maxPlayers) || 6;
		mapSize = parseInt(mapSize) || 51;
		mapVisibility = parseInt(mapVisibility) || 31;
		if(mapVisibility>mapSize) {	mapVisibility = mapSize; }
		bombDelay = parseInt(bombDelay) || 1500;
		roomPassword = roomPassword || null;

		if(room!==null && room!=='' && !(/^\s+$/.test(room))) {
			room = sanitizeHtml(room.replace(/\s+/g,' ')).trim();
			if(roomAvailable(room) && room.length<=20) {
				rooms[room] = {
					players: {},
					playerCount: 0,
					maxPlayers: maxPlayers,
					mapSize: mapSize,
					mapVisibility: mapVisibility,
					bombDelay: bombDelay,
					roomPassword: roomPassword,
					map: Create2DArray(mapSize)
				};

				for(var y=0;y<rooms[room].mapSize;y++) {
					for(var x=0;x<rooms[room].mapSize;x++) {
						if(y===0 || y===rooms[room].mapSize-1 || x===0 || x===rooms[room].mapSize-1) {
							rooms[room].map[y][x] = '2';
						} else {
							rooms[room].map[y][x] = (Math.floor(Math.random()*2)+0).toString();	//'0' or '1' tile
						}
					}
				}
				joinRoom(client, room);
			} else {
				client.emit('roomCreateError', 'The room name must be unique, and must not surpass 20 chars');
			}
		} else {
			client.emit('roomCreateError', 'The room name cannot be blank');
		}
	});

	client.on('sendchat', function(data) {
		io.sockets.in(client.room).emit('updateChat', client.username, client.colour, data);
	});

	client.on('clearDebris', function() {
		updateMiniMapsInYourRoom(client);
	});

	client.on('move', function(deltaX, deltaY) { 					//Received action from a client.
		if(client.room!==null) {
			if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='0') {
				if(client.bombUnderneath===false) {
					rooms[client.room].map[client.yPos][client.xPos] = '0';
				} else {
					rooms[client.room].map[client.yPos][client.xPos] = '3';
				}
				client.xPos+=deltaX;
				client.yPos+=deltaY;
				client.bombUnderneath = false;
				rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
			}
			updateMiniMapsInYourRoom(client);
		}
	});

	client.on('placeBomb', function() {
		if(client.room!==null) {
			var bombY = client.yPos;
			var bombX = client.xPos;
			client.bombUnderneath = true;
			rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
			updateMiniMapsInYourRoom(client);


			setTimeout(function() {
				rooms[client.room].map[bombY][bombX] = '0';
				if(bombY!==2 && bombY!==1) {
					rooms[client.room].map[bombY-2][bombX] = '0';
				} if(bombY!==1) {
					rooms[client.room].map[bombY-1][bombX] = '0';
				} if(bombY!==rooms[client.room].mapSize-3 && bombY!==rooms[client.room].mapSize-2) {
					rooms[client.room].map[bombY+2][bombX] = '0';
				} if(bombY!==rooms[client.room].mapSize-2) {
					rooms[client.room].map[bombY+1][bombX] = '0';
				} if(bombX!==2 && bombX!==1) {
					rooms[client.room].map[bombY][bombX-2] = '0';
				} if(bombX!==1) {
					rooms[client.room].map[bombY][bombX-1] = '0';
				} if(bombX!==rooms[client.room].mapSize-3 && bombX!==rooms[client.room].mapSize-2) {
					rooms[client.room].map[bombY][bombX+2] = '0';
				} if(bombX!==rooms[client.room].mapSize-2) {
					rooms[client.room].map[bombY][bombX+1] = '0';
				}

				updateMiniMapsInYourRoom(client);

				for(var username in rooms[client.room].players) {
					var iteratedClient = clientFromUsername(username, client);
					iteratedClient.emit('explosionVisual', iteratedClient.miniMap, bombY-iteratedClient.offsetY, bombX-iteratedClient.offsetX);
					if(rooms[iteratedClient.room].map[iteratedClient.yPos][iteratedClient.xPos]=='0') { spawn(iteratedClient); }							//IF CLIENT WAS DESTROYED
				}
			}, rooms[client.room].bombDelay);
		}
	});

	client.on('switchRoom', function(newroom) {
		joinRoom(client, newroom);
	});

	client.on('disconnect', function() {
		if(client.room!==null) {
			leaveRoom(client);
		}
	});
 });

function updatePlayersListIn(room) {
	var playersInRoom = [];
	for(var player in rooms[room].players) {
		playersInRoom.push(player);
	}
	io.sockets.in(room).emit('updatePlayersList', playersInRoom);
}

function Create2DArray(rows) { var arr = []; for (var i=0;i<rows;i++) { arr[i] = []; } return arr; }

function leaveRoom(client) {
	client.broadcast.to(client.room).emit('updateChat', 'SERVER', '#00FFFF', client.username+' chose to leave');

	rooms[client.room].map[client.yPos][client.xPos] = '0';

	for(var player in rooms[client.room].players) {
		if(player==client.username) {
			delete rooms[client.room].players[player];
			updatePlayersListIn(client.room);
		}
	}

	updateMiniMapsInYourRoom(client);

	client.leave(client.room);
	rooms[client.room].playerCount = Object.keys(rooms[client.room].players).length;
	if(rooms[client.room].playerCount===0) {
		delete rooms[client.room];
	}
	client.room = null;
	updateRoomLists();
}

function joinRoom(client, newroom) {
	if(rooms[newroom].playerCount!=rooms[newroom].maxPlayers) {
		if(client.room!==null) {
			leaveRoom(client);
		}

		client.join(newroom);
		client.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + newroom+'\'');
		client.broadcast.to(newroom).emit('updateChat', 'SERVER', '#00FFFF', client.username + ' has joined this room');
		client.room = newroom;
		rooms[client.room].players[client.username] = client.id;
		updatePlayersListIn(client.room);
		rooms[newroom].playerCount = Object.keys(rooms[newroom].players).length;
		updateRoomLists();

		spawn(client);
	} else {
		client.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full rooms!');
	}
}

function spawn(client) {
	client.colour = getRandColour();
	client.xPos = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
	client.yPos = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
	client.bombUnderneath = false;
	rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: false };
	updateMiniMapsInYourRoom(client);
}

function updateMiniMapsInYourRoom(client) {
	function getSlice(arr, upper, lower) {
	    return arr.slice(upper[0], lower[0]).map(function(row) {
	       return row.slice(upper[1], lower[1]);
	    });
	}

	for(var username in rooms[client.room].players) {
		var iteratedClient = clientFromUsername(username, client);

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
}

function updateRoomLists() {
	var ns = io.of("/");
	for (var id in ns.connected) {
		if(id!==undefined) {
			var iteratedClient = ns.connected[id];
			iteratedClient.emit('updateRooms', rooms, iteratedClient.room);
		}
	}
}

function clientFromUsername(username, client) {
	var clientsInRoom = [client];
	var ns = io.of("/");

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
}

function usernameAvailable(username) {
	var ns = io.of("/");
	for (var id in ns.connected) {
		if(username===ns.connected[id].username) {
			return false;
		}
	}
	return true;
}

function roomAvailable(room) {
	for(var iteratedRoom in rooms) {
		if(room===iteratedRoom) {
			return false;
		}
	}
	return true;
}

function getRandColour(){ function componentToHex(c) { var hex = c.toString(16); return hex.length == 1 ? "0" + hex : hex; } function rgbToHex(r, g, b) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); } var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];var mix = [5*51, 5*51, 5*51]; var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x){ return Math.round(x/2.0);}); return rgbToHex(mixedrgb[0], mixedrgb[1], mixedrgb[2]); }
