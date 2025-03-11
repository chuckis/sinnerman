import Phaser from 'phaser';
import EasyStar from 'easystarjs';
import NPC from '../entities/NPC';
import Dialogue from '../entities/Dialogue';
import Hero from '../entities/Hero';

export default class BaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseScene' });
        this.initializeProperties();
        this.mouseGridX = 0;
        this.mouseGridY = 0;
    }

    initializeProperties() {
        // Grid configuration
        this.gridSize = 10;
        this.tileSize = 64;
        
        // Pathfinding
        this.easystar = new EasyStar.js();
        this.grid = [];
        
        // Visual elements
        this.highlightTile = null;
        this.mouseHighlightTile = null;
        
        // Game objects
        this.hero = null;
        this.npc = null;
        this.dialogue = null;
    }

    preload() {
        // Load placeholder sprite for now
        this.load.spritesheet('hero', 'https://labs.phaser.io/assets/sprites/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.initializeGrid();
        this.setupPathfinding();
        this.createAnimations();
        this.createHero();
        this.createNPC();
        this.setupCamera();
        this.setupInput();
        this.setupVisualElements();
        this.setupDialogue();
        this.updateVisualFeedback();
    }

    setupCamera() {
        this.cameras.main.setBackgroundColor('#2d2d2d');
        this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    }

    initializeGrid() {
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = Array(this.gridSize).fill(0);
        }

        // Add obstacles
        const obstacles = [
            { x: 2, y: 2 },
            { x: 3, y: 3 },
            { x: 3, y: 4 },
            { x: 3, y: 5 }
        ];
        
        obstacles.forEach(({ x, y }) => {
            this.grid[y][x] = 1;
        });
    }

    setupPathfinding() {
        this.easystar.setGrid(this.grid);
        this.easystar.setAcceptableTiles([0]);
        // this.easystar.enableDiagonals();
        this.easystar.enableCornerCutting();
        this.easystar.setIterationsPerCalculation(1000);
    }

    createAnimations() {
        // Create placeholder animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('hero', { start: 4, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('hero', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

    createHero() {
        this.hero = new Hero(this, 0, 0, 'hero');
    }

    createNPC() {
        this.npc = new NPC(this, 8 * this.tileSize + this.tileSize/2, 2 * this.tileSize + this.tileSize/2, 'dummy');
    }

    setupInput() {
        this.input.on('pointerdown', this.handleClick.bind(this));
        this.input.keyboard.on('keydown-SPACE', this.handleSpaceKey.bind(this));
    }

    setupVisualElements() {
        this.drawGrid();
        this.setupHighlightTile();
        this.setupMouseHighlightTile();
        this.setupMouseMoveHandler();
    }

    setupHighlightTile() {
        this.highlightTile = this.add.graphics();
        this.highlightTile.setDepth(1);
    }

    setupMouseHighlightTile() {
        this.mouseHighlightTile = this.add.graphics();
        this.mouseHighlightTile.setDepth(1);
    }

    setupMouseMoveHandler() {
        this.input.on('pointermove', (pointer) => {
            const gridPos = this.screenToGrid(pointer.x, pointer.y);
            if (this.isValidGridPosition(gridPos)) {
                this.mouseGridX = gridPos.x;
                this.mouseGridY = gridPos.y;
                this.updateMouseHighlight();
            }
        });
    }

    handleClick(pointer) {
        if (!this.hero.canStartNewMovement()) return;

        const gridPos = this.screenToGrid(pointer.x, pointer.y);
        
        if (!this.isValidGridPosition(gridPos)) {
            console.log('Target position is outside the grid!');
            return;
        }

        // Check if target position is an obstacle
        if (this.grid[gridPos.y][gridPos.x] === 1) {
            console.log('Cannot move to obstacle position!');
            return;
        }

        this.findPath(gridPos);
    }

    screenToGrid(screenX, screenY) {
        // Get the camera's scroll position
        const camera = this.cameras.main;
        
        // Convert screen coordinates to world coordinates
        const worldX = (screenX + camera.scrollX) / camera.zoom;
        const worldY = (screenY + camera.scrollY) / camera.zoom;
        
        // Convert world coordinates to grid coordinates
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    isValidGridPosition({ x, y }) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    findPath(targetPos) {
        // Check if target is reachable
        if (this.grid[targetPos.y][targetPos.x] === 1) {
            console.log('Target position is blocked by obstacle!');
            return;
        }

        // Check if target is the NPC's position
        const npcGridX = Math.floor(this.npc.x / this.tileSize);
        const npcGridY = Math.floor(this.npc.y / this.tileSize);
        if (targetPos.x === npcGridX && targetPos.y === npcGridY) {
            console.log('Cannot move through NPC!');
            return;
        }

        const heroPos = this.hero.getGridPosition();
        this.easystar.findPath(
            heroPos.x,
            heroPos.y,
            targetPos.x,
            targetPos.y,
            this.handlePathFound.bind(this)
        );
        this.easystar.calculate();
    }

    handlePathFound(path) {
        if (!path) {
            console.log('No path found!');
            return;
        }

        // Verify path doesn't go through obstacles
        const hasObstacle = path.some(point => this.grid[point.y][point.x] === 1);
        if (hasObstacle) {
            console.log('Path goes through obstacle!');
            return;
        }

        this.hero.moveTo(path);
    }

    updateVisualFeedback() {
        this.updateHighlightTile();
        this.updateMouseHighlight();
    }

    updateHighlightTile() {
        const heroPos = this.hero.getGridPosition();
        this.highlightTile.clear();
        this.highlightTile.lineStyle(2, 0x00ff00);
        this.highlightTile.strokeRect(
            heroPos.x * this.tileSize,
            heroPos.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    updateMouseHighlight() {
        this.mouseHighlightTile.clear();
        this.mouseHighlightTile.lineStyle(2, 0x00ffff);
        this.mouseHighlightTile.strokeRect(
            this.mouseGridX * this.tileSize,
            this.mouseGridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x666666);

        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            graphics.moveTo(x * this.tileSize, 0);
            graphics.lineTo(x * this.tileSize, this.gridSize * this.tileSize);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            graphics.moveTo(0, y * this.tileSize);
            graphics.lineTo(this.gridSize * this.tileSize, y * this.tileSize);
        }

        // Draw obstacles
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    graphics.fillStyle(0xff0000, 0.3);
                    graphics.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }

        graphics.strokePath();
        graphics.setDepth(0);
    }

    setupDialogue() {
        this.dialogue = new Dialogue(this);
    }

    handleSpaceKey(event) {
        if (this.dialogue.isActive()) {
            this.dialogue.nextLine();
        } else if (this.npc && this.npc.canInteract) {
            this.npc.interact();
        }
    }

    update() {
        this.updateVisualFeedback();
        if (this.npc) {
            this.npc.update();
        }
    }

    get currentGridX() {
        return this.hero.gridX;
    }

    get currentGridY() {
        return this.hero.gridY;
    }
} 