var express 		= require('express'),
	http 			= require('http'),
	mongoose 		= require('mongoose'),
	socket 			= require('socket.io'),
	sanitizeHtml 	= require('sanitize-html'),
	generateName 	= require('sillyname');

var app = module.exports = express();
var config = require('./config.js')(app);
var meth = require('./meth.js');
require('./express-routes.js')(app);

if(config.connectToMongoDB) {
	mongoose.connect(config.db);
	console.log('Connected to '+config.db);
}

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server @ '+ config.host+ ':' + app.get('port') + '/ under ' + app.get('env') + ' environment');
});

var rooms = {};

var io = socket.listen(server);

io.sockets.on('connection', function(client) {
	client.room = null;
	while(true) {
		var generated = generateName();
		if(meth.usernameAvailable(io.of("/"), generated)) {
			client.username = generated;
			break;
		}
	}
	client.emit('updateRooms', rooms);

	client.on('changeName', function(newName) {
		newName = sanitizeHtml(newName);		//Must sanitize before & after checking emptiness of newName
		if(newName!=='null' && newName!=='undefined' && newName!=='' && !(/^\s+$/.test(newName))) {
			newName = sanitizeHtml(newName.replace(/\s+/g,' ')).trim();
			if(meth.usernameAvailable(io.of("/"), newName) && newName.length<=20) {
				var oldName = client.username;
				client.username = newName;
				client.emit('updateChat', 'SERVER', '#00FFFF', 'Username was changed to: '+newName);
				if(client.room!==null) {
					delete rooms[client.room].players[oldName];
					rooms[client.room].players[newName] = client.id;
					rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: newName, colour: client.colour };
					meth.updatePlayersListIn(io, rooms, client.room);
					meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
				}
			} else {
				client.emit('usernameCreateError', 'Username restrictions: \n   1. Username must be unique \n   2. Username must not surpass 20 chars \nPlease try again: ');
			}
		}
	});

	client.on('createRoom', function(room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword) {
		room = sanitizeHtml(room);
		if(roomPassword!==undefined) { roomPassword = sanitizeHtml(roomPassword); }
		roomPassword = roomPassword || null;
		maxPlayers = parseInt(maxPlayers) || 6;
		mapSize = parseInt(mapSize) || 51;
		mapVisibility = parseInt(mapVisibility) || 31;
		if(mapVisibility>mapSize) {	mapVisibility = mapSize; }
		bombDelay = parseInt(bombDelay) || 1500;

		if(room!=='null' && room!=='[object Object]' && room!=='undefined' && room!=='' && !(/^\s+$/.test(room))) {
			room = sanitizeHtml(room.replace(/\s+/g,' ')).trim();
			if(meth.roomAvailable(rooms, room) && room.length<=20) {
				if(maxPlayers>=2 && maxPlayers<=6 && mapSize<=70 && mapSize>=10 && mapVisibility>=5 && mapVisibility<=35 && bombDelay>=500 && bombDelay<=3000) {
					rooms[room] = {
						players: {},
						playerCount: 0,
						maxPlayers: maxPlayers,
						mapSize: mapSize,
						mapVisibility: mapVisibility,
						bombDelay: bombDelay,
						roomPassword: roomPassword,
						map: meth.Create2DArray(mapSize)
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
					meth.joinRoom(io, rooms, client, room);
				} else {
					client.emit('roomCreateError', 'Some room variables were not within the correct limits.');
				}
			} else {
				client.emit('roomCreateError', 'The room name must be unique, and must not surpass 20 chars');
			}
		} else {
			client.emit('roomCreateError', 'The room name cannot be blank');
		}
	});

	client.on('sendchat', function(message) {
		message = sanitizeHtml(message.replace(/\s+/g,' ')).trim();
		if(message!==null && message!=='' && !(/^\s+$/.test(message))) {
			io.sockets.in(client.room).emit('updateChat', client.username, client.colour, message);
		}
	});

	client.on('clearDebris', function() {
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
	});

	client.on('move', function(deltaX, deltaY) { 					//Received action from a client.
		if(client.room!==null) {
			if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='0' || rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='4') {
				if(client.bombUnderneath===false) {
					rooms[client.room].map[client.yPos][client.xPos] = '0';
				} else {
					rooms[client.room].map[client.yPos][client.xPos] = '3';
				}
				client.bombUnderneath = false;

				if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='4') {
					client.bombs++;
					client.emit('updateBombs', client.bombs);
				}

				client.xPos+=deltaX;
				client.yPos+=deltaY;

				rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
			}
			meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
		}
	});

	client.on('placeBomb', function() {
		function spawnPickup() {
			var x, y;
			while(true) {
				x = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
				y = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
				if(rooms[client.room].map[y][x]==='0') {
					break;
				}
			}
			rooms[client.room].map[y][x] = '4';
		}
		function respawnBlock(bombY,bombX) {
			setTimeout(function() {
				if(client.room!==null) {
					var dontSpawnYet;
					for(var username in rooms[client.room].players) {
						var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
						if(meth.dist(iteratedClient.xPos,iteratedClient.yPos,bombX,bombY)<5) {
							dontSpawnYet=true;	//delay the block respawn if any iteratedClient is closer than 5 blocks from the spawnpoint.
						}
					}

					if(dontSpawnYet) {
						respawnBlock(bombY,bombX);
					} else if(rooms[client.room].map[bombY][bombX]==='0') {
						rooms[client.room].map[bombY][bombX] = '1';
						meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
					}
				}
			}, 15000);	//delay between trying to respawn the block that was blown up
		}

		if(client.room!==null) {
			if(!client.bombUnderneath && client.bombs>0) {
				var bombY = client.yPos;
				var bombX = client.xPos;
				client.bombUnderneath = true;
				client.bombs--;
				client.emit('updateBombs', client.bombs);
				rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);


				setTimeout(function() {
					rooms[client.room].map[bombY][bombX] = '0';
					if(bombY!==2 && bombY!==1 && rooms[client.room].map[bombY-2][bombX]!=='0' && rooms[client.room].map[bombY-2][bombX]!=='4') {
						rooms[client.room].map[bombY-2][bombX] = '0';
						respawnBlock(bombY-2,bombX);
					} if(bombY!==1 && rooms[client.room].map[bombY-1][bombX]!=='0' && rooms[client.room].map[bombY-1][bombX]!=='4') {
						rooms[client.room].map[bombY-1][bombX] = '0';
						respawnBlock(bombY-1,bombX);
					} if(bombY!==rooms[client.room].mapSize-3 && bombY!==rooms[client.room].mapSize-2 && rooms[client.room].map[bombY+2][bombX]!=='0' && rooms[client.room].map[bombY+2][bombX]!=='4') {
						rooms[client.room].map[bombY+2][bombX] = '0';
						respawnBlock(bombY+2,bombX);
					} if(bombY!==rooms[client.room].mapSize-2 && rooms[client.room].map[bombY+1][bombX]!=='0' && rooms[client.room].map[bombY+1][bombX]!=='4') {
						rooms[client.room].map[bombY+1][bombX] = '0';
						respawnBlock(bombY+1,bombX);
					} if(bombX!==2 && bombX!==1 && rooms[client.room].map[bombY][bombX-2]!=='0' && rooms[client.room].map[bombY][bombX-2]!=='4') {
						rooms[client.room].map[bombY][bombX-2] = '0';
						respawnBlock(bombY,bombX-2);
					} if(bombX!==1 && rooms[client.room].map[bombY][bombX-1]!=='0' && rooms[client.room].map[bombY][bombX-1]!=='4') {
						rooms[client.room].map[bombY][bombX-1] = '0';
						respawnBlock(bombY,bombX-1);
					} if(bombX!==rooms[client.room].mapSize-3 && bombX!==rooms[client.room].mapSize-2 && rooms[client.room].map[bombY][bombX+2]!=='0' && rooms[client.room].map[bombY][bombX+2]!=='4') {
						rooms[client.room].map[bombY][bombX+2] = '0';
						respawnBlock(bombY,bombX+2);
					} if(bombX!==rooms[client.room].mapSize-2 && rooms[client.room].map[bombY][bombX+1]!=='0' && rooms[client.room].map[bombY][bombX+1]!=='4') {
						rooms[client.room].map[bombY][bombX+1] = '0';
						respawnBlock(bombY,bombX+1);
					}

					spawnPickup();
					meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);

					for(var username in rooms[client.room].players) {
						var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
						iteratedClient.emit('explosionVisual', iteratedClient.miniMap, bombY-iteratedClient.offsetY, bombX-iteratedClient.offsetX);
						if(rooms[iteratedClient.room].map[iteratedClient.yPos][iteratedClient.xPos]=='0') {	//IF CLIENT WAS DESTROYED
							client.lives--;
							client.emit('updateLives', client.lives);
							if(client.lives===0) {
								//meth.joinRoom(io, rooms, client, client.room);	//Reconnect to room after death
								/*
								YOU LEFT OFF HERE! The player should respawn when they die in the same room. This is an issue though, because leaving the room deletes it, therefore making you unable to reconnect.
								You should try to respawn the player with cleared/reset stats(Without reconnect).
								*/
							}
							meth.spawn(io.of("/"), rooms, iteratedClient);
						}
					}
				}, rooms[client.room].bombDelay);
			}
		}
	});

	client.on('switchRoom', function(newroom) {
		meth.joinRoom(io, rooms, client, newroom);
	});

	client.on('disconnect', function() {
		if(client.room!==null) {
			meth.leaveRoom(io, rooms, client);
		}
	});
 });