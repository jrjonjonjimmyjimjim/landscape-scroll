const CONSTANTS = {
    FPS_TARGET: 60,
    SCROLL_SPEED: 1,
    TILE_DIMENSION_IN_PIXELS: 32,
    GROUND_Y_TARGET: 8,
};

CONSTANTS.FPS_INTERVAL = 1000 / CONSTANTS.FPS_TARGET;

const publicVars = {
    canvas: document.getElementById('backgroundCanvas'),
    canvasContext: document.getElementById('backgroundCanvas').getContext('2d', { alpha: false }),
    animationFrameId: undefined, // To store the requestAnimationFrame ID for cleanup
    previousRenderTime: undefined,
    leavingBuffer: undefined,
    enteringBuffer: undefined,
    groundY: undefined,
    scrollOffset: undefined,
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomArrayEntry(array) {
    return array[getRandomInt(array.length)];
}

/**
 * 
 * @param {Array<{weight: number, entry: any}>} array 
 * @returns any
*/
function getWeightedArrayEntry(array) {
    const randomDecimal = Math.random();
    let accumulatedDecimal = 0;
    for (let i = 0; i < array.length; i++) {
        const currentEntry = array[i];
        accumulatedDecimal += currentEntry.weight;
        if (accumulatedDecimal > randomDecimal) {
            return currentEntry.entry;
        }
    }
}

function loadSpriteArray(spriteIds) {
    const spriteArray = [];
    for (let i = 0; i < spriteIds.length; i++) {
        spriteArray.push(document.getElementById(spriteIds[i]))
    }
    return spriteArray;
}

function drawCanvasContent() {
    publicVars.canvasContext.clearRect(0, 0, publicVars.canvas.width, publicVars.canvas.height);
    
    const gradient = publicVars.canvasContext.createLinearGradient(0, 0, 0, publicVars.canvas.height);
    gradient.addColorStop(0, '#c8f3ffff');
    gradient.addColorStop(1, '#63b9ffff');
    
    publicVars.canvasContext.fillStyle = gradient;
    publicVars.canvasContext.fillRect(0, 0, publicVars.canvas.width, publicVars.canvas.height);
    
    publicVars.canvasContext.drawImage(publicVars.leavingBuffer, publicVars.scrollOffset, 0);
    publicVars.canvasContext.drawImage(publicVars.enteringBuffer, publicVars.scrollOffset + publicVars.leavingBuffer.width, 0);
}

function animate() {
    const currentRenderTime = Date.now();
    const elapsedRenderTime = currentRenderTime - publicVars.previousRenderTime;
    
    if (elapsedRenderTime > CONSTANTS.FPS_INTERVAL) {
        publicVars.previousRenderTime = currentRenderTime - (elapsedRenderTime % CONSTANTS.FPS_INTERVAL);
        drawCanvasContent();
        publicVars.scrollOffset -= CONSTANTS.SCROLL_SPEED;

        if (publicVars.scrollOffset + publicVars.leavingBuffer.width < 0) {
            generateLandscapeBuffers();
            publicVars.scrollOffset = 0;
        }
    }
    publicVars.animationFrameId = requestAnimationFrame(animate);
}

function generateLandscapeBuffers() {
    if (publicVars.leavingBuffer !== null) {
        generateLandscapeBuffer(publicVars.leavingBuffer);
        const newEnteringBuffer = publicVars.leavingBuffer;
        publicVars.leavingBuffer = publicVars.enteringBuffer;
        publicVars.enteringBuffer = newEnteringBuffer;
        return;
    }
    generateLandscapeBuffer(publicVars.canvas.landscapeBuffer1);
    generateLandscapeBuffer(publicVars.canvas.landscapeBuffer2);
    publicVars.leavingBuffer = publicVars.canvas.landscapeBuffer1;
    publicVars.enteringBuffer = publicVars.canvas.landscapeBuffer2;
}

function generateLandscapeBuffer(buffer) {
    const landscapeBufferRenderQueue = [];
    const tileColumnsToGenerate = Math.ceil(buffer.width / CONSTANTS.TILE_DIMENSION_IN_PIXELS);

    const grassSprites = loadSpriteArray(['sprite_grass_1', 'sprite_grass_2', 'sprite_grass_3', 'sprite_grass_4']);
    const downslopeSprites = loadSpriteArray(['sprite_grass_downslope_1', 'sprite_grass_downslope_2']);
    const upslopeSprites = loadSpriteArray(['sprite_grass_upslope_1', 'sprite_grass_upslope_2']);
    const dirtSprites = loadSpriteArray(['sprite_dirt_1', 'sprite_dirt_2', 'sprite_dirt_3', 'sprite_dirt_4']);
    const flowerSprites = loadSpriteArray(['sprite_flower_red_1', 'sprite_flower_red_2', 'sprite_flower_yellow_1', 'sprite_flower_yellow_2', 'sprite_flower_violet_1', 'sprite_flower_violet_2']);
    const treeSprites = loadSpriteArray(['sprite_tree_1', 'sprite_tree_2']);
    const deadTreeSprites = loadSpriteArray(['sprite_tree_dead_1', 'sprite_tree_dead_2']);
    const largePlantSprites = loadSpriteArray(['sprite_berry_bush_blue', 'sprite_berry_bush_red']);
    const boulderSprites = loadSpriteArray(['sprite_boulder_1', 'sprite_boulder_2']);
    
    function _addGrass({ xStart, xEnd, y }) {
        for (let x = xStart; x < xEnd; x++) {
            const grassToDraw = getRandomArrayEntry(grassSprites);
            landscapeBufferRenderQueue.push({ image: grassToDraw, x, y });
        }
    }

    function _addDirt({ xStart, xEnd, yStart }) {
        const dirtRowsToGenerate = Math.ceil(((publicVars.canvas.height / 2) / CONSTANTS.TILE_DIMENSION_IN_PIXELS) - yStart);
        for (let x = xStart; x < xEnd; x++) {
            for (let i = 0; i <= dirtRowsToGenerate; i++) {
                const dirtToDraw = getRandomArrayEntry(dirtSprites);
                landscapeBufferRenderQueue.push({ image: dirtToDraw, x, y: yStart + i });
            }
        }
    }

    const LANDSCAPE_OBJECTS = [
        {
            weight: 0.4,
            entry: flowerSprites,
        },
        {
            weight: 0.2,
            entry: treeSprites,
        },
        {
            weight: 0.2,
            entry: largePlantSprites,
        },
        {
            weight: 0.1,
            entry: deadTreeSprites,
        },
        {
            weight: 0.1,
            entry: boulderSprites,
        }
    ]

    const ACTIONS = [
        { // Step up
            weight: 0.125,
            entry: ({ x }) => {
                const cancelStep = Math.random() > (1 + ((publicVars.groundY - CONSTANTS.GROUND_Y_TARGET) / 10));
                if (cancelStep) {
                    _addGrass({ xStart: x, xEnd: x + 1, y: publicVars.groundY });
                    _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                    return 1;
                }
                const upslopeToDraw = getRandomArrayEntry(upslopeSprites);
                landscapeBufferRenderQueue.push({ image: upslopeToDraw, x, y: publicVars.groundY })
                _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                publicVars.groundY--;
                return 1;
            },
        },
        { // Step down
            weight: 0.125,
            entry: ({ x }) => {
                const cancelStep = Math.random() < ((publicVars.groundY - CONSTANTS.GROUND_Y_TARGET) / 10);
                if (cancelStep) {
                    _addGrass({ xStart: x, xEnd: x + 1, y: publicVars.groundY });
                    _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                    return 1;
                }
                publicVars.groundY++;
                const downslopeToDraw = getRandomArrayEntry(downslopeSprites);
                landscapeBufferRenderQueue.push({ image: downslopeToDraw, x, y: publicVars.groundY })
                _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                return 1;
            },
        },
        { // Plant an object
            weight: 0.25,
            entry: ({ x }) => {
                const objectToDraw = getRandomArrayEntry(getWeightedArrayEntry(LANDSCAPE_OBJECTS));
                const objectTileWidth = objectToDraw.width / CONSTANTS.TILE_DIMENSION_IN_PIXELS;
                if (x + objectTileWidth >= tileColumnsToGenerate) {
                    _addGrass({ xStart: x, xEnd: x + 1, y: publicVars.groundY });
                    _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                    return 1;
                }
                landscapeBufferRenderQueue.push({ image: objectToDraw, x, y: publicVars.groundY })
                _addGrass({ xStart: x, xEnd: x + objectTileWidth, y: publicVars.groundY });
                _addDirt({ xStart: x, xEnd: x + objectTileWidth, yStart: publicVars.groundY + 1 });
                return objectTileWidth;
            },
        },
        { // Plant grass in remaining cases
            weight: 1,
            entry: ({ x }) => {
                _addGrass({ xStart: x, xEnd: x + 1, y: publicVars.groundY });
                _addDirt({ xStart: x, xEnd: x + 1, yStart: publicVars.groundY + 1 });
                return 1;
            },
        }
    ]

    let currentBufferX = 0;
    while (currentBufferX < tileColumnsToGenerate) {
        const columnsGenerated = (getWeightedArrayEntry(ACTIONS))({ x: currentBufferX });
        currentBufferX += columnsGenerated;
    }
    
    const bufferContext = buffer.getContext('2d');
    bufferContext.clearRect(0, 0, buffer.width, buffer.height);
    const bufferHalfHeight = Math.floor(buffer.height / 2);
    for (const sprite of landscapeBufferRenderQueue) {
        const spriteTileHeight = sprite.image.height / CONSTANTS.TILE_DIMENSION_IN_PIXELS;
        bufferContext.drawImage(sprite.image, (sprite.x * CONSTANTS.TILE_DIMENSION_IN_PIXELS), ((sprite.y - spriteTileHeight) * CONSTANTS.TILE_DIMENSION_IN_PIXELS) + bufferHalfHeight);
    }
}

function restartRender() {
    publicVars.canvas.width = window.innerWidth;
    publicVars.canvas.height = window.innerHeight;

    publicVars.leavingBuffer = null;
    publicVars.enteringBuffer = null;
    publicVars.groundY = CONSTANTS.GROUND_Y_TARGET;
    publicVars.scrollOffset = -50;
    const minimumBufferWidth = Math.ceil(publicVars.canvas.width / CONSTANTS.TILE_DIMENSION_IN_PIXELS) * CONSTANTS.TILE_DIMENSION_IN_PIXELS;
    publicVars.canvas.landscapeBuffer1 = new OffscreenCanvas(minimumBufferWidth, publicVars.canvas.height);
    publicVars.canvas.landscapeBuffer2 = new OffscreenCanvas(minimumBufferWidth, publicVars.canvas.height);
    generateLandscapeBuffers();
    publicVars.previousRenderTime = Date.now();
}

window.onload = function() {
    restartRender();
    animate();
};

const debouncedRender = debounce(restartRender, 500);

window.addEventListener('resize', () => {
    debouncedRender();
});

// Stolen from Google Gemini
// But they probably stole it from some random github repo so fair's fair
function debounce(func, delay) {
  let timeoutId;

  return function(...args) {
    const context = this;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(publicVars.animationFrameId);
});