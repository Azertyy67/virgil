const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// PENGATURAN RESOLUSI DINAMIS (PENYESUAIAN HP & LAYAR)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Dijalankan pertama kali saat game dibuka

const WORLD_WIDTH = 2500; 
const WORLD_HEIGHT = 850;
const gravity = 0.48;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 900; canvas.height = 500;
const WORLD_WIDTH = 2500; const WORLD_HEIGHT = 850;
const gravity = 0.48;

let gameFrame = 0; let screenShake = 0;
let pauseSelectedOption = 0; let gameOverSelectedOption = 0;
let bossSpawned = false;

const platforms = [
    { x: 0, y: 810, width: 2500, height: 40 },
    { x: 200, y: 650, width: 250, height: 20 },
    { x: 100, y: 480, width: 200, height: 20 },
    { x: 350, y: 320, width: 200, height: 20 },
    { x: 700, y: 200, width: 450, height: 40 },
    { x: 800, y: 550, width: 300, height: 20 },
    { x: 1200, y: 400, width: 350, height: 20 },
    { x: 1300, y: 150, width: 500, height: 40 },
    { x: 1700, y: 600, width: 250, height: 20 },
    { x: 2000, y: 450, width: 300, height: 20 }
];

const styleRanks = [
    { name: 'D', label: 'Dismal', color: '#7f8c8d', min: 0 },
    { name: 'C', label: 'Crazy', color: '#3498db', min: 180 },
    { name: 'B', label: 'Badass', color: '#2ecc71', min: 500 },
    { name: 'A', label: 'Apocalyptic', color: '#e67e22', min: 1000 },
    { name: 'S', label: 'Savage', color: '#e74c3c', min: 1700 },
    { name: 'SS', label: 'Sick Skills', color: '#9b59b6', min: 2600 },
    { name: 'SSS', label: 'Smokin\' Sexy Style!!', color: '#f1c40f', min: 3800 }
];

let player = {
    x: 150, y: 700, width: 32, height: 52, vx: 0, vy: 0,
    speed: 5.5, jumpForce: -13.8, jumpsLeft: 2, maxJumps: 2,
    isGrounded: false, facing: 'right',
    currentWeapon: 'SWORD', hp: 5, maxHp: 5,
    attackCooldown: 0, isSlashing: false, slashTimer: 0,
    isShielding: false, parryWindow: 0, parryTextTimer: 0,
    stylePoints: 0, awakeningGauge: 0, isAwakened: false,
    trail: [],
    skills: {
        rapidSlash: { active: false, timer: 0, count: 0, cd: 0, maxCd: 240 },
        jCut: { active: false, timer: 0, cd: 0, maxCd: 420 },
        endless: { active: false, timer: 0, cd: 0, maxCd: 540 },
        timeStop: { active: false, timer: 0, cd: 0, maxCd: 900 },
        doppelSummon: { active: false, timer: 0, cd: 0, maxCd: 1080 }
    }
};

let doppelCompanion = { 
    x: 0, y: 0, width: 32, height: 52, facing: 'right', vx: 0, vy: 0, isGrounded: false,
    state: 'IDLE', timer: 0, actionCooldown: 60, isSlashing: false, slashTimer: 0
};

let camera = { x: 0, y: 0 };
let playerBullets = [], enemyBullets = [], enemies = [], items = [], skillVisuals = [];
let score = 0, wave = 1, enemiesLeftToSpawn = 0, totalEnemiesInWave = 0, enemySpawnTimer = 0;
let keys = {};

function startWave() {
    bossSpawned = false;
    if (wave % 10 === 0) {
        totalEnemiesInWave = 0; enemiesLeftToSpawn = 0;
    } else {
        totalEnemiesInWave = 1 + wave * 2; enemiesLeftToSpawn = totalEnemiesInWave;
    }
    enemySpawnTimer = 0;
}
startWave();

// EVENT SENTUHAN BISA LANGSUNG UNTUK MENU OVERLAY
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (window.gameState === 'GAME_OVER') {
        if (clickY >= 280 && clickY <= 335) {
            gameOverSelectedOption = 0;
            restartGame();
        } else if (clickY >= 340 && clickY <= 395) {
            gameOverSelectedOption = 1;
            window.gameState = 'MAIN_MENU';
        }
    } else if (window.gameState === 'PAUSED') {
        if (clickY >= 230 && clickY <= 270) {
            window.gameState = 'GAME';
        } else if (clickY >= 275 && clickY <= 315) {
            restartGame();
        } else if (clickY >= 320 && clickY <= 360) {
            window.gameState = 'MAIN_MENU';
        }
    }
});

