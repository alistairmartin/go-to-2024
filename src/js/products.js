
document.addEventListener("DOMContentLoaded", function(event) {

    $('.product-content-routine').on( "click", function() {
        var contentRoutine = $('.product-content-routine');

        if (contentRoutine.hasClass('active--morning')) {
            contentRoutine.addClass('active--evening');
            contentRoutine.removeClass('active--morning');
        } else {
            contentRoutine.addClass('active--morning');
            contentRoutine.removeClass('active--evening');
        }
    });
});

