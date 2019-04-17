var canvas, context;
var height, width;

var state;
const PLAYING = 1;
const STOPPED = 2;

var dx, dy;
var grid;

var piece;
var pieceColor;

const ROWS = 30;
const COLS = 15;

var lastKey;

const REFRESH_MS = 1000 / 90;

var velocity_squares_per_ms = 15 / 1000;
var partialSquares;

const init = function()
{
	document.addEventListener("keydown", keypressListener);
	
	canvas = document.getElementById('tetris');
	context = canvas.getContext("2d");
	
	height = canvas.height;
	width = canvas.width;
	
	dx = Math.floor(width / COLS);
	dy = Math.floor(height / ROWS);

	start();
};

const start = function()
{
	grid = [];
	
	for(var row = 0; row < ROWS; row++)
	{	
		grid.push(Array(COLS).fill(null));
	}
	
	nextPiece();
	
	lastKey = "";
	
	partialSquares = 0;
	
	state = PLAYING;
	
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
	
	if(! newPieceOK(newPiece))
	{
		// game over, man!
		
		state = STOPPED;
	}
	else
	{
		piece = newPiece;
		pieceColor = getRandomColor();
	}	
};

const movePiece = function()
{
	partialSquares += velocity_squares_per_ms * REFRESH_MS;
	
	if(partialSquares > 1)
	{
		partialSquares = 0;
		
		var newPiece = translatedPiece(0, 1);
		
		if(! newPieceOK(newPiece))
		{
			// Add piece to background grid
			
			piece.forEach(function(square)
			{
				[c, r] = square;
				
				grid[r][c] = pieceColor;
			});
			
			// Start a new piece at the top
			
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
		[c, r] = square;
		
		context.fillStyle = pieceColor;
		context.fillRect(c * dx, r * dy, dx, dy);
	});
};

const getRandomPiece = function()
{
	var pieceNum = Math.floor(Math.random() * 6);
	
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
	}
};

const getRandomColor = function()
{
	return 'rgb('  + Array(3).fill(null)
	       .map(x => Math.floor(Math.random() * 240))
		   .join(",") + ')';
};

const keypressListener = function(e)
{
	switch(e.key)
	{
	  case "ArrowLeft":
	  case "ArrowRight":
	  case "ArrowUp":
	  case "ArrowDown":
	    lastKey = e.key;
        break;
	}
};

const processInput = function()
{
	switch(lastKey)
	{
      case "ArrowLeft":
		var newPiece = translatedPiece(-1, 0);
	    if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
	  case "ArrowRight":
	    var newPiece = translatedPiece(1, 0);
	    if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
	  case "ArrowUp":
	    var newPiece = rotatedPiece();
		if(newPieceOK(newPiece)) { piece = newPiece; }
        break;
	  case "ArrowDown":
        break;
	}
	
	lastKey = "";
};

const translatedPiece = function(dc, dr)
{
	return piece.map(function(square)
	{
		[c, r] = square;
		
		return [c + dc, r + dr];
	});
}

const rotatedPiece = function()
{
	// Calculate center of mass
	
	var cx = 0; var cy = 0;
	
	piece.forEach(function(square)
	{
		var x; var y;
		[x, y] = square;
		
		cx += x;
		cy += y;
	});
	
	cx = Math.round(cx / 4);
	cy = Math.round(cy / 4);
	
	// Rotate piece around center of mass
	
	newPiece = [];
	
	piece.forEach(function(square)
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