// HANDLER INPUT D-PAD DAN KEYBOARD
window.addEventListener('keydown', (e) => {
    if (window.gameState === 'PAUSED') {
        if (e.key === 'Escape') { window.gameState = 'GAME'; return; }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pauseSelectedOption = (pauseSelectedOption - 1 + 3) % 3;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pauseSelectedOption = (pauseSelectedOption + 1) % 3;
        if (e.key === 'Enter') {
            if (pauseSelectedOption === 0) window.gameState = 'GAME';
            else if (pauseSelectedOption === 1) restartGame();
            else if (pauseSelectedOption === 2) window.gameState = 'MAIN_MENU';
        }
        return;
    }

    if (window.gameState === 'GAME_OVER') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            gameOverSelectedOption = gameOverSelectedOption === 0 ? 1 : 0;
        }
        if (e.key === 'Enter') {
            if (gameOverSelectedOption === 0) restartGame();
            else window.gameState = 'MAIN_MENU';
        }
        return;
    }

    if (window.gameState !== 'GAME') return;

    if (e.key === 'Escape') { window.gameState = 'PAUSED'; pauseSelectedOption = 0; return; }
    keys[e.key] = true;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (player.isGrounded) {
            player.vy = player.jumpForce;
            player.isGrounded = false;
            player.jumpsLeft = 1; 
        } else if (player.jumpsLeft > 0 && !isAnyComboActive()) {
            player.vy = player.jumpForce * 0.92;
            player.jumpsLeft--;
            skillVisuals.push({ type: 'shockwave', x: player.x + player.width/2, y: player.y + player.height, radius: 5, maxRadius: 45, timer: 12, color: '#00ffff' });
        }
    }

    if (e.key === 'q' || e.key === 'Q') player.currentWeapon = player.currentWeapon === 'SWORD' ? 'PISTOL' : 'SWORD';
    if ((e.key === 'e' || e.key === 'E') && player.awakeningGauge >= 100 && !player.isAwakened) {
        player.isAwakened = true; screenShake = 20;
        skillVisuals.push({ type: 'shockwave', x: player.x, y: player.y, radius: 10, maxRadius: 180, timer: 20, color: '#9b59b6' });
    }

    if (!player.isShielding) {
        if (e.key === '1' && player.skills.rapidSlash.cd === 0 && !isAnyComboActive()) {
            player.skills.rapidSlash.active = true; player.skills.rapidSlash.timer = 24; player.skills.rapidSlash.count = 0;
            player.skills.rapidSlash.cd = player.skills.rapidSlash.maxCd;
        }
        if (e.key === '2' && player.skills.jCut.cd === 0 && !isAnyComboActive()) {
            player.skills.jCut.active = true; 
            player.skills.jCut.timer = player.isAwakened ? 220 : 110; 
            player.skills.jCut.cd = player.skills.jCut.maxCd;
            if (player.skills.doppelSummon.active) {
                doppelCompanion.state = 'JUDGMENT_CUT'; doppelCompanion.timer = player.skills.jCut.timer;
            }
        }
        if (e.key === '3' && player.skills.endless.cd === 0 && !isAnyComboActive()) {
            player.skills.endless.active = true; 
            player.skills.endless.timer = player.isAwakened ? 240 : 120; 
            player.skills.endless.cd = player.skills.endless.maxCd;
            if (player.skills.doppelSummon.active) {
                doppelCompanion.state = 'ENDLESS_JC'; doppelCompanion.timer = player.skills.endless.timer;
            }
        }
        if (e.key === '4' && player.skills.timeStop.cd === 0) {
            player.skills.timeStop.active = true; player.skills.timeStop.timer = player.isAwakened ? 480 : 360;
            player.skills.timeStop.cd = player.skills.timeStop.maxCd; screenShake = 35;
            skillVisuals.push({ type: 'domain', x: player.x, y: player.y, radius: 10, maxRadius: 1600, timer: 45 });
        }
        if (e.key === '5' && player.skills.doppelSummon.cd === 0) {
            player.skills.doppelSummon.active = true; player.skills.doppelSummon.timer = 600;
            player.skills.doppelSummon.cd = player.skills.doppelSummon.maxCd;
            doppelCompanion.x = player.x; doppelCompanion.y = player.y; doppelCompanion.state = 'IDLE'; doppelCompanion.actionCooldown = 30;
            skillVisuals.push({ type: 'shockwave', x: player.x, y: player.y, radius: 10, maxRadius: 120, timer: 15, color: '#00ffff' });
        }
    }
});

window.addEventListener('keyup', (e) => { if (window.gameState === 'GAME') keys[e.key] = false; });

window.addEventListener('mousedown', (e) => {
    if (window.gameState !== 'GAME' || isAnyComboActive() || player.isShielding || player.attackCooldown > 0) return;
    let dmgMultiplier = player.isAwakened ? 3 : 1;

    if (player.currentWeapon === 'SWORD') {
        player.isSlashing = true; player.slashTimer = 10; player.attackCooldown = 12;
        checkPlayerSwordHit(dmgMultiplier * 2, player.isAwakened ? 95 : 60);
        if(player.isAwakened) screenShake = 6;
    } else {
        let bVx = player.facing === 'right' ? 14 : -14;
        playerBullets.push({ x: player.facing === 'right' ? player.x + player.width : player.x - 12, y: player.y + 16, vx: bVx, width: 14, height: 4, damage: 1.2 * dmgMultiplier });
        player.attackCooldown = 13;
    }
});

