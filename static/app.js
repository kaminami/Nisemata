window.onload = function() {

    var player = new nisemata.NisemataPlayer('nisemataCanvas');

    document.getElementById('startButton').onclick = function(event) {
        player.start();
    };

    document.getElementById('stopButton').onclick = function(event) {
        player.stop();
    };

    document.getElementById('clearButton').onclick = function(event) {
        player.clear();
    };
}

