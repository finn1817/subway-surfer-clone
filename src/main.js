import kaplay from "kaplay";

// 1. Initialize KAPLAY
kaplay({
    width: 800,
    height: 600,
    background: [135, 206, 235], // Sky blue background
    debug: true, // F1 for hitboxes
});

// --- CONSTANTS & CONFIG ---
const LANE_COUNT = 5;
const LANE_WIDTH = width() / LANE_COUNT;
const PLAYER_Y = height() - 100;
const SPEED_START = 400;
const SPEED_MAX = 1200;

// Helper: Calculate the X center of a specific lane (0 to 4)
function getLaneX(laneIndex) {
    laneIndex = Math.max(0, Math.min(laneIndex, LANE_COUNT - 1));
    return (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
}

// --- ASSETS ---
loadSprite("bean", "sprites/bean.png"); 

// ==================================================
// SCENE 1: START MENU
// ==================================================
scene("start", () => {
    // Title
    add([
        text("SUBWAY RUNNER", { size: 60, font: "monospace" }),
        pos(center().x, center().y - 100),
        anchor("center"),
        color(255, 255, 0),
    ]);

    // Instructions
    add([
        text("ARROWS to Move  |  SPACE to Jump", { size: 24 }),
        pos(center().x, center().y),
        anchor("center"),
    ]);

    // Flashing "Press Space" text
    const startText = add([
        text("PRESS SPACE TO START", { size: 30 }),
        pos(center().x, center().y + 100),
        anchor("center"),
        opacity(1),
    ]);

    // Simple flash animation
    loop(0.8, () => {
        startText.opacity = startText.opacity === 1 ? 0 : 1;
    });

    onKeyPress("space", () => {
        go("game");
    });
});

// ==================================================
// SCENE 2: THE GAME LOOP
// ==================================================
scene("game", () => {
    
    // --- VARIABLES ---
    let currentLane = 2; // Start in middle (0-4)
    let currentSpeed = SPEED_START;
    let score = 0;
    let isJumping = false;

    // --- SETUP ---
    
    // 1. Visual Lane Markers
    for (let i = 1; i < LANE_COUNT; i++) {
        add([
            rect(4, height()),
            pos(i * LANE_WIDTH, 0),
            color(255, 255, 255),
            opacity(0.2),
        ]);
    }

    // 2. The Player
    const player = add([
        sprite("bean"),
        pos(getLaneX(currentLane), PLAYER_Y),
        anchor("center"),
        scale(1.5), // Normal size
        area({ scale: 0.8 }), // Hitbox slightly smaller
        z(10), // Draw on top
        "player"
    ]);

    // 3. UI Layer
    const scoreLabel = add([
        text("0", { size: 48, font: "monospace" }),
        pos(24, 24),
        z(100)
    ]);

    // --- CONTROLS ---

    // Move Left
    onKeyPress("left", () => {
        if (currentLane > 0) currentLane--;
    });

    // Move Right
    onKeyPress("right", () => {
        if (currentLane < LANE_COUNT - 1) currentLane++;
    });

    // Jump Action
    onKeyPress("space", () => {
        if (!isJumping) { 
            performJump();
        }
    });

    function performJump() {
        isJumping = true;
        // Visual "Jump": Scale up to simulate getting closer to camera
        tween(1.5, 2.5, 0.3, (val) => player.scale = vec2(val), easings.easeOutQuad)
        .then(() => {
            tween(2.5, 1.5, 0.3, (val) => player.scale = vec2(val), easings.easeInQuad)
            .then(() => isJumping = false);
        });
    }

    // --- GAME LOGIC ---

    onUpdate(() => {
        // 1. Smooth Movement (Lerp)
        const targetX = getLaneX(currentLane);
        player.pos.x = lerp(player.pos.x, targetX, dt() * 15);

        // 2. Score & Speed
        score += dt() * 10;
        scoreLabel.text = Math.floor(score);

        if (currentSpeed < SPEED_MAX) {
            currentSpeed += 10 * dt(); // Accelerate slowly
        }
    });

    // --- OBSTACLE SPAWNER ---
    
    // Spawner Loop
    loop(1.2, () => {
        spawnObstacle();
    });

    function spawnObstacle() {
        const lane = randi(0, LANE_COUNT);
        
        // 20% Chance for a "Barricade" (Red) -> Must Jump
        // 80% Chance for a "Block" (Orange) -> Must Dodge
        const isBarricade = rand() < 0.2; 

        const obs = add([
            rect(LANE_WIDTH - 20, 50),
            pos(getLaneX(lane), -100),
            anchor("center"),
            color(isBarricade ? [255, 50, 50] : [255, 165, 0]),
            area(),
            move(DOWN, currentSpeed),
            offscreen({ destroy: true }),
            "obstacle",
            { isBarricade: isBarricade } // Custom property
        ]);

        // Visual distinction for Barricades
        if (isBarricade) {
            obs.use(outline(4, [0,0,0])); // Add outline to red ones
        }
    }

    // --- COLLISION HANDLING ---

    player.onCollide("obstacle", (obs) => {
        // Rule: If it's a Barricade AND we are Jumping, we survive.
        if (obs.isBarricade && isJumping) {
            shake(2); // Feedback
        } 
        // Otherwise, we crash.
        else {
            shake(20);
            destroy(player);
            go("gameover", Math.floor(score));
        }
    });
});

// ==================================================
// SCENE 3: GAME OVER
// ==================================================
scene("gameover", (finalScore) => {
    add([
        text("GAME OVER", { size: 64, color: [255, 0, 0] }),
        pos(center().x, center().y - 50),
        anchor("center"),
    ]);

    add([
        text("Final Score: " + finalScore, { size: 32 }),
        pos(center().x, center().y + 50),
        anchor("center"),
    ]);

    add([
        text("Press SPACE to Restart", { size: 24 }),
        pos(center().x, center().y + 120),
        anchor("center"),
    ]);

    onKeyPress("space", () => go("game"));
});

// Start the game at the Menu
go("start");