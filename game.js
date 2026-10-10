/**
 * Bloody Mary - Interactive Horror Web Experience
 * Ported and enhanced from Python terminal adventure
 */

const ENDINGS_DATA = [
    {
        id: "shatter",
        title: "The Shattered Reflection",
        type: "survived",
        desc: "You smashed the mirror with your elbow, shattering her manifestation. The bathroom falls dead silent. You survived the wrath of Bloody Mary!"
    },
    {
        id: "dragged",
        title: "Dragged Under",
        type: "perished",
        desc: "Bloody Mary doesn't care about apologies. Her claw dragged you into the mirror world. You are never seen again."
    },
    {
        id: "sparks",
        title: "Sparks in the Dark",
        type: "perished",
        desc: "The light bulb exploded in a shower of sparks. In the momentary flash, she was already standing behind you."
    },
    {
        id: "hallway",
        title: "The Hallway Sprint",
        type: "survived",
        desc: "You found the doorknob in the dark, burst into the hallway, and slammed the door shut just as claws raked the wood."
    },
    {
        id: "choked",
        title: "Choked by Shadows",
        type: "perished",
        desc: "Your hand missed the knob in pitch blackness. An icy hand wrapped around your throat: 'You shouldn't have summoned me.'"
    },
    {
        id: "hesitated",
        title: "Paralyzed by Terror",
        type: "perished",
        desc: "Panic paralyzed you completely. You failed to make a choice in time, and Bloody Mary claimed your soul without resistance."
    }
];

class BloodyMaryGame {
    constructor() {
        this.ghost = "Bloody Mary";
        this.typewriterSpeed = 35; // ms per char
        this.isTyping = false;
        this.currentTypeTimeout = null;
        this.typeResolver = null;
        
        // Timer
        this.timerInterval = null;
        this.timerRemaining = 0;
        this.timerDuration = 0;

        // Endings
        this.unlockedEndings = this.loadEndings();

        // DOM elements
        this.initDOMElements();
        this.bindEvents();
        this.updateEndingsUI();
    }

    initDOMElements() {
        this.dom = {
            viewport: document.getElementById('sceneViewport'),
            clockDisplay: document.getElementById('clockDisplay'),
            currentDialogue: document.getElementById('currentDialogue'),
            dialogueBox: document.getElementById('dialogueBox'),
            choicesContainer: document.getElementById('choicesContainer'),
            startBtn: document.getElementById('startBtn'),
            skipTypingBtn: document.getElementById('skipTypingBtn'),
            timerContainer: document.getElementById('timerContainer'),
            timerBarFill: document.getElementById('timerBarFill'),
            
            // Mirror & Props
            ghostEntity: document.getElementById('ghostEntity'),
            clawHand: document.getElementById('clawHand'),
            crackSvg: document.getElementById('crackSvg'),
            bloodDrips: document.getElementById('bloodDripsContainer'),
            candleFlame: document.getElementById('candleFlame'),
            smokePuff: document.getElementById('smokePuff'),
            lightFlash: document.getElementById('lightFlash'),
            darknessOverlay: document.getElementById('darknessOverlay'),
            screenSpatter: document.getElementById('screenSpatter'),

            // Modals & Nav
            resultModal: document.getElementById('resultModal'),
            modalCard: document.getElementById('modalCard'),
            modalBanner: document.getElementById('modalBanner'),
            modalTitle: document.getElementById('modalTitle'),
            modalEndingTag: document.getElementById('modalEndingTag'),
            modalDesc: document.getElementById('modalDesc'),
            retryBtn: document.getElementById('retryBtn'),
            modalViewEndingsBtn: document.getElementById('modalViewEndingsBtn'),
            endingsBtn: document.getElementById('endingsBtn'),
            endingsCount: document.getElementById('endingsCount'),
            endingsModal: document.getElementById('endingsModal'),
            closeEndingsBtn: document.getElementById('closeEndingsBtn'),
            endingsGrid: document.getElementById('endingsGrid'),
            galleryCount: document.getElementById('galleryCount'),
            resetProgressBtn: document.getElementById('resetProgressBtn'),
            audioToggleBtn: document.getElementById('audioToggleBtn')
        };
    }