function isAnyComboActive() { return player.skills.rapidSlash.active || player.skills.jCut.active || player.skills.endless.active; }
function isColliding(r1, r2) { return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y; }

function handlePlatformCollision(entity) {
    entity.vy += gravity; entity.y += entity.vy; entity.isGrounded = false;
    for (let p of platforms) {
        if (entity.x + entity.width > p.x && entity.x < p.x + p.width && entity.y + entity.height <= p.y + 10 && entity.y + entity.height + entity.vy >= p.y) {
            entity.y = p.y - entity.height; entity.vy = 0; entity.isGrounded = true; 
            if (entity === player) player.jumpsLeft = player.maxJumps; 
            break;
        }
    }
}

function checkPlayerSwordHit(dmg, customRange) {
    let range = customRange || 60;
    let hitbox = { x: player.facing === 'right' ? player.x + player.width : player.x - range, y: player.y, width: range, height: player.height };
    triggerHitOnHitbox(hitbox, dmg, player.facing === 'right' ? 9 : -9);
}

function triggerHitOnHitbox(hitbox, dmg, knockbackX) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(hitbox, enemies[i])) {
            enemies[i].hp -= dmg; enemies[i].vx += knockbackX;
            player.stylePoints += player.isAwakened ? 120 : 60;
            if (!player.isAwakened) player.awakeningGauge = Math.min(100, player.awakeningGauge + 5);
            if (enemies[i].hp <= 0) { processKill(enemies[i]); enemies.splice(i, 1); }
        }
    }
}

function triggerAreaJudgmentCut(targetX, targetY, radius, dmg) {
    skillVisuals.push({ type: 'jcut', x: targetX, y: targetY, radius: radius, currentRadius: 0, timer: 16 });
    let hitbox = { x: targetX - radius, y: targetY - radius, width: radius * 2, height: radius * 2 };
    triggerHitOnHitbox(hitbox, dmg, 0);
}

function processKill(enemyEntity) {
    let points = enemyEntity.isBoss ? 1500 : 25;
    score += points; player.stylePoints += enemyEntity.isBoss ? 2000 : 130;
    if (!player.isAwakened) player.awakeningGauge = Math.min(100, player.awakeningGauge + (enemyEntity.isBoss ? 60 : 12));
    if (Math.random() < 0.35 || enemyEntity.isBoss) items.push({ x: enemyEntity.x, y: enemyEntity.y, vx: 0, vy: 0, width: 20, height: 20, isGrounded: false });
}

function getStyleRank() {
    let current = styleRanks[0];
    for (let r of styleRanks) { if (player.stylePoints >= r.min) current = r; }
    return current;
}

// PENANGANAN SAAT PEMAIN MATI
function takeDamage(amount) {
    let finalDamage = player.isAwakened ? amount * 0.35 : amount;
    player.hp -= finalDamage; player.stylePoints = Math.floor(player.stylePoints * 0.45);
    if (player.hp <= 0) { 
        player.hp = 0; 
        window.gameState = 'GAME_OVER'; 
        gameOverSelectedOption = 0;
    }
}

function triggerPerfectParry() {
    player.parryTextTimer = 45; player.stylePoints = 4000; screenShake = 25;
    if (!player.isAwakened) player.awakeningGauge = 100;
}

function getClosestEnemyEntity() {
    if (enemies.length === 0) return null;
    let closest = enemies[0]; let minDist = Math.abs(enemies[0].x - player.x);
    enemies.forEach(e => { let d = Math.abs(e.x - player.x); if (d < minDist) { minDist = d; closest = e; } });
    return closest;
}

function getClosestEnemy() {
    let e = getClosestEnemyEntity();
    if (!e) return { x: player.x + (player.facing === 'right' ? 220 : -220), y: player.y + player.height/2 };
    return { x: e.x + e.width/2, y: e.y + e.height/2 };
}

