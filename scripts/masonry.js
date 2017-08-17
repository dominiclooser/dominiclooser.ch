(function() {
  var draw;

  draw = function() {
    var options;
    options = {
      itemSelector: '.grid-item',
      columnWidth: 300,
      gutter: 30,
      fitWidth: true
    };
    return new Masonry('.grid', options);
  };

  $('.grid').imagesLoaded(draw);

}).call(this);
