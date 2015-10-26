var canvas = document.getElementById('game'),
	ctx = canvas.getContext('2d'),
	bombCount, wallCount, lifeCount, redScore = '', blueScore = '',
	colour,
	w, h,			//w and h of the game board, not the canvas.
	localMap,
	atMenu = true,
	images;