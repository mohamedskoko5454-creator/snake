/**
 * HANISH.IO - Multiplayer Server
 * Socket.IO + Express
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Game = require('./game');

const app = express();
const server = http.createServer(app);

// CORS for Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.static('public'));

// Game rooms storage
const rooms = new Map();

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    let currentRoom = null;
    let playerName = 'Player';

    // Get available rooms
    socket.on('getRooms', () => {
        const roomList = [];
        rooms.forEach((game, code) => {
            if (game.players.size < 20) {
                roomList.push({
                    code,
                    count: game.players.size,
                    max: 20
                });
            }
        });
        socket.emit('roomList', roomList);
    });

    // Join random room
    socket.on('joinRandom', (data) => {
        let targetRoom = null;

        // Find first non-full room
        for (const [code, game] of rooms) {
            if (game.players.size < 20) {
                targetRoom = code;
                break;
            }
        }

        // If no room found, create one
        if (!targetRoom) {
            targetRoom = generateRoomCode();
            const game = new Game(targetRoom);
            rooms.set(targetRoom, game);
            console.log(`Random join created room: ${targetRoom}`);
        }

        // Join process (reusing logic)
        const game = rooms.get(targetRoom);
        playerName = data.name || 'Player';
        currentRoom = targetRoom;

        socket.join(targetRoom);
        game.addPlayer(socket.id, playerName, data.skin);

        socket.emit('roomJoined', {
            roomCode: targetRoom,
            playerId: socket.id,
            players: game.getPlayersData(),
            food: game.food
        });

        socket.to(targetRoom).emit('playerJoined', {
            id: socket.id,
            name: playerName,
            ...game.players.get(socket.id)
        });

        console.log(`${playerName} joined random room: ${targetRoom}`);
    });

    // Create a new room
    socket.on('createRoom', (data) => {
        const roomCode = generateRoomCode();
        const game = new Game(roomCode);
        rooms.set(roomCode, game);

        playerName = data.name || 'Player';
        currentRoom = roomCode;

        socket.join(roomCode);
        game.addPlayer(socket.id, playerName, data.skin);

        socket.emit('roomCreated', {
            roomCode,
            playerId: socket.id,
            players: game.getPlayersData(),
            food: game.food
        });

        console.log(`Room created: ${roomCode} by ${playerName}`);
    });

    // Join existing room
    socket.on('joinRoom', (data) => {
        const roomCode = data.roomCode.toUpperCase();
        const game = rooms.get(roomCode);

        if (!game) {
            socket.emit('error', { message: 'Room not found!' });
            return;
        }

        if (game.players.size >= 20) {
            socket.emit('error', { message: 'Room is full!' });
            return;
        }

        playerName = data.name || 'Player';
        currentRoom = roomCode;

        socket.join(roomCode);
        game.addPlayer(socket.id, playerName, data.skin);

        // Notify new player
        socket.emit('roomJoined', {
            roomCode,
            playerId: socket.id,
            players: game.getPlayersData(),
            food: game.food
        });

        // Notify other players
        socket.to(roomCode).emit('playerJoined', {
            id: socket.id,
            name: playerName,
            ...game.players.get(socket.id)
        });

        console.log(`${playerName} joined room: ${roomCode}`);
    });

    // Player position update
    socket.on('playerUpdate', (data) => {
        if (!currentRoom) return;
        const game = rooms.get(currentRoom);
        if (!game) return;

        game.updatePlayer(socket.id, data);

        // Broadcast to other players in room
        socket.to(currentRoom).emit('playerMoved', {
            id: socket.id,
            ...data
        });
    });

    // Player ate food
    socket.on('eatFood', (data) => {
        if (!currentRoom) return;
        const game = rooms.get(currentRoom);
        if (!game) return;

        const result = game.eatFood(socket.id, data.foodIndex);
        if (result) {
            io.to(currentRoom).emit('foodEaten', {
                playerId: socket.id,
                foodIndex: data.foodIndex,
                newFood: result.newFood,
                score: result.score
            });
        }
    });

    // Player died
    socket.on('playerDied', (data) => {
        if (!currentRoom) return;
        const game = rooms.get(currentRoom);
        if (!game) return;

        game.playerDied(socket.id);
        io.to(currentRoom).emit('playerDeath', {
            id: socket.id,
            killedBy: data.killedBy
        });
    });

    // Player respawn
    socket.on('respawn', () => {
        if (!currentRoom) return;
        const game = rooms.get(currentRoom);
        if (!game) return;

        game.respawnPlayer(socket.id);
        io.to(currentRoom).emit('playerRespawned', {
            id: socket.id,
            ...game.players.get(socket.id)
        });
    });

    // Chat message
    socket.on('chatMessage', (message) => {
        if (!currentRoom) return;
        io.to(currentRoom).emit('chatMessage', {
            id: socket.id,
            name: playerName,
            message: message.substring(0, 100)
        });
    });

    // Ping/Pong
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        if (currentRoom) {
            const game = rooms.get(currentRoom);
            if (game) {
                game.removePlayer(socket.id);
                socket.to(currentRoom).emit('playerLeft', { id: socket.id });

                // Delete empty rooms
                if (game.players.size === 0) {
                    rooms.delete(currentRoom);
                    console.log(`Room ${currentRoom} deleted (empty)`);
                }
            }
        }
    });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        rooms: rooms.size,
        players: Array.from(rooms.values()).reduce((acc, g) => acc + g.players.size, 0)
    });
});

// Start server
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HANISH.IO Server running on port ${PORT}`);
});
