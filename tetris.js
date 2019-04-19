const ROWS = 30;
const COLS = 15;

const REFRESH_MS = 1000 / 90;
const INIT_VELOCITY_SQUARES_PER_MS = 5 / 1000;

var canvas, context;
var height, width;

var scoreDiv, highScoreDiv;
var score, highScore;

var state;
const PLAYING = 1;
const STOPPED = 2;

var dx, dy;
var grid;

var piece;
var pieceColor;

var lastKey;

var velocity_squares_per_ms;
var speedBoost;
var partialSquares;


const init = function()
{
	document.addEventListener("keydown", keypressListener);
	
	canvas = document.getElementById('tetris');
	context = canvas.getContext("2d");
	
	scoreDiv = document.getElementById('score');
	highScoreDiv = document.getElementById('highscore');
	
	height = canvas.height;
	width = canvas.width;
	
	dx = Math.floor(width / COLS);
	dy = Math.floor(height / ROWS);
	
	highScore = 0;

	start();
};

const start = function()
{
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
	  
	  setTimeout(tick, REFRESH_MS);
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
	partialSquares += velocity_squares_per_ms * REFRESH_MS * speedBoost;
	
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

const redrawGrid = function()
{	
    context.clearRect(0, 0, width, height);
	
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

const keypressListener = function(e)
{
	lastKey = e.key;
};

const processInput = function()
{
	speedBoost = 1;
	
	switch(lastKey)
	{
      case "ArrowLeft":
	  case "A":
	  case "a":
		var newPiece = translatePiece(piece, -1, 0);
	    if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
		
	  case "ArrowRight":
	  case "D":
	  case "d":
	    var newPiece = translatePiece(piece, 1, 0);
	    if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
		
	  case "ArrowUp":
	  case "W":
	  case "w":
	    var newPiece = rotatePiece(piece);
		if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
		
	  case "ArrowDown":
	  case "S":
	  case "s":
	    speedBoost = 25;
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
	}
	
	lastKey = "";
};

const translatePiece = function(aPiece, dc, dr)
{
	return aPiece.map(function(square)
	{
		[c, r] = square;
		
		return [c + dc, r + dr];
	});
}

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
}

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
}

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
}