    bindEvents() {
        if (this.dom.startBtn) {
            this.dom.startBtn.addEventListener('click', () => this.startRitual());
        }

        this.dom.retryBtn.addEventListener('click', () => {
            this.closeModal(this.dom.resultModal);
            this.resetScene();
            this.startRitual();
        });

        this.dom.endingsBtn.addEventListener('click', () => this.openEndingsGallery());
        this.dom.modalViewEndingsBtn.addEventListener('click', () => {
            this.closeModal(this.dom.resultModal);
            this.openEndingsGallery();
        });

        this.dom.closeEndingsBtn.addEventListener('click', () => this.closeModal(this.dom.endingsModal));

        this.dom.audioToggleBtn.addEventListener('click', () => {
            const isMuted = window.soundFX.toggleMute();
            this.dom.audioToggleBtn.textContent = isMuted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
        });

        this.dom.resetProgressBtn.addEventListener('click', () => {
            if (confirm("Reset all unlocked endings?")) {
                localStorage.removeItem('bloody_mary_endings');
                this.unlockedEndings = [];
                this.updateEndingsUI();
                this.renderEndingsGrid();
            }
        });

        this.dom.skipTypingBtn.addEventListener('click', () => {
            this.skipTyping();
        });

        // Keyboard navigation for choices 1, 2, 3
        window.addEventListener('keydown', (e) => {
            if (this.isTyping) return;
            const buttons = this.dom.choicesContainer.querySelectorAll('.choice-btn');
            if (e.key === '1' && buttons[0]) buttons[0].click();
            if (e.key === '2' && buttons[1]) buttons[1].click();
            if (e.key === '3' && buttons[2]) buttons[2].click();
        });
    }

    // Typewriter effect promise
    typeText(text, isWhisper = false, speed = null) {
        return new Promise((resolve) => {
            this.stopTyping();
            this.isTyping = true;
            this.typeResolver = resolve;
            
            this.dom.currentDialogue.textContent = '';
            this.dom.currentDialogue.className = isWhisper ? 'dialogue-line whisper' : 'dialogue-line';

            let index = 0;
            const charDelay = speed || this.typewriterSpeed;

            const nextChar = () => {
                if (index < text.length) {
                    this.dom.currentDialogue.textContent += text.charAt(index);
                    index++;
                    this.currentTypeTimeout = setTimeout(nextChar, charDelay);
                } else {
                    this.isTyping = false;
                    this.typeResolver = null;
                    resolve();
                }
            };
            nextChar();
        });
    }

    skipTyping() {
        if (this.isTyping && this.currentTypeTimeout) {
            clearTimeout(this.currentTypeTimeout);
            this.isTyping = false;
            // Finish remaining text
            if (this.pendingFullText) {
                this.dom.currentDialogue.textContent = this.pendingFullText;
            }
            if (this.typeResolver) {
                const res = this.typeResolver;
                this.typeResolver = null;
                res();
            }
        }
    }

