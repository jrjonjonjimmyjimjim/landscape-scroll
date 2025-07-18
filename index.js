const FPS_TARGET = 60;
const FPS_INTERVAL = 1000 / FPS_TARGET;

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

let animationFrameId; // To store the requestAnimationFrame ID for cleanup
let previousRenderTime;
let totalRenderedTilesWidth = 0;
let scrollOffset = 0;
const spritesToRender = [];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Resizes the canvas to fill the entire window.
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Redraw content if necessary after resize (e.g., for particles)
    drawCanvasContent();
}

/**
 * Draws content onto the canvas. This is where you'd add your
 * background animation or visual effects.
 * For this boilerplate, we'll just fill it with a subtle gradient.
 */
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
    scrollOffset++;

    if ((totalRenderedTilesWidth * 32) - scrollOffset < canvas.width) {
        const grass_1 = document.getElementById('sprite_grass_1');
        const grass_2 = document.getElementById('sprite_grass_2');
        const grass_3 = document.getElementById('sprite_grass_3');
        const grass_4 = document.getElementById('sprite_grass_4');
        const grassSprites = [grass_1, grass_2, grass_3, grass_4];
        const grassToDraw = grassSprites[getRandomInt(4)];
        spritesToRender.push({ image: grassToDraw, x: totalRenderedTilesWidth, y: 32 });
        totalRenderedTilesWidth++;
    }
}

/**
 * The main animation loop.
 * You can add more complex animation logic here.
 */
function animate() {
    const currentRenderTime = Date.now();
    const elapsedRenderTime = currentRenderTime - previousRenderTime;

    if (elapsedRenderTime > FPS_INTERVAL) {
        previousRenderTime = currentRenderTime - (elapsedRenderTime % FPS_INTERVAL);
        drawCanvasContent(); // Redraw canvas content each frame
    }
    animationFrameId = requestAnimationFrame(animate); // Request next frame
}

// Initialize canvas size and start animation when the window loads
window.onload = function() {
    resizeCanvas(); // Set initial size

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
    animate(); // Start the animation loop
};

// Add event listener for window resize to make the canvas responsive
window.addEventListener('resize', resizeCanvas);

// Optional: Clean up animation frame on page unload (good practice)
window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
});