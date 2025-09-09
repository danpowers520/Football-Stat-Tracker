document.addEventListener('DOMContentLoaded', function() {
    // Game data object to store all statistics
    let gameData = {
        opponent: "",
        currentQB: 0,
        // Pass stats
        completions: 0,
        attempts: 0,
        passYards: 0,
        passTDs: 0,
        ints: 0,
        // Rush stats
        rushes: 0,
        rushYards: 0,
        rushTDs: 0,
        sacks: 0,
        // Kicking stats
        fgAttempts: 0,
        fgMade: 0,
        fgYards: [],
        patAttempts: 0,
        patMade: 0,
        // Other data
        penalties: [],
        playHistory: [],
        receivers: {},
        // ENHANCED: Each rusher now tracks every carry's yardage!
        rushers: {},
        defenseStats: {
            tackles: 0,
            sacks: 0,
            interceptions: 0,
            forcedFumbles: 0,
            tfl: 0,
            players: {}
        },
        qbs: {}
    };
    // ---- HELPER FUNCTIONS FOR ADVANCED RUSH STATS ----
    function getTeamYdsPerCarry() {
        return gameData.rushes ? (gameData.rushYards / gameData.rushes) : 0;
    }
    function getTeamLongestRush() {
        let allRushes = [];
        for (const rusherNum in gameData.rushers) {
            allRushes = allRushes.concat(gameData.rushers[rusherNum].rushes || []);
        }
        return allRushes.length ? Math.max(...allRushes) : 0;
    }
    function getRusherYdsPerCarry(rusher) {
        return rusher.carries ? (rusher.yards / rusher.carries) : 0;
    }
    function getRusherLongestRush(rusher) {
        return rusher.rushes && rusher.rushes.length ? Math.max(...rusher.rushes) : 0;
    }
    // ---- END HELPER FUNCTIONS ----
    // Get elements
    const setupForm = document.getElementById('setupForm');
    const setupModal = document.getElementById('setupModal');
    const inputModal = document.getElementById('inputModal');
    const inputForm = document.getElementById('inputForm');
    const inputTitle = document.getElementById('inputTitle');
    const inputFields = document.getElementById('inputFields');
    const cancelBtn = document.getElementById('cancelBtn');
    const opponentDisplay = document.getElementById('opponentDisplay');
    // Action buttons
    const passBtn = document.getElementById('passBtn');
    const rushBtn = document.getElementById('rushBtn');
    const kickBtn = document.getElementById('kickBtn');
    const defenseBtn = document.getElementById('defenseBtn');
    const flagBtn = document.getElementById('flagBtn');
    const undoBtn = document.getElementById('undoBtn');
    const endGameBtn = document.getElementById('endGameBtn');
    // NEW: Change QB button
    const changeQbBtn = document.getElementById('changeQbBtn');
    // NEW: MaxPreps Export button
    const maxPrepsBtn = document.getElementById('maxPrepsBtn');
    // Stats content divs
    const passStatsContent = document.getElementById('passStatsContent');
    const rushStatsContent = document.getElementById('rushStatsContent');
    const kickStatsContent = document.getElementById('kickStatsContent');
    const defenseStatsContent = document.getElementById('defenseStatsContent');
    const penaltyStatsContent = document.getElementById('penaltyStatsContent');
    // Setup form submission initializes the game
    setupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const opponent = document.getElementById('opponent').value;
        const qbNumber = parseInt(document.getElementById('qbNumber').value);
        gameData.opponent = opponent;
        gameData.currentQB = qbNumber;
        // Initialize QB stats
        gameData.qbs[qbNumber] = {
            number: qbNumber,
            completions: 0,
            attempts: 0,
            yards: 0,
            tds: 0,
            ints: 0
        };
        // Update UI
        opponentDisplay.textContent = opponent;
        // Hide the setup modal robustly
        setupModal.style.display = 'none';
        setupModal.style.cssText = "display: none !important;";
        setupModal.classList.add('hidden');
        updateAllStats();
    });
    // Button event listeners
    if (passBtn) passBtn.addEventListener('click', handlePassPlay);
    if (rushBtn) rushBtn.addEventListener('click', handleRushPlay);
    if (kickBtn) kickBtn.addEventListener('click', handleKickPlay);
    if (defenseBtn) defenseBtn.addEventListener('click', handleDefensePlay);
    if (flagBtn) flagBtn.addEventListener('click', handleFlagPlay);
    if (undoBtn) undoBtn.addEventListener('click', handleUndo);
    if (endGameBtn) endGameBtn.addEventListener('click', handleEndGame);
    // NEW: Change QB button event
    if (changeQbBtn) changeQbBtn.addEventListener('click', handleChangeQB);
    // NEW: MaxPreps Export button event
    if (maxPrepsBtn) maxPrepsBtn.addEventListener('click', handleMaxPrepsExport);
    // Handle input form submission (actual handling is in showInputModal callback)
    inputForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
    // Show input modal with custom fields and a callback
    function showInputModal(title, fields, callback) {
        inputTitle.textContent = title;
        inputFields.innerHTML = '';
        // Create input fields
        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = field.label;
            label.htmlFor = field.id;
            fieldDiv.appendChild(label);
            if (field.type === 'radio') {
                const radioGroup = document.createElement('div');
                radioGroup.className = 'radio-group';
                field.options.forEach(option => {
                    const radioOption = document.createElement('div');
                    radioOption.className = 'radio-option';
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = field.id;
                    input.id = `${field.id}_${option.value}`;
                    input.value = option.value;
                    const optionLabel = document.createElement('label');
                    optionLabel.textContent = option.text;
                    optionLabel.htmlFor = `${field.id}_${option.value}`;
                    radioOption.appendChild(input);
                    radioOption.appendChild(optionLabel);
                    radioGroup.appendChild(radioOption);
                });
                fieldDiv.appendChild(radioGroup);
            } else {
                const input = document.createElement('input');
                input.type = field.type;
                input.id = field.id;
                input.name = field.id;
                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
                if (field.required) input.required = true;
                fieldDiv.appendChild(input);
            }
            inputFields.appendChild(fieldDiv);
        });
        // Set up the form submission for modal
        const submitHandler = function(e) {
            e.preventDefault();
            const data = {};
            fields.forEach(field => {
                if (field.type === 'radio') {
                    const selectedOption = document.querySelector(`input[name="${field.id}"]:checked`);
                    data[field.id] = selectedOption ? selectedOption.value : '';
                } else {
                    const input = document.getElementById(field.id);
                    data[field.id] = input.value;
                }
            });
            closeInputModal();
            inputForm.removeEventListener('submit', submitHandler);
            callback(data);
        };
        inputForm.addEventListener('submit', submitHandler);
        // Cancel now just closes the modal and aborts the flow
        cancelBtn.onclick = () => {
            closeInputModal();
            inputForm.removeEventListener('submit', submitHandler);
            callback({ cancelled: true });
        };
        inputModal.style.display = 'flex';
    }
    function closeInputModal() {
        inputModal.style.display = 'none';
    }
    // All modal flows now properly abort if cancelled
    function handlePassPlay() {
        function askTarget() {
            showInputModal('Pass Play', [
                { type: 'number', label: 'Target Player Number:', id: 'target', min: 0, max: 99, required: true }
            ], (data) => {
                if (data.cancelled) return; // ABORT flow
                const target = parseInt(data.target);
                askResult(target);
            });
        }
        function askResult(target) {
            showInputModal('Pass Result', [
                {
                    type: 'radio',
                    label: 'Result:',
                    id: 'result',
                    options: [
                        { value: 'complete', text: 'Complete' },
                        { value: 'incomplete', text: 'Incomplete' },
                        { value: 'touchdown', text: 'Touchdown' },
                        { value: 'interception', text: 'Interception' },
                        // { value: 'drop', text: 'Dropped' }
                    ]
                }
            ], (resultData) => {
                if (resultData.cancelled) return;
                const result = resultData.result;
                gameData.attempts++;
                if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].attempts++;
                if (!gameData.receivers[target]) gameData.receivers[target] = { qbs: {} };
                if (!gameData.receivers[target].qbs[gameData.currentQB]) {
                    gameData.receivers[target].qbs[gameData.currentQB] = {
                        catches: 0, targets: 0, yards: 0, tds: 0
                    };
                }
                gameData.receivers[target].qbs[gameData.currentQB].targets++;
                if (result === 'interception') {
                    gameData.ints++;
                    if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].ints++;
                    gameData.playHistory.push({ type: 'pass', target, result: 'interception', yards: 0 });
                    updateAllStats();
                } else if (result === 'incomplete') {
                    gameData.playHistory.push({ type: 'pass', target, result: 'incomplete', yards: 0 });
                    updateAllStats();
                } else {
                    askYards(target, result);
                }
            });
        }
        function askYards(target, result) {
            showInputModal('Yards Gained', [
                { type: 'number', label: 'Yards:', id: 'yards', min: 0, required: true }
            ], (yardsData) => {
                if (yardsData.cancelled) return;
                const yards = parseInt(yardsData.yards);
                gameData.completions++;
                if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].completions++;
                gameData.receivers[target].qbs[gameData.currentQB].catches++;
                gameData.passYards += yards;
                if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].yards += yards;
                gameData.receivers[target].qbs[gameData.currentQB].yards += yards;
                if (result === 'touchdown') {
                    gameData.passTDs++;
                    if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].tds++;
                    gameData.receivers[target].qbs[gameData.currentQB].tds++;
                    gameData.playHistory.push({ type: 'pass', target, result: 'touchdown', yards });
                    askPAT();
                } else {
                    gameData.playHistory.push({ type: 'pass', target, result: 'complete', yards });
                    updateAllStats();
                }
            });
        }
        function askPAT() {
            showInputModal('PAT Attempt', [
                {
                    type: 'radio',
                    label: 'PAT Result:',
                    id: 'pat',
                    options: [
                        { value: 'good', text: 'Good' },
                        { value: 'missed', text: 'Missed' }
                    ]
                }
            ], (patData) => {
                if (patData.cancelled) return;
                gameData.patAttempts++;
                if (patData.pat === 'good') gameData.patMade++;
                updateAllStats();
            });
        }
        askTarget();
    }
    // --- CHANGED: Increments rusher's .rushes array per run!
    function handleRushPlay() {
        function askRush() {
            showInputModal('Rush Play', [
                { type: 'number', label: 'Rusher Number:', id: 'rusher', min: 0, max: 99, required: true },
                { type: 'number', label: 'Yards Gained:', id: 'yards', required: true }
            ], (data) => {
                if (data.cancelled) return;
                const rusher = parseInt(data.rusher);
                const yards = parseInt(data.yards);
                gameData.rushes++;
                gameData.rushYards += yards;
                if (!gameData.rushers[rusher]) {
                    gameData.rushers[rusher] = { carries: 0, yards: 0, tds: 0, rushes: [] };
                }
                gameData.rushers[rusher].carries++;
                gameData.rushers[rusher].yards += yards;
                gameData.rushers[rusher].rushes.push(yards); // <-- NEW
                if (rusher === gameData.currentQB && yards < 0) gameData.sacks++;
                askTD(rusher, yards);
            });
        }
        function askTD(rusher, yards) {
            showInputModal('Touchdown?', [
                {
                    type: 'radio',
                    label: 'Was this a touchdown?',
                    id: 'touchdown',
                    options: [
                        { value: 'yes', text: 'Yes' },
                        { value: 'no', text: 'No' }
                    ]
                }
            ], (tdData) => {
                if (tdData.cancelled) return;
                const playData = { type: 'rush', rusher, yards, touchdown: (tdData.touchdown === 'yes') };
                if (tdData.touchdown === 'yes') {
                    gameData.rushTDs++;
                    gameData.rushers[rusher].tds++;
                    askPAT(playData);
                } else {
                    gameData.playHistory.push(playData);
                    updateAllStats();
                }
            });
        }
        function askPAT(playData) {
            showInputModal('PAT Attempt', [
                {
                    type: 'radio',
                    label: 'PAT Result:',
                    id: 'pat',
                    options: [
                        { value: 'good', text: 'Good' },
                        { value: 'missed', text: 'Missed' }
                    ]
                }
            ], (patData) => {
                if (patData.cancelled) return;
                gameData.patAttempts++;
                if (patData.pat === 'good') gameData.patMade++;
                gameData.playHistory.push(playData);
                updateAllStats();
            });
        }
        askRush();
    }
    function handleKickPlay() {
        function askType() {
            showInputModal('Kick Type', [
                {
                    type: 'radio',
                    label: 'Type:',
                    id: 'type',
                    options: [
                        { value: 'fg', text: 'Field Goal' },
                        { value: 'pat', text: 'PAT' }
                    ]
                }
            ], (data) => {
                if (data.cancelled) return;
                const type = data.type;
                if (type === 'fg') {
                    askFGYards();
                } else {
                    askPATResult('pat');
                }
            });
        }
        function askFGYards() {
            showInputModal('Field Goal Distance', [
                { type: 'number', label: 'Yards:', id: 'yards', min: 1, required: true }
            ], (yardsData) => {
                if (yardsData.cancelled) return;
                const yards = parseInt(yardsData.yards);
                askFGResult(yards);
            });
        }
        function askFGResult(yards) {
            showInputModal('Field Goal Result', [
                {
                    type: 'radio',
                    label: 'Result:',
                    id: 'result',
                    options: [
                        { value: 'good', text: 'Good' },
                        { value: 'missed', text: 'Missed' }
                    ]
                }
            ], (resultData) => {
                if (resultData.cancelled) return;
                gameData.fgAttempts++;
                if (resultData.result === 'good') {
                    gameData.fgMade++;
                    gameData.fgYards.push(yards);
                }
                gameData.playHistory.push({ type: 'kick', kickType: 'fg', yards, result: resultData.result });
                updateAllStats();
            });
        }
        function askPATResult(kickType) {
            showInputModal('PAT Result', [
                {
                    type: 'radio',
                    label: 'Result:',
                    id: 'result',
                    options: [
                        { value: 'good', text: 'Good' },
                        { value: 'missed', text: 'Missed' }
                    ]
                }
            ], (resultData) => {
                if (resultData.cancelled) return;
                gameData.patAttempts++;
                if (resultData.result === 'good') gameData.patMade++;
                gameData.playHistory.push({ type: 'kick', kickType, result: resultData.result });
                updateAllStats();
            });
        }
        askType();
    }
    function handleDefensePlay() {
        function askDefense() {
            showInputModal('Defensive Play', [
                { type: 'number', label: 'Player Number:', id: 'player', min: 0, max: 99, required: true },
                {
                    type: 'radio',
                    label: 'Play Type:',
                    id: 'playType',
                    options: [
                        { value: 'tackle', text: 'Tackle' },
                        { value: 'sack', text: 'Sack' },
                        { value: 'interception', text: 'Interception' },
                        { value: 'fumble', text: 'Forced Fumble' },
                        { value: 'tfl', text: 'TFL' }
                    ]
                }
            ], (data) => {
                if (data.cancelled) return;
                const player = parseInt(data.player);
                const playType = data.playType;
                if (!gameData.defenseStats.players[player]) {
                    gameData.defenseStats.players[player] = {
                        tackles: 0,
                        sacks: 0,
                        interceptions: 0,
                        forcedFumbles: 0,
                        tfl: 0
                    };
                }
                switch (playType) {
                    case 'tackle':
                        gameData.defenseStats.tackles++;
                        gameData.defenseStats.players[player].tackles++;
                        break;
                    case 'sack':
                        gameData.defenseStats.sacks++;
                        gameData.defenseStats.players[player].sacks++;
                        break;
                    case 'interception':
                        gameData.defenseStats.interceptions++;
                        gameData.defenseStats.players[player].interceptions++;
                        break;
                    case 'fumble':
                        gameData.defenseStats.forcedFumbles++;
                        gameData.defenseStats.players[player].forcedFumbles++;
                        break;
                    case 'tfl':
                        gameData.defenseStats.tfl++;
                        gameData.defenseStats.players[player].tfl++;
                        break;
                }
                gameData.playHistory.push({ type: 'defense', player, playType });
                updateAllStats();
            });
        }
        askDefense();
    }
    function handleFlagPlay() {
        function askPenalty() {
            showInputModal('Penalty', [
                { type: 'text', label: 'Penalty Type:', id: 'type', required: true },
                { type: 'number', label: 'Yards:', id: 'yards', required: true },
                { type: 'text', label: 'Player Number (S for sideline, C for coach, U for Unknown):', id: 'player', required: true }
            ], (data) => {
                if (data.cancelled) return;
                const penalty = {
                    type: data.type,
                    yards: parseInt(data.yards),
                    player: data.player
                };
                gameData.penalties.push(penalty);
                updateAllStats();
            });
        }
        askPenalty();
    }
    // Handle Undo
    function handleUndo() {
        if (gameData.playHistory.length > 0) {
            undoLastPlay();
            updateAllStats();
        } else {
            alert('No plays to undo');
        }
    }
    function undoLastPlay() {
        const lastPlay = gameData.playHistory.pop();
        if (!lastPlay) return;
        switch (lastPlay.type) {
            case 'pass': undoPassPlay(lastPlay); break;
            case 'rush': undoRushPlay(lastPlay); break;
            case 'kick': undoKickPlay(lastPlay); break;
            case 'defense': undoDefensePlay(lastPlay); break;
        }
    }
    function undoPassPlay(play) {
        gameData.attempts--;
        if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].attempts--;
        if (gameData.receivers[play.target] && gameData.receivers[play.target].qbs[gameData.currentQB]) {
            gameData.receivers[play.target].qbs[gameData.currentQB].targets--;
        }
        if (play.result === 'interception') {
            gameData.ints--;
            if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].ints--;
        } else if (play.result === 'complete' || play.result === 'touchdown') {
            gameData.completions--;
            if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].completions--;
            if (gameData.receivers[play.target] && gameData.receivers[play.target].qbs[gameData.currentQB]) {
                gameData.receivers[play.target].qbs[gameData.currentQB].catches--;
            }
            gameData.passYards -= play.yards;
            if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].yards -= play.yards;
            if (gameData.receivers[play.target] && gameData.receivers[play.target].qbs[gameData.currentQB]) {
                gameData.receivers[play.target].qbs[gameData.currentQB].yards -= play.yards;
            }
            if (play.result === 'touchdown') {
                gameData.passTDs--;
                if (gameData.qbs[gameData.currentQB]) gameData.qbs[gameData.currentQB].tds--;
                if (gameData.receivers[play.target] && gameData.receivers[play.target].qbs[gameData.currentQB]) {
                    gameData.receivers[play.target].qbs[gameData.currentQB].tds--;
                }
            }
        }
    }
    // --- CHANGED: Remove last rush from .rushes array!
    function undoRushPlay(play) {
        gameData.rushes--;
        gameData.rushYards -= play.yards;
        if (gameData.rushers[play.rusher]) {
            gameData.rushers[play.rusher].carries--;
            gameData.rushers[play.rusher].yards -= play.yards;
            if (gameData.rushers[play.rusher].rushes) gameData.rushers[play.rusher].rushes.pop();
        }
        if (play.rusher === gameData.currentQB && play.yards < 0) gameData.sacks--;
        if (play.touchdown) {
            gameData.rushTDs--;
            if (gameData.rushers[play.rusher]) gameData.rushers[play.rusher].tds--;
        }
    }
    function undoKickPlay(play) {
        if (play.kickType === 'fg') {
            gameData.fgAttempts--;
            if (play.result === 'good') {
                gameData.fgMade--;
                const index = gameData.fgYards.indexOf(play.yards);
                if (index !== -1) gameData.fgYards.splice(index, 1);
            }
        } else {
            gameData.patAttempts--;
            if (play.result === 'good') gameData.patMade--;
        }
    }
    function undoDefensePlay(play) {
        switch (play.playType) {
            case 'tackle':
                gameData.defenseStats.tackles--;
                if (gameData.defenseStats.players[play.player]) gameData.defenseStats.players[play.player].tackles--;
                break;
            case 'sack':
                gameData.defenseStats.sacks--;
                if (gameData.defenseStats.players[play.player]) gameData.defenseStats.players[play.player].sacks--;
                break;
            case 'interception':
                gameData.defenseStats.interceptions--;
                if (gameData.defenseStats.players[play.player]) gameData.defenseStats.players[play.player].interceptions--;
                break;
            case 'fumble':
                gameData.defenseStats.forcedFumbles--;
                if (gameData.defenseStats.players[play.player]) gameData.defenseStats.players[play.player].forcedFumbles--;
                break;
            case 'tfl':
                gameData.defenseStats.tfl--;
                if (gameData.defenseStats.players[play.player]) gameData.defenseStats.players[play.player].tfl--;
                break;
        }
    }
    // Change QB (needs a button and wiring if desired)
    function handleChangeQB() {
        showInputModal('Change Quarterback', [
            { type: 'number', label: 'New QB Number:', id: 'qbNumber', min: 1, max: 99, required: true }
        ], (data) => {
            if (data.cancelled) return;
            const qbNumber = parseInt(data.qbNumber);
            if (!gameData.qbs[qbNumber]) {
                gameData.qbs[qbNumber] = {
                    number: qbNumber,
                    completions: 0,
                    attempts: 0,
                    yards: 0,
                    tds: 0,
                    ints: 0
                };
            }
            gameData.currentQB = qbNumber;
            updateAllStats();
        });
    }
    // End Game
    function handleEndGame() {
        const statsText = generateFinalStats();
        downloadStats(statsText);
    }
    function generateFinalStats() {
        let stats = `Final Stats vs ${gameData.opponent}\n\n`;
        // Pass stats
        stats += `PASSING:\n`;
        for (const qbNum in gameData.qbs) {
            const qb = gameData.qbs[qbNum];
            stats += `QB #${qbNum}: ${qb.completions}/${qb.attempts}, ${qb.yards} yards, ${qb.tds} TD, ${qb.ints} INT\n`;
            for (const receiverNum in gameData.receivers) {
                const receiver = gameData.receivers[receiverNum];
                if (receiver.qbs && receiver.qbs[qbNum]) {
                    const recStats = receiver.qbs[qbNum];
                    stats += `  #${receiverNum}: ${recStats.catches} catches on ${recStats.targets} targets for ${recStats.yards} yards and ${recStats.tds} TD\n`;
                }
            }
            stats += '\n';
        }
        // Rushing stats - ENHANCED
        stats += `RUSHING:\n`;
        stats += `Team: ${gameData.rushes} rushes, ${gameData.rushYards} yards, ${gameData.rushTDs} TD, YPC: ${getTeamYdsPerCarry().toFixed(2)}, Longest: ${getTeamLongestRush()}\n`;
        for (const rusherNum in gameData.rushers) {
            const rusher = gameData.rushers[rusherNum];
            let rusherStats = `#${rusherNum}: ${rusher.yards} yards on ${rusher.carries} carries for ${rusher.tds} TD, YPC: ${getRusherYdsPerCarry(rusher).toFixed(2)}, Longest: ${getRusherLongestRush(rusher)}`;
            if (rusherNum == gameData.currentQB) rusherStats += ` (sacked ${gameData.sacks} times)`;
            stats += `${rusherStats}\n`;
        }
        stats += '\n';
        // Kicking stats
        stats += `KICKING:\n`;
        stats += `PATs: ${gameData.patMade}/${gameData.patAttempts}\n`;
        stats += `FGs: ${gameData.fgMade}/${gameData.fgAttempts}\n`;
        if (gameData.fgYards.length > 0) {
            stats += `Good from: ${gameData.fgYards.join(', ')} yards\n`;
        }
        stats += '\n';
        // Defense stats
        stats += `DEFENSE:\n`;
        const defense = gameData.defenseStats;
        stats += `Team: ${defense.tackles} TKL, ${defense.sacks} SACK, ${defense.interceptions} INT, ${defense.forcedFumbles} FF, ${defense.tfl} TFLs\n`;
        for (const playerNum in defense.players) {
            const player = defense.players[playerNum];
            let statItems = [];
            if (player.tackles > 0) statItems.push(`${player.tackles} TKL`);
            if (player.sacks > 0) statItems.push(`${player.sacks} SACK`);
            if (player.interceptions > 0) statItems.push(`${player.interceptions} INT`);
            if (player.forcedFumbles > 0) statItems.push(`${player.forcedFumbles} FF`);
            if (player.tfl > 0) statItems.push(`${player.tfl} TFLs`);
            if (statItems.length > 0) {
                stats += `#${playerNum}: ${statItems.join(', ')}\n`;
            }
        }
        stats += '\n';
        // Penalties
        stats += `PENALTIES:\n`;
        if (gameData.penalties.length === 0) {
            stats += `No penalties recorded\n`;
        } else {
            gameData.penalties.forEach(penalty => {
                if (penalty.player === 'C') {
                    stats += `Coach: ${penalty.yards} yards - ${penalty.type}\n`;
                } else if (penalty.player === 'S') {
                    stats += `Sideline: ${penalty.yards} yards - ${penalty.type}\n`;
                } else if (penalty.player === 'U') {
                    stats += `Unknown Player: ${penalty.yards} yards - ${penalty.type}\n`;
                } else {
                    stats += `#${penalty.player}: ${penalty.yards} yards - ${penalty.type}\n`;
                }
            });
        }
        return stats;
    }
    function downloadStats(text) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats_vs_${gameData.opponent.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // NEW: MaxPreps Export Functions
    function generateMaxPrepsStats() {
        let maxprepsText = `MAXPREPS STAT IMPORT FILE\n`;
        maxprepsText += `Game Date: ${new Date().toLocaleDateString()}\n`;
        maxprepsText += `Opponent: ${gameData.opponent}\n`;
        maxprepsText += `\n`;

        // TEAM TOTALS
        maxprepsText += `TEAM TOTALS\n`;
        maxprepsText += `Rushing Attempts: ${gameData.rushes}\n`;
        maxprepsText += `Rushing Yards: ${gameData.rushYards}\n`;
        maxprepsText += `Rushing TDs: ${gameData.rushTDs}\n`;
        maxprepsText += `Pass Attempts: ${gameData.attempts}\n`;
        maxprepsText += `Pass Completions: ${gameData.completions}\n`;
        maxprepsText += `Passing Yards: ${gameData.passYards}\n`;
        maxprepsText += `Passing TDs: ${gameData.passTDs}\n`;
        maxprepsText += `Interceptions: ${gameData.ints}\n`;
        maxprepsText += `Sacks: ${gameData.sacks}\n`;
        maxprepsText += `Field Goals Made: ${gameData.fgMade}\n`;
        maxprepsText += `Field Goals Attempted: ${gameData.fgAttempts}\n`;
        maxprepsText += `PAT Made: ${gameData.patMade}\n`;
        maxprepsText += `PAT Attempted: ${gameData.patAttempts}\n`;
        maxprepsText += `\n`;

        // INDIVIDUAL STATS
        maxprepsText += `INDIVIDUAL STATS\n`;
        maxprepsText += `\n`;

        // Quarterback Stats
        maxprepsText += `PASSING\n`;
        for (const qbNum in gameData.qbs) {
            const qb = gameData.qbs[qbNum];
            maxprepsText += `${qbNum},${qb.attempts},${qb.completions},${qb.yards},${qb.tds},${qb.ints}\n`;
        }
        maxprepsText += `\n`;

        // Rushing Stats
        maxprepsText += `RUSHING\n`;
        for (const rusherNum in gameData.rushers) {
            const rusher = gameData.rushers[rusherNum];
            const longestRush = rusher.rushes && rusher.rushes.length ? Math.max(...rusher.rushes) : 0;
            maxprepsText += `${rusherNum},${rusher.carries},${rusher.yards},${rusher.tds},${longestRush}\n`;
        }
        maxprepsText += `\n`;

        // Receiving Stats
        maxprepsText += `RECEIVING\n`;
        for (const receiverNum in gameData.receivers) {
            const receiver = gameData.receivers[receiverNum];
            let totalCatches = 0, totalTargets = 0, totalYards = 0, totalTDs = 0;

            for (const qbNum in receiver.qbs) {
                const recStats = receiver.qbs[qbNum];
                totalCatches += recStats.catches;
                totalTargets += recStats.targets;
                totalYards += recStats.yards;
                totalTDs += recStats.tds;
            }

            if (totalTargets > 0) {
                maxprepsText += `${receiverNum},${totalTargets},${totalCatches},${totalYards},${totalTDs}\n`;
            }
        }
        maxprepsText += `\n`;

        // Defense Stats
        maxprepsText += `DEFENSE\n`;
        const defense = gameData.defenseStats;
        for (const playerNum in defense.players) {
            const player = defense.players[playerNum];
            maxprepsText += `${playerNum},${player.tackles},${player.sacks},${player.interceptions},${player.forcedFumbles},${player.tfl}\n`;
        }
        maxprepsText += `\n`;

        // Field Goal Details
        if (gameData.fgYards.length > 0) {
            maxprepsText += `FIELD GOALS\n`;
            gameData.fgYards.forEach(yards => {
                maxprepsText += `${yards} yards\n`;
            });
            maxprepsText += `\n`;
        }

        

        return maxprepsText;
    }

    function downloadMaxPrepsStats() {
        const statsText = generateMaxPrepsStats();
        const blob = new Blob([statsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maxpreps_${gameData.opponent.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleMaxPrepsExport() {
        if (!gameData.opponent) {
            alert('Please set up the game first');
            return;
        }
        downloadMaxPrepsStats();
    }

    // --------- Live stats window updates ---------
    function updateAllStats() {
        updatePassStats();
        updateRushStats();
        updateKickStats();
        updateDefenseStats();
        updatePenaltyStats();
    }
    function updatePassStats() {
        let html = '';
        // Ensure the current QB is displayed first
        let qbOrder = Object.keys(gameData.qbs);
        if (qbOrder.length > 1 && qbOrder.includes(String(gameData.currentQB))) {
            qbOrder = [String(gameData.currentQB), ...qbOrder.filter(qb => qb !== String(gameData.currentQB))];
        }
        for (const qbNum of qbOrder) {
            const qb = gameData.qbs[qbNum];
            html += `<div><strong>QB #${qbNum}:</strong> ${qb.completions}/${qb.attempts}, ${qb.yards} yards, ${qb.tds} TD, ${qb.ints} INT</div>`;
            html += '<div class="receiver-stats" style="margin-left: 15px; margin-top: 5px; margin-bottom: 10px;">';
            for (const receiverNum in gameData.receivers) {
                const receiver = gameData.receivers[receiverNum];
                if (receiver.qbs && receiver.qbs[qbNum]) {
                    const recStats = receiver.qbs[qbNum];
                    html += `<div>#${receiverNum}: ${recStats.catches} catches on ${recStats.targets} targets for ${recStats.yards} yards and ${recStats.tds} TD</div>`;
                }
            }
            html += '</div>';
        }
        passStatsContent.innerHTML = html || 'No passing stats recorded yet';
    }
    // ---- ENHANCED: Adds yds/carry, longest rush to display ----
    function updateRushStats() {
        let html = `<div><strong>Team:</strong> ${gameData.rushes} rushes, ${gameData.rushYards} yards, ${gameData.rushTDs} TD
            <span style="margin-left:10px;"> YPC: ${getTeamYdsPerCarry().toFixed(2)}</span>
            <span style="margin-left:10px;"> Longest: ${getTeamLongestRush()}</span>
        </div>`;
        for (const rusherNum in gameData.rushers) {
            const rusher = gameData.rushers[rusherNum];
            let rusherLine = `<div>#${rusherNum}: ${rusher.yards} yards on ${rusher.carries} carries for ${rusher.tds} TD
                <span style="margin-left:10px;">YPC: ${getRusherYdsPerCarry(rusher).toFixed(2)}</span>
                <span style="margin-left:10px;">Longest: ${getRusherLongestRush(rusher)}</span>`;
            if (rusherNum == gameData.currentQB) rusherLine += ` (sacked ${gameData.sacks} times)`;
            rusherLine += '</div>';
            html += rusherLine;
        }
        rushStatsContent.innerHTML = html;
    }
    function updateKickStats() {
        let html = `<div>PATs: ${gameData.patMade}/${gameData.patAttempts}</div>`;
        html += `<div>FGs: ${gameData.fgMade}/${gameData.fgAttempts}</div>`;
        if (gameData.fgYards.length > 0) {
            html += `<div>Good from: ${gameData.fgYards.join(', ')} yards</div>`;
        }
        kickStatsContent.innerHTML = html;
    }
    function updateDefenseStats() {
        const defense = gameData.defenseStats;
        let html = `<div><strong>Team:</strong> ${defense.tackles} TKL, ${defense.sacks} SACK, ${defense.interceptions} INT, ${defense.forcedFumbles} FF, ${defense.tfl} TFLs</div>`;
        for (const playerNum in defense.players) {
            const player = defense.players[playerNum];
            let statItems = [];
            if (player.tackles > 0) statItems.push(`${player.tackles} TKL`);
            if (player.sacks > 0) statItems.push(`${player.sacks} SACK`);
            if (player.interceptions > 0) statItems.push(`${player.interceptions} INT`);
            if (player.forcedFumbles > 0) statItems.push(`${player.forcedFumbles} FF`);
            if (player.tfl > 0) statItems.push(`${player.tfl} TFLs`);
            if (statItems.length > 0) {
                html += `<div>#${playerNum}: ${statItems.join(', ')}</div>`;
            }
        }
        defenseStatsContent.innerHTML = html;
    }
    function updatePenaltyStats() {
        if (gameData.penalties.length === 0) {
            penaltyStatsContent.innerHTML = 'No penalties recorded';
            return;
        }
        let html = '';
        gameData.penalties.forEach(penalty => {
            if (penalty.player === 'C') {
                html += `<div>Coach: ${penalty.yards} yards - ${penalty.type}</div>`;
            } else if (penalty.player === 'S') {
                html += `<div>Sideline: ${penalty.yards} yards - ${penalty.type}</div>`;
            } else if (penalty.player === 'U') {
                html += `<div>Unknown Player: ${penalty.yards} yards - ${penalty.type}</div>`;
            } else {
                html += `<div>#${penalty.player}: ${penalty.yards} yards - ${penalty.type}</div>`;
            }
        });
        penaltyStatsContent.innerHTML = html;
    }
});
