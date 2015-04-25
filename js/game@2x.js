// Init the game

var SCALE_FACTOR = 2; //window.devicePixelRatio
var BOTTOM_OFFSET = 30;

// For Megalopolis Font
var FONT_SIZE_SMALL = 18 * SCALE_FACTOR;
var FONT_SIZE_MED = 30 * SCALE_FACTOR;
var FONT_SIZE_LARGE = 64 * SCALE_FACTOR;

var W = 320 * SCALE_FACTOR, //window.innerWidth
    H = window.innerHeight * SCALE_FACTOR,
    TILE_SIZE = 80 * SCALE_FACTOR;

// Limit height range
//if (H > 760 * SCALE_FACTOR) { H = 760 * SCALE_FACTOR }
if (H > 1200 * SCALE_FACTOR) { H = 460 * SCALE_FACTOR }

if (window.innerWidth > 768) { H = 460 * SCALE_FACTOR }

var OFFSET_Y = H-((TILE_SIZE)*4-10 * SCALE_FACTOR)-BOTTOM_OFFSET * SCALE_FACTOR;

var game = new Phaser.Game(W, H, Phaser.AUTO, 'game_div');

var world;

var TILE_COUNT = { x: Math.floor(W/(TILE_SIZE-1)), y: 4 };
var ROUND_COUNT = 2;

var SCORE_TOTAL = 0;
var SCORE_ROUND = 0;
var BONUS_FREQ = 4; // 25% chance of a bonus '10' tile after 9

//var COLOR_BACKGROUND = '#1c0b19'; // Purple
var COLOR_BACKGROUND = '#f7e6dc'; // Tan

var flavourText = [
    'Tap on 1. Then on 2',
    'Easy! Now try 1-2-3',
    'Nice. Adding a four',
    'Getting a bit tougher...',
    'You can do it...',
    'You get one hint. Use it wisely',
    'Can you break 100?',
    'Keep going!',
    'Amazing!',
    'But chimps are still the champs',
    'Great memory or pure luck?',
    'Wow!'
];

Game = function(game) {
    this.game = game;
    this.score_text;
    this.highscore_text;
};

Game.Boot = function (game) { };

Game.Boot.prototype = {
   preload: function() {

        // Loading screen
        game.stage.backgroundColor = COLOR_BACKGROUND;

        game.scale.maxWidth = W;
        game.scale.maxHeight = H;

        // Scale up to whatever the browser can handle, but to do it proportionally
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.setScreenSize();

    },
    create: function() {
        this.visible_delay = game.time.events.add(Phaser.Timer.SECOND * 0.5,  this.game.state.start('game'), this);
    }
};

