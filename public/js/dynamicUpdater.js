function calcCanvasSizing() {
	h = (canvas.height = parseInt($('#game').css('height'), 10))-30;
	w = (canvas.width = canvas.height)-30;

	$('#chatInput').css({'width': w-6});
	$('#chatWrapper').css({'width': $(window).width()-canvas.width-20});
	$('#returnToMenu').css({'width': w*0.1, 'height': w*0.05, 'left': w-(w*0.1)});
	if(!atMenu) {
		updateLocalMap(localMap);
	} else {
		drawMenu(canvas, ctx, images);
	}
}
function updateLocalMap(map) {
	localMap = map;
	var mapPad = 3;
	var mapSize = map.length;
	var tileS = (w/mapSize)-mapPad;

	var col1 = '#4C767B';
	var col2 = '#334F52';

	ctx.fillStyle = col1;ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.font = "10px Verdana";

	for(var y=0;y<mapSize;y++) {			//Y
		for(var x=0;x<mapSize;x++) {		//X
			if(map[y][x]!=='0') {
				if(map[y][x].type==='air') {
					ctx.fillStyle = col1;
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x].type==='block') {
					ctx.fillStyle = col2;
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x].type==='indestructible') {
					ctx.fillStyle=map[y][x].colour;
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x].type==='bomb') {
					ctx.drawImage(images.bomb, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
				} else if(map[y][x].type==='wall') {
					ctx.fillStyle = map[y][x].colour;
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x].type==='crate') {
					ctx.drawImage(images.crate, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
				} else if(map[y][x].type==='flag') {
					if(map[y][x].colour==='red') {
						ctx.drawImage(images.redflag, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
					} else if(map[y][x].colour==='blue') {
						ctx.drawImage(images.blueflag, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
					}
				}

				if(map[y][x].type==='player' && map[y][x].entityUnderneath==='bomb') {
					ctx.fillStyle = '#FFF';
					ctx.font = w*0.01+'pt Bit';
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
					ctx.fillStyle = map[y][x].colour;
					ctx.drawImage(images.bomb, (x)*(tileS+mapPad)-1, (y)*(tileS+mapPad)-1, tileS+mapPad, tileS+mapPad);
				} else if(map[y][x].type==='player') {
					ctx.fillStyle = '#FFF';
					ctx.font = w*0.01+'pt Bit';
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillStyle = map[y][x].colour;
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				}
			}
		}
	}
	ctx.fillStyle = '#4C767B';
	ctx.fillRect(0,h,canvas.width,canvas.height);
	ctx.fillRect(w,0,canvas.width,canvas.height);

	for(var b=0;b<bombCount;b++) {
		ctx.drawImage(images.crate,w+4,(b*25)+4,22,22);
	}
	for(var l=0;l<lifeCount;l++) {
		ctx.drawImage(images.heart,w+4,(-l*25)+h,22,22);
	}
}