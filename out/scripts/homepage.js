(function() {
  var $list, $listItems, latestDate, now;

  $list = $('.performance-list');

  latestDate = $list.find('li:first-child').find('time').html();

  now = moment();

  if (moment(latestDate).isBefore(now)) {
    $list.parents('.card').remove();
  } else {
    $list.find('li').each(function() {
      var $entry, date;
      $entry = $(this);
      date = $entry.find('time').html();
      if (moment(date).isBefore(moment())) {
        $entry.nextAll().each(function() {
          return $(this).remove();
        });
        return $entry.remove();
      }
    });
    $listItems = $list.children('li');
    $list.append($listItems.get().reverse());
  }

}).call(this);
