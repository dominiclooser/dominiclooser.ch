(function() {
  var $buttons;

  $buttons = $('.more');

  $('.more').parent().siblings('ul').children(':nth-child(n+4)').hide();

  $buttons.click(function() {
    $(this).parent().siblings('ul').children().show();
    return $(this).remove();
  });

}).call(this);
