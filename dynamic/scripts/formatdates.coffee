$list = $('.performance-list')

moment.locale('de-ch')

$list.find('time').each ->
    raw = this.innerHTML
    if moment(raw).isValid()
        formatted = moment(raw).format('DD. MMM YYYY')
        this.innerHTML = formatted