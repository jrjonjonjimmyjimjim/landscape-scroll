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

function loadSpriteArray(spriteIds) {
    const spriteArray = [];
    for (let i = 0; i < spriteIds.length; i++) {
        spriteArray.push(document.getElementById(spriteIds[i]));
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
    const tileColumnsToGenerate = buffer.width / CONSTANTS.TILE_DIMENSION_IN_PIXELS;

    const grassSprites = loadSpriteArray(['sprite_grass_1', 'sprite_grass_2', 'sprite_grass_3', 'sprite_grass_4']);
    const downslopeSprites = loadSpriteArray(['sprite_grass_downslope_1', 'sprite_grass_downslope_2']);
    const upslopeSprites = loadSpriteArray(['sprite_grass_upslope_1', 'sprite_grass_upslope_2']);
    const dirtSprites = loadSpriteArray(['sprite_dirt_1', 'sprite_dirt_2', 'sprite_dirt_3', 'sprite_dirt_4']);
    const plantSprites = loadSpriteArray(['sprite_flower_red_1', 'sprite_flower_red_2', 'sprite_flower_yellow_1', 'sprite_flower_yellow_2', 'sprite_flower_violet_1', 'sprite_flower_violet_2']);
    const largePlantSprites = loadSpriteArray(['sprite_tree_1', 'sprite_tree_2', 'sprite_tree_dead_1', 'sprite_tree_dead_2']); // 4 tiles wide
    
    let emptyGrassRequested = 0;
    for (let i = 0; i < tileColumnsToGenerate; i++) {
        let dirtStartY = publicVars.groundY + 1;
        const changeGroundHeight = Math.random() < 0.25;
        // TODO: There's likely a more elegant way to force flat ground in subsequent loops
        if (emptyGrassRequested === 0 && changeGroundHeight) {
            const stepUp = Math.random() < (0.5 + ((publicVars.groundY - CONSTANTS.GROUND_Y_TARGET) / 50));
            if (stepUp) {
                const upslopeToDraw = getRandomArrayEntry(upslopeSprites);
                landscapeBufferRenderQueue.push({ image: upslopeToDraw, x: i, y: publicVars.groundY })
                publicVars.groundY--;
            } else {
                dirtStartY++;
                publicVars.groundY++;
                const downslopeToDraw = getRandomArrayEntry(downslopeSprites);
                landscapeBufferRenderQueue.push({ image: downslopeToDraw, x: i, y: publicVars.groundY })
            }
        } else {
            const placeLargePlant = Math.random() < 0.1;
            if (emptyGrassRequested === 0 && tileColumnsToGenerate - i > 4 && placeLargePlant) {
                const largePlantToDraw = getRandomArrayEntry(largePlantSprites);
                landscapeBufferRenderQueue.push({ image: largePlantToDraw, x: i, y: publicVars.groundY - 15 });
                emptyGrassRequested = 4;
            }
            const grassToDraw = getRandomArrayEntry(grassSprites);
            landscapeBufferRenderQueue.push({ image: grassToDraw, x: i, y: publicVars.groundY });

            const placePlant = Math.random() < 0.1;
            if (emptyGrassRequested === 0 && placePlant) {
                const plantToDraw = getRandomArrayEntry(plantSprites);
                landscapeBufferRenderQueue.push({ image: plantToDraw, x: i, y: publicVars.groundY });
            }
        }
        const dirtRowsToGenerate = ((publicVars.canvas.height / 2) / CONSTANTS.TILE_DIMENSION_IN_PIXELS) - dirtStartY;
        for (let j = 0; j < dirtRowsToGenerate; j++) {
            const dirtToDraw = getRandomArrayEntry(dirtSprites);
            landscapeBufferRenderQueue.push({ image: dirtToDraw, x: i, y: dirtStartY + j });
        }

        if (emptyGrassRequested > 0) {
            emptyGrassRequested -= 1;
        }
    }
    
    const bufferContext = buffer.getContext('2d');
    bufferContext.clearRect(0, 0, buffer.width, buffer.height);
    const bufferHalfHeight = Math.floor(buffer.height / 2);
    for (const sprite of landscapeBufferRenderQueue) {
        bufferContext.drawImage(sprite.image, (sprite.x * 32), (sprite.y * 32) + bufferHalfHeight);
    }
}

function restartRender() {
    publicVars.canvas.width = window.innerWidth;
    publicVars.canvas.height = window.innerHeight;

    publicVars.leavingBuffer = null;
    publicVars.enteringBuffer = null;
    publicVars.groundY = CONSTANTS.GROUND_Y_TARGET;
    publicVars.scrollOffset = -50;
    const minimumBufferWidth = Math.ceil(publicVars.canvas.width / 32) * 32;
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