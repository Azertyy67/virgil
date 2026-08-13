// --- STATE SYSTEM & CONTROL SETTINGS ---
window.gameState = 'MAIN_MENU';
window.CONTROL_MODE = 'KEYBOARD'; // Default Control Mode

const menuCanvas = document.getElementById('gameCanvas');
const mCtx = menuCanvas.getContext('2d');

let menuFrame = 0;
let menuSelectedOption = 0;
let menuParticles = [];

function getMenuOptions() {
    return [
        'START MISSION', 
        `MODE: [ ${window.CONTROL_MODE} ]`, 
        'HOW TO PLAY', 
        'RANKINGS', 
        'CREDITS'
    ];
}

function updateGamepadVisibility() {
    const gamepadEl = document.getElementById('virtual-gamepad');
    if (gamepadEl) {
        gamepadEl.style.display = window.CONTROL_MODE === 'GAMEPAD' ? 'block' : 'none';
    }
}

function executeMenuOption() {
    if (menuSelectedOption === 0) {
        window.gameState = 'GAME';
        if (typeof window.restartGameInstance === 'function') {
            window.restartGameInstance();
        }
    } else if (menuSelectedOption === 1) {
        // Toggle Antara Keyboard dan Gamepad
        window.CONTROL_MODE = window.CONTROL_MODE === 'KEYBOARD' ? 'GAMEPAD' : 'KEYBOARD';
        updateGamepadVisibility();
    } else if (menuSelectedOption === 2) {
        window.gameState = 'HOW_TO_PLAY';
    } else if (menuSelectedOption === 3) {
        window.gameState = 'RANKINGS';
    } else if (menuSelectedOption === 4) {
        window.gameState = 'CREDITS';
    }
}

// Control Input Handler untuk Main Menu
window.addEventListener('keydown', (e) => {
    const options = getMenuOptions();
    if (window.gameState === 'MAIN_MENU') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            menuSelectedOption = (menuSelectedOption - 1 + options.length) % options.length;
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            menuSelectedOption = (menuSelectedOption + 1) % options.length;
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

// Inisialisasi Tampilan awal
updateGamepadVisibility();

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

    const options = getMenuOptions();

    if (window.gameState === 'MAIN_MENU') {
        mCtx.textAlign = 'center';
        mCtx.fillStyle = '#fff'; mCtx.font = 'bold 48px Impact';
        mCtx.fillText('Virgil', menuCanvas.width / 2, 100);
        
        mCtx.fillStyle = '#00ffff'; mCtx.font = 'bold 16px Impact';
        mCtx.fillText('DMC fan made', menuCanvas.width / 2, 130);

        for (let i = 0; i < options.length; i++) {
            let optY = 210 + i * 38;
            if (i === menuSelectedOption) {
                mCtx.fillStyle = '#f1c40f'; 
                mCtx.font = 'bold 20px Arial';
                mCtx.fillText(`>  ${options[i]}  <`, menuCanvas.width / 2, optY);
            } else {
                mCtx.fillStyle = '#7f8c8d'; mCtx.font = 'bold 16px Arial';
                mCtx.fillText(options[i], menuCanvas.width / 2, optY);
            }
        }
    } else if (window.gameState === 'HOW_TO_PLAY') {
        mCtx.textAlign = 'center'; mCtx.fillStyle = '#00d2d3'; mCtx.font = 'bold 24px Arial';
        mCtx.fillText('KONTROL KEYBOARD & MOUSE', menuCanvas.width / 2, 80);
        mCtx.fillStyle = '#fff'; mCtx.font = '15px Arial';
        mCtx.fillText('A / D : Gerak Kiri / Kanan', menuCanvas.width / 2, 140);
        mCtx.fillText('SPASI : Melompat', menuCanvas.width / 2, 170);
        mCtx.fillText('KLIK KIRI MOUSE : Menyerang', menuCanvas.width / 2, 200);
        mCtx.fillText('Q : Ganti Senjata | R : Perisai / Parrying', menuCanvas.width / 2, 230);
        mCtx.fillText('E : Awakening Mode | 1 - 5 : Skill Special', menuCanvas.width / 2, 260);
        
        mCtx.fillStyle = '#f1c40f'; mCtx.fillText('Tekan [ESC / ENTER] untuk Kembali', menuCanvas.width / 2, 380);
    }
}

function mainMenuLoop() {
    if (window.gameState !== 'GAME' && window.gameState !== 'PAUSED' && window.gameState !== 'GAME_OVER') {
        updateMenu(); drawMenu();
    }
    requestAnimationFrame(mainMenuLoop);
}
mainMenuLoop();