function update() {
    gameFrame++;
    if (screenShake > 0) screenShake -= 1;

    for (let s in player.skills) { if (player.skills[s].cd > 0) player.skills[s].cd--; }
    let isTimeStopped = player.skills.timeStop.timer > 0;
    if (isTimeStopped) player.skills.timeStop.timer--;

    for (let i = skillVisuals.length - 1; i >= 0; i--) {
        let fx = skillVisuals[i]; fx.timer--;
        if (fx.type === 'jcut') fx.currentRadius += fx.radius / 6;
        if (fx.type === 'shockwave' || fx.type === 'domain') fx.radius += (fx.maxRadius - fx.radius) * 0.22;
        if (fx.timer <= 0) skillVisuals.splice(i, 1);
    }

    camera.x = player.x + player.width / 2 - canvas.width / 2;
    camera.y = player.y + player.height / 2 - canvas.height / 2;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - canvas.height));

    if (player.isAwakened) {
        player.awakeningGauge -= 0.055;
        if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + 0.008);
        if (player.awakeningGauge <= 0) { player.awakeningGauge = 0; player.isAwakened = false; }
        player.trail.push({x: player.x, y: player.y, facing: player.facing, state: 'AWAKENED'});
        if (player.trail.length > 5) player.trail.shift();
    } else {
        if (!isAnyComboActive()) player.trail = [];
    }

    if (player.skills.doppelSummon.active) {
        player.skills.doppelSummon.timer--;
        let target = getClosestEnemyEntity();

        if (doppelCompanion.slashTimer > 0) doppelCompanion.slashTimer--;
        else doppelCompanion.isSlashing = false;

        if (player.skills.jCut.active && doppelCompanion.state !== 'JUDGMENT_CUT') {
            doppelCompanion.state = 'JUDGMENT_CUT'; doppelCompanion.timer = player.skills.jCut.timer;
        }
        if (player.skills.endless.active && doppelCompanion.state !== 'ENDLESS_JC') {
            doppelCompanion.state = 'ENDLESS_JC'; doppelCompanion.timer = player.skills.endless.timer;
        }
        if (player.skills.rapidSlash.active && doppelCompanion.state !== 'RAPID_SLASH') {
            doppelCompanion.state = 'RAPID_SLASH'; doppelCompanion.timer = player.skills.rapidSlash.timer;
        }

        if (doppelCompanion.state === 'IDLE') {
            if (target) {
                let targetX = target.x + (target.x > doppelCompanion.x ? -60 : 60);
                doppelCompanion.x += (targetX - doppelCompanion.x) * 0.1;
                doppelCompanion.y += (target.y - doppelCompanion.y) * 0.1;
                doppelCompanion.facing = doppelCompanion.x < target.x ? 'right' : 'left';

                if (doppelCompanion.actionCooldown > 0) doppelCompanion.actionCooldown--;
                else {
                    doppelCompanion.state = Math.random() > 0.5 ? 'RAPID_SLASH' : 'JUDGMENT_CUT';
                    doppelCompanion.timer = doppelCompanion.state === 'RAPID_SLASH' ? 30 : (player.isAwakened ? 220 : 110);
                }
            } else {
                let followX = player.x + (player.facing === 'right' ? -50 : 50);
                doppelCompanion.x += (followX - doppelCompanion.x) * 0.08;
                doppelCompanion.y += (player.y - doppelCompanion.y) * 0.08;
                doppelCompanion.facing = player.facing;
            }
        } 
        else if (doppelCompanion.state === 'RAPID_SLASH') {
            doppelCompanion.timer--;
            if (target) {
                doppelCompanion.facing = doppelCompanion.x < target.x ? 'right' : 'left';
                doppelCompanion.x += (target.x + (doppelCompanion.facing === 'right' ? 70 : -70) - doppelCompanion.x) * 0.25;
                doppelCompanion.y += (target.y - doppelCompanion.y) * 0.25;

                if (doppelCompanion.timer % 8 === 0) {
                    doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 8;
                    let hitBox = { x: doppelCompanion.x - 40, y: doppelCompanion.y, width: 110, height: doppelCompanion.height };
                    triggerHitOnHitbox(hitBox, player.isAwakened ? 5 : 2, 0);
                    screenShake = 6;
                }
            }
            if (doppelCompanion.timer <= 0) { doppelCompanion.state = 'IDLE'; doppelCompanion.actionCooldown = 50; }
        } 
        else if (doppelCompanion.state === 'JUDGMENT_CUT') {
            doppelCompanion.timer--; doppelCompanion.vx = 0; doppelCompanion.vy = 0;
            let t = doppelCompanion.timer; let targetPos = getClosestEnemy();
            let baseJCutDmg = player.isAwakened ? 6.5 : 2.0;
            
            if (player.isAwakened) {
                if (t > 20 && t % 25 === 0) {
                    doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 10;
                    triggerAreaJudgmentCut(targetPos.x, targetPos.y, 75, baseJCutDmg);
                }
                if (t === 15) {
                    doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 16;
                    triggerAreaJudgmentCut(targetPos.x, targetPos.y, 145, baseJCutDmg * 4);
                }
            } else {
                if (t === 90 || t === 54) { doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 10; triggerAreaJudgmentCut(targetPos.x, targetPos.y, 55, baseJCutDmg); }
                if (t === 14) { doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 12; triggerAreaJudgmentCut(targetPos.x, targetPos.y, 120, baseJCutDmg * 4); }
            }
            if (t <= 0) { doppelCompanion.state = 'IDLE'; doppelCompanion.actionCooldown = 70; }
        }
        else if (doppelCompanion.state === 'ENDLESS_JC') {
            doppelCompanion.timer--; doppelCompanion.vx = 0; doppelCompanion.vy = -0.05;
            if (doppelCompanion.timer % 4 === 0) {
                doppelCompanion.isSlashing = true; doppelCompanion.slashTimer = 4;
                let scatterX = doppelCompanion.x + (Math.random() * 500 - 250);
                let scatterY = doppelCompanion.y + (Math.random() * 300 - 150);
                triggerAreaJudgmentCut(scatterX, scatterY, 70, player.isAwakened ? 4.5 : 1.5);
            }
            if (doppelCompanion.timer <= 0) { doppelCompanion.state = 'IDLE'; doppelCompanion.actionCooldown = 60; }
        }

        doppelCompanion.x = Math.max(0, Math.min(doppelCompanion.x, WORLD_WIDTH - doppelCompanion.width));
        if (player.skills.doppelSummon.timer <= 0) player.skills.doppelSummon.active = false;
    }

    if (player.skills.rapidSlash.active) {
        player.skills.rapidSlash.timer--; player.vx = player.facing === 'right' ? 16 : -16; player.vy = 0;
        player.trail.push({x: player.x, y: player.y, facing: player.facing, state: 'COMBO'});
        if (player.trail.length > 7) player.trail.shift();
        if (player.skills.rapidSlash.timer % 7 === 0) {
            player.skills.rapidSlash.count++; player.isSlashing = true; player.slashTimer = 6;
            checkPlayerSwordHit(player.isAwakened ? 7.5 : 2.5, 100);
        }
        if (player.skills.rapidSlash.timer <= 0 || player.skills.rapidSlash.count >= 3) player.skills.rapidSlash.active = false;
    }
    else if (player.skills.jCut.active) {
        player.skills.jCut.timer--; player.vx = 0; player.vy = 0;
        let t = player.skills.jCut.timer; let target = getClosestEnemy();
        let baseJCutDmg = player.isAwakened ? 9.5 : 3.0;
        
        if (player.isAwakened) {
            if (t > 20 && t % 25 === 0) { player.isSlashing = true; player.slashTimer = 10; triggerAreaJudgmentCut(target.x, target.y, 80, baseJCutDmg); }
            if (t === 15) {
                player.isSlashing = true; player.slashTimer = 16;
                triggerAreaJudgmentCut(target.x, target.y, 170, baseJCutDmg * 5); screenShake = 35;
                skillVisuals.push({ type: 'shockwave', x: target.x, y: target.y, radius: 10, maxRadius: 210, timer: 22, color: '#00d2d3' });
            }
        } else {
            if (t === 90 || t === 54) { player.isSlashing = true; player.slashTimer = 10; triggerAreaJudgmentCut(target.x, target.y, 60, baseJCutDmg); }
            if (t === 14) {
                player.isSlashing = true; player.slashTimer = 12;
                triggerAreaJudgmentCut(target.x, target.y, 135, baseJCutDmg * 4.5); screenShake = 28;
                skillVisuals.push({ type: 'shockwave', x: target.x, y: target.y, radius: 10, maxRadius: 150, timer: 18, color: '#00d2d3' });
            }
        }
        if (t <= 0) player.skills.jCut.active = false;
    }
    else if (player.skills.endless.active) {
        player.skills.endless.timer--; player.vx = 0; player.vy = -0.08;
        if (player.skills.endless.timer % 3 === 0) {
            player.isSlashing = true; player.slashTimer = 4;
            let scatterX = player.x + (Math.random() * 650 - 325); let scatterY = player.y + (Math.random() * 400 - 220);
            triggerAreaJudgmentCut(scatterX, scatterY, 75, player.isAwakened ? 6.0 : 1.8);
        }
        if (player.skills.endless.timer <= 0) player.skills.endless.active = false;
    }

    if (!isAnyComboActive()) {
        player.isShielding = !!(keys['Shift'] || keys['f'] || keys['F']);
        if (player.parryWindow > 0) player.parryWindow--;
        if (player.parryTextTimer > 0) player.parryTextTimer--;
        player.stylePoints = Math.max(0, player.stylePoints - (player.isAwakened ? 0.3 : 1.3));
        if (player.attackCooldown > 0) player.attackCooldown--;
        if (player.isSlashing) { player.slashTimer--; if (player.slashTimer <= 0) player.isSlashing = false; }

        player.vx *= player.isGrounded ? 0.76 : 0.988;
        let accel = player.isAwakened ? 1.25 : 0.82;
        let maxSpd = player.isShielding ? (player.speed * 0.5) : (player.isAwakened ? player.speed * 1.45 : player.speed);

        if (keys['ArrowLeft'] || keys['a'] || keys['A']) { player.vx -= accel; if (player.isGrounded && player.vx < -maxSpd) player.vx = -maxSpd; player.facing = 'left'; }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) { player.vx += accel; if (player.isGrounded && player.vx > maxSpd) player.vx = maxSpd; player.facing = 'right'; }

        player.x += player.vx; handlePlatformCollision(player);
        player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    } else {
        player.x += player.vx; player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    }

    if (!isTimeStopped) {
        if (wave % 10 === 0 && !bossSpawned && enemies.length === 0) {
            bossSpawned = true; let bossTier = wave / 10;
            enemies.push({
                x: player.x + 400, y: 200, vx: 0, vy: 0, width: 65, height: 95,
                isBoss: true, bossType: bossTier, hp: 60 + bossTier * 50, maxHp: 60 + bossTier * 50,
                speed: 1.5, facing: 'left', attackCooldown: 60, isSlashing: false
            });
            screenShake = 30;
            skillVisuals.push({ type: 'domain', x: player.x + 400, y: 400, radius: 10, maxRadius: 400, timer: 40 });
        }

        if (enemies.length === 0 && enemiesLeftToSpawn === 0) { wave++; startWave(); }
        
        if (enemiesLeftToSpawn > 0 && wave % 10 !== 0) {
            enemySpawnTimer++;
            if (enemySpawnTimer > 90 && enemies.length < 5) {
                enemySpawnTimer = 0; enemiesLeftToSpawn--;
                let type = Math.random() > 0.45 ? 'SWORD' : 'GUN';
                enemies.push({
                    x: player.x + (Math.random() > 0.5 ? 450 : -450), y: 100, vx: 0, vy: 0, width: 28, height: 48, type: type,
                    hp: type === 'SWORD' ? 3 : 2, speed: type === 'SWORD' ? 1.8 : 1.2, facing: 'left', attackCooldown: 0, isSlashing: false
                });
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; handlePlatformCollision(e); e.x += e.vx; e.vx *= 0.8;
            e.facing = (e.x < player.x) ? 'right' : 'left';
            let dist = Math.abs(player.x - e.x);

            if (e.attackCooldown > 0) e.attackCooldown--;

            if (e.isBoss) {
                if (e.attackCooldown === 0) {
                    e.isSlashing = true;
                    if (e.bossType % 3 === 1) { 
                        screenShake = 20; e.attackCooldown = 150;
                        skillVisuals.push({ type: 'shockwave', x: e.x, y: e.y + 40, radius: 20, maxRadius: 350, timer: 30, color: '#e74c3c' });
                        if (dist < 320 && player.y > e.y - 50) takeDamage(1.5);
                    } 
                    else if (e.bossType % 3 === 2) { 
                        e.x = player.x + (player.facing === 'right' ? -70 : 70); e.y = player.y; screenShake = 15; e.attackCooldown = 120;
                        triggerAreaJudgmentCut(player.x, player.y + 20, 80, 1.5);
                    } 
                    else { 
                        e.attackCooldown = 180;
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            enemyBullets.push({ x: e.x + 20, y: e.y + 40, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6, width: 12, height: 12 });
                        }
                    }
                }
                if (dist > 80) e.x += e.facing === 'right' ? e.speed : -e.speed;
                if (isColliding(e, player) && gameFrame % 30 === 0) takeDamage(1.0);
            } else {
                if (e.type === 'SWORD') {
                    if (dist > 35) e.x += e.facing === 'right' ? e.speed : -e.speed;
                    else if (e.attackCooldown === 0) {
                        e.attackCooldown = 60; e.isSlashing = true;
                        let hBox = { x: e.facing === 'right' ? e.x + e.width : e.x - 40, y: e.y, width: 40, height: e.height };
                        if (isColliding(hBox, player)) {
                            if (player.isShielding && player.parryWindow > 0) { triggerPerfectParry(); e.vx += e.facing === 'right' ? -15 : 15; }
                            else takeDamage(1);
                        }
                    }
                } else {
                    if (dist > 250) e.x += e.facing === 'right' ? e.speed : -e.speed;
                    if (e.attackCooldown === 0 && dist < 350) {
                        enemyBullets.push({ x: e.facing === 'right' ? e.x + e.width : e.x - 10, y: e.y + 16, vx: e.facing === 'right' ? 7.5 : -7.5, vy: 0, width: 10, height: 4 });
                        e.attackCooldown = 90;
                    }
                }
            }
            if (gameFrame % 20 === 0) e.isSlashing = false; 
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            let eb = enemyBullets[i]; eb.x += eb.vx; if(eb.vy) eb.y += eb.vy;
            if (eb.x < 0 || eb.x > WORLD_WIDTH) { enemyBullets.splice(i, 1); continue; }
            if (isColliding(eb, player)) {
                if (player.isShielding && player.parryWindow > 0) triggerPerfectParry();
                else takeDamage(1);
                enemyBullets.splice(i, 1);
            }
        }
    }

    for (let i = playerBullets.length - 1; i >= 0; i--) {
        playerBullets[i].x += playerBullets[i].vx;
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(playerBullets[i], enemies[j])) {
                enemies[j].hp -= playerBullets[i].damage; playerBullets.splice(i, 1);
                if (enemies[j].hp <= 0) { processKill(enemies[j]); enemies.splice(j, 1); }
                break;
            }
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        handlePlatformCollision(items[i]);
        if (isColliding(player, items[i])) { player.hp = Math.min(player.maxHp, player.hp + 1); items.splice(i, 1); }
    }
}

