"use strict";

function Lines(el)
{
    const parent = document.querySelector(el);
    const canvas = document.createElement("canvas");

    parent.appendChild(canvas);

    const options = {

        gridSize: [9,9],
        cellSize: 60,
        cellMargin: 2,
        countStartBall: 5,
        countNextBall: 3,
        countMinLine: 5,
        revenue: 10,
        normalCellColor: "#666666",
        activeCellColor: "#999999",
        ballRadius: 24,
        ballColors: ["#a80000", "#540000", "#fca800", "#00a800", "#00a8fc", "#0000a8", "#a800a8"],
    };

    const w = (options.cellSize * options.gridSize[0]) + (options.cellMargin * options.gridSize[0]) - options.cellMargin;
    const h = (options.cellSize * options.gridSize[1]) + (options.cellMargin * options.gridSize[1]) - options.cellMargin;
    
    canvas.width  = w;                                                  // set size game field
    canvas.height = h;
    canvas.addEventListener("click", (e) => this.hittest(e));
    
    this.options = options;
    this.handlers = [];
    this.gameMap = [];
    this.context = canvas.getContext("2d");

    this.findPath = new FindPath();                                     // include class
    this.startGame();
};

Lines.prototype.startGame = function()
{
    const options = this.options;
    const gameMap = this.gameMap;
    
    for(let y = 0; y < options.gridSize[1]; y++)                        // create gameMap
    {
        gameMap[y] = [];
        
        for(let x = 0; x < options.gridSize[0]; x++)
        {
            const color = options.normalCellColor;

            const dx = (x * options.cellSize) + (x * options.cellMargin);
            const dy = (y * options.cellSize) + (y * options.cellMargin);
            const cx = dx + options.cellSize / 2;
            const cy = dy + options.cellSize / 2;                       // center x

            gameMap[y][x] = {
                
                ball:null, color, x, y, dx, dy, cx, cy
            };
        };
    };
    this.activeCell = null;                                             // reset current active cell
    this.score = 0;
    this.addBalls(options.countStartBall);
    this.trigger("onChangeScore", {score:this.score});
};

Lines.prototype.addBalls = function(count)
{
    const gameMap = this.gameMap;
    const color = this.options.ballColors;
    const empty = this.getEmptyCell();

    count = Math.min(count, empty.length);                              // if the count of empty cells is less than 3 (optional)

    for(let i = 0; i < count; i++)
    {
        const colorRand = Math.intRand(0, color.length-1);              // choose a random color
        const emptyRand = Math.intRand(0, empty.length-1);              // choose a random free cell

        const x = empty[emptyRand].x;
        const y = empty[emptyRand].y;
        
        empty.splice(emptyRand, 1);                                     // remove free cell

        gameMap[y][x].ball = color[colorRand];
    };

    const countLines = this.removeLines();

    if(countLines === 0)
    {
        this.render();
    };
    if(empty.length === 0) setTimeout(() => this.gameOver(), 200);
};

Lines.prototype.removeBalls = function(balls)
{
    const gameMap = this.gameMap;

    for(let i = 0; i < balls.length; i++)
    {
        const x = balls[i].x;
        const y = balls[i].y;

        gameMap[y][x].ball = null;
    };
    this.render();
};

Lines.prototype.moveBall = function(sx, sy, dx, dy)
{
    const options = this.options;
    const gameMap = this.gameMap;

    gameMap[dy][dx].ball = gameMap[sy][sx].ball;                        // copy to destination position
    gameMap[sy][sx].ball = null;                                        // remove from source position

    const countLines = this.removeLines();
    
    if(countLines === 0)
    {
        this.addBalls(options.countNextBall);
    }
    else {
        this.score += options.revenue;
        this.render();
        this.trigger("onChangeScore", {score:this.score});
    };
};

Lines.prototype.getEmptyCell = function()
{
    const gameMap = this.gameMap;
    const empty = [];                                                   // array of free cells

    for(let y = 0; y < gameMap.length; y++)
    {
        for(let x = 0; x < gameMap[0].length; x++)
        {
            const cell = gameMap[y][x];

            if(cell.ball === null)
            {
                empty.push(cell);
            };
        };
    };
    return empty;
};

Lines.prototype.removeLines = function()
{
    const horizontal = this.findRows();

    for(let i in horizontal)
    {
        this.removeBalls(horizontal[i]);
    }
    const vertical = this.findColumns();

    for(let i in vertical)
    {
        this.removeBalls(vertical[i]);
    }
    return horizontal.length + vertical.length;
};

Lines.prototype.findRows = function()
{
    const options = this.options;
    const gameMap = this.gameMap;
    const lines = [];
    
    for(let y = 0; y < gameMap.length; y++)                             // loop rows
    {
        let cells = [];

        for(let x = 0; x < gameMap[0].length - 1; x++)
        {
            const currCell = gameMap[y][x+0];
            const nextCell = gameMap[y][x+1];
            
            if(currCell.ball)                                           // in the current cell has a ball
            {
                if(cells.length === 0)                                  // init the first ball
                {
                    cells.push(currCell);
                };

                if(currCell.ball === nextCell.ball)                     // the next ball of the same color
                {       
                    cells.push(nextCell);
                }
                else {                                                  // event: "End Of Series"
                    
                    if(cells.length >= options.countMinLine)
                    {
                        lines.push(cells);                              // save the found line
                    };
                    cells = [];                                         // reset any line
                };
            };
        };
        if(cells.length >= options.countMinLine)                        // event: "End Of Row" (if the first event failed)
        {
            lines.push(cells);
        };
    };
    return lines;                                                       // return all found lines
};

