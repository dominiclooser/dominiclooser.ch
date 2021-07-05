(function() {
  var button, buttons, getEntityProps, i, len, render, showOverlay, wikidata,
    indexOf = [].indexOf;

  wikidata = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
  });

  getEntityProps = function(entity) {
    var props, types;
    types = entity.claims['P31'];
    if (!types) {
      return [];
    } else {
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
    }
  };

  render = function(entity, extract, lang) {
    var close, dl, fileName, i, image, imageUrl, images, len, links, logos, overlay, prop, props, value;
    logos = entity.claims['P154'];
    images = entity.claims['P18'];
    if (logos) {
      fileName = logos[0].replace(' ', '_');
      imageUrl = wikidata.getImageUrl(fileName);
    } else if (images) {
      fileName = images[0].replace(' ', '_');
      imageUrl = wikidata.getImageUrl(fileName);
    }
    if (imageUrl) {
      image = `<img src='${imageUrl}' class='overlay-image'>`;
    } else {
      image = '';
    }
    props = getEntityProps(entity);
    dl = "<dl class='overlay-props'>";
    for (i = 0, len = props.length; i < len; i++) {
      prop = props[i];
      value = entity.claims[prop];
      dl += `<dt><wd-entity id=${prop} lang=${lang}></dt>
<dd><wd-entity id=${entity.id} property=${prop} lang=${lang}></dd>`;
    }
    dl += '</dl>';
    links = '<ul>';
    console.log(entity);
    if (entity.sitelinks.enwiki) {
      links += '<li><a href="https://wikipedia.org/wiki/enwiki/#{entity.sitelinks.enwiki}">English Wikipedia entry</a></li>';
    }
    links += '</ul>';
    //     <ul>

    //         <li><a is='wd-link' entity-id=#{entity.id} property='P856'>Official Website</a></li>
    //         <li><a is='wd-link' entity-id=#{entity.id} property='P345'>IMDB</a></li>
    //     </ul>
    // """
    overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.innerHTML = `<div class='overlay-content'>
    <header class='overlay-header'>
        <h4 class='overlay-title'>
            <wd-entity id=${entity.id} label lang=${lang}>
        </h4>
        <svg class='close-overlay' viewBox='0 0 100 100'>
            <line x1=0 y1=0 x2=100 y2=100 />
            <line x1=0 y1=100 x2=100 y2=0 />
        </svg> 
    </header>
    <div class='overlay-main'>
        ${image}
        <div class='overlay-summary'>${extract}</div>
        ${dl}
        ${links}
    </div>
</div>`;
    document.body.append(overlay);
    close = overlay.querySelector('.close-overlay');
    return close.addEventListener('click', function() {
      document.body.style.overflow = 'scroll';
      return overlay.style.display = 'none';
    });
  };

  showOverlay = function(id, lang) {
    var url;
    url = wikidata.getEntities(id);
    return fetch(url).then(function(response) {
      return response.json();
    }).then(wikidata.parse.wd.entities).then(function(entities) {
      var entity, sitelink;
      entity = entities[id];
      sitelink = entity.sitelinks.enwiki;
      return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${sitelink}`).then(function(response) {
        return response.json();
      }).then(function(data) {
        var summary;
        if (data.type === 'standard') {
          summary = data.extract;
        } else {
          summary = '';
        }
        return render(entity, summary, lang);
      });
    });
  };

  buttons = document.querySelectorAll('.show-item');

  for (i = 0, len = buttons.length; i < len; i++) {
    button = buttons[i];
    button.addEventListener('click', function() {
      var id;
      id = this.dataset.id;
      document.body.style.overflow = 'hidden';
      return showOverlay(id, 'en');
    });
  }

  
  // showOverlay('Q669591', 'en')

}).call(this);
