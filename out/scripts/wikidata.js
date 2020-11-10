(function() {
  var button, buttons, getEntityProps, i, len, render, showOverlay,
    indexOf = [].indexOf;

  getEntityProps = function(entity) {
    var props, types;
    types = entity.claims['P31'];
    props = [];
    // P69 educated at
    // P101 field of work
    // P108 employer
    if (indexOf.call(types, 'Q11424') >= 0) { // film
      props.push('P57', 'P58', 'P495', 'P272'); // dir, screenwriter, country, prod comp
    }
    if (indexOf.call(types, 'Q47461344') >= 0) { // written work
      props.push('P50', 'P577'); // author, publication date
    }
    if (indexOf.call(types, 'Q5') >= 0) { // human
      props.push('P101', 'P108', 'P69');
    }
    return props;
  };

  render = function(entity, lang) {
    var close, dl, i, len, links, overlay, prop, props, value;
    props = getEntityProps(entity);
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
    overlay.innerHTML = `<div class='overlay-content'>\n    <header class='overlay-header'>\n        <h4 class='overlay-title'>\n            <wd-entity id=${entity.id} label lang=${lang}>\n        </h4>\n        <svg class='close-overlay' viewBox='0 0 100 100'>\n            <line x1=0 y1=0 x2=100 y2=100 />\n            <line x1=0 y1=100 x2=100 y2=0 />\n        </svg> \n    </header>\n    <div class='overlay-main'>\n        ${dl}\n        ${links}\n    </div>\n</div>`;
    document.body.append(overlay);
    close = overlay.querySelector('.close-overlay');
    return close.addEventListener('click', function() {
      return overlay.style.display = 'none';
    });
  };

  showOverlay = function(id, lang) {
    var url, wikidata;
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
      return render(entity, lang);
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

  // showOverlay('Q669591', 'en')

}).call(this);
