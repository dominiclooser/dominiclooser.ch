(function() {
  var $list;

  $list = $('.performance-list');

  moment.locale('de-ch');

  $list.find('time').each(function() {
    var formatted, raw;
    raw = this.innerHTML;
    if (moment(raw).isValid()) {
      formatted = moment(raw).format('DD. MMM YYYY');
      return this.innerHTML = formatted;
    }
  });

}).call(this);
