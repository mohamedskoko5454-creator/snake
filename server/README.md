# HANISH.IO - Multiplayer Server

## 🚀 Quick Start (Local)

```bash
# Install dependencies
npm install

# Start server
npm start
```

Server runs on `http://localhost:3000`

---

## 🌐 Deploy to Render.com

### Step 1: Push to GitHub
1. Create a new GitHub repository
2. Push the `server/` folder content

### Step 2: Create Render Service
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

### Step 3: Get Your URL
After deploy, copy your URL like:
`https://hanish-io-server.onrender.com`

### Step 4: Update Client
In `index.html`, change:
```javascript
const SERVER_URL = 'https://YOUR-APP.onrender.com';
```

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Server status & stats |

## 🔌 Socket Events

| Event | Direction | Data |
|-------|-----------|------|
| `createRoom` | → | name, skin |
| `joinRoom` | → | roomCode, name, skin |
| `playerUpdate` | → | x, y, angle, segments |
| `roomCreated` | ← | roomCode, playerId, players, food |
| `roomJoined` | ← | roomCode, playerId, players, food |
| `playerMoved` | ← | id, x, y, angle, segments |
| `playerJoined` | ← | player data |
| `playerLeft` | ← | id |
