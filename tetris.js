const ROWS = 30;
const COLS = 15;

const FRAMES_PER_SEC = 90;
const INIT_VELOCITY_SQUARES_PER_MS = 5 / 1000;
const MOVE_DELAY_MSEC_FIRST = 250;
const MOVE_DELAY_MSEC_SUBSEQUENT = 25;

const GRID_VISIBLE_COLOR='#d0d0d0';
const BACKGROUND_COLOR='rgba(0,0,0,0)';

var canvas, context;
var height, width;

var scoreDiv, highScoreDiv;
var score, highScore;

var state;
const PLAYING = 1;
const STOPPED = 2;

var dx, dy;
var grid;
var grid_color;

var piece;
var pieceColor;

var leftButton, rightButton, rotateButton, boostButton;
var leftDown, rightDown;
var leftCoolingDown, rightCoolingDown;

var lastKey;
var lastButton;

var velocity_squares_per_ms;
var speedBoost;
var partialSquares;

var paused;

const init = function()
{
	document.addEventListener("keydown", keydownListener);
	document.addEventListener("keyup", keyupListener);
	
	canvas = document.getElementById('tetris');
	context = canvas.getContext("2d");
	
	scoreDiv = document.getElementById('score');
	highScoreDiv = document.getElementById('highscore');
	
	leftButton = document.getElementById('left');
	rightButton = document.getElementById('right');
	rotateButton = document.getElementById('rotate');
	boostButton = document.getElementById('boost');
	
	height = canvas.height;
	width = canvas.width;
	
	dx = Math.floor(width / COLS);
	dy = Math.floor(height / ROWS);
	
	highScore = 0;
	
    grid_color = BACKGROUND_COLOR;

	start();
};

const start = function()
{
	paused = false;
	
    if(score > highScore)
	{
		highScore = score;
		highScoreDiv.innerHTML = highScore;
	}
	
	grid = [];
	
	for(var row = 0; row < ROWS; row++)
	{	
		grid.push(Array(COLS).fill(null));
	}
	
	nextPiece();
	
	lastKey = "";
	
	partialSquares = 0;
	
	velocity_squares_per_ms = INIT_VELOCITY_SQUARES_PER_MS;
	
	state = PLAYING;
	
	score = 0;
	
	speedBoost = 1;
	
	leftCoolingDown = false;
	rightCoolingDown = false;
	
	tick();
};

const tick = function()
{	
	if(state == PLAYING)
	{
	  processInput();
	  movePiece();
	  removeRows();
	  redrawGrid();
	  redrawPiece();
	  
	  setTimeout(tick, 1000 / FRAMES_PER_SEC);
	}
	else if(state == STOPPED)
	{
	  setTimeout(start, 2000)
	}
};

const nextPiece = function()
{
	newPiece = getRandomPiece();
	
	[cx, cy] = getCenterOfMass(newPiece);
	
	newPiece = translatePiece(newPiece, Math.floor(COLS/2) - cx, 0);
	
	if(! newPieceOK(newPiece))
	{
		// game over, man!
		
		state = STOPPED;
	}
	else
	{
		piece = newPiece;
		pieceColor = getRandomColor();
		
		velocity_squares_per_ms *= 1.01;
	}	
};

const absorbPieceIntoBackground = function()
{
	piece.forEach(function(square)
	{
		[c, r] = square;
		
		grid[r][c] = pieceColor;
	});	
}

const movePiece = function()
{	
	if(paused) { return; }

	partialSquares += velocity_squares_per_ms * 1000 / FRAMES_PER_SEC * speedBoost;
	
	if(partialSquares > 1)
	{
		partialSquares = 0;
		
		var newPiece = translatePiece(piece, 0, 1);
		
		if(! newPieceOK(newPiece))
		{			
			absorbPieceIntoBackground();
			nextPiece();
		}
		else 
		{
			piece = newPiece;
		}
	}	
};

