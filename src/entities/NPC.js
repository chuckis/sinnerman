import Phaser from 'phaser';
import dialogue from './testdialogue';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setScale(1.5);
        this.setTint(0xffff00); // Yellow color
        this.setDepth(1);
        
        // Add physics body for visual purposes only
        scene.physics.add.existing(this, true);
        this.body.setSize(32, 32);
        
        // Grid position
        this.gridX = Math.floor(x / scene.tileSize);
        this.gridY = Math.floor(y / scene.tileSize);
        
        // Interaction properties
        this.hasStartedDialogue = false;
        this.dialogueDelay = 1000; // 1 second delay before starting dialogue
        this.dialogueTimer = null;
        
        scene.add.existing(this);
    }

    isNeighborCell(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    update() {
        const dummyGridX = this.scene.currentGridX;
        const dummyGridY = this.scene.currentGridY;
        
        const isNeighbor = this.isNeighborCell(this.gridX, this.gridY, dummyGridX, dummyGridY);
        
        if (isNeighbor && !this.hasStartedDialogue) {
            // Start dialogue timer when dummy is in neighboring cell
            if (!this.dialogueTimer) {
                this.dialogueTimer = this.scene.time.delayedCall(this.dialogueDelay, () => {
                    this.interact();
                    this.hasStartedDialogue = true;
                });
            }
            this.setAlpha(1); // Full opacity when neighbor
        } else if (!isNeighbor) {
            this.cancelDialogueTimer();
            this.hasStartedDialogue = false; // Reset dialogue state when not neighbors
            this.setAlpha(0.7); // Set to less opaque when not neighbor
        }
    }

    cancelDialogueTimer() {
        if (this.dialogueTimer) {
            this.dialogueTimer.destroy();
            this.dialogueTimer = null;
        }
    }

    interact() {
        
     this.scene.dialogue.startDialogue(dialogue);
        return true;
    }

    // Add any NPC-specific methods here
    // For example: dialogue, interaction, etc.
} 