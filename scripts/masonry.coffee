draw = ->
    options = 
        itemSelector: '.grid-item'
        columnWidth: 300
        gutter: 30
        fitWidth: true
    new Masonry('.grid', options)

$('.grid').imagesLoaded(draw)