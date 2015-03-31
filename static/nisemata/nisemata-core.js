var nisemata

(function(nisemata) {

    var NisemataEngine = (function() {
        function NisemataEngine() {
            this.field = new Field();
            this.intervalId = undefined;

            this.callbackFunctions = [];
        };

        NisemataEngine.prototype.start = function() {
            var self = this;
            this.intervalId = setInterval(function() {
                self.step();
            }, 240);
        };

        NisemataEngine.prototype.stop = function() {
            clearInterval(this.intervalId);
        };

        NisemataEngine.prototype.clear = function() {
            this.field.clearStones();
            this.changed('stones', this.field.stones, this.field.currentMap);
        };

        NisemataEngine.prototype.step = function() {
            this.field.evolve();
            this.changed('stones', this.field.stones, this.field.currentMap);
        };

        NisemataEngine.prototype.addCallback = function(callbackFunction) {
            this.callbackFunctions.push(callbackFunction)
        };

        NisemataEngine.prototype.changed = function(aspect, stoneArray, stoneMap) {
            this.callbackFunctions.forEach(function(eachCallbackFunction) {
                eachCallbackFunction(aspect, stoneArray, stoneMap);
            });
        }

        NisemataEngine.prototype.addStone = function(x, y) {
            this.field.addStone(x, y);
            this.changed('stones', this.field.stones, this.field.currentMap);
        };

        NisemataEngine.prototype.rotateOrRemoveStone = function(x, y) {
            this.field.rotateOrRemoveStone(x, y);
            this.changed('stones', this.field.stones, this.field.currentMap);
        };

        NisemataEngine.prototype.removeStone = function(x, y) {
            this.field.removeStone(x, y);
            this.changed('stones', this.field.stones, this.field.currentMap);
        };

        NisemataEngine.prototype.nextState = function(x, y) {
            var stoneCount = this.field.currentMap[x][y];

            if (stoneCount <= 0) {
                this.addStone(x, y);

            } else if (stoneCount == 1) {
                this.rotateOrRemoveStone(x, y);

            } else {
                this.removeStone(x, y);
            }
        };

        return NisemataEngine;
    })();
    nisemata.NisemataEngine = NisemataEngine;

    var Field = (function() {
        function Field() {
            this.stones = [];

            this.height = 9;
            this.width = 9;
            this.currentMap = this.createMap();
            this.prevMap = this.createMap();

            this.soundManager = new SoundManager(ScaleProvider.getDefault().scales[1]);
        };

        Field.prototype.createMap = function() {
            var fieldMap = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            return fieldMap;
        };

        Field.prototype.addStone = function(x, y) {
            var newStone = new Stone(x, y);
            this.stones.push(newStone);
            this.updateCurrentMap();
        };

        Field.prototype.clearStones = function(x, y) {
            this.stones = [];
            this.updateCurrentMap();
        };

        Field.prototype.rotateStone = function(x, y) {
            this.stones.forEach(function(eachStone) {
                if (eachStone.x == x && eachStone.y == y) {
                    eachStone.rotate();
                }
            });
            this.updateCurrentMap();
        };

        Field.prototype.removeStone = function(x, y) {
            var list = [];
            this.stones.forEach(function(eachStone) {
                if (!(eachStone.x == x && eachStone.y == y)) {
                    list.push(eachStone);
                }
            });

            this.stones = list;
            this.updateCurrentMap();
        };

        Field.prototype.rotateOrRemoveStone = function(x, y) {

            for (var i = 0; i < this.stones.length; i++) {
                var eachStone = this.stones[i];
                if (eachStone.x == x && eachStone.y == y && eachStone.orientation != 'left') {
                    eachStone.rotate();
                    this.updateCurrentMap();
                    return;
                }
            }

            this.removeStone(x, y);
        };

        Field.prototype.reservePlaySound = function(soundIndex) {
            this.soundManager.reserve(soundIndex);
        };

        Field.prototype.playSound = function() {
            this.soundManager.playAll();
        };

        Field.prototype.clearSound = function(soundIndex) {
            this.soundManager.clearBuffer();
        };

        Field.prototype.evolve = function() {
            this.prevMap = this.currentMap;
            this.currentMap = this.createMap();

            this.stoneMoveForward();
            this.stoneRotateIfStacked();

            this.playSound();
            this.clearSound();
        };

        Field.prototype.stoneMoveForward = function() {
            var self = this;
            this.stones.forEach(function(eachStone) {
                eachStone.moveForward(self);
            });

            this.updateCurrentMap();
        };

        Field.prototype.stoneRotateIfStacked = function() {
            var self = this;
            this.stones.forEach(function(eachStone) {
                eachStone.rotateIfStacked(self);
            });
        };

        Field.prototype.updateCurrentMap = function() {
            this.currentMap = this.createMap();

            var self = this;
            this.stones.forEach(function(eachStone) {
                var count = self.currentMap[eachStone.x][eachStone.y];
                self.currentMap[eachStone.x][eachStone.y] = count + 1;
            });
        };

        return Field;
    })();
    nisemata.Field = Field;

    var Stone = (function() {
        var nextOrientations = {'up':'right', 'right':'down', 'down':'left', 'left':'up'}
        var oppositeOrientations = {'up':'down', 'down':'up', 'right':'left', 'left':'right'}
        var moveSelectors = {'up':'moveUp', 'down':'moveDown', 'right':'moveRight', 'left':'moveLeft'}
        var delta = {
            'up': {x:0, y:-1},
            'down': {x:0, y:1},
            'right': {x:1, y:0},
            'left': {x: -1, y:0}
        }

        function Stone(x, y) {
            this.x = x;
            this.y = y;
            this.orientation = 'up';
        };

        Stone.prototype.rotate = function() {
            this.orientation = nextOrientations[this.orientation]
        };

        Stone.prototype.reflect = function() {
            this.orientation = oppositeOrientations[this.orientation]
        };

        Stone.prototype.moveForward = function(field) {
            var moveSelector = moveSelectors[this.orientation];
            this[moveSelector](field);
        };

        Stone.prototype.moveUp = function(field) {
            if (this.y == 0) {
                field.reservePlaySound(this.x);
            }

            if (this.y == 0 || this.isEncountered(field)) {
                this.reflect();
                this.y = this.y + 1;
            } else {
                this.y = this.y - 1;
            }
        };

        Stone.prototype.moveDown = function(field) {
            if (this.y == (field.height - 1)) {
                field.reservePlaySound(this.x);
            }

            if (this.y == (field.height - 1) || this.isEncountered(field)) {
                this.reflect();
                this.y = this.y - 1;
            } else {
                this.y = this.y + 1;
            }
        };

        Stone.prototype.moveLeft = function(field) {
            if (this.x == 0) {
                field.reservePlaySound(this.y);
            }

            if (this.x == 0 || this.isEncountered(field)) {
                this.reflect();
                this.x = this.x + 1;
            } else {
                this.x = this.x - 1;
            }
        };

        Stone.prototype.moveRight = function(field) {
            if (this.x == (field.width - 1)) {
                field.reservePlaySound(this.y);
            }

            if (this.x == (field.width - 1) || this.isEncountered(field)) {
                this.reflect();
                this.x = this.x - 1;
            } else {
                this.x = this.x + 1;
            }
        };

        Stone.prototype.rotateIfStacked = function(field) {
            if (this.isStacked(field)) {
                this.rotate();
            }
        };

        Stone.prototype.isEncountered = function(field) {
            var d = delta[this.orientation];
            var posX = this.x + d.x;
            var posY = this.y + d.y;

            if (field.prevMap[posX][posY] <= 0) { return false; }

            var self = this;
            field.stones.forEach(function(eachStone) {
                if (eachStone.x == posX && eachStone.y == posY) {
                    if (self.orientation != eachStone.orientation) {
                        return true;
                    }
                }
            });
            return false;
        };

        Stone.prototype.isStacked = function(field) {
            return (field.currentMap[this.x][this.y] >= 2);
        };

        return Stone;
    })();
    nisemata.Stone = Stone;


    var ScaleProvider = (function() {
        ScaleProvider.default;

        ScaleProvider.getDefault = function() {
            if (ScaleProvider.default) { return ScaleProvider.default; }
            ScaleProvider.default = new ScaleProvider();
            return ScaleProvider.default;
        };

        function ScaleProvider() {
            if (ScaleProvider.default) { return ScaleProvider.default }
            this.scales = this.buildScales();
        };

        ScaleProvider.prototype.buildScales = function() {
            var scaleList = [];

            scaleList.push(new NisemataScale("Otomata", ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "A4", "C5"]));
            scaleList.push(new NisemataScale("Okinawa", ["F3", "G3", "B3", "C4", "E4", "F4", "G4", "B5", "C5"]));

            return scaleList;
        }

        return ScaleProvider;
    })();
    nisemata.ScaleProvider = ScaleProvider;


    var SoundManager = (function() {
        function SoundManager(aNisemataScale) {
            this.buffer = this.createBuffer();
            this.useWebAudio();
            this.nisemataScale = aNisemataScale;
        };

        SoundManager.prototype.useWebAudio = function() {
            this.soundPlayerClass = WebAudioPlayer;
        }

        SoundManager.prototype.createBuffer = function() {
            var bufArray = [0, 0, 0, 0, 0, 0, 0, 0];
            return bufArray;
        };

        SoundManager.prototype.clearBuffer = function() {
            this.buffer = this.createBuffer();
        };

        SoundManager.prototype.reserve = function(soundIndex) {
            this.buffer[soundIndex] = 1;
        };

        SoundManager.prototype.playSound = function(soundIndex) {
            var player = this.createPlayer(soundIndex);
            player.play();
        };

        SoundManager.prototype.createPlayer = function(soundIndex) {
            var soundName = this.nisemataScale.scale[soundIndex];
            var player = new this.soundPlayerClass(soundName);
            return player;
        };

        SoundManager.prototype.playAll = function() {
            for (var i = 0; i < this.buffer.length; i++) {
                var isOn = this.buffer[i]
                if (isOn) {
                    this.playSound(i);
                }
            }
        };

        return SoundManager;
    })();
    nisemata.SoundManager = SoundManager;

    var WebAudioPlayer = (function() {
        function WebAudioPlayer(soundName) {
          var soundFont = 'shamisen';
          //  var soundFont = 'glockenspiel';
          //  var soundFont = 'banjo';
          //  var soundFont = 'celesta';
          //  var soundFont = 'woodblock';
          //  var soundFont = 'pizzicato_strings';
          //  var soundFont = 'agogo';
          //  var soundFont = 'gunshot';
          //  var soundFont = 'fx_8_scifi';
          //  var soundFont = 'orchestra_hit';



            var urlArray = []
            urlArray.push('./assets/soundfont/' + soundFont + '-mp3/' + soundName + '.mp3');

            this.player = new Howl({
                urls: urlArray
            });
        };

        WebAudioPlayer.prototype.play = function() {
            this.player.play();
        };

        return WebAudioPlayer;
    })();
    nisemata.WebAudioPlayer = WebAudioPlayer;

    var NisemataScale = (function() {
        function NisemataScale(nameStr, scaleArray7) {
            this.name = nameStr;
            this.scale = scaleArray7;
        };

        return NisemataScale;
    })();
    nisemata.NisemataScale = NisemataScale;

})(nisemata || (nisemata = {}));
