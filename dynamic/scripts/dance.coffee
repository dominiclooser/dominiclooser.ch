stage = document.querySelector('svg')
dancer1 = document.querySelector('#dancer1')

class Dancer


class Postion
    constructor: (@x) ->
    right: -> new Position(@x+30)

# getNextPositions(dancer)
#     answer = [dancer.position.right()]


move = -> 
    nextPositions = getNextPositions(dancer1)
    nextPosition = nextPositions[0]
    dancer.move(nextPosition)    
    

window.setInterval move, 1000


# dancer1.setAttribute('cx', dancer1.cx.baseVal.value + 30)
