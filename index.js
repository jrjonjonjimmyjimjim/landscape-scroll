const FPS_TARGET = 60;
const FPS_INTERVAL = 1000 / FPS_TARGET;

const TILE_DIMENSION_IN_PIXELS = 32;
const GROUND_Y_TARGET = 10;

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

let animationFrameId; // To store the requestAnimationFrame ID for cleanup
let previousRenderTime;

let leavingBuffer = null;
let enteringBuffer = null;
let groundY = GROUND_Y_TARGET;
let scrollOffset = -50;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function drawCanvasContent() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a linear gradient for a subtle background effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e0f2f7'); // Light blue
    gradient.addColorStop(0.5, '#c8e6c9'); // Light green
    gradient.addColorStop(1, '#bbdefb'); // Another light blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(leavingBuffer, scrollOffset, 0);
    ctx.drawImage(enteringBuffer, scrollOffset + leavingBuffer.width, 0);
}

function animate() {
    const currentRenderTime = Date.now();
    const elapsedRenderTime = currentRenderTime - previousRenderTime;
    
    if (elapsedRenderTime > FPS_INTERVAL) {
        previousRenderTime = currentRenderTime - (elapsedRenderTime % FPS_INTERVAL);
        drawCanvasContent();
        scrollOffset--;

        if (scrollOffset + enteringBuffer.width < 0) {
            generateLandscapeBuffers();
            scrollOffset = 0;
        }
    }
    animationFrameId = requestAnimationFrame(animate);
}

function generateLandscapeBuffers() {
    if (leavingBuffer !== null) {
        generateLandscapeBuffer(leavingBuffer);
        const newEnteringBuffer = leavingBuffer;
        leavingBuffer = enteringBuffer;
        enteringBuffer = newEnteringBuffer;
        return;
    }
    generateLandscapeBuffer(canvas.landscapeBuffer1);
    generateLandscapeBuffer(canvas.landscapeBuffer2);
    leavingBuffer = canvas.landscapeBuffer1;
    enteringBuffer = canvas.landscapeBuffer2;
}

function generateLandscapeBuffer(buffer) {
    const landscapeBufferRenderQueue = [];
    const tileColumnsToGenerate = Math.ceil(canvas.width) / TILE_DIMENSION_IN_PIXELS;
    
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
    const blueFlower1 = document.getElementById('sprite_flower_blue_1');
    const blueFlower2 = document.getElementById('sprite_flower_blue_2');
    const plantSprites = [redFlower1, redFlower2, yellowFlower1, yellowFlower2, blueFlower1, blueFlower2];
    
    for (let i = 0; i < tileColumnsToGenerate; i++) {
        const grassToDraw = grassSprites[getRandomInt(4)];
        landscapeBufferRenderQueue.push({ image: grassToDraw, x: i, y: groundY });
        for (let j = 1; j <= 20; j++) {
            const dirtToDraw = dirtSprites[getRandomInt(4)];
            landscapeBufferRenderQueue.push({ image: dirtToDraw, x: i, y: groundY + j });
        }
        const placePlant = Math.random() < 0.1;
        if (placePlant) {
            const plantToDraw = plantSprites[getRandomInt(6)];
            landscapeBufferRenderQueue.push({ image: plantToDraw, x: i, y: groundY });
        }
        const changeGroundHeight = Math.random() < 0.25;
        if (changeGroundHeight) {
            const stepUp = Math.random() < (0.5 + ((groundY - GROUND_Y_TARGET) / 50));
            if (stepUp) {
                groundY--;
            } else {
                groundY++;
            }
        }
    }
    
    const bufferContext = buffer.getContext('2d');
    bufferContext.clearRect(0, 0, canvas.width, canvas.height);
    for (const sprite of landscapeBufferRenderQueue) {
        bufferContext.drawImage(sprite.image, (sprite.x * 32), (sprite.y * 32) + (canvas.height / 2));
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCanvasContent();
}

window.onload = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // TODO: These canvases should snap width to next multiple of 32 so they don't overlap
    canvas.landscapeBuffer1 = new OffscreenCanvas(canvas.width, canvas.height);
    canvas.landscapeBuffer2 = new OffscreenCanvas(canvas.width, canvas.height);
    generateLandscapeBuffers();
    
    previousRenderTime = Date.now();
    animate();
};

window.addEventListener('resize', resizeCanvas);

window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
});