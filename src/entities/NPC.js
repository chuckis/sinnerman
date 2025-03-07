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
        
        scene.add.existing(this);
    }

    // Add any NPC-specific methods here
    // For example: dialogue, interaction, etc.
} 