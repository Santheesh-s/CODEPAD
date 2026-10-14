# ⚡ Codeplaces - Real-Time Collaborative Code Editor & Runner

Codeplaces is a modern, full-featured collaborative code editor and execution workspace. It enables developers, teachers, and students to write, share, and execute code together in real-time with zero setup.

---

## ✨ Features

- **🔄 Real-Time Collaboration**: Real-time multi-user synchronization powered by Yjs CRDTs and Firebase Firestore.
- **👥 Remote Cursor & Collaborator Presence**: See collaborator cursor locations, text selections, and user labels in real-time with vibrant color-coding.
- **⚡ Built-In Code Runner**: Execute **Python 3**, **C++ (GCC)**, **Java (OpenJDK)**, **TypeScript**, and **JavaScript** with standard input (`stdin`) support, execution timing, and memory tracking. Shortcut: `Ctrl+Enter` / `Cmd+Enter`.
- **🌐 Live Web Preview**: Instant sandboxed `<iframe>` preview for **HTML5**, **CSS3**, and **JavaScript** with live console logging, refresh, and new-tab view.
- **🎓 Teacher & Classroom Mode**: Instructors can claim the "Teacher" role to lock editing permissions for students, creating a distraction-free presentation environment.
- **⏱️ Expiring vs. Permanent Sessions**:
  - **Anonymous Rooms**: Instant 1-click access; expire automatically after 24 hours.
  - **Permanent Rooms**: Sign in with Google to save up to 20 permanent rooms with custom URL slugs, rename options, and permanent persistence.
  - **Save to Account**: Convert any temporary room to permanent with a single click.
- **📝 Starter Templates**: One-click boilerplate insertion for JavaScript, Python, HTML/CSS, C++, Java, and TypeScript.
- **⚙️ Editor Customization**: Configurable font size (12px - 20px), word wrap toggle, and syntax highlighting via CodeMirror 6.
- **💾 One-Click Download**: Export and download files locally with proper extensions (`.js`, `.py`, `.html`, `.cpp`, `.java`, etc.).
- **📊 Real-Time Status Bar**: Live line/column counter (`Ln X, Col Y`), character count, word count, selection statistics, and room expiration timers.
- **🌓 Dark & Light Modes**: Seamless transition between dark and light themes.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────┐
                    │        Frontend (Client)        │
                    │   React 19 + CodeMirror 6       │
                    │   Hosted on Firebase Hosting    │
                    └───────┬─────────────────┬───────┘
                            │                 │
              Real-time CRDT│                 │ Serverless API
              (Rooms & Sync)│                 │ (Execute / New-Room)
                            ▼                 ▼
             ┌─────────────────────┐   ┌─────────────────────┐
             │  Firebase Firestore │   │   Vercel Backend    │
             │  & Authentication   │   │   (api/**/*.js)     │
             └─────────────────────┘   └─────────────────────┘
