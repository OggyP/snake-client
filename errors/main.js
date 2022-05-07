$(function(){
    let infoOpen = false;

    $('#more-info-btn').click(function() {
        if (infoOpen) $('aside').fadeOut('fast');
        else $('aside').fadeIn('fast');
        infoOpen = !infoOpen;
    });
    $('#close-info-btn').click(function() {
        if (infoOpen) {
            $('aside').fadeOut('fast');
            infoOpen = false;
        }
    });

});