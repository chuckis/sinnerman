import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Example } from './scenes/Example';
import BaseScene from './scenes/BaseScene';
import DialogExample from'./scenes/DialogExample';
import ParentScene from "./scenes/ParentScene.js";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    parent: 'body',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#2d7c45",
    dom: {
        createContainer: true
    },
    scale:{
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            // gravity: { y: 30 },
            debug: true
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver,
        Example,
        BaseScene,
        ParentScene,
        DialogExample
    ]
};

const game = new Phaser.Game(config);

const onChangeScreen = () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    if (game.scene.scenes.length > 0) {
        let currentScene = game.scene.scenes[0];
        if (currentScene instanceof MainMenu) {
            currentScene.resize();
        }
        else if (currentScene instanceof ParentScene) {

        }
    }
}

const _orientation = screen.orientation;
_orientation.addEventListener('change', () => {
    onChangeScreen();
});

window.addEventListener('resize', () => {
    onChangeScreen();
});

// export default new Phaser.Game(config);
