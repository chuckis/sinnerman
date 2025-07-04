import Phaser from 'phaser';
import EasyStar from 'easystarjs';
import NPC from '../entities/NPC';
import Dialogue from '../entities/Dialogue';
import Hero from '../entities/Hero';
import GridManager from '../managers/GridManager';
import VisualFeedbackManager from '../managers/VisualFeedbackManager';
import Utils from '../Utils';
import DialogSystem from '../managers/DialogSystem';

export default class BaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseScene' });
        this.initializeProperties();
        this.dialogSystem = new DialogSystem();
    }

    initializeProperties() {
        // Grid configuration
        this.gridSize = 10;
        this.tileSize = 64;
        
        // Managers
        this.gridManager = null;
        this.visualFeedback = null;
        
        // Pathfinding
        this.easystar = new EasyStar.js();
        
        // Game objects
        this.hero = null;
        this.npc = null;
        this.dialogue = null;

        this.hasStartedDialogue = false;
        this.dialogueDelay = 1000; // 1 second delay before starting dialogue
        this.dialogueTimer = null;

        this.utils = new Utils();
    }

    preload() {
        this.load.spritesheet('hero', 'https://labs.phaser.io/assets/sprites/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.json('dialogs', 'dialogs/example-dialog.json');

    }

    create() {
        this.setupManagers();
        this.setupPathfinding();
        this.createGameObjects();
        this.setupGameSystems();
        this.createDialogUI(); // Добавить создание UI для диалогов
        const dialogData = this.cache.json.get('dialogs');
        this.dialogSystem.loadDialogData(dialogData);

    }

    // #region Setup Methods
    setupManagers() {
        this.gridManager = new GridManager(this, this.gridSize, this.tileSize);
        this.visualFeedback = new VisualFeedbackManager(this, this.tileSize);
    }

    setupPathfinding() {
        this.easystar.setGrid(this.gridManager.grid);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableCornerCutting();
        this.easystar.setIterationsPerCalculation(1000);
    }

    createGameObjects() {
        this.createAnimations();
        this.hero = new Hero(this, 0, 0, 'hero');
        this.npc = new NPC(this, 8 * this.tileSize + this.tileSize/2, 2 * this.tileSize + this.tileSize/2, 'dummy');
        this.dialogue = new Dialogue(this);
    }

    setupGameSystems() {
        this.setupCamera();
        this.setupInput();
        this.gridManager.drawGrid();
    }
    // #endregion

    // #region Input Handling
    // Упрощаем обработку клавиатуры - оставляем только ESC для закрытия
    setupInput() {
        this.input.on('pointerdown', this.handleClick.bind(this));
        this.input.keyboard.on('keydown-ESC', this.handleEscKey.bind(this));
        this.input.on('pointermove', this.handlePointerMove.bind(this));
    }

    handleClick(pointer) {
        if (!this.hero.canStartNewMovement()) return;

        const gridPos = this.gridManager.screenToGrid(pointer.x, pointer.y);
        
        if (!this.gridManager.isValidPosition(gridPos)) {
            console.log('Target position is outside the grid!');
            return;
        }

        if (this.gridManager.grid[gridPos.y][gridPos.x] === 1) {
            console.log('Cannot move to obstacle position!');
            return;
        }

        this.findPath(gridPos);
    }

    handleEscKey(event) {
        if (this.isDialogActive) {
            this.endDialog();
        }
    }

    handlePointerMove(pointer) {
        const gridPos = this.gridManager.screenToGrid(pointer.x, pointer.y);
        if (this.gridManager.isValidPosition(gridPos)) {
            this.visualFeedback.updateMouseHighlight(gridPos.x, gridPos.y);
        }
    }
    // #endregion

    // Убираем старые обработчики клавиш
    handleSpaceKey(event) {
        // Убираем обработку Space для диалогов
        if (this.npc && this.npc.canInteract && !this.isDialogActive) {
            this.npc.interact();
        }
    }

    // #region Game Logic
    findPath(targetPos) {
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

        const hasObstacle = path.some(point => 
            this.gridManager.grid[point.y][point.x] === 1
        );
        
        if (hasObstacle) {
            console.log('Path goes through obstacle!');
            return;
        }

        this.hero.moveTo(path);
    }
    // #endregion


    update() {
        this.visualFeedback.updateHighlightTile(this.hero.getGridPosition());
        if (this.npc) {
            this.npc.update();
        }

        const dummyGridX = this.hero.getGridPosition().x;
        const dummyGridY = this.hero.getGridPosition().y;

        const npcGridX = Math.floor(this.npc.x / this.tileSize);
        const npcGridY = Math.floor(this.npc.y / this.tileSize);

        const isNeighbor = this.utils.isNeighborCell(npcGridX, npcGridY, dummyGridX, dummyGridY);

        if (isNeighbor && !this.hasStartedDialogue) {
            // Start dialogue timer when dummy is in neighboring cell
            if (!this.dialogueTimer) {
                this.dialogueTimer = this.time.delayedCall(this.dialogueDelay, () => {
                    this.npc.interact();
                    this.hasStartedDialogue = true;
                });
            }
            this.npc.setAlpha(1); // Full opacity when neighbor
        } else if (!isNeighbor) {
            this.cancelDialogueTimer();
            this.hasStartedDialogue = false; // Reset dialogue state when not neighbors
            this.npc.setAlpha(0.7); // Set to less opaque when not neighbor
        }

    }

    cancelDialogueTimer() {
        if (this.dialogueTimer) {
            this.dialogueTimer.destroy();
            this.dialogueTimer = null;
        }
    }

    setupCamera() {
        this.cameras.main.setBackgroundColor('rgba(160,152,152,0.93)');
        this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    }

    createAnimations() {
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

    // Добавить методы для работы с диалогами
    createDialogUI() {
        this.dialogContainer = this.add.container(0, 0);
        this.dialogContainer.setVisible(false);
        this.dialogContainer.setScrollFactor(0); // UI фиксирован на экране

        // Фон диалога
        this.dialogBg = this.add.rectangle(400, 500, 750, 200, 0x000000, 0.8);
        this.dialogBg.setStrokeStyle(2, 0xffffff);

        // Кнопка закрытия (крестик)
        this.closeButton = this.add.text(760, 410, '✕', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 8, y: 4 }
        });
        this.closeButton.setInteractive();
        this.closeButton.on('pointerdown', () => this.endDialog());
        this.closeButton.on('pointerover', () => {
            this.closeButton.setStyle({ fill: '#ffff00' });
        });
        this.closeButton.on('pointerout', () => {
            this.closeButton.setStyle({ fill: '#ffffff' });
        });

        // Текст диалога
        this.dialogText = this.add.text(50, 420, '', {
            fontSize: '18px',
            fill: '#ffffff',
            wordWrap: { width: 700 }
        });

        // Имя говорящего
        this.speakerName = this.add.text(50, 390, '', {
            fontSize: '16px',
            fill: '#ffff00',
            fontStyle: 'bold'
        });

        // Контейнер для выборов
        this.choicesContainer = this.add.container(0, 0);

        // Добавляем все в основной контейнер
        this.dialogContainer.add([
            this.dialogBg,
            this.closeButton,
            this.dialogText,
            this.speakerName,
            this.choicesContainer
        ]);

        // Устанавливаем фиксированную позицию относительно камеры
        this.dialogContainer.setDepth(1000); // Поверх игровых объектов
    }

    startDialog(dialogId) {
        const dialogData = this.dialogSystem.startDialog(dialogId);
        if (dialogData) {
            this.showDialog(dialogData);
        }
    }

    showDialog(dialogData) {
        this.dialogContainer.setVisible(true);
        this.dialogText.setText(dialogData.text);
        this.speakerName.setText(dialogData.speaker || '');

        this.choicesContainer.removeAll(true);

        if (dialogData.choices && dialogData.choices.length > 0) {
            this.showChoices(dialogData.choices);
        } else {
            this.showContinueButton(dialogData.autoNext);
        }
    }

    showChoices(choices) {
        choices.forEach((choice, index) => {
            const button = this.add.rectangle(400, 550 + index * 40, 700, 35, 0x333333, 0.8);
            button.setStrokeStyle(2, 0x666666);
            button.setScrollFactor(0);
            button.setDepth(1001);
            button.setInteractive();
            
            const buttonText = this.add.text(70, 550 + index * 40, choice.text, {
                fontSize: '16px',
                fill: '#ffffff',
                wordWrap: { width: 650 }
            });
            buttonText.setScrollFactor(0);
            buttonText.setDepth(1002);
            buttonText.setOrigin(0, 0.5);
            
            // Hover эффекты
            button.on('pointerover', () => {
                button.setFillStyle(0x555555, 0.9);
                button.setStrokeStyle(2, 0xffffff);
                buttonText.setStyle({ fill: '#ffff00' });
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x333333, 0.8);
                button.setStrokeStyle(2, 0x666666);
                buttonText.setStyle({ fill: '#ffffff' });
            });
            
            button.on('pointerdown', () => {
                console.log(`Choice ${index} clicked`);
                this.makeChoice(index);
            });

            this.choicesContainer.add([button, buttonText]);
        });
    }

    showContinueButton(autoNext) {
        const button = this.add.rectangle(400, 550, 300, 35, 0x004400, 0.8);
        button.setStrokeStyle(2, 0x008800);
        button.setScrollFactor(0);
        button.setDepth(1001);
        button.setInteractive();
        
        const buttonText = this.add.text(400, 550, 'Продолжить', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setScrollFactor(0);
        buttonText.setDepth(1002);
        buttonText.setOrigin(0.5, 0.5);
        
        // Hover эффекты
        button.on('pointerover', () => {
            button.setFillStyle(0x006600, 0.9);
            button.setStrokeStyle(2, 0x00ff00);
            buttonText.setStyle({ fill: '#ffff00' });
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(0x004400, 0.8);
            button.setStrokeStyle(2, 0x008800);
            buttonText.setStyle({ fill: '#ffffff' });
        });
        
        button.on('pointerdown', () => {
            console.log('Continue button clicked');
            this.continueDialog();
        });

        this.choicesContainer.add([button, buttonText]);
    }

    makeChoice(choiceIndex) {
        console.log(`Making choice: ${choiceIndex}`); // Для отладки
        const nextDialog = this.dialogSystem.makeChoice(choiceIndex);
        if (nextDialog) {
            this.showDialog(nextDialog);
        } else {
            this.endDialog();
        }
    }

    continueDialog() {
        const nextDialog = this.dialogSystem.continueDialog();
        if (nextDialog) {
            this.showDialog(nextDialog);
        } else {
            this.endDialog();
        }
    }

    startDialog(dialogId) {
        const dialogData = this.dialogSystem.startDialog(dialogId);
        if (dialogData) {
            this.showDialog(dialogData);
        }
    }

    showDialog(dialogData) {
        this.isDialogActive = true; // Блокируем движение
        this.dialogContainer.setVisible(true);
        this.dialogText.setText(dialogData.text);
        this.speakerName.setText(dialogData.speaker || '');

        this.choicesContainer.removeAll(true);

        if (dialogData.choices && dialogData.choices.length > 0) {
            this.showChoices(dialogData.choices);
        } else {
            this.showContinueButton(dialogData.autoNext);
        }
    }

    endDialog() {
        this.isDialogActive = false;
        this.dialogContainer.setVisible(false);
        this.hasStartedDialogue = false;
        this.dialogSystem.currentDialog = null;
        
        // Очищаем контейнер с кнопками
        this.choicesContainer.removeAll(true);
    }
}