draw = ->
    options = 
        gutter: 33
        columnWidth: '.masonry-item'
        percentPosition: true
    new Masonry('.masonry', options)

$('.masonry').imagesLoaded ->
    setTimeout(draw, 800)

lightbox.option
    showImageNumberLabel: false