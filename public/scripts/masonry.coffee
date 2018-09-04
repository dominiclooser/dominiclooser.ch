draw = ->
    options = 
        gutter: 33
        columnWidth: '.masonry-item'
        percentPosition: true
    new Masonry('.masonry', options)

$('.masonry').imagesLoaded(draw)

lightbox.option
    showImageNumberLabel: false