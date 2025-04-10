export default class Thing extends Phaser.GameObjects.Sprite{
    constructor(scene, gridX, gridY, texture) {
        super(scene,
            gridX * scene.tileSize + scene.tileSize / 2,
            gridY * scene.tileSize + scene.tileSize / 2,
            texture
        );
        this.scene = scene
        // Here some logic for inventory management
    }
}