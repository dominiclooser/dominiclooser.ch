$list = $('.performance-list')
latestDate =  $list.find('li:first-child').children('time').html()
now = moment()

if moment(latestDate).isBefore(now)
    $list.parents('section').remove()
else
    $list.find('li').each ->
        $entry = $(this)
        date = $entry.find('time').html()
        if moment(date).isBefore(moment())
            $entry.nextAll().each ->
                $(this).remove()
            $entry.remove()
    
    $listItems = $list.children('li')
    $list.append($listItems.get().reverse())