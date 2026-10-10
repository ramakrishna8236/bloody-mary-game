# 🕯️ Bloody Mary — Interactive Horror Web Game

A browser-based adaptation and enhancement of the Python text adventure **Bloody Mary**.

---

## 🎮 How to Play

You can play the deployed website or run the game locally:

### Play Online
Import this GitHub repository into [Vercel](https://vercel.com/new) and deploy it as a static site:

1. Sign in to Vercel with GitHub and choose **Add New → Project**.
2. Import `ramakrishna8236/bloody-mary-game`.
3. Set **Framework Preset** to **Other** and **Root Directory** to `./`.
4. Leave **Build Command** blank and set **Output Directory** to `.`.
5. Select **Deploy**. Vercel will give you a public URL where the game can be played.

After setup, pushes to the connected GitHub repository will trigger new deployments.

### Run Locally: Direct in Browser (No Server Needed)
Simply double-click [`index.html`](file:///d:/1%20AI%20Workflows/bloody-mary-game/index.html) in your file explorer to open and play directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari!

### Run Locally: Python Server
Run the included launcher in PowerShell or Command Prompt:
```bash
python app.py
```
This automatically starts a local web server at `http://localhost:8000` and opens your default browser.

---

## ✨ Web Features & Enhancements

- 🪞 **Haunted Bathroom Mirror**: Dynamic animations including a manifesting shadow silhouette, shattering glass cracks, dripping blood streaks, and reaching claws.
- 🕯️ **Interactive Candle Atmosphere**: A realistic candle flame that dips violently when cold air arrives and blows out with rising smoke when extinguished.
- 🔊 **Procedural Web Audio Engine**: Zero external MP3 files needed! Built-in synthesizers for sub-bass horror drones, heartbeats that quicken during panic moments, candle whooshes, buzzing light explosions, glass shatter crashes, and ghostly stings.
- ⌨️ **Keyboard & Mouse Controls**: Click the choice buttons or press `1`, `2`, or `3` on your keyboard.
- ⏳ **Panic / Hesitation Timer**: Just like the original Python script, hesitating too long triggers a terror death!
- 📜 **All 6 Endings Tracker**: Discover and collect all surviving and fatal fates in the Endings Gallery (saved in your browser).
- ⏩ **Speed Toggle**: Option to speed through typewriter text on replay.
