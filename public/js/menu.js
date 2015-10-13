function drawMenu(canvas, ctx, images) {
	h = (canvas.height = parseInt($('#game').css('height'), 10))-30;
	w = (canvas.width = canvas.height)-30;

	ctx.drawImage(images.grid, 0, 0, canvas.width, canvas.height);

	ctx.font = canvas.width/37+'px Bit';
	ctx.fillStyle = "#4C767B";
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