(function(nisemata) {

    var Config = {};
    Config.cellSize = 64;
    Config.cellColor = 'lightGray';
    Config.cellStrokeColor = 'gray';
    Config.cellStrokeWidthr = 3;

    var NisemataPlayer = (function() {
        function NisemataPlayer(canvasId) {
            this.engine = new nisemata.NisemataEngine();

            this.stoneImages = [];


            var self = this;
            this.engine.addCallback(function(aspect, obj1, obj2) {
                if (aspect == 'stones') {
                    var stones = obj1;
                    var currentMap = obj2;
                    self.updateCells(stones, currentMap);
                }
            });

            this.canvas = new fabric.Canvas(canvasId);
            this.prepareGrid();
            this.setupHandlers();

            this.canvas.on("mouse:up", function(event) {
                var tar = event.target;
                if (tar.isCell) {
                    console.log(tar.xPos + ':' + tar.yPos);
                    self.engine.nextState(tar.xPos, tar.yPos)
                }
            });
        };

        NisemataPlayer.prototype.buildBaseRect = function() {
            var baseRect = new fabric.Rect({
                left: 1,
                top: 1,
                width: this.canvas.width,
                height: this.canvas.height,
                fill: 'Gray',
                hasControls: false,
                hasRotatingPoint: false,
                selectable: false
            });
            return baseRect;
        };

        NisemataPlayer.prototype.buildCell = function(x, y) {
            var cell = new fabric.Rect({
                left: x * Config.cellSize + 8,
                top: y * Config.cellSize + 8,
                width: Config.cellSize,
                height: Config.cellSize,
                fill: Config.cellColor,
                stroke: Config.cellStrokeColor,
                strokeWidth: Config.cellStrokeWidthr,
                padding: 10,
                rx: 5,
                ry: 5,
                hasControls: false,
                hasRotatingPoint: false,
                selectable: false
            });

            cell.xPos = x;
            cell.yPos = y;
            cell.isCell = true;

            return cell;
        };

        NisemataPlayer.prototype.prepareGrid = function() {
            this.canvas.add(this.buildBaseRect());

            for (var x = 0; x < 9; x++) {
                for (var y = 0; y < 9; y++) {
                    var newCell = this.buildCell(x, y)
                    this.canvas.add(newCell);
                }
            }
        };

        NisemataPlayer.prototype.setupHandlers = function() {
            // noop
        };

        NisemataPlayer.prototype.renderAll = function() {
            this.canvas.renderAll();
        };

        NisemataPlayer.prototype.updateCells = function(stones, currentMap) {
            var self = this;

            this.stoneImages.forEach(function(eachStoneImage) {
                self.canvas.remove(eachStoneImage);
            });
            this.stoneImages = [];

            stones.forEach(function(eachStone) {
                var arrowStone = new fabric.Triangle({
                    width: 20,
                    height: 30,
                    left: eachStone.x * 64 + self.arrowXOffsetFor(eachStone),
                    top: eachStone.y * 64 +  self.arrowYOffsetFor(eachStone),
                    fill: 'darkgray',
                    stroke: 'gray',
                    strokeWidth: 3,
                    hasControls: false,
                    hasRotatingPoint: false,
                    selectable: false

                });
                arrowStone.angle = self.arrowAngleFor(eachStone);

                self.canvas.add(arrowStone);
                self.stoneImages.push(arrowStone);
            });
        };

        NisemataPlayer.prototype.arrowXOffsetFor = function(aStone) {
            if (aStone.orientation == 'up') { return 32; }
            if (aStone.orientation == 'right') { return 56; }
            if (aStone.orientation == 'down') { return 52; }
            if (aStone.orientation == 'left') { return 24; }
            return 0;
        };

        NisemataPlayer.prototype.arrowYOffsetFor = function(aStone) {
            if (aStone.orientation == 'up') { return 24; }
            if (aStone.orientation == 'right') { return 32; }
            if (aStone.orientation == 'down') { return 56; }
            if (aStone.orientation == 'left') { return 52; }
            return 0;
        };

        NisemataPlayer.prototype.arrowAngleFor = function(aStone) {
            if (aStone.orientation == 'up') { return 0; }
            if (aStone.orientation == 'right') { return 90; }
            if (aStone.orientation == 'down') { return 180; }
            if (aStone.orientation == 'left') { return 270; }
            return 0;
        };

        NisemataPlayer.prototype.start = function() {
            this.engine.start();
        };

        NisemataPlayer.prototype.stop = function() {
            this.engine.stop();
        };

        NisemataPlayer.prototype.clear = function() {
            this.engine.clear();
        };

        return NisemataPlayer;
    })();
    nisemata.NisemataPlayer = NisemataPlayer;

})(nisemata || (nisemata = {}));