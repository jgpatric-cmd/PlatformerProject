class Lose extends Phaser.Scene {
    constructor() {
        super("loseScene");
    }

    create() {
        this.add.text(this.scale.width/2, this.scale.height/2 - 100,
            'You got dirty!', {
            fontSize: '48px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(this.scale.width/2, this.scale.height/2 + 20,
            'Press R to play again', {
            fontSize: '28px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            this.scene.start("platformerScene");
        });
    }
}