```

- **Frontend**: Single Page Application built with React 19, CodeMirror 6, Tailwind CSS v4, and Vite. Deployed to **Firebase Hosting**.
- **Backend**: Serverless API routes under `api/` deployed to **Vercel** (`/api/execute`, `/api/new-room`, `/api/health`).
- **Database / Auth**: Firebase Firestore for room metadata, document updates, and Google OAuth.

---

## 📁 Repository Structure

```
CODEPAD/
├── api/                       # Vercel Serverless Backend Functions
│   ├── execute.js             # Code execution proxy endpoint
│   ├── new-room.js            # Room ID generation & slug sanitization
│   └── health.js              # Backend health-check endpoint
├── public/                    # Static assets & favicons
├── src/                       # Frontend Source Code
│   ├── components/            # Reusable UI components
│   │   ├── CodeEditor.jsx     # CodeMirror 6 + Yjs collaborative editor
│   │   ├── OutputPanel.jsx    # Terminal output, stdin & web preview
│   │   ├── StatusBar.jsx      # Bottom stats & room status bar
│   │   └── Toolbar.jsx        # Navigation, controls, run & share
│   ├── hooks/                 # Custom React hooks (useTheme)
│   ├── pages/                 # Route pages
│   │   ├── Home.jsx           # Dashboard, room manager & quick join
│   │   └── Room.jsx           # Editor workspace
│   ├── utils/                 # Utilities
│   │   ├── codeRunner.js      # Multi-language execution engine
│   │   ├── collaboratorColors.js # User identity & color palette
│   │   └── templates.js       # Starter templates & file extensions
│   ├── firebase.js            # Firebase app, db & auth initialization
│   ├── index.css              # Global styles & Tailwind CSS
│   ├── main.jsx               # React DOM entrypoint
│   └── App.jsx                # Router configuration
├── firebase.json              # Firebase Hosting configuration
├── .firebaserc                # Firebase project configuration
├── vercel.json                # Vercel serverless configuration
├── .vercelignore              # Ignore frontend source when deploying Vercel backend
└── package.json               # Dependencies & build scripts
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be available at [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## 🚢 Deployment Guide

This project is optimized to deploy:
- **Backend (`api/`)** on **Vercel**
- **Frontend (`dist/`)** on **Firebase Hosting**

---

### Step 1: Deploy Backend to Vercel

The backend functions live in `api/` and are configured in `vercel.json`.

#### Option A: Using the Vercel CLI (Recommended)
1. Install the Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Log in and deploy:
   ```bash
   vercel
   ```
   Or deploy to production directly:
   ```bash
   npm run deploy:backend
   ```
3. Follow the CLI prompts:
   - **Set up and deploy?** `Y`
   - **Which scope?** Select your Vercel account/team.
   - **Link to existing project?** `N` (for first deployment).
   - **Project name?** e.g., `codeplaces-backend`.
   - **Directory?** `./`

4. Once deployed, Vercel will provide your backend URL, for example:
   ```
   https://codeplaces-backend.vercel.app
   ```
5. Test the health endpoint:
   ```
   https://codeplaces-backend.vercel.app/api/health
   ```

#### Option B: Deploying via Vercel Web Dashboard (GitHub)
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Keep the default settings (Vercel automatically detects `vercel.json` and `api/`).
4. Click **Deploy**.

---

### Step 2: Deploy Frontend to Firebase Hosting

The frontend is built with Vite into the `dist/` directory and configured in `firebase.json`.

#### 1. Configure the Backend URL
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
VITE_API_URL=https://codeplaces-backend.vercel.app
```
*(Replace with your actual Vercel backend URL from Step 1).*

#### 2. Install Firebase CLI & Log In
```bash
npm install -g firebase-tools
firebase login
```

#### 3. Select your Firebase Project
If not already set in `.firebaserc`:
```bash
firebase use codeplaces
# or to switch projects:
firebase use --add
```

#### 4. Build and Deploy Frontend
Build the production bundle and deploy to Firebase Hosting:
```bash
npm run deploy:frontend
```
Or run the steps manually:
```bash
npm run build
firebase deploy --only hosting
```

Your frontend is now live at:
```
https://codeplaces.web.app
https://codeplaces.firebaseapp.com
```

---

## 📡 Backend API Reference

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "Codeplaces Backend API",
    "uptime": 124.5,
    "timestamp": "2026-10-14T14:30:00.000Z"
  }
  ```

### 2. Generate New Room
- **Endpoint**: `GET /api/new-room` or `POST /api/new-room`
- **Optional Body/Query**: `{ "slug": "my-custom-room" }`
- **Response**:
  ```json
  {
    "success": true,
    "roomId": "e9b21f3c-8a1e-4501-a1dc-2a819b5d3a1f",
    "createdAt": 1773585000000
  }
  ```

### 3. Execute Code
- **Endpoint**: `POST /api/execute`
- **Request Body**:
  ```json
  {
    "language": "python",
    "code": "print('Hello, Codeplaces!')",
    "stdin": ""
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "stdout": "Hello, Codeplaces!\n",
    "stderr": "",
    "time": "0.038s",
    "memory": "7.8 MB",
    "status": "Success"
  }
  ```

Supported execution languages: `python`, `javascript`, `typescript`, `cpp`, `java`.

---

## 🛠️ NPM Scripts Summary

| Command | Description |
|---|---|
| `npm run dev` | Launch local Vite development server |
| `npm run build` | Build optimized production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint check |
| `npm run deploy:frontend` | Build and deploy frontend to Firebase Hosting |
| `npm run deploy:backend` | Deploy serverless backend functions to Vercel |

---

## 📄 License

MIT License. Feel free to use, modify, and distribute.
