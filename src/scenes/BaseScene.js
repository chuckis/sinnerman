import Phaser from 'phaser';
import EasyStar from 'easystarjs';

export default class BaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseScene' });
        this.easystar = new EasyStar.js();
        this.gridSize = 10;
        this.tileSize = 64;  // Size of each grid tile
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.currentGridX = 2; // Track current grid position
        this.currentGridY = 2;
        this.debugText = null;
        this.highlightTile = null;
    }

    preload() {
        // Load a simple placeholder sprite for our dummy object
        this.load.image('dummy', 'https://labs.phaser.io/assets/sprites/block.png');
    }

    create() {
        // Set up camera
        this.cameras.main.setBackgroundColor('#2d2d2d');
        
        // Create a simple grid for pathfinding (0 = walkable, 1 = blocked)
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = 0;
            }
        }

        // Add some obstacles
        this.grid[2][2] = 1;
        this.grid[3][3] = 1;
        this.grid[4][4] = 1;

        // Set up EasyStar
        this.easystar.setGrid(this.grid);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableDiagonals();
        this.easystar.enableCornerCutting();
        this.easystar.setIterationsPerCalculation(1000);

        // Create dummy object at a valid grid position
        this.dummy = this.add.sprite(
            this.currentGridX * this.tileSize + this.tileSize/2,
            this.currentGridY * this.tileSize + this.tileSize/2,
            'dummy'
        );
        this.dummy.setScale(1.5);
        this.dummy.setTint(0xff0000);
        this.dummy.setDepth(1); // Ensure it's above the grid

        // Add click handler for movement
        this.input.on('pointerdown', (pointer) => {
            if (this.isMoving) return; // Prevent new movement while already moving

            // Convert screen coordinates to grid coordinates
            const gridX = Math.floor(pointer.x / this.tileSize);
            const gridY = Math.floor(pointer.y / this.tileSize);

            // Debug output
            console.log('Click grid pos:', gridX, gridY);

            // Check if coordinates are within grid bounds
            if (gridX < 0 || gridX >= this.gridSize || 
                gridY < 0 || gridY >= this.gridSize) {
                console.log('Target position is outside the grid!');
                return;
            }

            // Find path
            this.easystar.findPath(
                this.currentGridX, 
                this.currentGridY, 
                gridX, 
                gridY, 
                (path) => {
                    if (path === null) {
                        console.log('No path found!');
                        return;
                    }

                    // Convert path points to world coordinates
                    this.pathPoints = path.map(point => ({
                        x: point.x * this.tileSize + this.tileSize/2,
                        y: point.y * this.tileSize + this.tileSize/2
                    }));

                    // Start moving along the path
                    this.currentPathIndex = 0;
                    this.isMoving = true;
                    this.moveToNextPoint();
                }
            );

            this.easystar.calculate();
        });

        // Add visual grid for debugging
        this.drawGrid();

        // Add debug text
        this.debugText = this.add.text(10, 10, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setDepth(2);

        // Create highlight tile
        this.highlightTile = this.add.graphics();
        this.highlightTile.setDepth(1);

        // Center camera on dummy
        this.cameras.main.startFollow(this.dummy, true, 0.1, 0.1);

        // Initial update of visual feedback
        this.updateVisualFeedback();
    }

    updateVisualFeedback() {
        // Update debug text
        this.debugText.setText([
            `Current Grid Position: (${this.currentGridX}, ${this.currentGridY})`,
            `World Position: (${Math.round(this.dummy.x)}, ${Math.round(this.dummy.y)})`,
            `Moving: ${this.isMoving ? 'Yes' : 'No'}`
        ]);

        // Update highlight tile
        this.highlightTile.clear();
        this.highlightTile.lineStyle(2, 0x00ff00);
        
        // Draw rectangle for the current tile
        this.highlightTile.strokeRect(
            this.currentGridX * this.tileSize,
            this.currentGridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    moveToNextPoint() {
        if (this.currentPathIndex >= this.pathPoints.length - 1) {
            this.isMoving = false;
            // Update current grid position
            this.currentGridX = Math.floor(this.dummy.x / this.tileSize);
            this.currentGridY = Math.floor(this.dummy.y / this.tileSize);
            this.updateVisualFeedback();
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

        graphics.strokePath();
        graphics.setDepth(0); // Ensure grid is below sprites
    }

    update() {
        // Update visual feedback every frame
        this.updateVisualFeedback();
    }
} 