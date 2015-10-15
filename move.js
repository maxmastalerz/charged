var meth = require('./meth.js');

function hackedMovement(cli, deltaX, deltaY) {
	if(cli.room!==null && deltaX>-2 && deltaX<2 && deltaY>-2 && deltaY<2) {
		return false;
	}
}
function validDestination(cli, rooms, deltaX, deltaY) {
	if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].type==='air' || rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].type==='crate') {
		return true;
	}
	if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].type==='wall') {
		if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].owner===cli.username && rooms[cli.room].gameMode==='ffa') {
			return true;
		}
		if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].owner===cli.team && rooms[cli.room].gameMode==='ctf') {
			return true;
		}
	}
}
function pickedUpBomb(cli, rooms, deltaX, deltaY) {
	if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].type==='crate') {
		return true;
	}
}
function decideBlockTrail(cli, rooms) {	//Determines whether to leave a empty block or a bomb at the player's previous position.
	if(cli.entityUnderneath===null) {
		rooms[cli.room].map[cli.yPos][cli.xPos] = {type: 'air'};
	} else if(cli.entityUnderneath==='bomb') {
		rooms[cli.room].map[cli.yPos][cli.xPos] = {type: 'bomb'};
	} else if(cli.entityUnderneath==='wall') {
		if(rooms[cli.room].gameMode==='ctf') {
			rooms[cli.room].map[cli.yPos][cli.xPos] = {type: 'wall', colour: cli.colour, owner: cli.team};
		} else {
			rooms[cli.room].map[cli.yPos][cli.xPos] = {type: 'wall', colour: cli.colour, owner: cli.username};
		}
	}
	cli.entityUnderneath = null;
}
function movePlayer(cli, rooms, deltaX, deltaY) {
	cli.xPos+=deltaX;
	cli.yPos+=deltaY;
	rooms[cli.room].map[cli.yPos][cli.xPos] = { type: 'player', id: cli.id, username: cli.username, colour: cli.colour, entityUnderneath: cli.entityUnderneath };
}

module.exports = function(io, cli, rooms, deltaX, deltaY) {
	if(cli.room!==null) {
		if(!hackedMovement(cli, deltaX, deltaY) && validDestination(cli, rooms, deltaX, deltaY)) {
			decideBlockTrail(cli, rooms);

			if(pickedUpBomb(cli, rooms, deltaX, deltaY)) {
				cli.bombs++;
				cli.emit('updateBombs', cli.bombs);
			}

			var walkedOnWall = false;
			if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].type==='wall') {
				if(rooms[cli.room].map[cli.yPos+deltaY][cli.xPos+deltaX].colour===cli.colour) {
					walkedOnWall = true;
				}
			}

			movePlayer(cli, rooms, deltaX, deltaY);
			if(walkedOnWall) { cli.entityUnderneath='wall'; }
			meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
		}
	}
};