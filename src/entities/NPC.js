import Phaser from 'phaser';
import {dialogue} from './testdialogue';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setScale(2);
        this.setTint(0xffff00); // Yellow color
        this.setDepth(1);
        
        // Add physics body for visual purposes only
        scene.physics.add.existing(this, true);
        this.body.setSize(32, 32);
        
        // Grid position
        this.gridX = Math.floor(x / scene.tileSize);
        this.gridY = Math.floor(y / scene.tileSize);

        scene.add.existing(this);
    }

    update() {
    }

    interact() {
     this.scene.dialogue.startDialogue(dialogue);
        return true;
    }

    // Add any NPC-specific methods here
    // For example: dialogue, interaction, etc.

}