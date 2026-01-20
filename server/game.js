/**
 * HANISH.IO - Game State Manager
 */

const MAP_SIZE = 3800;
const FOOD_COUNT = 500;

class Game {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.players = new Map();
        this.food = [];
        this.createdAt = Date.now();

        // Generate initial food
        this.generateFood();
    }

    generateFood() {
        this.food = [];
        for (let i = 0; i < FOOD_COUNT; i++) {
            this.food.push(this.createFood());
        }
    }

    createFood() {
        const types = [
            { type: 'normal', color: null, val: 1, size: 4.5, chance: 0.7 },
            { type: 'gold', color: '#ffd700', val: 10, size: 12, chance: 0.15 },
            { type: 'speed', color: '#00ffff', val: 5, size: 10, chance: 0.05 },
            { type: 'shield', color: '#4169e1', val: 3, size: 10, chance: 0.05 },
            { type: 'mega', color: '#ff00ff', val: 50, size: 18, chance: 0.05 }
        ];

        let foodType = types[0];
        const rnd = Math.random();
        let cumulative = 0;
        for (let ft of types) {
            cumulative += ft.chance;
            if (rnd < cumulative) { foodType = ft; break; }
        }

        return {
            x: (Math.random() - 0.5) * MAP_SIZE * 2,
            y: (Math.random() - 0.5) * MAP_SIZE * 2,
            val: foodType.val,
            s: foodType.size,
            c: foodType.color || `hsl(${Math.random() * 360}, 90%, 70%)`,
            type: foodType.type
        };
    }

    addPlayer(id, name, skin) {
        this.players.set(id, {
            name: name,
            skin: skin || { colors: ['#00ff88'] },
            x: (Math.random() - 0.5) * MAP_SIZE,
            y: (Math.random() - 0.5) * MAP_SIZE,
            angle: Math.random() * Math.PI * 2,
            segments: [],
            score: 0,
            kills: 0,
            isDead: false
        });
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.angle = data.angle;
            player.segments = data.segments || [];
            player.score = data.score || player.score;
            player.isBoosting = data.isBoosting || false;
        }
    }

    eatFood(playerId, foodIndex) {
        if (foodIndex < 0 || foodIndex >= this.food.length) return null;

        const player = this.players.get(playerId);
        if (!player) return null;

        const food = this.food[foodIndex];
        player.score += food.val;

        // Replace eaten food
        const newFood = this.createFood();
        this.food[foodIndex] = newFood;

        return {
            newFood: { index: foodIndex, ...newFood },
            score: player.score
        };
    }

    playerDied(id) {
        const player = this.players.get(id);
        if (player) {
            player.isDead = true;
            // Drop food from body
            const segments = player.segments || [];
            for (let i = 0; i < Math.min(segments.length / 4, 20); i++) {
                if (segments[i * 4]) {
                    this.food.push({
                        x: segments[i * 4].x,
                        y: segments[i * 4].y,
                        val: 10,
                        s: 12,
                        c: '#ffd700',
                        type: 'gold'
                    });
                }
            }
        }
    }

    respawnPlayer(id) {
        const player = this.players.get(id);
        if (player) {
            player.x = (Math.random() - 0.5) * MAP_SIZE;
            player.y = (Math.random() - 0.5) * MAP_SIZE;
            player.angle = Math.random() * Math.PI * 2;
            player.segments = [];
            player.score = 0;
            player.isDead = false;
        }
    }

    getPlayersData() {
        const data = {};
        this.players.forEach((player, id) => {
            data[id] = { ...player };
        });
        return data;
    }
}

module.exports = Game;
