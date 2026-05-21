// Jefferson Patricio
// Created: 5/16/2026
// Phaser: 3.70.0
//
// Platformer Project
//
// A simple platformer game implementation
// 
// Art assets from Kenny Assets

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1440,
    height: 900,
    scene: [Load, Platformer, Win, Lose]
}

var cursors;
const SCALE = 2.0;

//  Global variables accessible accross all scenes
var my = { sprite: {}, text: {}, vfx: {} };

const game = new Phaser.Game(config);