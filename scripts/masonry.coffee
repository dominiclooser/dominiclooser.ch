draw = ->
    options = 
        itemSelector: '.grid-item'
        columnWidth: 300
        gutter: 10
    new Masonry('.grid', options)

$('.grid').imagesLoaded(draw)