document.addEventListener("DOMContentLoaded", function(event) {

    // Routine Switcher
    var contentRoutine = document.querySelector('.product-content-routine');
    if (contentRoutine) {
        contentRoutine.addEventListener("click", function() {
            if (contentRoutine.classList.contains('active--morning')) {
                contentRoutine.classList.add('active--evening');
                contentRoutine.classList.remove('active--morning');
            } else {
                contentRoutine.classList.add('active--morning');
                contentRoutine.classList.remove('active--evening');
            }
        });
    }

    // Teaser 
    var teaserOpen = document.querySelector('.product-content-description--teaser-open');
    var teaserClose = document.querySelector('.product-content-description--teaser-close');
    var teaser = document.querySelector('.product-content-description--teaser');
    
    if (teaserOpen && teaserClose && teaser) {
        teaserOpen.addEventListener("click", function() {
            this.classList.add("hidden");
            teaserClose.classList.remove("hidden");
            teaser.setAttribute('aria-revealed', 'true');
        });

        teaserClose.addEventListener("click", function() {
            this.classList.add("hidden");
            teaserOpen.classList.remove("hidden");
            teaser.setAttribute('aria-revealed', 'false');
        });
    }

    // Ingredients
    var ingredientItems = document.querySelectorAll('.product-content-ingredients--text-item__mobile');
    if (ingredientItems.length > 0) {
        ingredientItems.forEach(function(item) {
            item.addEventListener("click", function() {
                ingredientItems.forEach(function(el) {
                    el.classList.remove('active');
                });

                this.classList.add("active");
            });
        });
    }

});
