(function() {
  var button, buttons, i, len, showOverlay,
    indexOf = [].indexOf;

  showOverlay = function(id, lang) {
    var get_props, render, url, wikidata;
    get_props = function(entity) {
      var claims, props, types;
      claims = entity.claims;
      types = claims['P31'];
      if (indexOf.call(types, 'Q11424') >= 0) { // film
        props = [
          'P57',
          'P58',
          'P495',
          'P272' // dir, screenwriter, country, prod comp
        ];
      }
      return props;
    };
    render = function(entity) {
      var dl, i, len, links, overlay, prop, props, value;
      props = get_props(entity);
      dl = "<dl class='overlay-props'>";
      for (i = 0, len = props.length; i < len; i++) {
        prop = props[i];
        value = entity.claims[prop];
        dl += `<dt><wd-entity id=${prop} lang=${lang}></dt>\n<dd><wd-entity id=${entity.id} property=${prop} lang=${lang}></dd>`;
      }
      dl += '</dl>';
      links = `<ul>\n    <li><a is='wd-link' entity-id=${entity.id} site='enwiki'>English Wikipedia</a></li>\n    <li><a is='wd-link' entity-id=${entity.id} property='P856'>Official Website</a></li>\n    <li><a is='wd-link' entity-id=${entity.id} property='P345'>IMDB</a></li>\n</ul>`;
      overlay = document.createElement('div');
      overlay.classList.add('overlay');
      overlay.innerHTML = `<div class='overlay-content'>\n    <h4 class='overlay-title'>\n        <wd-entity id=${entity.id} label lang=${lang}>\n    </h4>\n    <div class='overlay-main'>\n        ${dl}\n        ${links}\n    </div>\n</div>`;
      return document.body.append(overlay);
    };
    wikidata = WBK({
      instance: 'https://www.wikidata.org',
      sparqlEndpoint: 'https://query.wikidata.org/sparql'
    });
    url = wikidata.getEntities(id);
    return fetch(url).then(function(response) {
      return response.json();
    }).then(wikidata.parse.wd.entities).then(function(entities) {
      var entity;
      entity = entities[id];
      return render(entity);
    });
  };

  buttons = document.querySelectorAll('.show-item');

  for (i = 0, len = buttons.length; i < len; i++) {
    button = buttons[i];
    button.addEventListener('click', function() {
      var id;
      id = this.dataset.id;
      return showOverlay(id, 'en');
    });
  }

  showOverlay('Q669591', 'en');

}).call(this);
