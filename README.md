# PhotoMotion Studio 🎬

> Browser-based Photo-to-Cinematic-Video studio with real-time motion, WebGL transitions, procedural royalty-free music, and hardware-accelerated MP4 export.

---

## ✨ Features

- **100% Client-Side Processing**: Zero server GPU/CPU costs, infinite horizontal scaling, and complete privacy (user photos and audio never leave the device).
- **Dual-Mode Experience**:
  - **✨ Simple Mode**: Clean 3-step dock designed for non-tech users (Upload Photos $\to$ Magic Auto-Style $\to$ Download Video).
  - **⚙️ Advanced Studio**: Granular control over aspect ratios (9:16, 16:9, 1:1, 4:5), zoom scale (0.5x to 3.0x), tilt/rotation (-45° to +45°), focal pan offsets, and drag-and-drop storyboard timeline.
- **Cinematic Ken Burns Engine**: Real-time camera movements (zoom in, zoom out, pan left, pan right, pan up, pan down).
- **WebGL Shader Transitions**: GPU-compiled GLSL fragment shaders (Cross Fade, Film Dissolve, Directional Wipes, Zoom Punch, Circle Reveal).
- **Offline Royalty-Free Music Library**: 5 distinct procedural music genres (Lo-Fi boom-bap, Upbeat 120BPM dance pop, Acoustic folk fingerpicking, Epic cinematic strings, Ambient meditation) with instant audio preview.
- **Hardware-Accelerated MP4 Export**: Uses WebCodecs `VideoEncoder` + `mp4-muxer` to export high-definition H.264/AAC MP4 files directly to phone or computer in seconds.

---

## 🚀 Cloudflare Pages Deployment

This project is optimized for **Cloudflare Pages** (or Vercel / Netlify):

1. **Framework preset**: `Vite`
2. **Build command**: `npm run build`
3. **Build output directory**: `dist`
4. **Node version**: `20` or higher

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Production build
npm run build
```
