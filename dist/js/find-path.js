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
    const direction = [[-1,0], [1,0], [0,-1], [0,1]];           // directions of neighboring cells

    this.array = map.slice();                                   // copy array
    this.array[sy][sx] = null;                                  // mark the starting cell
    
    this.queue = [];                                            // stack queue
    this.queue.push([sx, sy]);                                  // add the first task

    let pathFound = false;
    
    while(this.queue.length > 0)
    {
        const current = this.queue.shift();

        const cx = current[0];                                  // current cell
        const cy = current[1];

        const weight = this.array[cy][cx] + 1;                  // weight of the current cell

        if(cx === dx && cy === dy)                              // path found - stop searching
        {
            pathFound = true; break;
        }
        else {                                                  // path not found yet

            for(let i = 0; i < direction.length; i++)           // search for neighboring cells
            {
                const nx = cx + direction[i][0];
                const ny = cy + direction[i][1];
                
                if(this.getWeight(nx, ny) === 0)                // this cell is not yet viewed
                {
                    this.queue.push([nx, ny]);
                    this.array[ny][nx] = weight;
                };
            };
        };
    };
    if(pathFound) return true;
    
    return false;
};

FindPath.prototype.getWeight = function(x, y)
{
    const w = this.array[0].length;
    const h = this.array.length;

    if(x >= 0 && x < w && y >= 0 && y < h)
    {
        return this.array[y][x];                                // element within the array - return value
    };
    return false;                                               // element outside the array
};