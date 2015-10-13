var canvas = document.getElementById('game'),
	ctx = canvas.getContext('2d'),
	bombCount, lifeCount,
	w, h,			//w and h of the game board, not the canvas.
	localMap,
	atMenu = true,
	images;