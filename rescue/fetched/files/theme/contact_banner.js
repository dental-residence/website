var _window = $(window),
    header = $('.contact-banner'),
    max = 30,
    padding = parseFloat(header.css('padding-bottom')),
    currentPadding = padding,
    scrollPos = _window.scrollTop();

_window.scroll(function() {  

    if (scrollPos < _window.scrollTop() && currentPadding < max) {
        header.css('padding-bottom', ++currentPadding + 'px');
    } else if (scrollPos > _window.scrollTop() && currentPadding > padding) {
        header.css('padding-bottom', --currentPadding + 'px');
    }

    if (_window.scrollTop() == 0)
        header.css('padding', padding + 'px 0');

    scrollPos = _window.scrollTop();
});