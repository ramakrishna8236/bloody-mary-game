// Procedural Web Audio API sound engine - Zero external dependencies!
class SoundFX {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneGain = null;
        this.heartbeatTimer = null;
        this.heartbeatRate = 1200; // ms between beats
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    startAtmosphericDrone() {
        this.init();
        if (this.droneGain) return;

        try {
            const now = this.ctx.currentTime;
            this.droneGain = this.ctx.createGain();
            this.droneGain.gain.setValueAtTime(0.01, now);
            this.droneGain.gain.exponentialRampToValueAtTime(0.2, now + 3);

            // Low rumble oscillator
            this.droneOsc1 = this.ctx.createOscillator();
            this.droneOsc1.type = 'sawtooth';
            this.droneOsc1.frequency.setValueAtTime(45, now);

            // Low frequency filter to make it dark and ominous
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(110, now);

            // Sub bass
            this.droneOsc2 = this.ctx.createOscillator();
            this.droneOsc2.type = 'sine';
            this.droneOsc2.frequency.setValueAtTime(32, now);

            this.droneOsc1.connect(filter);
            this.droneOsc2.connect(filter);
            filter.connect(this.droneGain);
            this.droneGain.connect(this.masterGain);

            this.droneOsc1.start();
            this.droneOsc2.start();
        } catch (e) {
            console.warn("Drone audio error:", e);
        }
    }

    stopAtmosphericDrone() {
        if (this.droneGain && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
                setTimeout(() => {
                    if (this.droneOsc1) { this.droneOsc1.stop(); this.droneOsc1.disconnect(); this.droneOsc1 = null; }
                    if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2.disconnect(); this.droneOsc2 = null; }
                    this.droneGain = null;
                }, 1600);
            } catch (e) {}
        }
    }

    playWhisperChime() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 1.2);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(300, now);
            filter.Q.setValueAtTime(3, now);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 1.5);
        } catch (e) {}
    }

    playHeartbeat() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            
            // "Lub"
            this._singleBeat(now, 65, 0.35, 0.12);
            // "Dub"
            this._singleBeat(now + 0.16, 52, 0.25, 0.15);
        } catch (e) {}
    }

    _singleBeat(time, freq, gainVal, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + dur);

        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + dur);
    }

    startHeartbeatLoop(fast = false) {
        this.stopHeartbeatLoop();
        this.heartbeatRate = fast ? 650 : 1200;
        const beat = () => {
            this.playHeartbeat();
            this.heartbeatTimer = setTimeout(beat, this.heartbeatRate);
        };
        beat();
    }

    stopHeartbeatLoop() {
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    playCandleBlow() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // Noise burst for whoosh/breath
            const bufferSize = this.ctx.sampleRate * 0.8;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);
            filter.Q.setValueAtTime(1.5, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(now);
            noise.stop(now + 0.8);
        } catch (e) {}
    }

    playLightExplosion() {
        this.init();
        try {
            const now = this.ctx.currentTime;

            // Spark pop & buzz
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.setValueAtTime(60, now + 0.1);

            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.4);

            // Noise burst for bulb glass shatter
            const bufferSize = this.ctx.sampleRate * 0.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2000, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);

            noise.start(now);
            noise.stop(now + 0.5);
        } catch (e) {}
    }

    playGlassShatter() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const dur = 1.2;

            // Heavy crash burst
            const bufferSize = this.ctx.sampleRate * dur;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(400, now + dur);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(now);
            noise.stop(now + dur);

            // Sharp dissonant glass ringings
            [1800, 2450, 3100].forEach((freq) => {
                const ringOsc = this.ctx.createOscillator();
                const ringGain = this.ctx.createGain();
                ringOsc.type = 'sine';
                ringOsc.frequency.setValueAtTime(freq, now);
                ringOsc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.8);

                ringGain.gain.setValueAtTime(0.2, now);
                ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

                ringOsc.connect(ringGain);
                ringGain.connect(this.masterGain);
                ringOsc.start(now);
                ringOsc.stop(now + 0.8);
            });
        } catch (e) {}
    }

    playJumpscareSting() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const chords = [130, 185, 260, 370]; // Dissonant tritone chord
            chords.forEach((freq) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 1.2);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 1.5);
            });
        } catch (e) {}
    }

    playDoorSlam() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {}
    }

    playClick() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }
}

window.soundFX = new SoundFX();
