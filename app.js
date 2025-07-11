// Football Stats Tracker - JavaScript with Modal FixMore actions
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

    // Get elements
    const setupForm = document.getElementById('setupForm');
    const setupModal = document.getElementById('setupModal');
    const inputModal = document.getElementById('inputModal');
    const inputForm = document.getElementById('inputForm');
    const inputTitle = document.getElementById('inputTitle');
    const inputFields = document.getElementById('inputFields');
    const cancleBtn = document.getElementById('cancelBtn').addEventListener('click', closeInputModal);

    const opponentDisplay = document.getElementById('opponentDisplay');

    // Action buttons
    const passBtn = document.getElementById('passBtn');
    const rushBtn = document.getElementById('rushBtn');
    const kickBtn = document.getElementById('kickBtn');
    const defenseBtn = document.getElementById('defenseBtn');
    const flagBtn = document.getElementById('flagBtn');
    const undoBtn = document.getElementById('undoBtn');
    const endGameBtn = document.getElementById('endGameBtn').addEventListener("click", handleEndGame);

    // Stats content divs
    const passStatsContent = document.getElementById('passStatsContent');
    const rushStatsContent = document.getElementById('rushStatsContent');
    const kickStatsContent = document.getElementById('kickStatsContent');
    const defenseStatsContent = document.getElementById('defenseStatsContent');
    const penaltyStatsContent = document.getElementById('penaltyStatsContent');

    // Initialize the game when the setup form is submitted
    setupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get values from the setup form
        const opponent = document.getElementById('opponent').value;
        const qbNumber = parseInt(document.getElementById('qbNumber').value);

        // Store values in game data
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

        // CRITICAL FIX: Hide the setup modal using multiple methods to ensure it works
        setupModal.style.display = 'none';
        setupModal.style.cssText = "display: none !important;";
        setupModal.classList.add('hidden');

        console.log(`Game started against ${opponent} with QB #${qbNumber}`);

        // Initialize UI
        updateAllStats();
    });

    // Pass Button
    passBtn.addEventListener('click', function() {
        handlePassPlay();
    });

    // Rush Button
    rushBtn.addEventListener('click', function() {
        handleRushPlay();
    });

    // Kick Button
    kickBtn.addEventListener('click', function() {
        handleKickPlay();
    });

    // Defense Button
    defenseBtn.addEventListener('click', function() {
        handleDefensePlay();
    });

    // Flag Button
    flagBtn.addEventListener('click', function() {
        handleFlagPlay();
    });

    // Undo Button
    undoBtn.addEventListener('click', function() {
        handleUndo();
    });


    // End Game Button
    endGameBtn.addEventListener('click', function() {
        handleEndGame();
    });

    // Cancel button for input modal
    cancelBtn.addEventListener('cancel',function() {
        closeInputModal();
    });

    // Handle input form submission
    inputForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // The specific handling depends on the current action
        // It will be defined in the respective handling functions
    });

    // Function to show the input modal with custom fields
    function showInputModal(title, fields, callback) {
        inputTitle.textContent = title;
        inputFields.innerHTML = '';

        // Create input fields
        fields.forEach(field => {
            if (field.type === 'radio') {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-group';

                const label = document.createElement('label');
                label.textContent = field.label;
                fieldDiv.appendChild(label);

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
                inputFields.appendChild(fieldDiv);
            } else {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-group';

                const label = document.createElement('label');
                label.textContent = field.label;
                label.htmlFor = field.id;
                fieldDiv.appendChild(label);

                const input = document.createElement('input');
                input.type = field.type;
                input.id = field.id;
                input.name = field.id;

                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
                if (field.required) input.required = true;

                fieldDiv.appendChild(input);
                inputFields.appendChild(fieldDiv);
            }
        });

        // Set up the form submission
        const submitHandler = function(e) {
            e.preventDefault();

            // Collect form data
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

            // Close the modal
            closeInputModal();

            // Remove the event listener to prevent memory leaks
            inputForm.removeEventListener('submit', submitHandler);

            // Call the callback with the collected data
            callback(data);
        };

        inputForm.addEventListener('submit', submitHandler);

        // Show the modal
        inputModal.style.display = 'flex';
    }

    function closeInputModal() {
        inputModal.style.display = 'none';
    }

    // Handle Pass Play
    function handlePassPlay() {
        showInputModal('Pass Play', [
            {
                type: 'number',
                label: 'Target Player Number:',
                id: 'target',
                min: 1,
                max: 99,
                required: true
            }
        ], (data) => {
            const target = parseInt(data.target);

            showInputModal('Pass Result', [
                {
                    type: 'radio',
                    label: 'Result:',
                    id: 'result',
                    options: [
                        { value: 'complete', text: 'Complete' },
                        { value: 'incomplete', text: 'Incomplete' },
                        { value: 'touchdown', text: 'Touchdown' },
                        { value: 'interception', text: 'Interception' }
                    ]
                }
            ], (resultData) => {
                const result = resultData.result;

                // Increment attempts
                gameData.attempts++;

                // Update QB attempts
                if (gameData.qbs[gameData.currentQB]) {
                    gameData.qbs[gameData.currentQB].attempts++;
                }

                // Initialize receiver if not exists
                if (!gameData.receivers[target]) {
                    gameData.receivers[target] = { qbs: {} };
                }

                // Initialize receiver stats for current QB
                if (!gameData.receivers[target].qbs[gameData.currentQB]) {
                    gameData.receivers[target].qbs[gameData.currentQB] = {
                        catches: 0,
                        targets: 0,
                        yards: 0,
                        tds: 0
                    };
                }

                // Update targets
                gameData.receivers[target].qbs[gameData.currentQB].targets++;

                if (result === 'interception') {
                    // Handle interception
                    gameData.ints++;
                    if (gameData.qbs[gameData.currentQB]) {
                        gameData.qbs[gameData.currentQB].ints++;
                    }

                    // Add to play history
                    gameData.playHistory.push({
                        type: 'pass',
                        target: target,
                        result: 'interception',
                        yards: 0
                    });

                    updateAllStats();
                } else if (result === 'incomplete') {
                    // Add to play history
                    gameData.playHistory.push({
                        type: 'pass',
                        target: target,
                        result: 'incomplete',
                        yards: 0
                    });

                    updateAllStats();
                } else {
                    // For complete or touchdown, ask for yards
                    showInputModal('Yards Gained', [
                        {
                            type: 'number',
                            label: 'Yards:',
                            id: 'yards',
                            min: 0,
                            required: true
                        }
                    ], (yardsData) => {
                        const yards = parseInt(yardsData.yards);

                        // Update completions
                        gameData.completions++;
                        if (gameData.qbs[gameData.currentQB]) {
                            gameData.qbs[gameData.currentQB].completions++;
                        }

                        // Update catches for receiver
                        gameData.receivers[target].qbs[gameData.currentQB].catches++;

                        // Update yards
                        gameData.passYards += yards;
                        if (gameData.qbs[gameData.currentQB]) {
                            gameData.qbs[gameData.currentQB].yards += yards;
                        }
                        gameData.receivers[target].qbs[gameData.currentQB].yards += yards;

                        if (result === 'touchdown') {
                            // Update TDs
                            gameData.passTDs++;
                            if (gameData.qbs[gameData.currentQB]) {
                                gameData.qbs[gameData.currentQB].tds++;
                            }
                            gameData.receivers[target].qbs[gameData.currentQB].tds++;

                            // Add TD to play history
                            gameData.playHistory.push({
                                type: 'pass',
                                target: target,
                                result: 'touchdown',
                                yards: yards
                            });

                            // Prompt for PAT
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
                                // Update PAT stats
                                gameData.patAttempts++;
                                if (patData.pat === 'good') {
                                    gameData.patMade++;
                                }

                                updateAllStats();
                            });
                        } else {
                            // Add complete pass to play history
                            gameData.playHistory.push({
                                type: 'pass',
                                target: target,
                                result: 'complete',
                                yards: yards
                            });

                            updateAllStats();
                        }
                    });
                }
            });
        });
    }

    // Handle Rush Play
    function handleRushPlay() {
        showInputModal('Rush Play', [
            {
                type: 'number',
                label: 'Rusher Number:',
                id: 'rusher',
                min: 1,
                max: 99,
                required: true
            },
            {
                type: 'number',
                label: 'Yards Gained:',
                id: 'yards',
                required: true
            }
        ], (data) => {
            const rusher = parseInt(data.rusher);
            const yards = parseInt(data.yards);

            // Update rush stats
            gameData.rushes++;
            gameData.rushYards += yards;

            // Initialize rusher if not exists
            if (!gameData.rushers[rusher]) {
                gameData.rushers[rusher] = {
                    carries: 0,
                    yards: 0,
                    tds: 0
                };
            }

            // Update rusher stats
            gameData.rushers[rusher].carries++;
            gameData.rushers[rusher].yards += yards;

            // Check for sack
            if (rusher === gameData.currentQB && yards < 0) {
                gameData.sacks++;
            }

            // Ask if it was a touchdown
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
                // Add to play history
                const playData = {
                    type: 'rush',
                    rusher: rusher,
                    yards: yards,
                    touchdown: (tdData.touchdown === 'yes')
                };

                if (tdData.touchdown === 'yes') {
                    // Update TD stats
                    gameData.rushTDs++;
                    gameData.rushers[rusher].tds++;

                    // Prompt for PAT
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
                        // Update PAT stats
                        gameData.patAttempts++;
                        if (patData.pat === 'good') {
                            gameData.patMade++;
                        }

                        gameData.playHistory.push(playData);
                        updateAllStats();
                    });
                } else {
                    gameData.playHistory.push(playData);
                    updateAllStats();
                }
            });
        });
    }

    // Handle Kick Play
    function handleKickPlay() {
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
            const type = data.type;

            if (type === 'fg') {
                // Field Goal attempt
                showInputModal('Field Goal Distance', [
                    {
                        type: 'number',
                        label: 'Yards:',
                        id: 'yards',
                        min: 1,
                        required: true
                    }
                ], (yardsData) => {
                    const yards = parseInt(yardsData.yards);

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
                        // Update FG stats
                        gameData.fgAttempts++;
                        if (resultData.result === 'good') {
                            gameData.fgMade++;
                            gameData.fgYards.push(yards);
                        }

                        // Add to play history
                        gameData.playHistory.push({
                            type: 'kick',
                            kickType: 'fg',
                            yards: yards,
                            result: resultData.result
                        });

                        updateAllStats();
                    });
                });
            } else {
                // PAT attempt
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
                    // Update PAT stats
                    gameData.patAttempts++;
                    if (resultData.result === 'good') {
                        gameData.patMade++;
                    }

                    // Add to play history
                    gameData.playHistory.push({
                        type: 'kick',
                        kickType: 'pat',
                        result: resultData.result
                    });

                    updateAllStats();
                });
            }
        });
    }

    // Handle Defense Play
    function handleDefensePlay() {
        showInputModal('Defensive Play', [
            {
                type: 'number',
                label: 'Player Number:',
                id: 'player',
                min: 1,
                max: 99,
                required: true
            },
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
            const player = parseInt(data.player);
            const playType = data.playType;

            // Initialize player if not exists
            if (!gameData.defenseStats.players[player]) {
                gameData.defenseStats.players[player] = {
                    tackles: 0,
                    sacks: 0,
                    interceptions: 0,
                    forcedFumbles: 0,
                    tfl: 0
                };
            }

            // Update stats based on play type
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

            // Add to play history
            gameData.playHistory.push({
                type: 'defense',
                player: player,
                playType: playType
            });

            updateAllStats();
        });
    }

    // Handle Flag Play
    function handleFlagPlay() {
        // Undo last play first
        if (gameData.playHistory.length > 0) {
            undoLastPlay();
        }

        // Then ask for penalty details
        showInputModal('Penalty', [
            {
                type: 'text',
                label: 'Penalty Type:',
                id: 'type',
                required: true
            },
            {
                type: 'number',
                label: 'Yards:',
                id: 'yards',
                required: true
            },
            {
                type: 'number',
                label: 'Player Number:',
                id: 'player',
                min: 1,
                max: 99,
                required: true
            }
        ], (data) => {
            // Record penalty
            const penalty = {
                type: data.type,
                yards: parseInt(data.yards),
                player: parseInt(data.player)
            };

            gameData.penalties.push(penalty);

            updateAllStats();
        });
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
            case 'pass':
                undoPassPlay(lastPlay);
                break;
            case 'rush':
                undoRushPlay(lastPlay);
                break;
            case 'kick':
                undoKickPlay(lastPlay);
                break;
            case 'defense':
                undoDefensePlay(lastPlay);
                break;
        }
    }

    function undoPassPlay(play) {
        // Decrement attempts
        gameData.attempts--;

        // Update QB attempts
        if (gameData.qbs[gameData.currentQB]) {
            gameData.qbs[gameData.currentQB].attempts--;
        }

        // Update receiver targets
        if (gameData.receivers[play.target] && 
            gameData.receivers[play.target].qbs[gameData.currentQB]) {
            gameData.receivers[play.target].qbs[gameData.currentQB].targets--;
        }

        if (play.result === 'interception') {
            // Handle interception
            gameData.ints--;
            if (gameData.qbs[gameData.currentQB]) {
                gameData.qbs[gameData.currentQB].ints--;
            }
        } else if (play.result === 'complete' || play.result === 'touchdown') {
            // Update completions
            gameData.completions--;
            if (gameData.qbs[gameData.currentQB]) {
                gameData.qbs[gameData.currentQB].completions--;
            }

            // Update catches for receiver
            if (gameData.receivers[play.target] && 
                gameData.receivers[play.target].qbs[gameData.currentQB]) {
                gameData.receivers[play.target].qbs[gameData.currentQB].catches--;
            }

            // Update yards
            gameData.passYards -= play.yards;
            if (gameData.qbs[gameData.currentQB]) {
                gameData.qbs[gameData.currentQB].yards -= play.yards;
            }

            if (gameData.receivers[play.target] && 
                gameData.receivers[play.target].qbs[gameData.currentQB]) {
                gameData.receivers[play.target].qbs[gameData.currentQB].yards -= play.yards;
            }

            if (play.result === 'touchdown') {
                // Update TDs
                gameData.passTDs--;
                if (gameData.qbs[gameData.currentQB]) {
                    gameData.qbs[gameData.currentQB].tds--;
                }

                if (gameData.receivers[play.target] && 
                    gameData.receivers[play.target].qbs[gameData.currentQB]) {
                    gameData.receivers[play.target].qbs[gameData.currentQB].tds--;
                }
            }
        }
    }

    function undoRushPlay(play) {
        // Update rush stats
        gameData.rushes--;
        gameData.rushYards -= play.yards;

        // Update rusher stats
        if (gameData.rushers[play.rusher]) {
            gameData.rushers[play.rusher].carries--;
            gameData.rushers[play.rusher].yards -= play.yards;
        }

        // Check for sack
        if (play.rusher === gameData.currentQB && play.yards < 0) {
            gameData.sacks--;
        }

        // Update TD stats if it was a touchdown
        if (play.touchdown) {
            gameData.rushTDs--;
            if (gameData.rushers[play.rusher]) {
                gameData.rushers[play.rusher].tds--;
            }
        }
    }

    function undoKickPlay(play) {
        if (play.kickType === 'fg') {
            // Update FG stats
            gameData.fgAttempts--;
            if (play.result === 'good') {
                gameData.fgMade--;
                // Remove the yard from fgYards array
                const index = gameData.fgYards.indexOf(play.yards);
                if (index !== -1) {
                    gameData.fgYards.splice(index, 1);
                }
            }
        } else {
            // Update PAT stats
            gameData.patAttempts--;
            if (play.result === 'good') {
                gameData.patMade--;
            }
        }
    }

    function undoDefensePlay(play) {
        // Update stats based on play type
        switch (play.playType) {
            case 'tackle':
                gameData.defenseStats.tackles--;
                if (gameData.defenseStats.players[play.player]) {
                    gameData.defenseStats.players[play.player].tackles--;
                }
                break;
            case 'sack':
                gameData.defenseStats.sacks--;
                if (gameData.defenseStats.players[play.player]) {
                    gameData.defenseStats.players[play.player].sacks--;
                }
                break;
            case 'interception':
                gameData.defenseStats.interceptions--;
                if (gameData.defenseStats.players[play.player]) {
                    gameData.defenseStats.players[play.player].interceptions--;
                }
                break;
            case 'fumble':
                gameData.defenseStats.forcedFumbles--;
                if (gameData.defenseStats.players[play.player]) {
                    gameData.defenseStats.players[play.player].forcedFumbles--;
                }
                break;
            case 'tfl':
                gameData.defenseStats.tfl--;
                if (gameData.defenseStats.players[play.player]) {
                    gameData.defenseStats.players[play.player].tfl--;
                }
                break;
        }
    }

    // Handle Change QB
    function handleChangeQB() {
        showInputModal('Change Quarterback', [
            {
                type: 'number',
                label: 'New QB Number:',
                id: 'qbNumber',
                min: 1,
                max: 99,
                required: true
            }
        ], (data) => {
            const qbNumber = parseInt(data.qbNumber);

            // Initialize QB stats if not exists
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

            // Update current QB
            gameData.currentQB = qbNumber;

            updateAllStats();
        });
    }

    // Handle End Game
    function handleEndGame() {
        // Generate and download final stats
        console.log("End game triggered");
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

            // Receiver stats for this QB
            for (const receiverNum in gameData.receivers) {
                const receiver = gameData.receivers[receiverNum];
                if (receiver.qbs && receiver.qbs[qbNum]) {
                    const recStats = receiver.qbs[qbNum];
                    stats += `  #${receiverNum}: ${recStats.catches} catches on ${recStats.targets} targets for ${recStats.yards} yards and ${recStats.tds} TD\n`;
                }
            }
            stats += '\n';
        }

        // Rush stats
        stats += `RUSHING:\n`;
        stats += `Team: ${gameData.rushes} rushes, ${gameData.rushYards} yards, ${gameData.rushTDs} TD\n`;
        for (const rusherNum in gameData.rushers) {
            const rusher = gameData.rushers[rusherNum];
            let rusherStats = `#${rusherNum}: ${rusher.yards} yards on ${rusher.carries} carries for ${rusher.tds} TD`;

            // Add sack info if this is the QB
            if (rusherNum == gameData.currentQB) {
                rusherStats += ` (sacked ${gameData.sacks} times)`;
            }

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
                stats += `#${penalty.player}: ${penalty.yards} yards - ${penalty.type}\n`;
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

    // Update functions for the stats windows
    function updateAllStats() {
        updatePassStats();
        updateRushStats();
        updateKickStats();
        updateDefenseStats();
        updatePenaltyStats();
    }

    function updatePassStats() {
        let html = '';

        // For each quarterback in the game
        for (const qbNum in gameData.qbs) {
            const qb = gameData.qbs[qbNum];
            html += `<div><strong>QB #${qbNum}:</strong> ${qb.completions}/${qb.attempts}, ${qb.yards} yards, ${qb.tds} TD, ${qb.ints} INT</div>`;

            // Add receiver stats for this QB
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

    function updateRushStats() {
        let html = `<div><strong>Team:</strong> ${gameData.rushes} rushes, ${gameData.rushYards} yards, ${gameData.rushTDs} TD</div>`;

        for (const rusherNum in gameData.rushers) {
            const rusher = gameData.rushers[rusherNum];
            let rusherLine = `<div>#${rusherNum}: ${rusher.yards} yards on ${rusher.carries} carries for ${rusher.tds} TD`;

            // Add sack info if this is the QB
            if (rusherNum == gameData.currentQB) {
                rusherLine += ` (sacked ${gameData.sacks} times)`;
            }

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

        // Individual player stats
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
            html += `<div>#${penalty.player}: ${penalty.yards} yards - ${penalty.type}</div>`;
        });

        penaltyStatsContent.innerHTML = html;
    }
});
