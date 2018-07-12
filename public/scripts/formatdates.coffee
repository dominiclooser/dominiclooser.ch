$list = $('.performance-list')

$list.find('time').each ->
    raw = this.innerHTML
    if moment(raw).isValid()
        formatted = moment(raw).format('DD.MM.YY')
        this.innerHTML = formatted