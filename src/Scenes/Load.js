class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        //  Tilemap tiles (spritesheet)
        this.load.spritesheet("tilemap_tiles",
            "./assets/kenney_pixel_platformer/Tilemap/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        //  Food spritesheet (for the player avatar)
        this.load.spritesheet("food_tiles", 
            "./assets/kenney_pixel_platformer_food_expansion/Tilemap/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        //  Tiled map
        this.load.tilemapTiledJSON("platformer-level-1",
            "./assets/tiled_files/platformer-level-1.tmj");

        //  Load particles
        this.load.image("dirt_01", "./assets/kenney_particle_pack/PNG (Transparent)/dirt_01.png");
        this.load.image("dirt_02", "./assets/kenney_particle_pack/PNG (Transparent)/dirt_02.png");
        this.load.image("dirt_03", "./assets/kenney_particle_pack/PNG (Transparent)/dirt_03.png");

        //  Load audio
        this.load.audio("jump_sfx", "./assets/other_sounds/jump-boing.mp3");
        this.load.audio("coin_sfx", "./assets/kenney_interface-sounds/Audio/bong_001.ogg");
    }

    create() {
        this.anims.create({
            key: 'idle',
            defaultTextureKey: "food_tiles",
            frames: [{ frame: 14 }],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers("food_tiles", { start: 14, end: 14 }),
            repeat: 0
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}