function drawProceduralCharacter(ctx, x, y, w, h, entity, baseColor) {
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    if (entity.facing === 'left') ctx.scale(-1, 1);

    let isMoving = Math.abs(entity.vx || 0) > 0.4;
    let isGrounded = entity.isGrounded;
    let bob = 0; let lean = 0; let legCycle = 0;

    if (!isGrounded) { bob = -4; legCycle = Math.PI / 4; } 
    else if (isMoving) { bob = Math.sin(gameFrame * 0.22) * 3.5; lean = 0.13; legCycle = gameFrame * 0.28; } 
    else { bob = Math.sin(gameFrame * 0.06) * 1.8; }

    ctx.rotate(lean);

    if (entity.isShielding) {
        ctx.save(); ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 3.5; ctx.shadowBlur = 18; ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = 'rgba(0, 255, 204, 0.16)'; ctx.beginPath(); ctx.arc(0, -h/2 + bob, w * 1.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    ctx.fillStyle = baseColor; ctx.fillRect(-w / 2, -h + 14 + bob, w, h - 24);
    ctx.beginPath(); ctx.arc(0, -h + 7 + bob, 7.5, 0, Math.PI * 2); ctx.fill();

    if (gameFrame % 140 > 8) { ctx.fillStyle = '#fff'; ctx.fillRect(2, -h + 5 + bob, 4, 2.5); }

    ctx.strokeStyle = baseColor; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    let legBaseY = -10 + bob;

    if (isGrounded && isMoving) {
        ctx.beginPath(); ctx.moveTo(-4, legBaseY); ctx.lineTo(-5 + Math.sin(legCycle) * 9, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, legBaseY); ctx.lineTo(3 + Math.cos(legCycle) * 9, 0); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.moveTo(-4, legBaseY); ctx.lineTo(-4, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, legBaseY); ctx.lineTo(4, 0); ctx.stroke();
    }

    if (entity.isSlashing) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(10, -h/2 + bob, 35, -Math.PI / 3, Math.PI / 3); ctx.stroke();
    }
    ctx.restore();
}

function draw() {
    let isTimeStopped = player.skills.timeStop.timer > 0;
    ctx.fillStyle = isTimeStopped ? '#0d0d11' : '#14141e'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
    ctx.translate(-camera.x, -camera.y);

    platforms.forEach(p => { ctx.fillStyle = '#23273a'; ctx.fillRect(p.x, p.y, p.width, p.height); });
    ctx.fillStyle = '#00ffff'; playerBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    ctx.fillStyle = '#ff4d4d'; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.width, eb.height));
    ctx.fillStyle = '#2ecc71'; items.forEach(it => ctx.fillRect(it.x, it.y, it.width, it.height));

    player.trail.forEach((t, index) => {
        ctx.globalAlpha = (index + 1) / 10;
        let tColor = t.state === 'AWAKENED' ? 'rgba(155,89,182,0.4)' : 'rgba(0,210,211,0.3)';
        drawProceduralCharacter(ctx, t.x, t.y, player.width, player.height, t, tColor);
    });
    ctx.globalAlpha = 1.0;

    enemies.forEach(e => {
        let eColor = e.isBoss ? '#e74c3c' : '#8e44ad';
        drawProceduralCharacter(ctx, e.x, e.y, e.width, e.height, e, eColor);
        ctx.fillStyle = '#c0392b'; ctx.fillRect(e.x, e.y - 14, e.width, 4);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(e.x, e.y - 14, (e.hp / e.maxHp) * e.width, 4);
    });

    skillVisuals.forEach(fx => {
        if (fx.type === 'jcut') {
            ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = `rgba(0, 255, 255, ${fx.timer/16})`;
            ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.currentRadius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        } else if (fx.type === 'shockwave' || fx.type === 'domain') {
            ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = fx.color || '#00d2d3';
            ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
    });

    if (player.skills.doppelSummon.active) {
        ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
        drawProceduralCharacter(ctx, doppelCompanion.x, doppelCompanion.y, doppelCompanion.width, doppelCompanion.height, doppelCompanion, 'rgba(0, 240, 255, 0.75)');
        ctx.shadowBlur = 0;
    }

    let pColor = player.isAwakened ? '#9b59b6' : '#00d2d3';
    drawProceduralCharacter(ctx, player.x, player.y, player.width, player.height, player, pColor);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 32, 0.65)'; ctx.fillRect(15, 15, 215, 120);
    ctx.strokeStyle = '#34495e'; ctx.lineWidth = 2; ctx.strokeRect(15, 15, 215, 120);

    ctx.fillStyle = '#34495e'; ctx.fillRect(25, 25, 195, 16);
    ctx.fillStyle = player.hp <= 1.5 ? '#e74c3c' : '#2ecc71'; ctx.fillRect(25, 25, (player.hp / player.maxHp) * 195, 16);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(`HP: ${Math.ceil(player.hp)} / ${player.maxHp}`, 32, 37);

    ctx.fillStyle = '#34495e'; ctx.fillRect(25, 48, 195, 13);
    ctx.fillStyle = player.isAwakened ? '#9b59b6' : '#8e44ad'; ctx.fillRect(25, 48, (player.awakeningGauge / 100) * 195, 13);
    ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.fillText(player.isAwakened ? "🔥 AWAKENED MODE" : `AWAKEN: ${Math.floor(player.awakeningGauge)}%`, 32, 58);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px monospace'; ctx.fillText(`SCORE  : ${score}`, 25, 84);
    if (wave % 10 === 0) { ctx.fillStyle = '#e74c3c'; ctx.fillText(`STATUS : ⚠️ BOSS WAVE`, 25, 102); } 
    else { ctx.fillStyle = '#f1c40f'; ctx.fillText(`WAVE   : ${wave}`, 25, 102); }

    ctx.fillStyle = '#00ffff'; ctx.font = '11px sans-serif'; ctx.fillText(`WEAPON : [${player.currentWeapon}]`, 25, 121);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15, 15, 26, 0.78)'; ctx.fillRect(15, 142, 215, 115);
    ctx.strokeStyle = '#34495e'; ctx.lineWidth = 2; ctx.strokeRect(15, 142, 215, 115);

    let listSkillsHUD = [
        { key: '1', name: 'Rapid Slash', obj: player.skills.rapidSlash },
        { key: '2', name: 'Judg. Cut', obj: player.skills.jCut },
        { key: '3', name: 'Endless JC', obj: player.skills.endless },
        { key: '4', name: 'Time Stop', obj: player.skills.timeStop },
        { key: '5', name: 'Doppelganger', obj: player.skills.doppelSummon }
    ];

    listSkillsHUD.forEach((sk, idx) => {
        let sy = 148 + idx * 21;
        ctx.fillStyle = '#bdc3c7'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`[${sk.key}] ${sk.name}`, 25, sy + 10);

        ctx.fillStyle = '#2c3e50'; ctx.fillRect(122, sy + 2, 55, 8);
        
        if (sk.obj.cd > 0) {
            let pct = sk.obj.cd / sk.obj.maxCd;
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(122, sy + 2, pct * 55, 8);
            ctx.fillStyle = '#e74c3c'; ctx.font = '9px monospace';
            ctx.fillText(`${Math.ceil(sk.obj.cd / 60)}s`, 184, sy + 10);
        } else {
            ctx.fillStyle = '#00ffff'; ctx.fillRect(122, sy + 2, 55, 8);
            ctx.fillStyle = '#00ffff'; ctx.font = 'bold 9px monospace';
            ctx.fillText('READY', 184, sy + 10);
        }
    });
    ctx.restore();

    let curRank = getStyleRank();
    if (player.stylePoints > 0) {
        ctx.save(); ctx.textAlign = 'right'; ctx.fillStyle = curRank.color; ctx.font = 'italic bold 45px Impact'; ctx.fillText(curRank.name, canvas.width - 30, 60); ctx.restore();
    }
}

