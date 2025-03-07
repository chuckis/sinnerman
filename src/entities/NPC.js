import Phaser from 'phaser';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setScale(1.5);
        this.setTint(0xffff00); // Yellow color
        this.setDepth(1);
        
        // Add physics body
        scene.physics.add.existing(this, true); // true makes it static
        this.body.setSize(32, 32); // Adjust hitbox size
        
        // Interaction properties
        this.interactionRadius = 64; // One tile distance
        this.canInteract = false;
        this.hasStartedDialogue = false;
        this.dialogueDelay = 1000; // 1 second delay before starting dialogue
        this.dialogueTimer = null;
        
        scene.add.existing(this);
    }

    update() {
        if (this.scene.dummy) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.scene.dummy.x, this.scene.dummy.y
            );
            
            const wasInteractable = this.canInteract;
            this.canInteract = distance <= this.interactionRadius;
            
            // Visual feedback when interaction is possible
            this.setAlpha(this.canInteract ? 1 : 0.7);

            // Start dialogue timer when dummy comes close
            if (this.canInteract && !wasInteractable && !this.hasStartedDialogue) {
                this.startDialogueTimer();
            }
            // Cancel dialogue timer when dummy moves away
            else if (!this.canInteract && wasInteractable) {
                this.cancelDialogueTimer();
            }
        }
    }

    startDialogueTimer() {
        this.dialogueTimer = this.scene.time.delayedCall(this.dialogueDelay, () => {
            this.interact();
            this.hasStartedDialogue = true;
        });
    }

    cancelDialogueTimer() {
        if (this.dialogueTimer) {
            this.dialogueTimer.destroy();
            this.dialogueTimer = null;
        }
    }

    interact() {
        if (!this.canInteract) return false;
        
        const dialogue = [
            { speaker: 'Dummy', text: 'Hello!' },
            { speaker: 'NPC', text: 'Hello there! How can I help you today?' },
            { speaker: 'Dummy', text: 'Just passing by!' },
            { speaker: 'NPC', text: 'Have a great day!' }
        ];
        
        this.scene.dialogue.startDialogue(dialogue);
        return true;
    }

    // Add any NPC-specific methods here
    // For example: dialogue, interaction, etc.
} 