Game.Game = function(game){};
Game.Game.prototype = {

    preload: function() {
        this.grid;
        this.map;
        this.layer;
        this.marker;
        this.bonus = false;
        this.reset_round = false;
        this.hint = false;
        this.tile_array = new Array();
        this.tiles_found = [0];
        this.visible_delay;
        this.delay_time = 1; // Seconds
        this.button;
        this.tile_back = 11; // Hide tiles
        this.tile_blank = 30; // Fill empty tiles

        game.load.bitmapFont('megalopolis', 'assets/font/megalopolis-brown.png', 'assets/font/megalopolis.xml');

        // Load tile images
        game.load.tilemap('matching', 'assets/images/tiles.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('tiles', 'assets/images/tiles-soft.png');
        game.load.spritesheet('buttonHint', 'assets/images/button-hint-soft.png', 176, 80);

        // Load sounds
        game.load.audio('tap', ['assets/audio/knock.mp3', 'assets/audio/knock.wav']);
        game.load.audio('fail', ['assets/audio/failure.mp3', 'assets/audio/failure.wav']);
        game.load.audio('success', ['assets/audio/success.mp3', 'assets/audio/failure.wav']);

    },

    create: function() {
        var preload = document.getElementById('preload');
        preload.style.display = 'none';

        // Set up 2 groups, a global world group and a game grid group
        world = game.add.group();
        this.grid = game.add.group();
        world.add(this.grid);

        game.stage.backgroundColor = COLOR_BACKGROUND;
        //game.world.setBounds(-20, -20, game.width+20, game.height+2);

        // Set up tiles
        this.map = game.add.tilemap('matching');
        this.map.addTilesetImage('Background', 'tiles');
        this.layer = this.map.createLayer('Tiles');

        this.marker = game.add.graphics();

        this.grid.add(this.marker);
        this.grid.add(this.layer);

        // Offset the grid
        this.grid.fixedToCamera = true;
        this.grid.cameraOffset.x = 0;
        this.grid.cameraOffset.y = OFFSET_Y;

        // Init Hint button
        this.button = game.add.button(W/2, 60 * SCALE_FACTOR, 'buttonHint', this.showNextTile, this, 0, 0, 0);
        this.button.anchor.setTo(0.5, 0.5);

        world.add(this.button);

        // Init Sounds
        tap = game.add.audio('tap',1,false);
        fail = game.add.audio('fail',1,false);
        success = game.add.audio('success',1,false);

        // Randomise tiles and start the game
        this.randomiseTiles();

        // Init the score
        this.initHUD();

        // Register tap input
        game.input.onDown.add(this.onTap, this);

    },

    update: function() {

    },
    render : function() {
        // For Debugging

    },
    onTap: function() {

        // to prevent the marker from going out of bounds
        if (this.layer.getTileY(game.input.activePointer.worldY-OFFSET_Y) < TILE_COUNT.y && game.input.activePointer.worldY-OFFSET_Y > 0) {
            this.marker.x = this.layer.getTileX(game.input.activePointer.worldX) * TILE_SIZE;
            this.marker.y = this.layer.getTileY(game.input.activePointer.worldY-OFFSET_Y) * TILE_SIZE;
        }

        var current_tile = this.map.getTile(
            this.layer.getTileX(this.marker.x),
            this.layer.getTileY(this.marker.y)
        );

        if (current_tile && current_tile.index != 30) {
            var current_tile_position = ((this.layer.getTileY(game.input.activePointer.worldY-OFFSET_Y)+1)*TILE_COUNT.y) - (TILE_COUNT.x-(this.layer.getTileX(game.input.activePointer.worldX)+1));
            this.showTile(current_tile_position, current_tile);
            console.log(current_tile);
            this.updateScore();
        }

    },
    showTile: function(current_tile_position, current_tile) {

        var current_number = this.tile_array[current_tile_position-1];

        if (current_tile.index <= 11 && current_tile_position <= TILE_COUNT.x*TILE_COUNT.y && !this.reset_round) {
            var temp_count = ROUND_COUNT;

            if (current_number == 1) {
                game.time.events.remove(this.visible_delay);
                this.toggleTiles();
                this.reveal(current_number+11); // Number in green
            }

            if (this.bonus == true) { temp_count = ROUND_COUNT + 1; }

            this.tiles_found.push(current_number);
            var len = this.tiles_found.length-1;

            if (this.tiles_found[len-1]+1 !== undefined) {
                if (this.tiles_found[len-1]+1 == this.tiles_found[len]) {

                    if (current_number != 10) {
                        this.reveal(current_number+11);  // Number in green
                    } else {
                       this.reveal(10);
                    }

                    SCORE_TOTAL = SCORE_TOTAL + current_number;
                    SCORE_ROUND = SCORE_ROUND + current_number; // For keeping track of this round's score only

                    tap.play('',0,0.5,false);

                    if (current_number == temp_count) {

                        success.play('',0,0.15,false);

                        this.flashBg('success');

                        if (ROUND_COUNT < 9) { ROUND_COUNT++; }

                        this.reset_round = true;
                        SCORE_ROUND = 0;

                        game.time.events.add(Phaser.Timer.SECOND * 0.5, this.reset, this);
                    }

                } else {
                    game.time.events.remove(this.visible_delay);
                    this.toggleTiles('show'); // Show all tiles
                    this.reveal(current_number+20); // Highlight failed tile

                    fail.play('',0,0.5,false);
                    this.flashBg('fail');
                    this.reset_round = true;

                    var scoreFeedbacks = ['GOOD TRY.', 'NICE!', 'AMAZING!'];
                    var scoreFeedback = '';
                    if (SCORE_TOTAL > 110) {
                        scoreFeedback = scoreFeedbacks[2];
                    } else if (SCORE_TOTAL > 60) {
                        scoreFeedback = scoreFeedbacks[1];
                    } else if (SCORE_TOTAL > 20) {
                        scoreFeedback = scoreFeedbacks[0];
                    }

                    this.author_label.setText('YOU SCORED ' + SCORE_TOTAL.toString() + ' POINTS. ' + scoreFeedback);
                    this.author_label.updateTransform();
                    this.author_label.position.x = W/2 - this.author_label.textWidth/2;

                    this.shakeScreen(6, 30);
                    game.time.events.add(Phaser.Timer.SECOND * 1,  this.gameOver, this);
                }
            }

        }
    },
    reveal: function(tile) {
        this.map.putTile(tile, this.layer.getTileX(this.marker.x), this.layer.getTileY(this.marker.y));
    },
    gameOver: function() {

        // TODO: Show final score
        ROUND_COUNT = 2;
        SCORE_TOTAL = 0;

        this.hint = false;
        this.button.setFrames(0, 0, 0);

        this.reset();

    },
    showNextTile: function() {

        if (this.hint) {
            var current_tile_index = (this.tiles_found[this.tiles_found.length-1]+1);
            var current_tile_position = this.tile_array.indexOf(current_tile_index);

            var y = Math.floor(current_tile_position/TILE_COUNT.y);
            var x = current_tile_position - y*TILE_COUNT.x;

            this.marker.y = y * TILE_SIZE;
            this.marker.x = x * TILE_SIZE;

            var current_tile = { index: 11 }; // Default back tile

            this.showTile(current_tile_position+1, current_tile);

            this.hint = false;
            this.updateScore();
            this.button.setFrames(0, 0, 0);
        }

    },
    reset: function() {

        this.reset_round = false;
        game.time.events.remove(this.visible_delay);
        this.flashBg();

        this.tile_array = [];
        this.tiles_found = [0];

        this.randomiseTiles();
        this.updateFlavourText();

        // Enable Hint button
        if (ROUND_COUNT == 7) { // && current_number == 1
            this.button.setFrames(1, 1, 2);
            this.hint = true;
        }

    },
    updateFlavourText: function() {
        var text = flavourText[ROUND_COUNT-2];
        if (text) {
            this.author_label.setText(text.toUpperCase());
            this.author_label.updateTransform();
            this.author_label.position.x = W/2 - this.author_label.textWidth/2;
        }

    },
    randomiseTiles: function() {

        // Get a randomised array with numbers 1 to ROUND_COUNT
        for (i = 1; i <= TILE_COUNT.x*TILE_COUNT.y; i++) {
            if (i <= ROUND_COUNT) {
                this.tile_array.push(i);
            } else {
                this.tile_array.push(0); // Empty
            }

            // Bonus
            if (ROUND_COUNT == 9 && i == TILE_COUNT.x*TILE_COUNT.y) {
                var spawnBonus = Math.floor(Math.random()*BONUS_FREQ);
                if (spawnBonus == 0) {
                    this.tile_array[this.tile_array.length-1] = 10;
                    bonus = true;
                }
            }

        }

        this.tile_array = this.shuffle(this.tile_array);

        this.toggleTiles('show');

        this.visible_delay = game.time.events.add(Phaser.Timer.SECOND * this.delay_time,  this.toggleTiles, this); // Hide tiles after 1 second
    },
    toggleTiles: function(status) {
        var count = 0;

        for (row = 0; row < TILE_COUNT.x; row++) {
            for (col = 0; col < TILE_COUNT.y; col++) {
                    var tile_type = this.tile_blank;

                    if (this.tile_array[count] != 0) {
                        var tile_type = this.tile_back;

                        if (status == 'show') {
                            tile_type = this.tile_array[count];
                        }
                    }
                    this.map.putTile(tile_type, col, row);
                count++;
            }
        }

    },
    shuffle: function(o) {

        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;

    },
    flashBg: function(type) {

        color = COLOR_BACKGROUND; // Default blue

        if (type == 'success') {
            color = '#99de21';
        } else if (type == 'fail') {
            color = '#de2141';
        }

        game.stage.backgroundColor = color;

    },
    updateScore: function() {
        // Replace title when starting again
        if (SCORE_TOTAL == 1) {
            this.author_label.setText(flavourText[0].toUpperCase());
            this.author_label.updateTransform();
            this.author_label.position.x = W/2 - this.author_label.textWidth/2;
        }

        // Store score in local storage
        if(game.device.localStorage ) {
            localStorage.sequenceScore = SCORE_TOTAL;
            if (localStorage.sequenceHighScore && localStorage.sequenceHighScore != 0) {
                if (SCORE_TOTAL > localStorage.sequenceHighScore) {
                    localStorage.sequenceHighScore = SCORE_TOTAL; // Update high score
                }
            } else {
                localStorage.sequenceHighScore = SCORE_TOTAL;
            }
        }

        //var anim = game.add.tween(this.score_text).to({y : 50, x: 10}, 500, Phaser.Easing.Elastic.InOut, true);
        //game.add.tween(this.score_text).to({height: this.score_text.height+18, width: this.score_text.width-12}, 50, Phaser.Easing.Bounce.In, true);  

        this.score_text.setText(SCORE_TOTAL.toString());

        var highscore = localStorage.sequenceHighScore;

        this.highscore_text.setText(localStorage.sequenceHighScore);
        this.highscore_text.updateTransform();

        // Adjust high score x position
        if (highscore == 10) {
            this.highscore_text.position.x = W - this.highscore_label.textWidth - 23;
        }
        if (highscore == 103) {
            this.highscore_text.position.x = W - this.highscore_label.textWidth - 52; 
        }

    },
    initHUD: function() {

        localStorage.sequenceScore = 0;

        var highScore = localStorage.sequenceHighScore;

        if (highScore == undefined) {
            highScore = 0;
            localStorage.sequenceHighScore = 0;
        }

        this.score_text = game.add.bitmapText(10 * SCALE_FACTOR, 28 * SCALE_FACTOR, 'megalopolis','0', FONT_SIZE_LARGE);
        //this.score_text.tint = 0x673a00;

        this.highscore_text = game.add.bitmapText(W-20 * SCALE_FACTOR, 52 * SCALE_FACTOR, 'megalopolis',highScore, FONT_SIZE_MED);
        this.highscore_text.updateTransform();
        this.highscore_text.position.x = W - this.highscore_text.textWidth - 29;
        this.highscore_text.align = 'right';

        this.highscore_label = game.add.bitmapText(W-60 * SCALE_FACTOR, 32 * SCALE_FACTOR, 'megalopolis','BEST', FONT_SIZE_SMALL);
        this.highscore_label.position.x = W - this.highscore_label.textWidth - 30;

        this.author_label = game.add.bitmapText(W/2, 10 * SCALE_FACTOR, 'megalopolis',flavourText[0].toUpperCase(), FONT_SIZE_SMALL);
        this.author_label.position.x = W/2 - this.author_label.textWidth / 2;

        world.add(this.score_text);
        world.add(this.highscore_text);
        world.add(this.highscore_label);
        world.add(this.author_label);

    },
    shakeScreen: function(i, t) {
        game.add.tween(world).to({y : i}, t, Phaser.Easing.Linear.None)
        .to({y : -i}, t, Phaser.Easing.Linear.None)
        .to({y : i}, t, Phaser.Easing.Linear.None)
        .to({y : 0}, t, Phaser.Easing.Linear.None).start();

        game.add.tween(world).to({x : i}, t, Phaser.Easing.Linear.None)
        .to({x : -i}, t, Phaser.Easing.Linear.None)
        .to({x : i}, t, Phaser.Easing.Linear.None)
        .to({x : 0}, t, Phaser.Easing.Linear.None).start();
    }

};