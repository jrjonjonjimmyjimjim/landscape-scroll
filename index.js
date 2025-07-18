const FPS_TARGET = 30;
const FPS_INTERVAL = 1000 / FPS_TARGET;

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

let animationFrameId; // To store the requestAnimationFrame ID for cleanup
let previousRenderTime;
let totalRenderedTilesWidth = 0;
let groundY = 32;
let scrollOffset = 0;
const spritesToRender = [];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateNextTileColumn() {
    if ((totalRenderedTilesWidth * 32) - scrollOffset < canvas.width) {
        const changeGroundHeight = Math.random() < 0.25;
        if (changeGroundHeight) {
            const stepUp = Math.random() < 0.5;
            if (stepUp) {
                groundY--;
            } else {
                groundY++;
            }
        }

        const grass_1 = document.getElementById('sprite_grass_1');
        const grass_2 = document.getElementById('sprite_grass_2');
        const grass_3 = document.getElementById('sprite_grass_3');
        const grass_4 = document.getElementById('sprite_grass_4');
        const grassSprites = [grass_1, grass_2, grass_3, grass_4];
        const grassToDraw = grassSprites[getRandomInt(4)];
        spritesToRender.push({ image: grassToDraw, x: totalRenderedTilesWidth, y: groundY });

        const dirt_1 = document.getElementById('sprite_dirt_1');
        const dirt_2 = document.getElementById('sprite_dirt_2');
        const dirt_3 = document.getElementById('sprite_dirt_3');
        const dirt_4 = document.getElementById('sprite_dirt_4');
        const dirtSprites = [dirt_1, dirt_2, dirt_3, dirt_4];
        const dirtToDraw = dirtSprites[getRandomInt(4)];
        spritesToRender.push({ image: dirtToDraw, x: totalRenderedTilesWidth, y: groundY + 1 });
        totalRenderedTilesWidth++;
    }
}

function drawCanvasContent() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a linear gradient for a subtle background effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e0f2f7'); // Light blue
    gradient.addColorStop(0.5, '#c8e6c9'); // Light green
    gradient.addColorStop(1, '#bbdefb'); // Another light blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (const sprite of spritesToRender) {
        ctx.drawImage(sprite.image, (sprite.x * 32) - scrollOffset, sprite.y * 32);
    }
}

function animate() {
    const currentRenderTime = Date.now();
    const elapsedRenderTime = currentRenderTime - previousRenderTime;
    
    if (elapsedRenderTime > FPS_INTERVAL) {
        previousRenderTime = currentRenderTime - (elapsedRenderTime % FPS_INTERVAL);
        generateNextTileColumn();
        drawCanvasContent();
        scrollOffset++;
    }
    animationFrameId = requestAnimationFrame(animate);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCanvasContent();
}

window.onload = function() {
    resizeCanvas();
    
    const grass_1 = document.getElementById('sprite_grass_1');
    const grass_2 = document.getElementById('sprite_grass_2');
    const grass_3 = document.getElementById('sprite_grass_3');
    const grass_4 = document.getElementById('sprite_grass_4');
    const grassSprites = [grass_1, grass_2, grass_3, grass_4];
    for (let i = 0; i < 20; i++) {
        const grassToDraw = grassSprites[getRandomInt(4)];
        spritesToRender.push({ image: grassToDraw, x: i, y: 32 });
    }
    totalRenderedTilesWidth += 20;
    
    previousRenderTime = Date.now();
    animate();
};

window.addEventListener('resize', resizeCanvas);

window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
});