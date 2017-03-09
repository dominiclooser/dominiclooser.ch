middleGrey = '#e8e6e6'

draw = -> 

    container = document.getElementById('page-construction')
    while container.firstChild
        container.removeChild(container.firstChild)

    RATIO = 1.5
    WIDTH = 100
    console.log('Page Width: ' + WIDTH)
    height = RATIO * WIDTH
    console.log('Page height: ' + height)
    drawing = SVG('page-construction')
    drawing.viewbox(0, 0, WIDTH, height)
    page = drawing.rect('100%', '100%')
    page.attr {fill: 'black'}

    page2margins = document.getElementById('page2margins').value
    horizontalMargins = WIDTH / page2margins
    console.log('Horizontal Margins: ' + horizontalMargins)
    textWidth = WIDTH - horizontalMargins
    console.log('Text Width: ' + textWidth)
    verticalMargins = height / page2margins
    textHeight = height - verticalMargins
    console.log('Text Height: ' + textHeight)

    inner2outer = document.getElementById('inner2outer').value
    inner2outer = parseFloat(inner2outer)
    console.log('Inner / Outer: ' + inner2outer)
    outerMargin = horizontalMargins / (1 + inner2outer)
    console.log('Outer Margin: ' + outerMargin)

    bottom2top = document.getElementById('bottom2top').value
    bottom2top = parseFloat(bottom2top)
    topMargin = verticalMargins / (1 + bottom2top)

    text = drawing.rect(textWidth, textHeight)
    text.attr {x: outerMargin, y: topMargin}
    text.fill {color: middleGrey}

button = document.getElementById('generate-button')
button.addEventListener('click', draw)

# drawing = SVG('svg-wrapper').size('1000', '1000')
# rectangle = drawing.rect(200, 300)
# rectangle = drawing.rect(200, 1.3333333 * 200)
# # .attr({ fill: 'black' })