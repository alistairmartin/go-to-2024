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

    var subscriptionBlocks = document.querySelectorAll('[data-block-type="custom_subscription"]');
    if (subscriptionBlocks.length > 0) {
        subscriptionBlocks.forEach(function(block) {
            var planContainer = block.querySelector('[data-selling-plan-container]');
            var planSelect = block.querySelector('[data-selling-plan-select]');
            var subscribeRadio = block.querySelector('input[name="purchase_option"][value="subscribe"]');
            var oneTimeRadio = block.querySelector('input[name="purchase_option"][value="one_time"]');

            if (!planSelect || !subscribeRadio || !oneTimeRadio) {
                return;
            }

            if (planSelect.options.length === 0) {
                subscribeRadio.disabled = true;
                if (planContainer) {
                    planContainer.hidden = true;
                }
                planSelect.disabled = true;
                return;
            }

            var setSubscriptionState = function(isSubscribe) {
                if (planContainer) {
                    planContainer.hidden = !isSubscribe;
                }
                planSelect.disabled = !isSubscribe;
                if (isSubscribe && planSelect.selectedIndex === -1) {
                    planSelect.selectedIndex = 0;
                }
            };

            setSubscriptionState(subscribeRadio.checked);

            subscribeRadio.addEventListener("change", function(event) {
                setSubscriptionState(event.target.checked);
            });

            oneTimeRadio.addEventListener("change", function() {
                setSubscriptionState(false);
            });
        });
    }

});
