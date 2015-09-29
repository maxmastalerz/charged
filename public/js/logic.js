var server = io.connect(window.location.href);
server.on('disconnect', function () {
	alert('You are have been disconnected as the server can no longer see you on it\'s network');
});

$(document).ready(function($) {
	var bomb = document.getElementById('bomb'), grid = document.getElementById('grid'), heart = document.getElementById('heart'), explosion1 = document.getElementById('explosion1'), explosion2 = document.getElementById('explosion2'), explosion3 = document.getElementById('explosion3'), explosion4 = document.getElementById('explosion4'), crate = document.getElementById('crate');

	var canvas = document.getElementById('game'),
		ctx = canvas.getContext('2d'),
		bombCount, lifeCount,
		w, h,			//w and h of the game board, not the canvas.
		localMap,
		atMenu = true;

	calcCanvasSizing();
	window.onresize = function(event) {
		calcCanvasSizing();
	};
	server.on('updateMap', function(map) {
		if(atMenu===false) {
			updateLocalMap(map);
			localMap = map;
		}
	});
	server.on('updateBombs', function(bombs) {
		bombCount = bombs;
	});
	server.on('updateLives', function(lives) {
		lifeCount = lives;
	});
	server.on('roomProtected', function(room) {
		server.emit('checkRoomPassword', room, prompt('This room requires a password: '));
	});
	server.on('usernameCreateError', function(errorMessage) {
		server.emit('changeName', prompt(errorMessage));
	});
	server.on('errorMessage', function(errorMessage) {
		alert(errorMessage);
	});
	server.on('joinedRoom', function() {
		window.removeEventListener("mousedown", doMouseDown, false);
		$('#visibleInRoom').show();
		$('#visibleAtPlay').hide();
		atMenu=false;
	});
	server.on('leftRoom', function() {
		$('#visibleInRoom').hide();
		atMenu = true;
		drawMenu();
	});

	server.on('explosionVisual', function(map, bombY, bombX) {
		var mapPad = 3;
		var mapSize = map.length;
		var tileS = (w/mapSize)-mapPad;

		ctx.drawImage(explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad)));
		setTimeout(function() { ctx.drawImage(explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 20);
		setTimeout(function() { ctx.drawImage(explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 40);
		setTimeout(function() { ctx.drawImage(explosion4,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 60);
		setTimeout(function() { ctx.drawImage(explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 80);
		setTimeout(function() { ctx.drawImage(explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 100);
		setTimeout(function() { ctx.drawImage(explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); server.emit('clearDebris'); }, 120);
	});

	server.on('updateChat', function (username, colour, data) {
		var elem = $('#conversation');
		if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()){
			scrollChat();
		}
		$('#conversation').append('<p><b><font color="'+colour+'">'+ username + ':</font></b> ' + data + '</p>');
	});

	server.on('updatePlayersList', function(playersInRoom) {
		$('#playersInRoom').empty();
		for(var p=0; p<playersInRoom.length;p++) {
			$('#playersInRoom').append('<div class="player">'+playersInRoom[p]+'</div>');
		}
	});

	server.on('updateRooms', function (rooms) {
		pageChng(rooms, 0);
	});

	$(function(){
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			server.emit('sendchat', message);
			scrollChat();
		});
		$('#changeName').click(function() {
			server.emit('changeName', prompt('Choose a custom name: '));
		});
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});
		$('#roombutton').click(function(){
			var name = $('#roomname').val();
			var maxPlayers = $('#maxPlayers').val();
			var mapSize = $('#mapSize').val();
			var mapVisibility = $('#mapVisibility').val();
			var bombDelay = $('#bombDelay').val();
			var roomPassword = $('#roomPassword').val();

			$('#roomname').val('');
			$('#maxPlayers').val('6');
			$('#mapSize').val('');
			$('#mapVisibility').val('');
			$('#bombDelay').val('');
			$('#roomPassword').val('');
			server.emit('createRoom', name, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword);
		});
		$('#returnToMenu').click(function(e) {
			server.emit('returnToMenu');
		});
	});

	var holdingUp = false, holdingDown = false, holdingLeft = false, holdingRight = false, holdingSpace = false, upCount = 0, downCount = 0, leftCount = 0, rightCount = 0, spaceCount = 0;
	$('#game').keydown(function(e) {
		if(e.which==84) {			//'T'
			$('#data').focus();
			setTimeout(function() { $('#data').val($('#data').val().substring(0, $('#data').val().length - 1)); }, 1);
		}
	});
	$('#data').keydown(function(e) {
		if(e.which==27) {			//ESC
			$('#game').focus();
		} else if(e.which==13) {	//ENTER
			$('#datasend').trigger('click');
			$('#game').focus();
		}
	});
	$('#game').keydown(function(e) {
		if(e.which==65 && !holdingLeft) { holdingLeft = true; leftCount++; }
		if(e.which==87 && !holdingUp) { holdingUp = true; upCount++; }
		if(e.which==68 && !holdingRight) { holdingRight = true; rightCount++; }
		if(e.which==83 && !holdingDown) { holdingDown = true;  downCount++; }
		if(e.which==32 && !holdingSpace) { holdingSpace = true; spaceCount++; }
	});
	$('#game').keyup(function(e) {
		if(e.which==65) { holdingLeft = false; }
		if(e.which==87) { holdingUp = false; }
		if(e.which==68) { holdingRight = false; }
		if(e.which==83) { holdingDown = false; }
		if(e.which==32) { holdingSpace = false; }
	});
	setInterval(function() {
		if(!(holdingUp && holdingDown)) {
			if((upCount>0) || holdingUp) {
				if(upCount>0) { upCount--; }
				server.emit('move', 0, -1);
			} else if((downCount>0) || holdingDown) {
				if(downCount>0) { downCount--; }
				server.emit('move', 0, 1);
			}
		}
		if(!(holdingLeft && holdingRight)) {
			if((leftCount>0) || holdingLeft) {
				if(leftCount>0) { leftCount--; }
				server.emit('move', -1, 0);
			} else if((rightCount>0) || holdingRight) {
				if(rightCount>0) { rightCount--; }
				server.emit('move', 1, 0);
			}
		}
		if((spaceCount>0) || holdingSpace) {
			if(spaceCount>0) { spaceCount--; }
			server.emit('placeBomb');
		}
	}, 120);
	/*Message for the Hackers:
	1. Changing this value may spam the server and will cause your session to be unstable/prone to freezing and lagging.
	2. The interval of server emitions is moderated by the server, and will result in a temporary IP ban.
	3. The distance traveled is also monitored by the server.*/

	function updateLocalMap(map) {
		var mapPad = 3;
		var mapSize = map.length;
		var tileS = (w/mapSize)-mapPad;

		ctx.fillStyle = "black";ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.font = "10px Verdana";

		for(var y=0;y<mapSize;y++) {			//Y
			for(var x=0;x<mapSize;x++) {		//X
				if(map[y][x]==='0') {			//Empty space
					ctx.fillStyle = "black";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='1') {	//Regular wall
					ctx.fillStyle = "#3D3D3D";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='2') {	//Indestructable wall
					ctx.fillStyle="black";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='3') { 	//BOMB
					ctx.drawImage(bomb, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
				} else if(map[y][x]==='4') {	//BOMB pickup
					ctx.drawImage(crate, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
				}

				if(map[y][x].username!==undefined && map[y][x].bombUnderneath===true) {
					ctx.fillStyle = map[y][x].colour;
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
					ctx.drawImage(bomb, (x)*(tileS+mapPad)-1, (y)*(tileS+mapPad)-1, tileS+mapPad, tileS+mapPad);
				} else if(map[y][x].username!==undefined) {						//Player
					ctx.fillStyle = map[y][x].colour;
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				}
			}
		}
		ctx.fillStyle = 'grey';
		ctx.fillRect(0,h,canvas.width,canvas.height);
		ctx.fillRect(w,0,canvas.width,canvas.height);

		for(var b=0;b<bombCount;b++) {
			ctx.drawImage(crate,w+4,(b*25)+4,22,22);
		}
		for(var l=0;l<lifeCount;l++) {
			ctx.drawImage(heart,w+4,(-l*25)+h,22,22);
		}
	}
	function doMouseDown(event) {
		x = event.pageX - canvas.offsetLeft;
		y = event.pageY - canvas.offsetTop;
		if(x>=(canvas.width/2.39) && x<=(canvas.width/1.72) && y>=(canvas.height/2.58) && y<=(canvas.height/2.21)) {
			$('#visibleAtPlay').show();
		}
		if(x>=(canvas.width/2.39) && x<=(canvas.width/1.29) && y>=(canvas.height/2.08) && y<=(canvas.height/1.82)) {
			alert("Instructions");
		}
		if(x>=(canvas.width/2.39) && x<=(canvas.width/1.54) && y>=(canvas.height/1.73) && y<=(canvas.height/1.55)) {
			alert("Credits");
		}
	}
	function drawMenu() {
		h = (canvas.height = parseInt($('#game').css('height'), 10))-30;
		w = (canvas.width = canvas.height)-30;
		var callback = function(image) { if(!image) image = this; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); };
		if(grid.complete) { callback(grid); } else { grid.onload = callback; }

		ctx.font = canvas.width/37+'px Bit';
		ctx.fillStyle = "grey";
		ctx.fillText  ('Play', (canvas.width/2.24), canvas.height/2.32);
		ctx.fillText  ('Instructions', (canvas.width/2.24), canvas.height/1.9);
		ctx.fillText  ('Credits', (canvas.width/2.24), canvas.height/1.6);

		window.addEventListener("mousedown", doMouseDown, false);

		$('#roomList').css({
			top: canvas.height*0.29,
			left: canvas.width*0.03,
			height: canvas.height*0.79,
			width: canvas.width*0.36
		});
		$('#roomCreator').css({
			top: canvas.height*0.675,
			left: canvas.height*0.418,
			height: canvas.height*0.325,
			width: canvas.width*0.55
		});
	}
	function calcCanvasSizing() {
		h = (canvas.height = parseInt($('#game').css('height'), 10))-30;
		w = (canvas.width = canvas.height)-30;

		$('#chatInput').css({'width': w-6});
		$('#chatWrapper').css({'width': $(window).width()-canvas.width-20});
		$('#returnToMenu').css({'width': w*0.1, 'height': w*0.05, 'left': w-(w*0.1)});
		if(!atMenu) {
			updateLocalMap(localMap);
		} else {
			drawMenu(w, h);
		}
	}
	function debounce(fn, delay) {
		var timer = null;
		return function() {
			var context = this, args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function() {
				fn.apply(context, args);
			}, delay);
		};
	}
	function scrollChat() {
		var height = 0;
		$('#conversation p').each(function(i, value){
			height += parseInt($(this).height());
		});
		height += '';
		$('#conversation').animate({scrollTop: height});
	}
});