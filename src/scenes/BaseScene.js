import Phaser from 'phaser';
import EasyStar from 'easystarjs';

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
        
        // Movement state
        this.currentGridX = 2;
        this.currentGridY = 2;
        this.currentPathIndex = 0;
        this.isMoving = false;
        
        // Visual elements
        this.debugText = null;
        this.highlightTile = null;
        this.mouseHighlightTile = null;
        
        // Pathfinding
        this.easystar = new EasyStar.js();
        this.grid = [];
        this.pathPoints = [];
    }

    preload() {
        this.load.image('dummy', 'https://labs.phaser.io/assets/sprites/block.png');
    }

    create() {
        this.initializeGrid();
        this.setupPathfinding();
        this.createDummy();
        this.setupCamera();
        this.setupInput();
        this.setupVisualElements();
        this.updateVisualFeedback();
    }

    setupCamera() {
        this.cameras.main.setBackgroundColor('#2d2d2d');
        this.cameras.main.startFollow(this.dummy, true, 0.1, 0.1);
    }

    initializeGrid() {
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = Array(this.gridSize).fill(0);
        }

        // Add obstacles
        const obstacles = [
            { x: 2, y: 2 },
            { x: 3, y: 3 },
            { x: 4, y: 4 }
        ];
        
        obstacles.forEach(({ x, y }) => {
            this.grid[y][x] = 1;
        });
    }

    setupPathfinding() {
        this.easystar.setGrid(this.grid);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableDiagonals();
        this.easystar.enableCornerCutting();
        this.easystar.setIterationsPerCalculation(1000);
    }

    createDummy() {
        this.dummy = this.add.sprite(
            this.getWorldX(this.currentGridX),
            this.getWorldY(this.currentGridY),
            'dummy'
        );
        this.dummy.setScale(1.5);
        this.dummy.setTint(0xff0000);
        this.dummy.setDepth(1);
    }

    setupInput() {
        this.input.on('pointerdown', this.handleClick.bind(this));
    }

    setupVisualElements() {
        this.drawGrid();
        this.setupDebugText();
        this.setupHighlightTile();
        this.setupMouseHighlightTile();
        this.setupMouseMoveHandler();
    }

    setupDebugText() {
        this.debugText = this.add.text(10, 10, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setDepth(2);
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
        if (this.isMoving) return;

        const gridPos = this.screenToGrid(pointer.x, pointer.y);
        
        if (!this.isValidGridPosition(gridPos)) {
            console.log('Target position is outside the grid!');
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
        this.easystar.findPath(
            this.currentGridX,
            this.currentGridY,
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

        this.pathPoints = path.map(point => ({
            x: this.getWorldX(point.x),
            y: this.getWorldY(point.y)
        }));

        this.startMovement();
    }

    startMovement() {
        this.currentPathIndex = 0;
        this.isMoving = true;
        this.moveToNextPoint();
    }

    getWorldX(gridX) {
        return gridX * this.tileSize + this.tileSize / 2;
    }

    getWorldY(gridY) {
        return gridY * this.tileSize + this.tileSize / 2;
    }

    moveToNextPoint() {
        if (this.currentPathIndex >= this.pathPoints.length - 1) {
            this.completeMovement();
            return;
        }

        const currentPoint = this.pathPoints[this.currentPathIndex];
        const nextPoint = this.pathPoints[this.currentPathIndex + 1];

        this.tweens.add({
            targets: this.dummy,
            x: nextPoint.x,
            y: nextPoint.y,
            duration: 200,
            ease: 'Linear',
            onComplete: () => {
                this.currentPathIndex++;
                this.moveToNextPoint();
            }
        });
    }

    completeMovement() {
        this.isMoving = false;
        this.currentGridX = Math.floor(this.dummy.x / this.tileSize);
        this.currentGridY = Math.floor(this.dummy.y / this.tileSize);
        this.updateVisualFeedback();
    }

    updateVisualFeedback() {
        this.updateDebugText();
        this.updateHighlightTile();
        this.updateMouseHighlight();
    }

    updateDebugText() {
        this.debugText.setText([
            `Current Grid Position: (${this.currentGridX}, ${this.currentGridY})`,
            `Mouse Grid Position: (${this.mouseGridX}, ${this.mouseGridY})`,
            `World Position: (${Math.round(this.dummy.x)}, ${Math.round(this.dummy.y)})`,
            `Moving: ${this.isMoving ? 'Yes' : 'No'}`
        ]);
    }

    updateHighlightTile() {
        this.highlightTile.clear();
        this.highlightTile.lineStyle(2, 0x00ff00);
        this.highlightTile.strokeRect(
            this.currentGridX * this.tileSize,
            this.currentGridY * this.tileSize,
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

    update() {
        this.updateVisualFeedback();
    }
} 