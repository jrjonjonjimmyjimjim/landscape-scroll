const CONSTANTS = {
    FPS_TARGET: 60,
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
        publicVars.scrollOffset--;

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
    
    const grass1 = document.getElementById('sprite_grass_1');
    const grass2 = document.getElementById('sprite_grass_2');
    const grass3 = document.getElementById('sprite_grass_3');
    const grass4 = document.getElementById('sprite_grass_4');
    const grassSprites = [grass1, grass2, grass3, grass4];
    
    const dirt1 = document.getElementById('sprite_dirt_1');
    const dirt2 = document.getElementById('sprite_dirt_2');
    const dirt3 = document.getElementById('sprite_dirt_3');
    const dirt4 = document.getElementById('sprite_dirt_4');
    const dirtSprites = [dirt1, dirt2, dirt3, dirt4];

    const redFlower1 = document.getElementById('sprite_flower_red_1');
    const redFlower2 = document.getElementById('sprite_flower_red_2');
    const yellowFlower1 = document.getElementById('sprite_flower_yellow_1');
    const yellowFlower2 = document.getElementById('sprite_flower_yellow_2');
    const violetFlower1 = document.getElementById('sprite_flower_violet_1');
    const violetFlower2 = document.getElementById('sprite_flower_violet_2');
    const plantSprites = [redFlower1, redFlower2, yellowFlower1, yellowFlower2, violetFlower1, violetFlower2];
    
    for (let i = 0; i < tileColumnsToGenerate; i++) {
        const grassToDraw = grassSprites[getRandomInt(4)];
        landscapeBufferRenderQueue.push({ image: grassToDraw, x: i, y: publicVars.groundY });
        for (let j = 1; j <= 20; j++) {
            const dirtToDraw = dirtSprites[getRandomInt(4)];
            landscapeBufferRenderQueue.push({ image: dirtToDraw, x: i, y: publicVars.groundY + j });
        }
        const placePlant = Math.random() < 0.1;
        if (placePlant) {
            const plantToDraw = plantSprites[getRandomInt(6)];
            landscapeBufferRenderQueue.push({ image: plantToDraw, x: i, y: publicVars.groundY });
        }
        const changeGroundHeight = Math.random() < 0.25;
        if (changeGroundHeight) {
            const stepUp = Math.random() < (0.5 + ((publicVars.groundY - CONSTANTS.GROUND_Y_TARGET) / 50));
            if (stepUp) {
                publicVars.groundY--;
            } else {
                publicVars.groundY++;
            }
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