Lines.prototype.findColumns = function()
{
    const options = this.options;
    const gameMap = this.gameMap;
    const lines = [];
    
    for(let x = 0; x < gameMap[0].length; x++)                          // loop columns
    {
        let cells = [];

        for(let y = 0; y < gameMap.length - 1; y++)
        {
            const currCell = gameMap[y+0][x];
            const nextCell = gameMap[y+1][x];
            
            if(currCell.ball)                                           // in the current cell has a ball
            {
                if(cells.length === 0)                                  // init the first ball
                {
                    cells.push(currCell);
                };

                if(currCell.ball === nextCell.ball)                     // the next ball of the same color
                {       
                    cells.push(nextCell);
                }
                else {                                                  // event: "End Of Series"
                    
                    if(cells.length >= options.countMinLine)
                    {
                        lines.push(cells);                              // save the found line
                    };
                    cells = [];                                         // reset any line
                };
            };
        };
        if(cells.length >= options.countMinLine)                        // event: "End Of Row" (if the first event failed)
        {
            lines.push(cells);
        };
    };
    return lines;                                                       // return all found lines
};

Lines.prototype.hittest = function(e)
{
    const options = this.options;
    const gameMap = this.gameMap;

    const x = Math.floor(e.offsetX / (options.cellSize + options.cellMargin));
    const y = Math.floor(e.offsetY / (options.cellSize + options.cellMargin));

    const ball = gameMap[y][x].ball;

    if(this.activeCell === null)                                        // new move ball
    {
        if(ball)                                                        // click on the ball
        {
            this.gameMap[y][x].color = options.activeCellColor;         // select active cell
            this.activeCell = [x, y];
            this.render();
        };
    }
    else {                                                              // active ball selected
        const sx = this.activeCell[0];
        const sy = this.activeCell[1];

        if(ball)                                                        // change active ball
        {
            this.gameMap[sy][sx].color = options.normalCellColor;
            this.gameMap[y][x].color = options.activeCellColor;
            this.activeCell = [x, y];
            this.render();
        }
        else {                                                          // click on the free cell
            const polygon = this.getPolygon();
            const pathFound = this.findPath.search(polygon, sx, sy, x, y);

            if(pathFound)                                               // passage is possible
            {   
                this.gameMap[sy][sx].color = options.normalCellColor;
                this.activeCell = null;                                 // reset active cell
                this.moveBall(sx, sy, x, y);
            };
        };
    };
};

Lines.prototype.getPolygon = function()
{
    const gameMap = this.gameMap;
    const polygon = [];
    
    for(let y = 0; y < gameMap.length; y++)                             // convert gameMap to array [0,-1]
    {
        polygon[y] = [];

        for(let x = 0; x < gameMap[0].length; x++)
        {
            polygon[y][x] = gameMap[y][x].ball ? -1 : 0;
        };
    };
    return polygon;
}

Lines.prototype.gameOver = function()
{
    alert("Game Over! \nYour result: " + this.score);
    
    this.startGame();
};

Lines.prototype.addEvent = function(type, fn)                           // subscribe event
{
    this.handlers[type] = this.handlers[type] || [];
    this.handlers[type].push(fn);
};

Lines.prototype.removeEvent = function(type, fn)                        // unsubscribe event
{
    const event = this.handlers[type] || [];
    const total = event.length;
    
    for(let i = 0; i < total; i++)
    {
        if(event[i] === fn) event.splice(i, 1);
    };
};

Lines.prototype.trigger = function(type, param)                         // event call
{
    const event = this.handlers[type] || [];
    const total = event.length;
    
    param = param || {};                                                // if the argument is not passed
    param.type = type;
    
    for(let i = 0; i < total; i++)
    {
        event[i].call(null, param);
    };
};

Lines.prototype.render = function()
{
    const options = this.options;
    const gameMap = this.gameMap;
    const context = this.context;

    const w = context.canvas.width;
    const h = context.canvas.height;

    context.clearRect(0, 0, w, h);                                      // clear game field

    for(let y = 0; y < gameMap.length; y++)
    {
        for(let x = 0; x < gameMap[y].length; x++)
        {
            const size = options.cellSize;
            const cell = gameMap[y][x];
            const dx   = cell.dx;
            const dy   = cell.dy;
            
            context.beginPath();                                        // draw cells
            context.fillStyle = cell.color;
            context.fillRect(dx, dy, size, size);
            context.fill();

            if(cell.ball)                                               // draw balls
            {
                const cx = cell.cx;
                const cy = cell.cy;
                
                context.shadowOffsetY = 1;
                context.shadowColor = "rgba(0,0,0,0.5)";
                context.fillStyle = cell.ball;
                context.arc(cx, cy, options.ballRadius, Math.PI*2, false);
                context.fill();
            };
        };
    };
};

Math.intRand = function(min, max)                                       // custom random method
{
    return Math.floor(min + Math.random() * (max + 1 - min));
};