(function() {
  var draw;

  draw = function() {
    var options;
    options = {
      gutter: 33,
      columnWidth: '.masonry-item',
      percentPosition: true
    };
    return new Masonry('.masonry', options);
  };

  $('.masonry').imagesLoaded(function() {
    return setTimeout(draw, 800);
  });

  lightbox.option({
    showImageNumberLabel: false
  });

}).call(this);
