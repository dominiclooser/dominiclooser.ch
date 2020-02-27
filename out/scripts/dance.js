(function() {
  var Dancer, Postion, dancer1, move, stage;

  stage = document.querySelector('svg');

  dancer1 = document.querySelector('#dancer1');

  Dancer = class Dancer {};

  Postion = class Postion {
    constructor(x) {
      this.x = x;
    }

    right() {
      return new Position(this.x + 30);
    }

  };

  // getNextPositions(dancer)
  //     answer = [dancer.position.right()]
  move = function() {
    var nextPosition, nextPositions;
    nextPositions = getNextPositions(dancer1);
    nextPosition = nextPositions[0];
    return dancer.move(nextPosition);
  };

  window.setInterval(move, 1000);

  // dancer1.setAttribute('cx', dancer1.cx.baseVal.value + 30)

}).call(this);