const removeRows = function()
{
	var linesRemoved = 0;
	
	for(var row = 0; row < ROWS; row++)
	{
		if(grid[row].every(x => x!= null))
		{
			grid.splice(row, 1);
			grid.unshift(Array(COLS).fill(null));
			linesRemoved++;
		}
	}
	
	score += linesRemoved * (linesRemoved + 1) / 2;
	scoreDiv.innerHTML = score;
	
};

const redrawGridlines = function()
{
	context.strokeStyle = grid_color;
	
	for(var row = 0; row < ROWS; row++)
	{
		context.beginPath();
		context.moveTo(0, row * dx);
		context.lineTo(width, row * dx);
		context.stroke();
	}
	
	for(var col = 0; col < COLS; col++)
	{
		context.beginPath();
		context.moveTo(col * dy, 0);
		context.lineTo(col * dy, height);
		context.stroke();		
	}
}

const redrawGrid = function()
{	
    context.clearRect(0, 0, width, height);
	
	redrawGridlines();
		
	for(var row = 0; row < ROWS; row++)
	{
		for(var col = 0; col < COLS; col++)
		{
			if(grid[row][col] != null)
			{
				context.fillStyle = grid[row][col];
				context.fillRect(col * dx, row * dy, dx, dy);
			}
		}
	}
};

const redrawPiece = function()
{
	piece.forEach(function(square)
	{
		var c, r;
		
		[c, r] = square;
		
		if(newPieceOK(translatePiece(piece, 0, 1)))
		{
			r += partialSquares;
		}
		
		context.fillStyle = pieceColor;
		context.fillRect(c * dx, Math.floor(r * dy), dx, dy + 1);
	});
};

const getRandomPiece = function()
{
	var pieceNum = Math.floor(Math.random() * 7);
	
	switch(pieceNum)
	{
		case 0:
		  return [ [0, 0], [1, 0], [2, 0], [2, 1] ];
		  
		case 1:
		  return [ [0, 0], [1, 0], [2, 0], [0, 1] ];
		  
		case 2:
		  return [ [0, 0], [1, 0], [2, 0], [3, 0] ];
		
		case 3:
		  return [ [0, 0], [1, 0], [0, 1], [1, 1] ];
		  
		case 4:
		  return [ [0, 1], [1, 1], [1, 0], [2, 0] ];
		  
		case 5:
		  return [ [0, 0], [1, 1], [1, 0], [2, 1] ];
		  
		case 6:
		  return [ [0, 0], [1, 0], [2, 0], [1, 1] ];
		
	}
};

const getRandomColor = function()
{
	var rgb;

	do
	{
	  rgb = Array(3).fill(null)
	         .map(x => Math.floor(Math.random() * 255));
	}	 
	while(rgb[0] + rgb[1] + rgb[2] > 600);
	
	return 'rgb('  + rgb.join(",") + ')';
};

const clickedLeft = function()
{
	leftButton.style.backgroundColor = 'orange';
		
	if(!leftDown && !leftCoolingDown)
	{
	  leftDown = true;
	  rightDown = false;
	  leftCoolingDown = true;
	  var newPiece = translatePiece(piece, -1, 0);
	  if(newPieceOK(newPiece)) { piece = newPiece; }
	  setTimeout(() => leftCoolingDown = false, MOVE_DELAY_MSEC_FIRST);
	}
};

const unclickedLeft = function()
{
	leftButton.style.backgroundColor = 'grey';
	leftDown = false;
	leftCoolingDown = false;
};

const clickedRight = function()
{
	rightButton.style.backgroundColor = 'orange';
	
	if(!rightDown && !rightCoolingDown)
	{
	  rightDown = true;
	  leftDown = false;
	  rightCoolingDown = true;
	  var newPiece = translatePiece(piece, 1, 0);
	  if(newPieceOK(newPiece)) { piece = newPiece; }
	  setTimeout(() => rightCoolingDown = false, MOVE_DELAY_MSEC_FIRST);
	}
};

const unclickedRight = function()
{
	rightButton.style.backgroundColor = 'grey';
	rightDown = false;
	rightCoolingDown = false;
};

const clickedRotate = function()
{
	rotateButton.style.backgroundColor = 'orange';
	var newPiece = rotatePiece(piece);
	if(newPieceOK(newPiece)) { piece = newPiece; }
};

