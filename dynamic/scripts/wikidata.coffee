wikidata = WBK
    instance: 'https://www.wikidata.org'
    sparqlEndpoint: 'https://query.wikidata.org/sparql'

getEntityProps = (entity) ->
    types = entity.claims['P31']
    props = []

    # P69 educated at
    # P101 field of work
    # P108 employer

    if 'Q11424' in types # film
        props.push('P57', 'P58', 'P495', 'P272')  # dir, screenwriter, country, prod comp
    
    if 'Q47461344' in types  # written work
        props.push('P50', 'P577')  # author, publication date

    if 'Q5' in types # human
        props.push('P101', 'P108', 'P69')    

    return props


render = (entity, extract, lang) ->
    
    logos = entity.claims['P154']
    if logos
        fileName = logos[0].replace(' ', '_')
        logoUrl = wikidata.getImageUrl(fileName)
        image = "<img src='#{logoUrl}'>"
    
    props = getEntityProps(entity)
    dl = "<dl class='overlay-props'>"
    for prop in props
        value = entity.claims[prop]
        dl += """
        <dt><wd-entity id=#{prop} lang=#{lang}></dt>
        <dd><wd-entity id=#{entity.id} property=#{prop} lang=#{lang}></dd>
        """
    dl += '</dl>'
    
    links = '<ul>'
    console.log(entity)
    if entity.sitelinks.enwiki
        links += '<li><a href="https://wikipedia.org/wiki/enwiki/#{entity.sitelinks.enwiki}">English Wikipedia entry</a></li>'
    links += '</ul>'

    #     <ul>
    #         
    #         <li><a is='wd-link' entity-id=#{entity.id} property='P856'>Official Website</a></li>
    #         <li><a is='wd-link' entity-id=#{entity.id} property='P345'>IMDB</a></li>
    #     </ul>
    # """
    
    
    overlay = document.createElement('div')
    overlay.classList.add('overlay')
    overlay.innerHTML = """
        <div class='overlay-content'>
            <header class='overlay-header'>
                <h4 class='overlay-title'>
                    <wd-entity id=#{entity.id} label lang=#{lang}>
                </h4>
                <svg class='close-overlay' viewBox='0 0 100 100'>
                    <line x1=0 y1=0 x2=100 y2=100 />
                    <line x1=0 y1=100 x2=100 y2=0 />
                </svg> 
            </header>
            <div class='overlay-main'>
                <div class='overlay-summary'>#{extract}</div>
                #{dl}
                #{links}
            </div>
        </div>
    """
    document.body.append(overlay)
    close = overlay.querySelector('.close-overlay')
    close.addEventListener 'click', ->
        overlay.style.display = 'none'


showOverlay = (id, lang) ->

    url = wikidata.getEntities(id)
    fetch(url)
        .then (response) -> 
            response.json()
        .then wikidata.parse.wd.entities
        .then (entities) ->
            entity = entities[id] 
            sitelink = entity.sitelinks.enwiki
            fetch("https://en.wikipedia.org/api/rest_v1/page/summary/#{sitelink}")
                .then (response) -> response.json()
                .then (data) ->
                    if data.type == 'standard'
                        summary = data.extract
                    else
                        summary = ''
                    render(entity, summary, lang)
                    

buttons = document.querySelectorAll('.show-item')
for button in buttons
    button.addEventListener 'click', ->
        id = this.dataset.id
        showOverlay(id, 'en')


# showOverlay('Q669591', 'en')