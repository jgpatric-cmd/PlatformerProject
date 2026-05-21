class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
    
    // =================================================================== //
    // INIT - constants and physics settings                               //
    // =================================================================== //
    init() {
        //  JUMP_VELOCITY NOTES:
        //  -900 = 7 tiles high
        //  -800 = 6 tiles high
        //  -700 = 5 tiles high


        this.SCALE = 2.0;
        this.ACCELERATION = 300;
        this.DRAG = 200;    // DRAG < ACCELERATION = icy slide
        this.JUMP_VELOCITY = -800;
        this.physics.world.gravity.y = 1500;

        //  Tracker for setupCoins()
        this.coinCombo = 0;
        this.lastCoinTime = 0;
        this.COMBO_WINDOW = 500;

        //  Tracker for loseCondition()
        this.groundTime = 0;
        this.LOSE_WINDOW = 5000;
    }

    // =================================================================== //
    // CREATE - build the actual world                                     //
    // =================================================================== //
    create() {
        this.buildMap();
        this.spawnPlayer();
        this.setupCamera();
        this.setupCoins();
        this.setupUI();
        this.setupInput();
        this.setupMovementVFX();
        this.createSFX();
        this.setupWinCondition();
    }

    buildMap() {
        // Create a tilemap object from the JSON loaded in Load.js
        // Parameters: (key from load.tilemapTiledJSON, tileWidth, tileHeight, mapWidthInTiles, mapHeightInTiles)
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 135, 25);

        // Link the spritesheet image to these identifiers
        // Parameters: (name of tileset in Tiled, the key used in this.load.spritesheet in load.js)
        this.tileset = this.map.addTilesetImage("kenney_pixel_platformer", "tilemap_tiles");
        this.foodTileset = this.map.addTilesetImage("kenney_pixel_platformer_food_expansion", "food_tiles");

        //  Create the layers from the tilemap
        //  Parameters: (layer name, array of tilesets it can use, xoffset, yoffset)
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tileset, this.foodTileset], 0, 0);
        //  Scale the layer up since the tiles are small
        this.groundLayer.setScale(this.SCALE);
        //  Enable collision on tiles with the property "collides" with the value "true"
        this.groundLayer.setCollisionByProperty({ collides: true });

        //  Table layers
        this.tableLayer1 = this.map.createLayer("Table Top", [this.tileset], 0 ,0);
        this.tableLayer2 = this.map.createLayer("Table Legs", [this.tileset], 0, 0);
        //  Scale
        this.tableLayer1.setScale(this.SCALE);
        this.tableLayer2.setScale(this.SCALE);
        //  Enable collision
        this.tableLayer1.setCollisionByProperty({ collides: true });
        this.tableLayer2.setCollisionByProperty({ collides: true });

        //  Set the physics world boundary so the player can't go outside the map
        //  Parameters: (x, y, width, height) scaled up
        this.physics.world.setBounds(0, 0,
            this.map.widthInPixels * this.SCALE,
            this.map.heightInPixels * this.SCALE
        );

        //  Set the camera boundary to match the world boundary so it doesn't scroll
        //  past the map boundary
        //  Parameters: (x, y, width, height) scaled up
        this.cameras.main.setBounds(0, 0,
            this.map.widthInPixels * this.SCALE,
            this.map.heightInPixels * this.SCALE
        );

        //  Get the "Objects" layer
        this.objectsLayer = this.map.getObjectLayer("Objects");
    }
    spawnPlayer() {
        //  Get the spawnPoint from the Objects layer (which is just an array)
        this.spawnPoint = this.objectsLayer.objects.find( obj => obj.name === "spawnPoint");

        //  Create a sprite with physics at the spawnPoint
        //  Parameters: (x, y, textureKey, frameNumber)
        my.sprite.player = this.physics.add.sprite(
            this.spawnPoint.x * this.SCALE, 
            this.spawnPoint.y * this.SCALE, 
            "food_tiles", 14
        ).setScale(this.SCALE);

        //  Makes the player collide with the world bounds
        my.sprite.player.setCollideWorldBounds(true);

        //  Make the player collidable with the layers
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.tableLayer1);
        this.physics.add.collider(my.sprite.player, this.tableLayer2);

        //  Other configurations / properties
        my.sprite.player.setBounce(0.7);
    }
    setupCamera() {
        //  Make the camera smoothly follow the player
        //  Parameters: (gameObject, roundPx, lerpX, lerpY)
        //  roundPixels: snaps camera to whole pixels (prevents blurry tiles)
        //  lerp: makes it so that the camera "smoothly"goes towrad player (instead of instantly)
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        //  Camera wont move until the player exits this rectangle (that is cenetered on the camera)
        this.cameras.main.setDeadzone(50, 50);
    }
    setupCoins() {
        this.score = 0;

        //  Creates a physics group for all the coins
        //  Configuartion:
        //  allowGravity: coins float
        //  immovable: coins don't get pushed
        this.coins = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        //  Loop through all the objects in the Objects layer in Tiled
        this.objectsLayer.objects.forEach( obj => {
            if (obj.name === "coin") {
                //  Make a coin sprite inside the coins group
                //  Parameters: (x, y, textureKey, frameNumber)
                //  textureKey: where to find the texture
                const coin = this.coins.create(
                    obj.x * this.SCALE,
                    obj.y * this.SCALE,
                    "tilemap_tiles",
                    151
                );
                //  Set the anchor to the middle of the coin
                coin.setOrigin(0.5, 0.5);
                //  Scale size
                coin.setScale(this.SCALE);
            }
        });

        //  Collision Handler for the coins
        //  Parameters: (obj1, obj2, callback)
        //  Difference between collider and overlap - overlap does NOT cause a physical reaction
        //  it just fires the callback
        this.physics.add.overlap(my.sprite.player, this.coins, (player, coin) => {
            coin.destroy();
            this.score++;
            this.scoreText.setText("Coins: " + this.score);

            //  Check if collected within the COIN_WINDOW time
            const now = this.time.now;
            if ( now - this.lastCoinTime < this.COMBO_WINDOW) {
                this.coinCombo++;
            }
            else {  
                this.coinCombo = 0;     //  Reset
            }
            //  Update time of last coin
            this.lastCoinTime = now;
            
            //  Update the pitch of the SFX
            //  Parameters for Math.min(Min, Max)
            const detune  = Math.min(this.coinCombo * 200, 30000);
            //  Configuration for .play()
            //  detune: shifts pitch
            this.coinSound.play({ detune: detune });

        });

    }
    setupWinCondition() {
        //  Get the level end point from the Objects layer
        this.levelEndPoint = this.objectsLayer.objects.find(obj => obj.name === "levelEnd");

        //  Make the zone
        //  Parameters: (scene, x, y, width, height)
        this.levelEnd = this.add.zone(
            this.levelEndPoint.x * this.SCALE,
            this.levelEndPoint.y * this.SCALE,
            this.SCALE * 18,                    //  18 for the tile dimensions
            this.SCALE * 18 
        );

        //  
        this.physics.world.enable(this.levelEnd);
        this.levelEnd.body.allowGravity = false;

        //  Overlap handler
        this.physics.add.overlap(my.sprite.player, this.levelEnd, () => {
            this.scene.start("winScene");
        });
    }
    setupUI() {
        //  UI Stuff
        //  Parameters: (x, y, text, style object)
        this.scoreText = this.add.text(16, 16, 'Coins: 0', {
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(10); //  .setScrollFactor(0) keeps it at the same place when the camera moves
    }
    setupInput() {
        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        //  Parameters: (event. callback)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
    }
    setupMovementVFX() {
        //  Walking vfx
        my.vfx.walking = this.add.particles(0, 0, "dirt_01", {
            scale: { start: 0.03, end: 0.1 },
            lifespan: 350,
            alpha: { start: 1, end:0.1 },
            speedX: { min: -20, max: 20 },
            speedY: { min: -10, max: -30 },
            quantity: 1
        });
        my.vfx.walking.stop();

        //  Jumping vfx
        my.vfx.jumping = this.add.particles(0, 0, "dirt_03", {
            scale: { start: 0.08, end: 0.01 },
            lifespan: 350,
            alpha: { start: 1, end: 0 },
            speedX: { min: -80, max: 80 },
            speedY: { min: -100, max: -20 },
            quantity: 6
        });
        my.vfx.jumping.stop();
    }
    createSFX() {
        this.jumpSound = this.sound.add("jump_sfx");
        this.coinSound = this.sound.add("coin_sfx");
    }
    checkLoseCondition() {
        //  If player is touching the ground
        if (my.sprite.player.body.blocked.down) {
            //  Add the time spent on the ground
            this.groundTime += this.game.loop.delta;  //  delta is ms since last frame
            
            //  If time spent on ground > 5 secs 
            if (this.groundTime >= this.LOSE_WINDOW) {
                this.scene.start("loseScene");
            }
        }
        else {
            //  Reset the timer when player is in the air
            this.groundTime = 0;
        }
    }

    // =================================================================== //
    // UPDATE                                                              //
    // =================================================================== //
    update() {
        this.handleMovement();
        this.handleJump();
        this.checkLoseCondition();
    }

    handleMovement() {
        if(this.cursors.left.isDown) {
            //  Movement
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            //  Sprite
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('idle', true);

            //  VFX
            my.vfx.walking.startFollow(my.sprite.player, 0, 10);
            //  Only play if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
            else {
                my.vfx.walking.stop();
            }

            //  Camera
            this.cameras.main.setFollowOffset(100, 0);   //  Show more of the left side

        } else if(this.cursors.right.isDown) {
            //  Movement
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            //  Sprite
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('idle', true);

            //  VFX
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 30, my.sprite.player.displayHeight/2 - 5, false);
            //  Only play if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
            else {
                my.vfx.walking.stop();
            }

            //  Camera
            this.cameras.main.setFollowOffset(-100, 0);

        } else {
            //  Movement
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDrag(this.DRAG);

            //  Sprite
            my.sprite.player.anims.play('idle');

            //  VFX
            my.vfx.walking.stop();
        }
        
        //  Rotate
        my.sprite.player.angle += my.sprite.player.body.velocity.x * 0.1;
    }
    handleJump() {
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        //  Only jump when grounded AND just pressed
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

            //  VFX
            my.vfx.jumping.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);

            //  SFX
            this.jumpSound.play();
        }

        
    }
}