const unclickedRotate = function()
{
	rotateButton.style.backgroundColor = 'grey';
};

const clickedBoost = function()
{
	boostButton.style.backgroundColor='orange';
	speedBoost = 10;
};

const unclickedBoost = function()
{
	boostButton.style.backgroundColor='grey';
	speedBoost = 1;
};

const keydownListener = function(e)
{
	if(e.key == "p" || e.key == "P")
	{
		paused = !paused;
	}
	
	if(paused) { return; }
	
	switch(e.key)
	{
		case "ArrowLeft":
		case "A":
		case "a":
			clickedLeft();
			break;
		
		case "ArrowRight":
		case "D":
		case "d":
			clickedRight();
			break;
			
		case "ArrowUp":
		case "W":
		case "w":
			clickedRotate();
			break;
			
		case "ArrowDown":
		case "S":
		case "s":
			clickedBoost();
			break;
			
		case " ":
			var newPiece = piece;
			do
			{
				piece = newPiece;
				newPiece = translatePiece(piece, 0, 1);
			} while(newPieceOK(newPiece));
			
			absorbPieceIntoBackground();
			nextPiece();
			break;
			
		case "G":
		case "g":
			if(grid_color == GRID_VISIBLE_COLOR)
			{
				grid_color = BACKGROUND_COLOR;
			}
			else
			{
				grid_color = GRID_VISIBLE_COLOR;
			}
			break;
	}
};

const keyupListener = function(e)
{
	switch(e.key)
	{
		case "ArrowLeft":
		case "A":
		case "a":
			unclickedLeft();
			break;
		
		case "ArrowRight":
		case "D":
		case "d":
			unclickedRight();
			break;
			
		case "ArrowDown":
		case "S":
		case "s":
			unclickedBoost();
			break;
			
		case "ArrowUp":
		case "W":
		case "w":
			unclickedRotate();
			break;
	}
}

const processInput = function()
{
	if(paused) { return; }
	
	if(leftDown && ! leftCoolingDown)
	{		
		var newPiece = translatePiece(piece, -1, 0);
		if(newPieceOK(newPiece)) { piece = newPiece; }
		leftCoolingDown = true;
		setTimeout(() => leftCoolingDown = false, MOVE_DELAY_MSEC_SUBSEQUENT);
	}
	
	if(rightDown && ! rightCoolingDown)
	{
		var newPiece = translatePiece(piece, 1, 0);
		if(newPieceOK(newPiece)) { piece = newPiece; }
		rightCoolingDown = true;
		setTimeout(() => rightCoolingDown = false, MOVE_DELAY_MSEC_SUBSEQUENT);
	}
};

const translatePiece = function(aPiece, dc, dr)
{
	return aPiece.map(function(square)
	{
		[c, r] = square;
		
		return [c + dc, r + dr];
	});
};

const getCenterOfMass = function(newPiece)
{
	var cx = 0; var cy = 0;
	var squares = 0;
	
	newPiece.forEach(function(square)
	{
		var x; var y;
		[x, y] = square;
		
		cx += x;
		cy += y;
		squares++;
	});
	
	cx = Math.round(cx / squares);
	cy = Math.round(cy / squares);
	
	return [cx, cy]
};

const rotatePiece = function(aPiece)
{
	// Calculate center of mass
	
	var cx, cy;
	
	[cx, cy] = getCenterOfMass(aPiece);
	
	// Rotate piece around center of mass
	
	newPiece = [];
	
	aPiece.forEach(function(square)
	{
		var x; var y;
		[x, y] = square;
		
		newX = cx + (y - cy);
		newY = cy - (x - cx);
		
		newPiece.push([newX, newY]);
	});
	
	return newPiece;
};

const newPieceOK = function(newPiece)
{
  for(var i = 0; i < newPiece.length; i++)
  {
    [c, r] = newPiece[i];
	
	if(c < 0 || c >= COLS || r < 0 || r >= ROWS || grid[r][c] != null)
	{
		return false;
	}
  }	

  return true;  
};