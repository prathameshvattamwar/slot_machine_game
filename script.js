const balanceAmountElement = document.getElementById('balance-amount');
const betInputElement = document.getElementById('bet-input');
const decreaseBetButton = document.getElementById('decrease-bet');
const increaseBetButton = document.getElementById('increase-bet');
const currentBetAmountElement = document.getElementById('current-bet-amount');
const reel1Inner = document.getElementById('reel1');
const reel2Inner = document.getElementById('reel2');
const reel3Inner = document.getElementById('reel3');
const spinButton = document.getElementById('spin-button');
const lever = document.getElementById('lever');
const resultMessageElement = document.getElementById('result-message');
const jackpotOverlay = document.getElementById('jackpot-overlay');
const closeJackpotButton = document.getElementById('close-jackpot');
const rulesOverlay = document.getElementById('rules-overlay');
const closeRulesButton = document.getElementById('close-rules');
const infoIcon = document.getElementById('info-icon');


const symbols = [
    { name: "lemon", iconClass: "fas fa-lemon", threeKindMultiplier: 3 },
    { name: "bell", iconClass: "fas fa-bell", threeKindMultiplier: 3 },
    { name: "seedling", iconClass: "fas fa-seedling", threeKindMultiplier: 3 },
    { name: "smile", iconClass: "fa-solid fa-face-smile", threeKindMultiplier: 3 },
    { name: "star", iconClass: "fas fa-star", threeKindMultiplier: "jackpot" }
];

const weightedSymbols = [
    ...Array(50).fill(symbols[0]), // lemon (Highest frequency)
    ...Array(40).fill(symbols[1]), // bell
    ...Array(25).fill(symbols[2]), // seedling
    ...Array(10).fill(symbols[3]), // smile (Lower frequency)
    ...Array(2).fill(symbols[4]),  // star (Lowest frequency - Jackpot)
];


const REEL_ITEM_TOTAL_HEIGHT = 60;
const NUM_ITEMS_PER_REEL = 40;
const SPIN_DURATION = 3000;
const JACKPOT_REWARD = 1000;

let balance = 1000;
let currentBet = 10;
let isSpinning = false;

function updateBalanceDisplay() {
    balanceAmountElement.textContent = Math.floor(balance);
}

function updateCurrentBetDisplay() {
    currentBetAmountElement.textContent = currentBet;
}

function updateMessage(text, type = 'info') {
    resultMessageElement.textContent = text;
    resultMessageElement.className = `message ${type}`;
}

function getRandomSymbol() {
    return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
}

function populateReel(reelInner) {
    reelInner.innerHTML = '';
    for (let i = 0; i < NUM_ITEMS_PER_REEL; i++) {
        const symbolData = getRandomSymbol();
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        const icon = document.createElement('i');
        icon.className = symbolData.iconClass;
        icon.dataset.name = symbolData.name;
        iconContainer.appendChild(icon);
        reelInner.appendChild(iconContainer);
    }
     reelInner.style.transition = 'none';
     reelInner.style.transform = `translateY(0px)`;
}