function drawPausedOverlay() {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#00ffff'; ctx.font = 'bold 36px Impact';
    ctx.fillText('PAUSED', canvas.width / 2, 160);

    const opts = ['LANJUTKAN (RESUME)', 'RESTART MISSION', 'KEMBALI KE MENU'];
    opts.forEach((o, idx) => {
        if (idx === pauseSelectedOption) {
            ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 20px Arial'; ctx.fillText(`>  ${o}  <`, canvas.width / 2, 250 + idx * 45);
        } else {
            ctx.fillStyle = '#7f8c8d'; ctx.font = '17px Arial'; ctx.fillText(o, canvas.width / 2, 250 + idx * 45);
        }
    });
}

function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(20, 5, 5, 0.92)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center'; 
    ctx.fillStyle = '#ff4d4d'; 
    ctx.font = 'bold 46px Impact';
    ctx.fillText('KAMU MATI!', canvas.width / 2, 110);

    ctx.fillStyle = '#fff'; 
    ctx.font = '18px Courier New'; 
    ctx.fillText(`SKOR AKHIR : ${score}`, canvas.width / 2, 180);
    ctx.fillStyle = '#f1c40f'; 
    ctx.fillText(`WAVE TERTINGGI : ${wave}`, canvas.width / 2, 210);

    const opts = ['LANJUTKAN (TRY AGAIN)', 'KEMBALI KE MENU'];
    opts.forEach((o, idx) => {
        let optY = 310 + idx * 50;
        if (idx === gameOverSelectedOption) {
            ctx.fillStyle = '#00ffff'; 
            ctx.font = 'bold 22px Arial'; 
            ctx.fillText(`>  ${o}  <`, canvas.width / 2, optY);
        } else {
            ctx.fillStyle = '#7f8c8d'; 
            ctx.font = '18px Arial'; 
            ctx.fillText(o, canvas.width / 2, optY);
        }
    });
}

function restartGame() {
    player.x = 150; player.y = 700; player.vx = 0; player.vy = 0; player.hp = 5; player.isAwakened = false; player.awakeningGauge = 0; player.stylePoints = 0;
    player.jumpsLeft = player.maxJumps;
    for (let s in player.skills) { player.skills[s].cd = 0; player.skills[s].active = false; }
    playerBullets = []; enemyBullets = []; enemies = []; items = []; skillVisuals = [];
    score = 0; wave = 1; startWave(); window.gameState = 'GAME';
}
window.restartGameInstance = restartGame;

function gameLoop() {
    if (window.gameState === 'GAME') { update(); draw(); } 
    else if (window.gameState === 'PAUSED') { draw(); drawPausedOverlay(); } 
    else if (window.gameState === 'GAME_OVER') { draw(); drawGameOverOverlay(); }
    requestAnimationFrame(gameLoop);
}
gameLoop();
