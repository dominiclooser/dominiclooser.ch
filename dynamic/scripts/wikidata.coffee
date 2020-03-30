showOverlay = (id) ->
    

buttons = document.querySelectorAll('.show-item')
for button in buttons
    button.addEventListener 'click', ->
        id = this.dataset.id
        showOverlay(id)