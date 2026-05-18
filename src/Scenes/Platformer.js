class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.SCALE = 2.0;
        this.ACCELERATION = 500;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        //  Score
        this.score = 0;

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Create the objects layer
        this.objectsLayer = this.map.getObjectLayer("Objects");

        //  Set up where to spawn the player
        this.spawnPoint = this.objectsLayer.objects.find(obj => obj.name === "playerSpawn");        //  What is this obj => obj.name === "playerSpawn");

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "platformer_characters", "tile_0000.png").setScale(this.SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        //  Set the bounds to the new map size
        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels * this.SCALE,
            this.map.heightInPixels * this.SCALE
        );

        //  Get the Camera
        this.cameras.main.setBounds(
            0,
            0,
            this.map.widthInPixels * this.SCALE,
            this.map.heightInPixels * this.SCALE
        );
        //  Make the camera follow the player
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);  //  (gameObject, roundPx, lerpX, lerpY)
        this.cameras.main.setDeadzone(50, 50);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        //  Coins
        this.coins = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.objectsLayer.objects.forEach(obj => {
            if (obj.name === "coin") {
                const coin = this.coins.create(
                    obj.x * this.SCALE,
                    obj.y * this.SCALE,
                    "tilemap_tiles",
                    151);       //  coin tile index!!!
                coin.setOrigin(0.5, 0.5);
                coin.setScale(this.SCALE);
            };
        });

        //  UI Stuff
        this.scoreText = this.add.text(16, 16, 'Coins: 0', {
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(10); //  .setScrollFactor(0) keeps it at the same place when the camera moves

        //  Coin collision
        this.physics.add.overlap(my.sprite.player, this.coins, (player, coin) => {
            coin.destroy();
            this.score += 1;

            //  Update the score text
            this.scoreText.setText('Coins: ' + this.score);
        });

    }

    update() {
        if(this.cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            this.cameras.main.setFollowOffset(100, 0);   //  Show more of the left side

        } else if(this.cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            this.cameras.main.setFollowOffset(-100, 0);

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDrag(this.DRAG);

            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

        }
    }
}