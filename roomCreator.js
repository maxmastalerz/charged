var meth = require('./meth.js');
var join = require('./join.js');

function noCreationErrors(client, rooms, room, maxPlayers, mapSize, mapVisibility, bombDelay) {
	var sentMessage = '';
	if(room==='null' || room==='[object Object]' || room==='undefined' || room==='' || (/^\s+$/.test(room))) {
		sentMessage+='Room name must not be blank\n';
	} if(!meth.roomAvailable(rooms, room)) {
		sentMessage+='This noom name must be unique\n';
	} if(room.length>15) {
		sentMessage+='The length of the name surpassed 15 chars\n';
	} if(maxPlayers<2 || maxPlayers>6) {
		sentMessage+='Max players was outside the 2-6 range\n';
	} if(mapSize<10 || mapSize>70) {
		sentMessage+='Map size was outside the 10-70 range\n';
	} if(mapVisibility<5 || mapVisibility>35) {
		sentMessage+='Map visibility was outside the 5-35 range\n';
	} if(bombDelay<500 || bombDelay>3000) {
		sentMessage+='bombDelay was outside the 500-3000 range\n';
	}

	if(sentMessage==='') {
		return true;
	} else {
		client.emit('errorMessage', 'Issues that occured when creating room: \n'+sentMessage);
	}
}

function generateMap(rooms, room) {
	var density = 1;	//from 0 - 10. Lower values mean more space

	for(var y=0;y<rooms[room].mapSize;y++) {
		for(var x=0;x<rooms[room].mapSize;x++) {
			if(y===0 || y===rooms[room].mapSize-1 || x===0 || x===rooms[room].mapSize-1) {
				rooms[room].map[y][x] = '2';	//invisible wall
			} else {
				var num = Math.floor((Math.random()*10)+0);
				if(num<density) {
					rooms[room].map[y][x] = '1';
				} else {
					rooms[room].map[y][x] = '0';
				}
			}
		}
	}
}

module.exports = function(io, client, rooms, room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword) {
	room = meth.sanitizeInput(room);
	if(roomPassword!==undefined) { roomPassword = meth.sanitizeInput(roomPassword); }
	roomPassword = roomPassword || null;
	maxPlayers = parseInt(maxPlayers) || 6;
	mapSize = parseInt(mapSize) || 51;
	mapVisibility = parseInt(mapVisibility) || 31;
	if(mapVisibility>mapSize) {	mapVisibility = mapSize; }
	bombDelay = parseInt(bombDelay) || 1500;

	if(noCreationErrors(client, rooms, room, maxPlayers, mapSize, mapVisibility, bombDelay)) {
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

		generateMap(rooms, room);
		join(io, client, rooms, room);
	}
};