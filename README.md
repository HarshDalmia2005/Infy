# InfyBoard

A real-time collaborative whiteboard built with **Next.js 16**, **Socket.io**, and the **HTML5 Canvas API**. Multiple users can draw, annotate, and brainstorm together on an infinite canvas — with live cursors, instant sync, and a full suite of drawing tools.

![InfyBoard](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white?logo=socket.io) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Zustand](https://img.shields.io/badge/Zustand-5-orange) [![Live Demo](https://img.shields.io/badge/Live%20Demo-infy09.duckdns.org-brightgreen)](https://infy09.duckdns.org)

---

## 🌐 Live Demo

**[https://infy09.duckdns.org](https://infy09.duckdns.org)**

---

## Features

### Drawing Tools
| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | `V` | Click to select, drag to move, handles to resize |
| Pan | `H` | Click and drag to pan the infinite canvas |
| Pen | `P` | Pressure-sensitive freehand drawing |
| Rectangle | `R` | Draw rectangles |
| Ellipse | `E` | Draw circles and ellipses |
| Arrow | `A` | Draw arrows between ideas |
| Line | `L` | Draw straight lines |
| Text | `T` | Place text with custom font size & family |
| Sticky Note | `S` | Place resizable, color-coded sticky notes |
| Eraser | `Shift+E` | Erase drawn strokes |

### Collaboration
- **Live cursors** — see every collaborator's pointer in real time with their name tag
- **Instant sync** — all element additions, moves, resizes, and deletions broadcast via WebSockets
- **Team chat** — built-in chat drawer with message history restored on join
- **Persistent identity** — your name and color are saved in `localStorage` so they persist across refreshes
- **Shareable boards** — copy the board URL or paste a board ID to join

### Canvas Interaction
- **Infinite canvas** — pan freely with middle-mouse or the Pan tool
- **Smooth zoom** — scroll with Ctrl/Cmd to zoom around the pointer
- **Dot grid** — subtle, scale-aware dot grid that pans and zooms with the canvas
- **Minimap** — bottom-left overview of all elements with a live viewport indicator

### Element Editing
- **Move** — select an element and drag to reposition it
- **Resize** — drag any of the 8 handles (corners + midpoints) to resize shapes and sticky notes
- **Edit text / sticky** — double-click a text or sticky element to edit its content in place
- **Sticky note colors** — sticky notes adopt color themes based on the selected stroke color
- **Font control** — choose font size (12–48px) and font family (Sans, Serif, Mono) for the Text tool

### History & Actions
- **Undo / Redo** — full Command Pattern history (Ctrl+Z / Ctrl+Shift+Z)
- **Clear All** — clear the entire board (undoable)
- All history commands are sync-aware and emit socket events

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Rendering | HTML5 Canvas (double-buffered via `RenderEngine`) |
| Real-time | Socket.io 4 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Language | TypeScript 5 |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page (server actions for create/join)
│   ├── LandingClient.tsx     # Landing page UI
│   └── board/[id]/           # Board route
│       ├── page.tsx
│       └── BoardClient.tsx   # Root board layout, mounts all panels
│
├── components/
│   ├── Canvas.tsx            # Canvas element + text input overlay
│   ├── Toolbar.tsx           # Tool selector sidebar
│   ├── ColorPicker.tsx       # Color, stroke width, font size/family
│   ├── ActionBar.tsx         # Undo, Redo, Clear All
│   ├── Minimap.tsx           # Canvas overview with viewport rect
│   ├── LiveCursors.tsx       # Remote user cursors overlay
│   ├── ChatDrawer.tsx        # Slide-in team chat panel
│   ├── UserPanel.tsx         # Online users list
│   └── ShareModal.tsx        # Board URL share dialog
│
├── engine/
│   ├── types.ts              # Core types (Tool, CanvasElement, etc.)
│   ├── RenderEngine.ts       # RAF render loop, dot grid, viewport transform
│   ├── ShapeEngine.ts        # Canvas drawing for all element types
│   ├── SelectionEngine.ts    # Hit testing, bbox computation, resize logic
│   └── HistoryManager.ts     # Command Pattern (Add, Move, Resize, Update, Clear)
│
├── hooks/
│   ├── useCanvas.ts          # All pointer events: draw, pan, select, move, resize, edit
│   ├── useSocket.ts          # Socket.io room lifecycle and event listeners
│   └── useKeyboard.ts        # Global keyboard shortcuts
│
├── stores/
│   ├── boardStore.ts         # Elements + viewport (Zustand)
│   ├── toolStore.ts          # Active tool + style (Zustand)
│   └── userStore.ts          # Local and remote users (Zustand)
│
├── lib/
│   └── socket.ts             # Singleton Socket.io client
│
└── socket/
    └── events.ts             # Socket event name constants

server.js                     # Custom Node.js server with Socket.io
```

### Key Design Decisions

**Command Pattern for history** — Every user action (add, move, resize, update text, clear) is encapsulated as a `Command` object with `execute()` and `undo()` methods. Commands also emit the matching socket event so all collaborators stay in sync.

**Ref-based event handlers** — `useCanvas` uses `useRef` for all mutable interaction state (active element, drag/resize snapshots) to avoid stale closures inside pointer event handlers while keeping the render loop reactive to Zustand state.

**Separate SelectionEngine** — Hit testing and bounding-box computation are isolated in `SelectionEngine`, keeping `ShapeEngine` focused purely on rendering and `useCanvas` focused on event flow.

**Double-buffering via alpha:false** — The `RenderEngine` creates the canvas context with `{ alpha: false }`, which allows the browser to skip the compositing step and renders the dot-grid background inside the canvas rather than as a DOM overlay, ensuring it zooms and pans in perfect sync.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/HarshDalmia2005/Infy.git
cd Infy
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Create a board** to get started or share the URL with teammates.

### Production Build

```bash
npm run build
npm start
```

---

## Usage

1. **Create a board** — click *Create a board* on the landing page. A unique UUID is generated and you're redirected to your board.
2. **Share** — copy the URL from the address bar or use the share icon (top-right). Teammates can paste the full URL or just the board ID into the *Join* field.
3. **Draw** — select a tool from the left toolbar. Use the color and stroke panel at the bottom to style your strokes.
4. **Select & move** — press `V` to switch to the Select tool, click any element to select it, then drag to move. Drag a corner handle to resize.
5. **Add sticky notes** — press `S`, click anywhere on the canvas, type your note, and press Escape or click away to place it. Double-click an existing sticky to edit it. Resize by dragging its corner handles.
6. **Add text** — press `T`, click to place, choose font size and family from the bottom toolbar, then type. Press Enter to commit.
7. **Undo / Redo** — use the top action bar or Ctrl+Z / Ctrl+Shift+Z.
8. **Chat** — click the message bubble (bottom-right) to open the team chat.

---

## Deployment

The app is deployed on an Ubuntu server using:

- **Nginx** as a reverse proxy (port 80/443 → localhost:3000)
- **Let's Encrypt** SSL certificate via Certbot (auto-renewing)
- **Docker + Docker Compose** for containerized PostgreSQL

To deploy on your own server:

```bash
# Clone and install
git clone https://github.com/HarshDalmia2005/Infy.git
cd Infy
npm install
npm run build

# Start with PM2 or similar process manager
npm start
```

Then point Nginx to `localhost:3000` and run `certbot --nginx` for HTTPS.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Author

Built by [Harsh Dalmia](https://github.com/HarshDalmia2005)
