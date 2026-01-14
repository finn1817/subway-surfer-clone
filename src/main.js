import kaplay from "kaplay";

// 1. Initialize KAPLAY
kaplay({
    width: 800,
    height: 600,
    background: [135, 206, 235], // Sky blue background
    debug: true, // Allows you to see hitboxes by pressing F1
});

// --- CONSTANTS & CONFIG ---
const LANE_COUNT = 5;
const LANE_WIDTH = width() / LANE_COUNT;
const PLAYER_Y = height() - 100;
const SPEED_START = 400;
const SPEED_MAX = 1000;
let currentSpeed = SPEED_START;

// Calculate the X center of a specific lane (0 to 4)
function getLaneX(laneIndex) {
    // Clamp keeps us inside 0-4
    laneIndex = Math.max(0, Math.min(laneIndex, LANE_COUNT - 1));
    return (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
}

// --- ASSETS ---
// We use built-in shapes, but you can load sprites here later
loadSprite("bean", "sprites/bean.png"); // Default Kaplay bean

// --- SCENE: GAME ---
scene("game", () => {
    
    // VARIABLES
    let currentLane = 2; // Start in middle lane (0, 1, 2, 3, 4)
    let score = 0;
    let isJumping = false;

    // 1. ADD BACKGROUND LINES (Visuals for lanes)
    for (let i = 1; i < LANE_COUNT; i++) {
        add([
            rect(2, height()),
            pos(i * LANE_WIDTH, 0),
            color(255, 255, 255),
            opacity(0.3),
            "lane-marker"
        ]);
    }

    // 2. THE PLAYER
    const player = add([
        rect(40, 40),      // Placeholder box (replace with sprite later)
        pos(getLaneX(currentLane), PLAYER_Y),
        anchor("center"),  // Draw from center so we align perfectly in lanes
        color(0, 0, 255),  // Blue
        area(),            // Hitbox
        z(10),             // Draw on top of obstacles
        "player"
    ]);

    // 3. UI - SCORE
    const scoreLabel = add([
        text("Score: 0"),
        pos(24, 24),
        z(100),
    ]);

    // --- CONTROLS ---
    
    // Switch Left
    onKeyPress("left", () => {
        if (currentLane > 0) {
            currentLane--;
        }
    });

    // Switch Right
    onKeyPress("right", () => {
        if (currentLane < LANE_COUNT - 1) {
            currentLane++;
        }
    });

    // Jump (Visual scale up + state flag)
    onKeyPress("space", () => {
        if (player.isGrounded) { 
            // In a top-down runner, "Jump" is fake. 
            // We scale up to simulate being closer to camera
            // and ignore "Low" obstacles.
            jumpAction();
        }
    });

    function jumpAction() {
        if (isJumping) return;
        isJumping = true;
        
        // Visual "Pop" effect
        tween(1, 1.5, 0.2, (val) => player.scale = vec2(val), wasm.easings.easeOutQuad)
        .then(() => {
            tween(1.5, 1, 0.2, (val) => player.scale = vec2(val), wasm.easings.easeInQuad)
            .then(() => isJumping = false);
        });
        
        // Shadow effect could go here
    }

    // --- GAME LOOP ---

    // Smooth movement: Lerp player X to the target lane X
    onUpdate(() => {
        const targetX = getLaneX(currentLane);
        // 15 is the interpolation speed (higher = snappier)
        player.pos.x = lerp(player.pos.x, targetX, dt() * 15);
        
        // Update Score
        score += dt() * 10;
        scoreLabel.text = "Score: " + Math.floor(score);

        // Increase game speed gradually
        if (currentSpeed < SPEED_MAX) {
            currentSpeed += 5 * dt(); 
        }
    });

    // --- OBSTACLE SPAWNER ---
    
    // Spawn simple obstacles
    loop(1.0, () => { 
        // Logic to make spawn rate faster as speed increases could go here
        spawnObstacle();
    });

    function spawnObstacle() {
        // Pick a random lane
        const lane = randi(0, LANE_COUNT);
        
        // 10% chance to spawn a "Barricade" (Needs Jump)
        // 90% chance to spawn a "Block" (Needs Dodge)
        const isBarricade = rand() < 0.2; 

        add([
            rect(LANE_WIDTH - 20, 40), // Slightly smaller than lane
            pos(getLaneX(lane), -50),  // Spawn just above screen
            anchor("center"),
            color(isBarricade ? [255, 0, 0] : [255, 100, 0]), // Red vs Orange
            area(),
            move(DOWN, currentSpeed), // Move down automatically
            offscreen({ destroy: true }), // Cleanup when off screen
            "obstacle",
            {
                isBarricade: isBarricade
            }
        ]);
    }

    // --- COLLISIONS ---
    
    player.onCollide("obstacle", (obs) => {
        // Logic: If it's a barricade AND we are jumping, we are safe
        if (obs.isBarricade && isJumping) {
            // Safe! Maybe add a "Whoosh" sound
            shake(2); // tiny shake for feedback
        } else {
            // CRASH!
            shake(20);
            go("gameover", Math.floor(score));
        }
    });
});

// --- SCENE: GAMEOVER ---
scene("gameover", (score) => {
    add([
        text("GAME OVER\nScore: " + score, { align: "center" }),
        pos(center()),
        anchor("center"),
    ]);

    add([
        text("Press Space to Restart", { size: 24 }),
        pos(center().x, center().y + 100),
        anchor("center"),
    ]);

    onKeyPress("space", () => go("game"));
});

// Start the game
go("game");