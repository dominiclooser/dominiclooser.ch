(function() {
  var button, buttons, i, len, showOverlay;

  showOverlay = function(id) {};

  buttons = document.querySelectorAll('.show-item');

  for (i = 0, len = buttons.length; i < len; i++) {
    button = buttons[i];
    button.addEventListener('click', function() {
      var id;
      id = this.dataset.id;
      return showOverlay(id);
    });
  }

}).call(this);
