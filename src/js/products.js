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

    document.addEventListener('variant:changed', function(event) {
        var variant = event.detail && event.detail.variant;
        if (!variant) {
            return;
        }

        var handleize = function(value) {
            if (window.Shopify && typeof Shopify.handleize === "function") {
                return Shopify.handleize(value);
            }

            return String(value || "")
                .toLowerCase()
                .replace(/[^\w\u00C0-\u024f]+/g, "-")
                .replace(/^-+|-+$/g, "");
        };

        var optionHandle = handleize(variant.option1);
        if (!optionHandle) {
            return;
        }

        var form = event.target;
        var scope = form && typeof form.closest === "function" ? form.closest(".shopify-section") : null;
        var mediaParents = (scope || document).querySelectorAll(".product-media-desktop.enable-variant-images");

        if (mediaParents.length === 0) {
            return;
        }

        mediaParents.forEach(function(parent) {
            Array.from(parent.classList).forEach(function(className) {
                if (className.indexOf("current-option-") === 0) {
                    parent.classList.remove(className);
                }
            });

            parent.classList.add("current-option-" + optionHandle);
        });
    });

    document.addEventListener('variant:changed', function(event) {
        var variant = event.detail && event.detail.variant;
        if (!variant || typeof variant.price !== "number") {
            return;
        }

        var form = event.target;
        var scope = form && typeof form.closest === "function" ? form.closest(".shopify-section") : null;
        var loyaltyBlocks = (scope || document).querySelectorAll("[data-loyalty-points]");

        if (loyaltyBlocks.length === 0) {
            return;
        }

        loyaltyBlocks.forEach(function(block) {
            var multiplier = parseInt(block.getAttribute("data-points-multiplier"), 10);
            if (!multiplier || multiplier < 1) {
                multiplier = 1;
            }

            var pointsValue = Math.floor((variant.price * multiplier) / 100);
            var pointsValueEl = block.querySelector("[data-loyalty-points-value]");

            if (pointsValueEl) {
                pointsValueEl.textContent = pointsValue;
            }
        });
    });
});
