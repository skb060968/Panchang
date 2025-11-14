# Panchang Dates PWA

A beautiful Progressive Web App for looking up upcoming Hindu calendar events (Purnima, Amavasya, and Ekadashi).

## Features

- 🌙 Track Purnima, Amavasya, and Ekadashi dates
- 📱 Fully responsive design for mobile, tablet, and desktop
- ✨ Modern glassmorphism UI with smooth animations
- 🔄 Offline-capable with service worker caching
- ⚡ Fast and lightweight
- 🎨 Beautiful gradient backgrounds with animated effects

## Live Demo

Visit the app: [Your GitHub Pages URL]

## Installation

### As a PWA
1. Visit the app in your browser
2. Click "Install" or "Add to Home Screen"
3. Use it like a native app!

### Local Development
1. Clone the repository
```bash
git clone https://github.com/yourusername/panchang-dates-pwa.git
cd panchang-dates-pwa
```

2. Start a local server
```bash
node server.js
```

3. Open http://localhost:8000 in your browser

## Project Structure

```
├── index.html          # Main app shell
├── app.js             # Application logic
├── style.css          # Responsive styling
├── manifest.json      # PWA manifest
├── service-worker.js  # Offline caching
├── server.js          # Local development server
├── data/
│   └── dates.json     # Event data
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Technologies

- Vanilla JavaScript (no frameworks)
- CSS3 with glassmorphism effects
- Service Worker API for offline support
- Web App Manifest for PWA features

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

MIT License - feel free to use this project for your own purposes!
