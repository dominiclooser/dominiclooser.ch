showOverlay = (id, lang) ->

    get_props = (entity) ->
        claims = entity.claims
        types = claims['P31']
        if 'Q11424' in types # film
            props = ['P57', 'P58', 'P495', 'P272']  # dir, screenwriter, country, prod comp
        return props

    render = (entity) ->
        props = get_props(entity)

        dl = "<dl class='overlay-props'>"
        for prop in props
            value = entity.claims[prop]
            dl += """
            <dt><wd-entity id=#{prop} lang=#{lang}></dt>
            <dd><wd-entity id=#{entity.id} property=#{prop} lang=#{lang}></dd>
            """
        dl += '</dl>'
        links = """
            <ul>
                <li><a is='wd-link' entity-id=#{entity.id} site='enwiki'>English Wikipedia</a></li>
                <li><a is='wd-link' entity-id=#{entity.id} property='P856'>Official Website</a></li>
                <li><a is='wd-link' entity-id=#{entity.id} property='P345'>IMDB</a></li>
            </ul>
        """
        overlay = document.createElement('div')
        overlay.classList.add('overlay')
        overlay.innerHTML = """
            <div class='overlay-content'>
                <h4 class='overlay-title'>
                    <wd-entity id=#{entity.id} label lang=#{lang}>
                </h4>
                <div class='overlay-main'>
                    #{dl}
                    #{links}
                </div>
            </div>
        """
        document.body.append(overlay)

    wikidata = WBK
        instance: 'https://www.wikidata.org'
        sparqlEndpoint: 'https://query.wikidata.org/sparql'
  
    url = wikidata.getEntities(id)
    fetch(url)
        .then (response) -> 
            response.json()
        .then wikidata.parse.wd.entities
        .then (entities) ->
            entity = entities[id] 
            

            render(entity)

    
    

buttons = document.querySelectorAll('.show-item')
for button in buttons
    button.addEventListener 'click', ->
        id = this.dataset.id
        showOverlay(id, 'en')

showOverlay('Q669591', 'en')