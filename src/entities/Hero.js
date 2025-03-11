import Phaser from 'phaser';

export default class Hero extends Phaser.GameObjects.Sprite {
    constructor(scene, gridX, gridY, texture) {
        super(scene, 
            gridX * scene.tileSize + scene.tileSize / 2,
            gridY * scene.tileSize + scene.tileSize / 2,
            texture
        );
        this.scene = scene;
        
        // Visual setup
        this.setScale(1.5);
        this.setTint(0xff0000);
        this.setDepth(1);
        
        // Add physics body
        scene.physics.add.existing(this);
        this.body.setSize(32, 32);
        
        // Grid position
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Movement state
        this.isMoving = false;
        this.currentPathIndex = 0;
        this.pathPoints = [];
        
        scene.add.existing(this);
    }

    getGridPosition() {
        return {
            x: this.gridX,
            y: this.gridY
        };
    }

    updateGridPosition() {
        this.gridX = Math.floor(this.x / this.scene.tileSize);
        this.gridY = Math.floor(this.y / this.scene.tileSize);
    }

    moveTo(path) {
        if (!path || path.length === 0) return;
        
        this.pathPoints = path.map(point => ({
            x: point.x * this.scene.tileSize + this.scene.tileSize / 2,
            y: point.y * this.scene.tileSize + this.scene.tileSize / 2
        }));

        this.currentPathIndex = 0;
        this.isMoving = true;
        this.moveToNextPoint();
    }

    moveToNextPoint() {
        if (this.currentPathIndex >= this.pathPoints.length - 1) {
            this.completeMovement();
            return;
        }

        const nextPoint = this.pathPoints[this.currentPathIndex + 1];

        this.scene.tweens.add({
            targets: this,
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
        this.updateGridPosition();
        this.pathPoints = [];
    }

    canStartNewMovement() {
        return !this.isMoving;
    }
} 