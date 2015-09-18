var server = io.connect('https://tic-tic-boom.herokuapp.com/');
//var server = io.connect('localhost/');

$(document).ready(function($) {
	//Load images
	var bomb = document.getElementById('bomb'), grid = document.getElementById('grid'), heart = document.getElementById('heart'), explosion1 = document.getElementById('explosion1'), explosion2 = document.getElementById('explosion2'), explosion3 = document.getElementById('explosion3'), explosion4 = document.getElementById('explosion4'), crate = document.getElementById('crate');

	var canvas = document.getElementById('game'),
		ctx = canvas.getContext('2d'),
		bombCount, lifeCount,
		w, h,			//w and h of the game board, not the canvas.
		localMap,
		focusedOnGame = false;

	calcCanvasSizing();
	window.onresize = function(event) {
		calcCanvasSizing();
	};

	server.on('updateMap', function(map) {
		updateLocalMap(map);
		localMap = map;
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
	server.on('roomCreateError', function(errorMessage) {
		alert(errorMessage);
	});
	server.on('joinedRoom', function() {
		window.removeEventListener("mousedown", doMouseDown, false);
		$('#roomList').hide();
		$('#chatInput').show();
		$('#chatWrapper').show();

	});
	server.on('leftRoom', function() {
		//
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

	var toggle = false;
	server.on('updatePlayersList', function(playersInRoom) {
		$('#playersInRoom').empty();
		$('#playersInRoom').append('<hr/><b>Players</b><span class="toggle" style="float: right; text-decoration: underline;">Page ↹</span><br/>');
		for(var p=0; p<playersInRoom.length;p++) {
			$('#playersInRoom').append('<div class="player">'+playersInRoom[p]+'</div>');
		}

		if(toggle===true) {
			$('div.player:gt(2)').each(function (index) {}).show();
			$('div.player:lt(3)').each(function (index) {}).hide();
		} else if(toggle===false){
			$('div.player:gt(2)').each(function (index) {}).hide();
			$('div.player:lt(3)').each(function (index) {}).show();
		}

		$('.toggle').click(function(event) {
			if(toggle===false) {
				toggle=true;
				$('div.player:gt(2)').each(function (index) {}).show();
				$('div.player:lt(3)').each(function (index) {}).hide();
			} else if(toggle===true){
				toggle=false;
				$('div.player:gt(2)').each(function (index) {}).hide();
				$('div.player:lt(3)').each(function (index) {}).show();
			}
		});
	});

	server.on('updateRooms', function (rooms) {
		$('#roomList').empty();
		$('#roomList').append('<div style="font-size: 6vh; font-family: Bit; text-align: center; color: grey">Rooms</div>');
		for(var room in rooms) {
			$('#roomList').append('<div style="background-color: grey; padding: 2px; margin: 5px;" onclick="server.emit(\'switchRoom\',\''+room+'\');">' + room + '<span style="float: right;">'+rooms[room].playerCount+'/'+rooms[room].maxPlayers+'</span></div>');
		}
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
	});

	var holdingUp = false, holdingDown = false, holdingLeft = false, holdingRight = false, holdingSpace = false, upCount = 0, downCount = 0, leftCount = 0, rightCount = 0, spaceCount = 0;
	$(document).keypress(function(e) {
		if(e.keyCode===13 && focusedOnGame) {	//Enter changes focus between game and chat
			$('#data').focus();
			focusedOnGame = false;
		} else if(e.keyCode===13 && !focusedOnGame) {
			$('#game').focus();
			focusedOnGame = true;
		}
	});
	$('#game').keydown(function(e) {
		if(e.which==37 && !holdingLeft) { holdingLeft = true; leftCount++; }
		if(e.which==38 && !holdingUp) { holdingUp = true; upCount++; }
		if(e.which==39 && !holdingRight) { holdingRight = true; rightCount++; }
		if(e.which==40 && !holdingDown) { holdingDown = true;  downCount++; }
		if(e.which==32 && !holdingSpace) { holdingSpace = true; spaceCount++; }
	});
	$('#game').keyup(function(e) {
		if(e.which==37) { holdingLeft = false; }
		if(e.which==38) { holdingUp = false; }
		if(e.which==39) { holdingRight = false; }
		if(e.which==40) { holdingDown = false; }
		if(e.which==32) { holdingSpace = false; }
	});
	setInterval(function() {
		if((upCount>0) || holdingUp) {
			if(upCount>0) { upCount--; }
			server.emit('move', 0, -1);
		} else if((downCount>0) || holdingDown) {
			if(downCount>0) { downCount--; }
			server.emit('move', 0, 1);
		}
		if((leftCount>0) || holdingLeft) {
			if(leftCount>0) { leftCount--; }
			server.emit('move', -1, 0);
		} else if((rightCount>0) || holdingRight) {
			if(rightCount>0) { rightCount--; }
			server.emit('move', 1, 0);
		}
		if((spaceCount>0) || holdingSpace) {
			if(spaceCount>0) { spaceCount--; }
			server.emit('placeBomb');
		}
	}, 160);

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
			$('#roomList').show();
		}
		if(x>=(canvas.width/2.39) && x<=(canvas.width/1.29) && y>=(canvas.height/2.08) && y<=(canvas.height/1.82)) {
			alert("Instructions");
		}
		if(x>=(canvas.width/2.39) && x<=(canvas.width/1.54) && y>=(canvas.height/1.73) && y<=(canvas.height/1.55)) {
			alert("Credits");
		}
	}
	function calcCanvasSizing() {
		h = (canvas.height = parseInt($('#game').css('height'), 10))-30;
		w = (canvas.width = canvas.height)-30;

		$('#chatInput').css({'width': w-6});
		$('#chatWrapper').css({width: $(window).width()-canvas.width-20});
		if(localMap!==undefined) {
			updateLocalMap(localMap);
		} else {
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