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
	s.on('updateWallsInUse', function(wallsInUse) {
		wallCount = 3-wallsInUse;
	});
	s.on('updateLives', function(lives) {
		lifeCount = lives;
	});
	s.on('updateColour', function(col) {
		colour = col;
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
		setTimeout(function() { ctx.drawImage(images.explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 20);
		setTimeout(function() { ctx.drawImage(images.explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 40);
		setTimeout(function() { ctx.drawImage(images.explosion4,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 60);
		setTimeout(function() { ctx.drawImage(images.explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 80);
		setTimeout(function() { ctx.drawImage(images.explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 100);
		setTimeout(function() { ctx.drawImage(images.explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); s.emit('clearDebris'); }, 120);
	});

	s.on('updateChat', function (username, colour, data) {
		var elem = $('#conversation');
		if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()){
			scrollChat();
		}
		$('#conversation').append('<p><b><font color="'+colour+'">'+ username + ':</font></b> ' + data + '</p>');
	});

	s.on('updatePlayersList', function(playersInRoom) {
		$('#playersInRoom').empty();
		for(var p=0; p<playersInRoom.length;p++) {
			$('#playersInRoom').append('<div class="player">'+playersInRoom[p]+'</div>');
		}
	});

	function scrollChat() {
		var height = 0;
		$('#conversation p').each(function(i, value){
			height += parseInt($(this).height());
		});
		height += '';
		$('#conversation').animate({scrollTop: height});
	}
});

s.on('updateRooms', function (rooms) {
	pageChng(rooms, 0);
});