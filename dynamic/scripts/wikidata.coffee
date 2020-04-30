showOverlay = (id) ->

    wikidata = WBK
        instance: 'https://www.wikidata.org'
        sparqlEndpoint: 'https://query.wikidata.org/sparql'
  
    url = wikidata.getEntities(id)
    fetch(url)
        .then (response) -> 
            response.json()
        .then wikidata.parse.wd.entities
        .then (entities) -> 
            console.log entities[id].claims

    overlay = document.createElement('div')
    overlay.classList.add('overlay')
    overlay.innerHTML = """
        <div class='overlay'>
        #{id}
        </div>
    """
    document.body.append(overlay)
    

buttons = document.querySelectorAll('.show-item')
for button in buttons
    button.addEventListener 'click', ->
        id = this.dataset.id
        showOverlay(id)