(function() {
  $('.hamburger').click(function() {
    return $('.mobile-nav').show();
  });

  $('.close').click(function() {
    return $('.mobile-nav').hide();
  });

}).call(this);
