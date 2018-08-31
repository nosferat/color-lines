"use strict";
/*
    [0 -1  0  0  0  0  0  0  0]
    [0 -1  0 -1 -1 -1 -1 -1  0]
    [0 -1  0  0  0  0  0  0  0]
    [0 -1 -1 -1 -1 -1  0 -1  0]
    [0 -1  0  0  0  0  0 -1  0]
    [0 -1  0 -1 -1 -1  0 -1  0]
    [0  0  0 -1  0  0  0 -1  0]
    [0  0  0 -1  0  0  0 -1  0]
    [0  0  0 -1  0  0  0 -1 -1]

    array - two-dimensional array with values 0 and -1;

     0 - passageway
    -1 - wall

    sx, sy - point A (source)
    dx, dy - point B (destination)
*/

function FindPath() {};

FindPath.prototype.search = function(map, sx, sy, dx, dy)
{
    if(sx === dx && sy === dy)
    {
        return false;                                           // start and end position are the same
    };
    
    const direction = [[-1,0], [1,0], [0,-1], [0,1]];           // [L R T B] directions of neighboring cells

    this.array = this.deepCopy(map);
    this.array[sy][sx] = null;                                  // mark the starting cell
    
    this.queue = [];                                            // stack queue
    this.queue.push([sx, sy]);
    
    while(this.queue.length > 0)
    {
        const current = this.queue.shift();
        
        const cx = current[0];                                  // current x
        const cy = current[1];

        const weight = this.array[cy][cx];                      // weight of the current cell

        for(let i = 0; i < direction.length; i++)               // search for neighboring cells
        {
            const nx = cx + direction[i][0];                    // next x
            const ny = cy + direction[i][1];

            if(nx === dx && ny === dy)
            {
                this.array[ny][nx] = weight + 1;
                
                return this.restorePath(dx, dy);                // path found - stop searching
            };

            if(this.inArray(nx, ny).weight === 0)               // this cell is not yet viewed
            {
                this.queue.push([nx, ny]);
                this.array[ny][nx] = weight + 1;
            };
        };
    };
    return false;                                               // all possible neighbors have already been viewed - but the path is not found
};

FindPath.prototype.restorePath = function(dx, dy)
{
    const direction = [[0,-1], [1,0], [0,1], [-1,0]];           // [T R B L]

    this.backway = [];
    this.backway.push([dx, dy]);                                // start with end position

    while(true)
    {
        const current = this.backway.slice(-1)[0];

        const cx = current[0];
        const cy = current[1];

        const weight = this.array[cy][cx];                      // weight of the current cell

        for(let i = 0; i < direction.length; i++)               // search for neighboring cells
        {
            const nx = cx + direction[i][0];                    // next position
            const ny = cy + direction[i][1];

            const neighbor = this.inArray(nx, ny);

            if(neighbor.weight === null)                        // the starting position has been reached
            {
                this.backway.push([nx, ny]);
                
                return this.backway.reverse();
            };
            
            if(neighbor.weight > 0 && neighbor.weight < weight)
            {
                this.backway.push([nx, ny]);
                
                break;
            };
        };
    };
};

FindPath.prototype.inArray = function(cx, cy)
{
    const wmax = this.array[0].length;
    const hmax = this.array.length;

    if(cx >= 0 && cx < wmax && cy >= 0 && cy < hmax)
    {
        return {weight: this.array[cy][cx]};
    };
    return {weight: -1};
};

FindPath.prototype.deepCopy = function(array)
{
    return array.map(val => val.slice(0));                      // copy 2D array
};