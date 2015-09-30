var meth = require('./meth.js');

function hackedMovement(client, deltaX, deltaY) {
	if(client.room!==null && deltaX>-2 && deltaX<2 && deltaY>-2 && deltaY<2) {
		return false;
	}
}
function validDestination(client, rooms, deltaX, deltaY) {
	if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].type==='air' || rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].type==='crate') {
		return true;
	}
	if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].type==='wall') {
		if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].colour===client.colour) {
			return true;
		}
	}
}
function pickedUpBomb(client, rooms, deltaX, deltaY) {
	if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].type==='crate') {
		return true;
	}
}
function decideBlockTrail(client, rooms) {	//Determines whether to leave a empty block or a bomb at the player's previous position.
	if(client.entityUnderneath===null) {
		rooms[client.room].map[client.yPos][client.xPos] = {type: 'air'};
	} else if(client.entityUnderneath==='bomb') {
		rooms[client.room].map[client.yPos][client.xPos] = {type: 'bomb'};
	} else if(client.entityUnderneath==='wall') {
		rooms[client.room].map[client.yPos][client.xPos] = {type: 'wall', colour: client.colour};
	}
	client.entityUnderneath = null;
}
function movePlayer(client, rooms, deltaX, deltaY) {
	client.xPos+=deltaX;
	client.yPos+=deltaY;
	rooms[client.room].map[client.yPos][client.xPos] = { type: 'player', id: client.id, username: client.username, colour: client.colour, entityUnderneath: client.entityUnderneath };
}

module.exports = function(io, client, rooms, deltaX, deltaY) {
	if(client.room!==null) {
		if(!hackedMovement(client, deltaX, deltaY) && validDestination(client, rooms, deltaX, deltaY)) {
			decideBlockTrail(client, rooms);

			if(pickedUpBomb(client, rooms, deltaX, deltaY)) {
				client.bombs++;
				client.emit('updateBombs', client.bombs);
			}

			var walkedOnWall = false;
			if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].type==='wall') {
				if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX].colour===client.colour) {
					walkedOnWall = true;
				}
			}

			movePlayer(client, rooms, deltaX, deltaY);
			if(walkedOnWall) { client.entityUnderneath='wall'; }
			meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
		}
	}
};