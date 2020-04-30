(function() {
  var button, buttons, i, len, showOverlay;

  showOverlay = function(id) {
    var overlay, url, wikidata;
    wikidata = WBK({
      instance: 'https://www.wikidata.org',
      sparqlEndpoint: 'https://query.wikidata.org/sparql'
    });
    url = wikidata.getEntities(id);
    fetch(url).then(function(response) {
      return response.json();
    }).then(wikidata.parse.wd.entities).then(function(entities) {
      return console.log(entities[id].claims);
    });
    overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.innerHTML = `<div class='overlay'>\n${id}\n</div>`;
    return document.body.append(overlay);
  };

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
