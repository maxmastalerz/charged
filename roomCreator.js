var meth = require('./meth.js');
var join = require('./join.js');

module.exports = function(io, client, rooms, room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword) {
	room = meth.sanitizeInput(room);
	if(roomPassword!==undefined) { roomPassword = meth.sanitizeInput(roomPassword); }
	roomPassword = roomPassword || null;
	maxPlayers = parseInt(maxPlayers) || 6;
	mapSize = parseInt(mapSize) || 51;
	mapVisibility = parseInt(mapVisibility) || 31;
	if(mapVisibility>mapSize) {	mapVisibility = mapSize; }
	bombDelay = parseInt(bombDelay) || 1500;

	if(room!=='null' && room!=='[object Object]' && room!=='undefined' && room!=='' && !(/^\s+$/.test(room))) {
		room = meth.sanitizeInput(room.replace(/\s+/g,' ')).trim();
		if(meth.roomAvailable(rooms, room) && room.length<=15) {
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
				join(io, client, rooms, room);
			} else {
				client.emit('errorMessage', 'Some room variables were not within the correct limits.');
			}
		} else {
			client.emit('errorMessage', 'The room name must be unique, and must not surpass 15 chars');
		}
	} else {
		client.emit('errorMessage', 'The room name cannot be blank');
	}
};