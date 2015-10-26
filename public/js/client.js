var s = io.connect(window.location.href);
s.on('disconnect', function () {
	alert('You are have been disconnected as the server can no longer see you on it\'s network');
});

loadImages(function(imagesReturned) {
	images=imagesReturned;
	(window.onresize = function(event) {
		calcCanvasSizing();
	}).call();
	s.on('updateMap', function(map) {
		updateLocalMap(map);
	});
	s.on('updateBombs', function(bombs) {
		bombCount = bombs;
	});
	s.on('updateScore', function(updatedRedScore, updatedBlueScore) {
		redScore = updatedRedScore;
		blueScore = updatedBlueScore;
	});
	s.on('updateWallsInUse', function(wallsInUse) {
		wallCount = 3-wallsInUse;
	});
	s.on('updateLives', function(lives) {
		lifeCount = lives;
	});
	s.on('updateColour', function(col) {
		colour = col;
	});
	s.on('flagStolen', function(flagStolen) {
		if(flagStolen==='red' && colour==='#B20000') {
			updateChat('SERVER', '#00FFFF', '<font style="color: blue; font-weight: bold;">Blue stole your flag!</font>');
		} else if(flagStolen==='blue' && colour==='#0000B2') {
			updateChat('SERVER', '#00FFFF', '<font style="color: red; font-weight: bold;">Red stole your flag!</font>');
		}
	});
	s.on('flagDropped', function(flagDropped) {
		if(flagDropped==='red' && colour==='#B20000') {
			updateChat('SERVER', '#00FFFF', '<font style="color: red; font-weight: bold;">Our flag was taken back!</font>');
		} else if(flagDropped==='blue' && colour==='#0000B2') {
			updateChat('SERVER', '#00FFFF', '<font style="color: blue; font-weight: bold;">Our flag was taken back!</font>');
		}
	});
	s.on('flagCaptured', function(flagCaptured) {
		if(flagCaptured==='red' && colour==='#B20000') {
			updateChat('SERVER', '#00FFFF', '<font style="color: blue; font-weight: bold;">Blue has captured our flag!</font>');
		} else if(flagCaptured==='blue' && colour==='#0000B2') {
			updateChat('SERVER', '#00FFFF', '<font style="color: red; font-weight: bold;">Red has captured our flag!</font>');
		}
	});
	s.on('roomProtected', function(room) {
		s.emit('checkRoomPassword', room, prompt('This room requires a password: '));
	});
	s.on('usernameCreateError', function(errorMessage) {
		s.emit('changeName', prompt(errorMessage));
	});
	s.on('errorMessage', function(errorMessage) {
		alert(errorMessage);
	});
	s.on('joinedRoom', function() {
		window.removeEventListener("mousedown", doMouseDown, false);
		$('#visibleInRoom').show();
		$('#visibleAtPlay').hide();
		$('#game').focus();
		atMenu=false;
	});
	s.on('leftRoom', function() {
		$('#visibleInRoom').hide();
		atMenu = true;
		drawMenu(canvas, ctx, images);
	});

	s.on('explosionVisual', function(map, bombY, bombX) {
		var mapPad = 3;
		var mapSize = map.length;
		var tileS = (w/mapSize)-mapPad;

		ctx.drawImage(images.explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad)));
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); } }, 20);
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); } }, 40);
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion4,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); } }, 60);
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); } }, 80);
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); } }, 100);
		setTimeout(function() { if(!atMenu) { ctx.drawImage(images.explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); updateLocalMap(localMap); } }, 120);
	});

	s.on('updateChat', function (username, colour, data) {
		updateChat(username, colour, data);
	});

	s.on('updatePlayersList', function(playersInRoom) {
		$('#playersInRoom').empty();
		for(var p=0; p<playersInRoom.length;p++) {
			$('#playersInRoom').append('<div class="player">'+playersInRoom[p]+'</div>');
		}
	});


});

s.on('updateRooms', function (rooms) {
	pageChng(rooms, 0);
});