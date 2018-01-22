
"use strict";

// 2dminesweeper.
// (c) sebastian lin. 2018
// 2018.1.21, 2018.1.22

const MINE_REVEALED = -1;
const NOTHING = 0;
const MINE_NOT_MARKED = 1;
const NOTHING_MARKED = 2;
const MINE_MARKED = 3;
const NOTHING_REVEALED = 5;
// NOTHING_NUMBER_? = ? + 5;


// this is for the map generating process.
const MINE = 1;

// and this is for the display.
const X_PADDING = 50;
const Y_PADDING = 50;

const minesweeper = {
    // resources & constants.
    gamestarted: true,
    dirvector: [[-1,0,1,-1,1,-1,0,1],[-1,-1,-1,0,0,1,1,1]],
    // default to 10x10 map with 10 mine.
    cellsize: 20,
    mapwidth: 10,
    mapheight: 10,
    minecount: 10,
    mineremaining: 10,
    mismark: 0,
    unknowntile: 100,
    minemap: [],
    minegen: () => { // generating MINE / NOTHING
        let possibility = minesweeper.minecount / (minesweeper.mapwidth * minesweeper.mapheight);
        return (
            Math.random() >= possibility?
            NOTHING
            :MINE
        );
    },
    mapgen: () => {
        let minecount = minesweeper.minecount,
            mapwidth = minesweeper.mapwidth,
            mapheight = minesweeper.mapheight;
        let currentMinecount = minecount,
            possibility = minecount / (mapwidth * mapheight);
        for(let i = 0; i < mapheight; i++) {
            let currentrow = [];
            for(let j = 0; j < mapwidth; j++) {
                let mine = minesweeper.minegen();
                if(currentMinecount > 0){
                    if(mine === MINE){
                        currentMinecount --;
                        currentrow.push(mine);
                    } else currentrow.push(NOTHING);
                } else currentrow.push(NOTHING);
            }
            minesweeper.minemap.push(currentrow);
        }
        
        // keep generating till all mines are generated.
        while(currentMinecount > 0) {
            for(let y = 0; y < mapheight; y++) {
                for(let x = 0; x < mapwidth; x++) {
                    if(minesweeper.minemap[y][x] === NOTHING) {
                        let mine = minesweeper.minegen();
                        if(currentMinecount > 0 && mine === MINE){
                            currentMinecount--;
                            minesweeper.minemap[y][x] = mine;
                        }
                    }
                }
            }
        }
    },
    init: (config) => {
        minesweeper.mapwidth = config.mapwidth;
        minesweeper.mapheight = config.mapheight;
        minesweeper.minecount = config.minecount;
        minesweeper.mineremaining = config.minecount;
        minesweeper.mapgen();
    },
    mark: (x, y) => {
        if(minesweeper.gamestarted === false)return undefined;
        let target = minesweeper.minemap[y][x];
        if(target >= NOTHING_REVEALED);
        else if(target === NOTHING) {
            minesweeper.minemap[y][x] = NOTHING_MARKED;
            minesweeper.mismark++;
            minesweeper.unknowntile--;
        } else if(target === MINE_NOT_MARKED) {
            minesweeper.minemap[y][x] = MINE_MARKED;
            minesweeper.mineremaining--;
            minesweeper.unknowntile--;
        } else if(target === NOTHING_MARKED) {
            minesweeper.minemap[y][x] = NOTHING;
            minesweeper.mismark--;
            minesweeper.unknowntile++;
        } else if(target === MINE_MARKED) {
            minesweeper.minemap[y][x] = MINE_NOT_MARKED;
            minesweeper.mineremaining++;
            minesweeper.unknowntile++;
        }
    },
    reveal: (x, y) => {
        if(minesweeper.gamestarted === false)return undefined;
        const NOT_CAPABLE = -2;
        let checkSingl = (x, y) => {
            switch(minesweeper.minemap[y][x]) {
                case NOTHING:{
                    // check mines in the neighbourhood.
                    let neighbourhood = 0;
                    for(let d = 0; d < 8; d++) {
                        let newX = x + minesweeper.dirvector[0][d],
                            newY = y + minesweeper.dirvector[1][d];
                        if(newX >= 0 && newX < minesweeper.mapwidth
                            && newY >= 0 && newY < minesweeper.mapheight) {
                            if(minesweeper.minemap[newY][newX] === MINE_NOT_MARKED
                                || minesweeper.minemap[newY][newX] === MINE_MARKED
                            ) {
                                neighbourhood++;
                            }
                        }
                    }
                    return neighbourhood + NOTHING_REVEALED;
                }
                case MINE_MARKED: case MINE_NOT_MARKED:{
                    return MINE;
                }
                default:{
                    // do nothing.
                    return NOT_CAPABLE;
                }
            }
        };
        if(minesweeper.minemap[y][x] >= NOTHING_REVEALED)return undefined;
        if(minesweeper.minemap[y][x] === MINE_MARKED
            || minesweeper.minemap[y][x] === MINE_NOT_MARKED) {
            minesweeper.minemap[y][x] = MINE_REVEALED;
            return MINE;
        }
        // your typical bfs here.
        let workingset = [], visited = {};
        workingset.unshift([x, y]);
        while(workingset.length != 0){
            let pivot = workingset.pop();
            if(!(visited[pivot] === undefined))continue;
            let checkResult = checkSingl(pivot[0], pivot[1]);
            switch(checkResult){
                case MINE:{
                    continue;
                }
                case NOT_CAPABLE:{
                    continue;
                }
                default:{
                    minesweeper.minemap[pivot[1]][pivot[0]] = checkResult;
                    minesweeper.unknowntile--;
                }
            }
            visited[pivot] = true;
            for(let i = 0; i < 8; i++) {
                let newX = pivot[0] + minesweeper.dirvector[0][i],
                    newY = pivot[1] + minesweeper.dirvector[1][i];
                if(newX < 0 || newX >= minesweeper.mapwidth
                    || newY < 0 || newY >= minesweeper.mapheight)continue;
                workingset.unshift([newX, newY]);
            }
        }
        return NOTHING_REVEALED;
    },
    paintCell: (repStr, x, y) => {
        let cellsize = minesweeper.cellsize;
        stroke(255); fill(0);
        rect(x, y, cellsize, cellsize);
        stroke(0); fill(255);
        // this /3 & /3*2 stuff is tested on my machine only
        text(repStr, x + cellsize / 3, y + cellsize / 3 * 2);
    },
    refreshCanvas: () => {
        for(let y = 0; y < minesweeper.mapheight; y++) {
            for(let x = 0; x < minesweeper.mapwidth; x++) {
                let repStr = "";
                switch(minesweeper.minemap[y][x]){
                    case NOTHING: case MINE_NOT_MARKED:{
                        repStr = "?";
                        break;
                    }
                    case MINE_MARKED: case NOTHING_MARKED:{
                        repStr = "X";
                        break;
                    }
                    case MINE_REVEALED:{
                        repStr = "!";
                        break;
                    }
                    default:{
                        let neighbourhood = minesweeper.minemap[y][x] - 5;
                        repStr = "" + (neighbourhood === 0? " " : neighbourhood);
                        break;
                    }
                }
                let cellsize = minesweeper.cellsize;
                minesweeper.paintCell(repStr,
                                      x * cellsize + X_PADDING,
                                      y * cellsize + Y_PADDING);
            }
        }
    }
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    minesweeper.init({
        mapwidth: 10,
        mapheight: 10,
        minecount: 10
    });
}

function draw() {
    background(0);
    stroke(255);
    fill(0);
    // TODO: draw the board & event handling.
    minesweeper.refreshCanvas();
}

function mouseClicked() {
    let cellsize = minesweeper.cellsize,
        realX = Math.floor((mouseX - X_PADDING) / cellsize),
        realY = Math.floor((mouseY - Y_PADDING) / cellsize);
    if(mouseButton === LEFT) {
        if(keyIsDown(SHIFT)) {
            minesweeper.mark(realX, realY);
            if(minesweeper.mineremaining === 0
                && minesweeper.mismark === 0
                && minesweeper.unknowntile === 0
            ){
                minesweeper.gamestarted = false;
                alert("you get all the mines. u win.");
            }
        } else {
            let revealResult = minesweeper.reveal(realX, realY);
            if(revealResult === MINE) {
                minesweeper.gamestarted = false;
                alert("boom. u lose.");
            }
        }
        if(minesweeper.mineremaining === 0
            && minesweeper.mismark === 0
            && minesweeper.unknowntile === 0
        ){
            minesweeper.gamestarted = false;
            alert("you get all the mines. u win.");
        }
    }
}
