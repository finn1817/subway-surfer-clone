import kaplay from "kaplay";

// 1. Initialize KAPLAY
kaplay({
    width: 800,
    height: 600,
    background: [135, 206, 235], // Sky blue
    debug: true, // F1 to see hitboxes
});

// --- CONSTANTS & CONFIG ---
const LANE_COUNT = 5;
const LANE_WIDTH = width() / LANE_COUNT;
const PLAYER_Y = height() - 100;
const SPEED_START = 400;
const SPEED_MAX = 1000;
let currentSpeed = SPEED_START;

// Calculate the X center of a specific lane
function getLaneX(laneIndex) {
    laneIndex = Math.max(0, Math.min(laneIndex, LANE_COUNT - 1));
    return (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
}

// --- ASSETS ---
// Using loadBean() is safer for now. It loads the default built-in character.
// If you have your file, you can change this back to: loadSprite("bean", "sprites/bean.png");
loadBean(); 

// --- SCENE: GAME ---
scene("game", () => {
    
    // VARIABLES
    let currentLane = 2; // Start in middle lane (0-4)
    let score = 0;
    let isJumping = false;

    // 1. ADD BACKGROUND LINES
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
        sprite("bean"),    // Uses the default bean sprite
        pos(getLaneX(currentLane), PLAYER_Y),
        anchor("center"),
        scale(1),
        area(),            // Hitbox
        z(10),             // Draw on top
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

    // Jump
    onKeyPress("space", () => {
        jumpAction();
    });

    function jumpAction() {
        if (isJumping) return;
        isJumping = true;
        
        // Visual "Pop" effect (Scale Up then Down)
        tween(1, 1.5, 0.2, (val) => player.scale = vec2(val), easings.easeOutQuad)
        .then(() => {
            tween(1.5, 1, 0.2, (val) => player.scale = vec2(val), easings.easeInQuad)
            .then(() => isJumping = false);
        });
    }

    // --- GAME LOOP ---

    onUpdate(() => {
        // Smooth movement: Lerp player X to the target lane X
        const targetX = getLaneX(currentLane);
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
    
    loop(1.0, () => { 
        spawnObstacle();
    });

    function spawnObstacle() {
        // Pick a random lane
        const lane = randi(0, LANE_COUNT);
        
        // 20% chance to spawn a "Barricade" (Red) -> Must Jump
        const isBarricade = rand() < 0.2; 

        add([
            rect(LANE_WIDTH - 20, 40), 
            pos(getLaneX(lane), -50),
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
            shake(2); 
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

// Start the game immediately
go("game");