async function spinReel(reelInner, targetSymbolName) {
    return new Promise(resolve => {
        populateReel(reelInner);
         reelInner.offsetHeight;

        const items = Array.from(reelInner.children);
        let targetIndex = -1;
        for (let i = items.length - 4; i >= items.length - 10; i--) {
            if (i >= 0 && items[i].querySelector('i')?.dataset.name === targetSymbolName) {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex === -1) targetIndex = Math.max(0, items.length - 5);

        const targetPosition = - (targetIndex * REEL_ITEM_TOTAL_HEIGHT) + (REEL_ITEM_TOTAL_HEIGHT * 1);

        reelInner.style.transition = `transform ${SPIN_DURATION / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        reelInner.style.transform = `translateY(${targetPosition}px)`;

        setTimeout(() => {
            resolve();
        }, SPIN_DURATION);
    });
}


function checkWin(results) {
    const [s1, s2, s3] = results;

    if (s1 === 'star' && s2 === 'star' && s3 === 'star') {
        return { type: "jackpot", multiplier: 0 };
    }

    if (s1 === s2 && s2 === s3) {
         const winningSymbol = symbols.find(s => s.name === s1 && s.name !== 'star');
         if (winningSymbol) {
            return { type: "three_kind", multiplier: 3 };
         }
    }

    return { type: "lose", multiplier: 0 };
}

function showPopup(overlayElement) {
    overlayElement.classList.add('show');
    overlayElement.style.display = 'flex';
}

function hidePopup(overlayElement) {
     overlayElement.classList.remove('show');
      setTimeout(() => {
          if (!overlayElement.classList.contains('show')) {
             overlayElement.style.display = 'none';
          }
      }, 300);
}


async function handleSpin() {
    if (isSpinning) return;

    currentBet = parseInt(betInputElement.value);

    if (isNaN(currentBet) || currentBet <= 0) {
        updateMessage("Please enter a valid bet amount.", 'error');
        return;
    }

    if (currentBet > balance) {
        updateMessage("Insufficient balance for this bet.", 'error');
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;
    lever.style.pointerEvents = 'none';
    spinButton.classList.add('spinning');
    lever.classList.add('pulling');
    updateMessage('');

    balance -= currentBet;
    updateBalanceDisplay();

    const results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    const finalSymbolNames = results.map(s => s.name);

    await Promise.all([
        spinReel(reel1Inner, finalSymbolNames[0]),
        spinReel(reel2Inner, finalSymbolNames[1]),
        spinReel(reel3Inner, finalSymbolNames[2])
    ]);

    const winResult = checkWin(finalSymbolNames);
    let winnings = 0;

    if (winResult.type === "jackpot") {
        winnings = JACKPOT_REWARD;
        balance += winnings;
        updateBalanceDisplay();
        updateMessage('');
        showPopup(jackpotOverlay);
    } else if (winResult.type === "three_kind") {
        winnings = winResult.multiplier * currentBet;
        balance += winnings;
        updateBalanceDisplay();
        updateMessage(`Three of a Kind! You Won ${winnings} Rs!`, 'win');
    } else {
        updateMessage("Try Again!", 'lose');
    }

    setTimeout(() => {
        lever.classList.remove('pulling');
        spinButton.classList.remove('spinning');
        isSpinning = false;
        spinButton.disabled = false;
        lever.style.pointerEvents = 'auto';
    }, 300);
}

function adjustBet(amount) {
     let currentVal = parseInt(betInputElement.value);
     let newVal = currentVal + amount;
     const minBet = parseInt(betInputElement.min) || 10;
     const maxPossibleBet = balance;

     if (newVal < minBet) newVal = minBet;

     if (amount > 0 && newVal > maxPossibleBet) {
          newVal = maxPossibleBet;
     } else if (newVal > 10000) {
         newVal = 10000;
     }


     betInputElement.value = newVal;
     currentBet = newVal;
     updateCurrentBetDisplay();
}

function initGame() {
    updateBalanceDisplay();
    updateCurrentBetDisplay();
    populateReel(reel1Inner);
    populateReel(reel2Inner);
    populateReel(reel3Inner);

    spinButton.addEventListener('click', handleSpin);
    lever.addEventListener('click', handleSpin);

     decreaseBetButton.addEventListener('click', () => adjustBet(-10));
     increaseBetButton.addEventListener('click', () => adjustBet(10));

     betInputElement.addEventListener('change', () => {
         let betVal = parseInt(betInputElement.value);
         const minBet = parseInt(betInputElement.min) || 10;
          if (isNaN(betVal) || betVal < minBet) {
             betVal = minBet;
             betInputElement.value = betVal;
          }
          if (betVal > balance) {
              betVal = balance;
              betInputElement.value = betVal;
          }
         currentBet = betVal;
         updateCurrentBetDisplay();
     });

     infoIcon.addEventListener('click', () => showPopup(rulesOverlay));
     closeRulesButton.addEventListener('click', () => hidePopup(rulesOverlay));
     rulesOverlay.addEventListener('click', (event) => {
         if (event.target === rulesOverlay) {
             hidePopup(rulesOverlay);
         }
     });

     closeJackpotButton.addEventListener('click', () => hidePopup(jackpotOverlay));
     jackpotOverlay.addEventListener('click', (event) => {
         if (event.target === jackpotOverlay) {
             hidePopup(jackpotOverlay);
         }
     });
}

initGame();