// Init the game

var SCALE_FACTOR = 2; //window.devicePixelRatio

var W = window.innerWidth * SCALE_FACTOR, //window.innerWidth
    H = window.innerHeight * SCALE_FACTOR,
    TILE_SIZE = 80 * SCALE_FACTOR;


var game = new Phaser.Game(W, H, Phaser.AUTO, 'game_div');

var world;

var FONT_SIZE_MED = 30 * SCALE_FACTOR;
var FONT_SIZE_LARGE = 68 * SCALE_FACTOR;

var TILE_COUNT = { x: 4, y: 4 };
var ROUND_COUNT = 2;

var SCORE_TOTAL = 0;
var SCORE_ROUND = 0;
var BONUS_FREQ = 0.25; // 25% chance of a bonus '10' tile after 9

var COLOR_BACKGROUND = '#f7e6dc'; // Tan

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
        this.tile_array = [];
        this.count_array = [];
        this.tiles_found = 0;
        this.reset_round = false;
        this.grid;
        this.visible_delay;
        this.button;
        this.hintCount = 0;
        this.bonus = false;
        this.delay_time = 1; // Seconds
        this.tile_back = 11; // Hide tiles

        game.load.bitmapFont('megalopolis', 'assets/font/megalopolis-brown.png', 'assets/font/megalopolis.xml');

        // Load images
        game.load.spritesheet('tiles', 'assets/images/tiles-sprite.png', 160, 160);
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

        game.stage.backgroundColor = COLOR_BACKGROUND;

        // Init Hint button
        this.button = game.add.button(30, 45 * SCALE_FACTOR, 'buttonHint', this.showNextTile, this, 0, 0, 0);
        this.button.anchor.setTo(0, 0.5);

        world.add(this.button);

        // Init Sounds
        tap = game.add.audio('tap',1,false);
        fail = game.add.audio('fail',1,false);
        success = game.add.audio('success',1,false);

        // Set up tiles
        this.initGrid();

        // Set up score
        this.initHUD();

    },

    update: function() {

    },
    render : function() {
        // For Debugging

    },
    onTap: function(tile, pointer) {

        if (tile.value == 1) {
            game.time.events.remove(this.visible_delay);
            this.toggleTiles(); // Hide all when '1' is pressed
        }

        this.showTile(tile);

    },
    showTile: function(tile) {

        var currentFrame = tile.value-1;
        var len = this.tiles_found;

        tile.inputEnabled = false;

        if (this.count_array[this.tiles_found] == tile.value) {
            tile.frame = currentFrame+11;

            this.tiles_found++;

            tap.play('',0,0.5,false);

            SCORE_TOTAL += tile.value;
            SCORE_ROUND += tile.value;
            this.updateScore();

            if (this.tiles_found == this.count_array.length) {

                success.play('',0,0.15,false);
                this.flashBg('success');

                if (ROUND_COUNT < 9) { ROUND_COUNT++; } // Don't increment past 9

                // TODO: Add a segment to the hint button
                this.hintCount++;
                this.reset_round = true;
                SCORE_ROUND = 0;
                game.time.events.add(Phaser.Timer.SECOND * 0.5, this.reset, this);
            }

        } else {

            game.time.events.remove(this.visible_delay);
            this.toggleTiles('show'); // Show all tiles

            tile.frame = currentFrame+20;

            for (var i = 0, len = this.grid.children.length; i < len; i++) {
                this.grid.children[i].inputEnabled = false; // Disable input for all other tiles
            }

            fail.play('',0,0.5,false);
            this.flashBg('fail');
            this.reset_round = true;

            this.shakeScreen(6, 30);
            game.time.events.add(Phaser.Timer.SECOND * 1,  this.gameOver, this);
        }

    },
    initGrid: function() {
        this.grid = game.add.group();
        world.add(this.grid);

        if ((H - (TILE_SIZE*4))/2 <= (80*SCALE_FACTOR)) {
            this.grid.y = 100*SCALE_FACTOR;
        } else {
            this.grid.y = (H - (TILE_SIZE*4))/2;
        }

        this.grid.x = (W - (TILE_SIZE*4))/2;

        this.fillGrid();

    },
    fillGrid: function() {

        // Randomise tiles and start the game
        this.randomiseTiles();
        var count = 0;

        for (y = 0; y < 4; y++) {
            for (x = 0; x < 4; x++) {

                if (this.tile_array[count] != 0) {

                    var tile = game.add.sprite(x * TILE_SIZE, y * TILE_SIZE, 'tiles', 0);

                    tile.frame = this.tile_array[count]-1;
                    tile.inputEnabled = true;
                    tile.status = 0;
                    tile.id = count;
                    tile.value = this.tile_array[count];

                    tile.events.onInputDown.add(this.onTap, this);
                    //tile.hitArea = new Phaser.Circle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE-2); // Reduce hit area so we can do diagonals

                    this.grid.addChild(tile);
                }

                count++;
            }
        }

        this.visible_delay = game.time.events.add(Phaser.Timer.SECOND * this.delay_time,  this.toggleTiles, this); // Hide tiles after 1 second
    },
    toggleTiles: function(type) {
        for (var i = 0, len = this.grid.children.length; i < len; i++) {
            if (type == 'show') {
                this.grid.children[i].frame = this.grid.children[i].value-1;
            } else {
                if (this.grid.children[i].frame != 10) {
                    this.grid.children[i].frame = 10;
                }
            }
        }
    },
    randomiseTiles: function() {

        // Get a randomised array with numbers 1 to ROUND_COUNT
        for (i = 1; i <= TILE_COUNT.x*TILE_COUNT.y; i++) {
            if (i <= ROUND_COUNT) {
                this.tile_array.push(i);
                this.count_array.push(i);
            } else {
                this.tile_array.push(0); // Empty
            }

            // Bonus
            if (ROUND_COUNT == 9 && i == TILE_COUNT.x*TILE_COUNT.y) {
                var spawnBonus = Math.floor(Math.random()*1/BONUS_FREQ);
                if (spawnBonus == 0) {
                    this.tile_array[this.tile_array.length-1] = 10;
                    this.count_array[this.tile_array.length-1] = 10;
                    bonus = true;
                }
            }
        }
        this.tile_array = this.shuffle(this.tile_array);

    },
    reset: function() {

        this.reset_round = false;
        game.time.events.remove(this.visible_delay);
        this.flashBg();

        this.tile_array = [];
        this.count_array = [];
        this.tiles_found = 0;

        this.grid.destroy();

        this.initGrid();

        // Enable Hint button
        if (this.hintCount == 2) {
            this.button.setFrames(1, 1, 2);
            this.hint = true;
        }

    },
    gameOver: function() {

        // TODO: Show final score
        ROUND_COUNT = 2;
        SCORE_TOTAL = 0;

        this.hint = false;
        this.button.setFrames(0, 0, 0);
        this.hintCount = 0;

        this.reset();

    },
    initHUD: function() {

        localStorage.sequenceScore = 0;

        var highScore = localStorage.sequenceHighScore;

        if (highScore == undefined) {
            highScore = 0;
            localStorage.sequenceHighScore = 0;
        }

        this.score_text = game.add.bitmapText(W-60 * SCALE_FACTOR, 10 * SCALE_FACTOR, 'megalopolis','0', FONT_SIZE_LARGE);
        this.score_text.updateTransform();
        this.score_text.align = 'right';
        this.score_text.position.x = W - this.score_text.textWidth-30;
        world.add(this.score_text);

        this.highscore_text = game.add.bitmapText(W-60 * SCALE_FACTOR, 66 * SCALE_FACTOR, 'megalopolis',highScore.toString(), FONT_SIZE_MED);
        this.highscore_text.updateTransform();
        this.highscore_text.align = 'right';
        this.highscore_text.position.x = W - this.highscore_text.textWidth - 30;
        this.highscore_text.alpha = 0.8;
        world.add(this.highscore_text);

    },
    updateScore: function() {
        // Replace title when starting again
        if (SCORE_TOTAL == 1) {
            // Show the start hint
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

        this.score_text.setText(SCORE_TOTAL.toString());
        this.score_text.updateTransform();
        this.score_text.position.x = W - this.score_text.textWidth-30;

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
    showNextTile: function() {

        if (this.hint) {

            for (var i = 0, len = this.grid.children.length; i < len; i++) {
                console.log(this.grid.children[i].value);
                console.log(this.tiles_found);
                if (this.grid.children[i].value == this.tiles_found+1) {
                    var nextTile = this.grid.children[i];
                    this.showTile(nextTile);
                    break;
                }
            }

            this.hint = false;
            this.updateScore();
            this.button.setFrames(0, 0, 0);
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