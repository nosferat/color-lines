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
    canvas.addEventListener("click", (e) => this.hitTest(e));
    
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
    this.lastBall = [];
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

        this.lastBall = [x,y];

        this.removeLines();                                             // remove lines around each new ball
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

Lines.prototype.moveBall = async function(path)
{
    const options = this.options;
    const gameMap = this.gameMap;

    for(let i = 0; i < path.length - 1; i++)                            // visualization of moving the ball
    {
        const sx = path[i+0][0];
        const sy = path[i+0][1];
        const dx = path[i+1][0];
        const dy = path[i+1][1];

        gameMap[dy][dx].ball = gameMap[sy][sx].ball;                    // copy to destination position
        gameMap[sy][sx].ball = null;                                    // remove from source position
        
        this.lastBall = [dx,dy];
        this.render();

        await this.sleep(30);
    };

    const countLines = this.removeLines();
    
    if(countLines === 0)
    {
        this.addBalls(options.countNextBall);
    }
    else {                                                              // not add new balls
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
    const options = this.options;
    const gameMap = this.gameMap;
    const self = this;

    const cx = this.lastBall[0];                                        // last added or moved ball
    const cy = this.lastBall[1];
    
    let countLines = 0;

    const direction = {                                                 // sequence affects the priority queue:

        H: [-1, 0, 1, 0],                                               // [ — ] - horizontal ([0,1][2,3] - negative and positive direction)
        V: [ 0,-1, 0, 1],                                               // [ | ] - vertical
        D: [-1,-1, 1, 1],                                               // [ \ ] - main diagonal
        A: [ 1,-1,-1, 1],                                               // [ / ] - anti-diagonal
    };

    for(let i in direction)
    {
        const balls = [];

        balls.push(gameMap[cy][cx]);                                    // init the first ball

        function findLine(dx, dy, x, y)
        {
            while(true)
            {
                dx += direction[i][x];
                dy += direction[i][y];
                
                if(self.inArray(dx, dy))
                {
                    const neighbor = self.compare(cx, cy, dx, dy);
                    
                    if(neighbor)                                        // adjacent ball of the same color
                    {
                        balls.push(neighbor);
                    }
                    else break;                                         // adjacent ball of a different color
                }
                else break;                                             // this is the exit beyond the array
            };
        };

        findLine(cx, cy, 0, 1);                                         // negative search from current position
        findLine(cx, cy, 2, 3);                                         // positive search

        if(balls.length >= options.countMinLine)                        // minimum line length
        {
            this.removeBalls(balls);
            
            countLines++;
        };
    };
    return countLines;                                                  // count of lines found
};

Lines.prototype.hitTest = function(e)
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
            const path = this.findPath.search(polygon, sx, sy, x, y);

            if(path)                                                    // passage is possible
            {
                this.gameMap[sy][sx].color = options.normalCellColor;
                this.activeCell = null;                                 // reset active cell
                this.moveBall(path);
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

Lines.prototype.inArray = function(cx, cy)
{
    const gameMap = this.gameMap;

    const wmax = gameMap[0].length;
    const hmax = gameMap.length;

    return cx >= 0 && cx < wmax && cy >= 0 && cy < hmax;
};

Lines.prototype.compare = function(cx, cy, dx, dy)
{
    const gameMap = this.gameMap;

    const A = gameMap[cy][cx]["ball"];
    const B = gameMap[dy][dx]["ball"];

    if((A !== null) && (A === B))
    {
        return gameMap[dy][dx];
    }
    return false;
};

Lines.prototype.sleep = function(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
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