    stopTyping() {
        if (this.currentTypeTimeout) {
            clearTimeout(this.currentTypeTimeout);
            this.currentTypeTimeout = null;
        }
        this.isTyping = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Timer management for choices
    startTimer(seconds, onTimeout) {
        this.stopTimer();
        this.timerDuration = seconds;
        this.timerRemaining = seconds;
        this.dom.timerContainer.classList.add('active');
        this.dom.timerBarFill.style.width = '100%';

        const intervalMs = 100;
        const decrement = intervalMs / 1000;

        this.timerInterval = setInterval(() => {
            this.timerRemaining -= decrement;
            const pct = Math.max(0, (this.timerRemaining / this.timerDuration) * 100);
            this.dom.timerBarFill.style.width = `${pct}%`;

            if (this.timerRemaining <= 0) {
                this.stopTimer();
                if (onTimeout) onTimeout();
            }
        }, intervalMs);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.dom.timerContainer.classList.remove('active');
    }

    // Set interactive choice buttons
    setChoices(choicesList) {
        this.dom.choicesContainer.innerHTML = '';
        choicesList.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `<span class="key-badge">${index + 1}</span> <span>${item.text}</span>`;
            btn.addEventListener('click', () => {
                window.soundFX.playClick();
                this.stopTimer();
                this.dom.choicesContainer.innerHTML = '';
                item.action();
            });
            this.dom.choicesContainer.appendChild(btn);
        });
    }

    // Reset visual scene
    resetScene() {
        this.stopTimer();
        this.stopTyping();
        window.soundFX.stopHeartbeatLoop();
        window.soundFX.stopAtmosphericDrone();

        this.dom.ghostEntity.className = 'ghost-entity';
        this.dom.clawHand.className = 'claw-hand';
        this.dom.crackSvg.classList.remove('cracked', 'shattered');
        this.dom.bloodDrips.className = 'blood-drips-container';
        this.dom.candleFlame.className = 'candle-flame';
        this.dom.smokePuff.className = 'smoke-puff';
        this.dom.lightFlash.className = 'light-flash';
        this.dom.darknessOverlay.className = 'darkness-overlay';
        this.dom.screenSpatter.classList.remove('active');
        this.dom.viewport.classList.remove('shake');
        this.dom.clockDisplay.textContent = "02:59 AM";
    }

    // Main Game Sequence
    async startRitual() {
        this.resetScene();
        try {
            const audioReady = await window.soundFX.unlock();
            if (!audioReady) {
                throw new Error('The browser kept the audio context suspended.');
            }
        } catch (error) {
            console.warn('Unable to enable game audio:', error);
            this.dom.audioToggleBtn.textContent = "⚠️ Audio unavailable";
        }
        window.soundFX.startAtmosphericDrone();
        window.soundFX.startHeartbeatLoop(false);

        this.dom.choicesContainer.innerHTML = '';

        // Intro narrative
        this.pendingFullText = "It's 2:59 AM. You are standing in your dark bathroom.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1200);

        this.pendingFullText = "The only illumination comes from a single, flickering candle.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1200);

        this.pendingFullText = "You look into the mirror, take a deep breath, and whisper three times:";
        await this.typeText(this.pendingFullText);
        await this.sleep(1000);

        // Three whispers
        for (let i = 1; i <= 3; i++) {
            await this.sleep(600);
            window.soundFX.playWhisperChime();
            this.pendingFullText = `... "${this.ghost}" (${i}/3) ...`;
            await this.typeText(this.pendingFullText, true, 45);
            await this.sleep(1200);
        }

        // Clock strikes 3:00 AM
        this.dom.clockDisplay.textContent = "03:00 AM";

        // Supernatural shift
        window.soundFX.playJumpscareSting();
        this.dom.candleFlame.classList.add('dipping');
        this.dom.ghostEntity.classList.add('manifesting');

        this.pendingFullText = "The candle flame violently dips. The air turns freezing cold.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.pendingFullText = "A dark shape begins to form inside the glass...";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.firstEncounter();
    }

    // First Choice: What do you do?
    async firstEncounter() {
        this.pendingFullText = "--- WHAT DO YOU DO? ---";
        await this.typeText(this.pendingFullText);

        const choices = [
            {
                text: "Stand your ground and stare back.",
                action: () => this.handleStandGround()
            },
            {
                text: "Turn on the bathroom lights immediately.",
                action: () => this.handleTurnOnLights()
            },
            {
                text: "Blow out the candle and run.",
                action: () => this.handleBlowCandleAndRun()
            }
        ];

        this.setChoices(choices);

        // 12-second hesitation timer
        this.startTimer(12, () => this.handleHesitationDeath());
    }

    // Branch 1: Stand ground
    async handleStandGround() {
        window.soundFX.startHeartbeatLoop(true); // Fast heartbeat
        this.dom.ghostEntity.classList.add('pressing');

        this.pendingFullText = `You lock eyes with the reflection. ${this.ghost}'s face presses against the glass.`;
        await this.typeText(this.pendingFullText);
        await this.sleep(1400);

        // Glass crack and blood
        this.dom.viewport.classList.add('shake');
        this.dom.crackSvg.classList.add('cracked');
        this.dom.bloodDrips.classList.add('dripping');
        window.soundFX.playWhisperChime();
        setTimeout(() => this.dom.viewport.classList.remove('shake'), 400);

        this.pendingFullText = "The glass begins to crack. Blood starts dripping from the mirror frame.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1400);

        // Claw reaches through!
        this.dom.clawHand.classList.add('reaching');
        this.dom.screenSpatter.classList.add('active');
        window.soundFX.playJumpscareSting();

        this.pendingFullText = "She reaches a pale, clawed hand through the solid glass!";
        await this.typeText(this.pendingFullText);
        await this.sleep(1200);

        this.quickChoice();
    }

    // Quick Choice sub-branch
    async quickChoice() {
        this.pendingFullText = "--- QUICK CHOICE! ---";
        await this.typeText(this.pendingFullText);

        const choices = [
            {
                text: "Smash the mirror with your elbow!",
                action: () => this.handleSmashMirror()
            },
            {
                text: "Apologize and beg for mercy.",
                action: () => this.handleApologize()
            }
        ];

        this.setChoices(choices);

        // 8-second quick choice timer
        this.startTimer(8, () => this.handleHesitationDeath());
    }

    // Sub-choice 1: Smash mirror (WIN)
    async handleSmashMirror() {
        this.dom.viewport.classList.add('shake');
        this.dom.crackSvg.classList.add('shattered');
        window.soundFX.playGlassShatter();
        window.soundFX.stopHeartbeatLoop();

        this.dom.ghostEntity.classList.remove('manifesting', 'pressing');
        this.dom.clawHand.classList.remove('reaching');

        this.pendingFullText = "*CRASH!* You shatter the mirror!";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.pendingFullText = "The bathroom falls dead silent. The entity is gone... for now.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.triggerEnding("shatter");
    }

    // Sub-choice 2: Beg for mercy (LOSE)
    async handleApologize() {
        window.soundFX.playJumpscareSting();

        this.pendingFullText = `${this.ghost} doesn't care about apologies.`;
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.pendingFullText = "She drags you into the mirror world. You are never seen again.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.triggerEnding("dragged");
    }

    // Branch 2: Turn on lights (LOSE)
    async handleTurnOnLights() {
        window.soundFX.playLightExplosion();
        this.dom.lightFlash.classList.add('burst');
        this.dom.viewport.classList.add('shake');

        this.pendingFullText = "You frantically flip the light switch. The overhead light buzzes and pops, exploding in a shower of sparks!";
        await this.typeText(this.pendingFullText);
        await this.sleep(1600);

        // Ghost behind you
        this.dom.darknessOverlay.classList.add('pitch-black');
        window.soundFX.playJumpscareSting();

        this.pendingFullText = `In the sudden flash of light, you see ${this.ghost} standing right behind you.`;
        await this.typeText(this.pendingFullText);
        await this.sleep(1600);

        this.pendingFullText = "You felt her icy grip before everything went black.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.triggerEnding("sparks");
    }

    // Branch 3: Blow candle & run (50/50 Chance)
    async handleBlowCandleAndRun() {
        window.soundFX.playCandleBlow();
        this.dom.candleFlame.className = 'candle-flame extinguished';
        this.dom.smokePuff.className = 'smoke-puff rising';
        this.dom.darknessOverlay.classList.add('pitch-black');

        this.pendingFullText = "You blow out the candle, plunging the room into absolute pitch blackness.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1600);

        window.soundFX.startHeartbeatLoop(true);

        this.pendingFullText = "You fumble for the doorknob, your heart hammering against your ribs.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1800);

        // 50/50 chance from original Python logic
        const survived = Math.random() < 0.5;

        if (survived) {
            window.soundFX.playDoorSlam();
            window.soundFX.stopHeartbeatLoop();

            this.pendingFullText = "You twist the knob, burst out into the hallway, and slam the door behind you!";
            await this.typeText(this.pendingFullText);
            await this.sleep(1600);

            this.pendingFullText = "You hear violent scratching on the other side of the door, but you are safe.";
            await this.typeText(this.pendingFullText);
            await this.sleep(1600);

            this.triggerEnding("hallway");
        } else {
            window.soundFX.playJumpscareSting();

            this.pendingFullText = "Your hand misses the knob. You feel a freezing hand wrap around your throat from behind.";
            await this.typeText(this.pendingFullText);
            await this.sleep(1600);

            this.pendingFullText = `${this.ghost} whispered: 'You shouldn't have summoned me.'`;
            await this.typeText(this.pendingFullText, true);
            await this.sleep(1600);

            this.triggerEnding("choked");
        }
    }

    // Hesitation / Timeout death
    async handleHesitationDeath() {
        this.dom.choicesContainer.innerHTML = '';
        window.soundFX.playJumpscareSting();

        this.pendingFullText = "Panic paralyzes you. You failed to make a choice in time.";
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.pendingFullText = `${this.ghost} claimed your soul while you hesitated.`;
        await this.typeText(this.pendingFullText);
        await this.sleep(1500);

        this.triggerEnding("hesitated");
    }

    // Trigger Game Over or Victory Screen
    triggerEnding(endingId) {
        const ending = ENDINGS_DATA.find(e => e.id === endingId);
        if (!ending) return;

        this.recordEnding(endingId);

        const isVictory = ending.type === "survived";

        this.dom.modalCard.className = isVictory ? "modal-card victory" : "modal-card";
        this.dom.modalBanner.textContent = isVictory ? "YOU SURVIVED THE NIGHT!" : "GAME OVER";
        this.dom.modalTitle.textContent = ending.title.toUpperCase();
        this.dom.modalEndingTag.textContent = `ENDING ${ENDINGS_DATA.indexOf(ending) + 1}/6: ${ending.type.toUpperCase()}`;
        this.dom.modalDesc.textContent = isVictory
            ? `${ending.desc} You managed to escape the wrath of Bloody Mary. But you will never look at mirrors the same way again.`
            : `Reason: ${ending.desc}`;

        this.openModal(this.dom.resultModal);
    }

    // Endings storage
    loadEndings() {
        try {
            const data = localStorage.getItem('bloody_mary_endings');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    recordEnding(id) {
        if (!this.unlockedEndings.includes(id)) {
            this.unlockedEndings.push(id);
            try {
                localStorage.setItem('bloody_mary_endings', JSON.stringify(this.unlockedEndings));
            } catch (e) {}
            this.updateEndingsUI();
        }
    }

    updateEndingsUI() {
        const count = `${this.unlockedEndings.length}/${ENDINGS_DATA.length}`;
        if (this.dom.endingsCount) this.dom.endingsCount.textContent = count;
        if (this.dom.galleryCount) this.dom.galleryCount.textContent = count;
    }

    openEndingsGallery() {
        this.renderEndingsGrid();
        this.openModal(this.dom.endingsModal);
    }

    renderEndingsGrid() {
        this.dom.endingsGrid.innerHTML = '';
        ENDINGS_DATA.forEach((ending, idx) => {
            const isUnlocked = this.unlockedEndings.includes(ending.id);
            const card = document.createElement('div');
            card.className = `ending-item ${isUnlocked ? 'unlocked ' + ending.type : 'locked'}`;

            if (isUnlocked) {
                card.innerHTML = `
                    <div class="ending-header">
                        <span class="ending-number">ENDING #${idx + 1}</span>
                        <span class="ending-type ${ending.type}">${ending.type.toUpperCase()}</span>
                    </div>
                    <div class="ending-name">${ending.title}</div>
                    <div class="ending-desc">${ending.desc}</div>
                `;
            } else {
                card.innerHTML = `
                    <div class="ending-header">
                        <span class="ending-number">ENDING #${idx + 1}</span>
                        <span class="ending-type" style="color: #666;">LOCKED</span>
                    </div>
                    <div class="ending-name">??? Undiscovered Fate</div>
                    <div class="ending-desc">Make different choices in the dark bathroom to unlock this outcome.</div>
                `;
            }
            this.dom.endingsGrid.appendChild(card);
        });
    }

    openModal(modalElem) {
        modalElem.classList.add('open');
    }

    closeModal(modalElem) {
        modalElem.classList.remove('open');
    }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new BloodyMaryGame();
});
