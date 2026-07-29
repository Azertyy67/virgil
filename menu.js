// --- STATE SYSTEM & GAMEPAD SETTINGS ---
window.gameState = 'MAIN_MENU';

const menuCanvas = document.getElementById('gameCanvas');
const mCtx = menuCanvas.getContext('2d');

let menuFrame = 0;
let menuSelectedOption = 0;
const menuOptions = ['START MISSION', 'HOW TO PLAY', 'RANKINGS', 'CREDITS'];
let menuParticles = [];

function executeMenuOption() {
    if (menuSelectedOption === 0) {
        window.gameState = 'GAME';
        if (typeof window.restartGameInstance === 'function') {
            window.restartGameInstance();
        }
    } else if (menuSelectedOption === 1) {
        window.gameState = 'HOW_TO_PLAY';
    } else if (menuSelectedOption === 2) {
        window.gameState = 'RANKINGS';
    } else if (menuSelectedOption === 3) {
        window.gameState = 'CREDITS';
    }
}

// Control Input Handler
window.addEventListener('keydown', (e) => {
    if (window.gameState === 'MAIN_MENU') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            menuSelectedOption = (menuSelectedOption - 1 + menuOptions.length) % menuOptions.length;
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            menuSelectedOption = (menuSelectedOption + 1) % menuOptions.length;
        }
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
            executeMenuOption();
        }
    } else if (['HOW_TO_PLAY', 'RANKINGS', 'CREDITS'].includes(window.gameState)) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') {
            window.gameState = 'MAIN_MENU';
        }
    }
});

// Partikel Latar Menu
for (let i = 0; i < 30; i++) {
    menuParticles.push({
        x: Math.random() * menuCanvas.width,
        y: Math.random() * menuCanvas.height,
        vy: -(Math.random() * 1.5 + 0.5),
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#9b59b6' : '#00d2d3'
    });
}

function updateMenu() {
    menuParticles.forEach(p => {
        p.y += p.vy;
        if (p.y < -10) { p.y = menuCanvas.height + 10; p.x = Math.random() * menuCanvas.width; }
    });
}

function drawMenu() {
    mCtx.fillStyle = '#0d0d11';
    mCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);

    menuParticles.forEach(p => {
        mCtx.fillStyle = p.color;
        mCtx.beginPath(); mCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); mCtx.fill();
    });

    if (window.gameState === 'MAIN_MENU') {
        mCtx.textAlign = 'center';
        mCtx.fillStyle = '#fff'; mCtx.font = 'bold 48px Impact';
        mCtx.fillText('NEON TRIGGER', menuCanvas.width / 2, 115);
        
        mCtx.fillStyle = '#00ffff'; mCtx.font = 'bold 16px Impact';
        mCtx.fillText('AWAKENING VERTESA', menuCanvas.width / 2, 145);

        for (let i = 0; i < menuOptions.length; i++) {
            let optY = 240 + i * 42;
            if (i === menuSelectedOption) {
                mCtx.fillStyle = '#f1c40f'; 
                mCtx.font = 'bold 22px Arial';
                mCtx.fillText(`>  ${menuOptions[i]}  <`, menuCanvas.width / 2, optY);
            } else {
                mCtx.fillStyle = '#7f8c8d'; mCtx.font = 'bold 18px Arial';
                mCtx.fillText(menuOptions[i], menuCanvas.width / 2, optY);
            }
        }
    } else if (window.gameState === 'HOW_TO_PLAY') {
        mCtx.textAlign = 'center'; mCtx.fillStyle = '#00d2d3'; mCtx.font = 'bold 24px Arial';
        mCtx.fillText('HOW TO PLAY', menuCanvas.width / 2, 80);
        mCtx.fillStyle = '#fff'; mCtx.font = '16px Arial';
        mCtx.fillText('Gunakan D-Pad [▲/▼] untuk memilih menu & [⚔️] untuk Enter.', menuCanvas.width / 2, 180);
        mCtx.fillText('Tekan D-Pad [▲] untuk Lompat, [◀/▶] untuk Jalan.', menuCanvas.width / 2, 220);
        mCtx.fillStyle = '#f1c40f'; mCtx.fillText('Tekan [⚔️] untuk Kembali', menuCanvas.width / 2, 380);
    }
}

function mainMenuLoop() {
    if (window.gameState !== 'GAME' && window.gameState !== 'PAUSED' && window.gameState !== 'GAME_OVER') {
        updateMenu(); drawMenu();
    }
    requestAnimationFrame(mainMenuLoop);
}
mainMenuLoop();