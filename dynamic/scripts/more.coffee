$buttons = $('.more')

$('.more').parent().siblings('ul').children(':nth-child(n+4)').hide()

$buttons.click ->
    $(this).parent().siblings('ul').children().show()
    $(this).remove()