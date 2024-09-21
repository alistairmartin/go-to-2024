document.addEventListener("DOMContentLoaded", function(event) {


    // Routine Switcher
    document.querySelector('.product-content-routine').addEventListener("click", function() {
        var contentRoutine = document.querySelector('.product-content-routine');

        if (contentRoutine.classList.contains('active--morning')) {
            contentRoutine.classList.add('active--evening');
            contentRoutine.classList.remove('active--morning');
        } else {
            contentRoutine.classList.add('active--morning');
            contentRoutine.classList.remove('active--evening');
        }
    });


    // Teaser 
    document.querySelector('.product-content-description--teaser-open').addEventListener("click", function() {
        this.classList.add("hidden");
        document.querySelector('.product-content-description--teaser-close').classList.remove("hidden");
        document.querySelector('.product-content-description--teaser').setAttribute('aria-revealed', 'true');
    });

    document.querySelector('.product-content-description--teaser-close').addEventListener("click", function() {
        this.classList.add("hidden");
        document.querySelector('.product-content-description--teaser-open').classList.remove("hidden");
        document.querySelector('.product-content-description--teaser').setAttribute('aria-revealed', 'false');
    });


    // Ingredients
    document.querySelectorAll('.product-content-ingredients--text-item__mobile').forEach(function(item) {
        item.addEventListener("click", function() {
            
            document.querySelectorAll('.product-content-ingredients--text-item__mobile').forEach(function(el) {
                el.classList.remove('active');
            });
    
            this.classList.add("active");
        });
    });


});



