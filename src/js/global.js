document.addEventListener("DOMContentLoaded", function(event) {

    document.querySelectorAll('.brand-switcher--brand path').forEach(path => {
        const bbox = path.getBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        path.style.setProperty('--origin-x', `${x}px`);
        path.style.setProperty('--origin-y', `${y}px`);
    });
    
    document.querySelectorAll("button[data-action='toggle-tab']").forEach(function(button) {
        button.addEventListener("click", function() {
            console.log('clicked');
            let targetElement = document.getElementById(this.getAttribute("aria-controls"));
            let tabList = this.closest(".tab-list").querySelectorAll(".tab-list--tab");

            console.log(targetElement);

            tabList.forEach(function(tab) {
                tab.setAttribute("aria-selected", false);
                tab.classList.remove("active");
            });

            this.setAttribute("aria-selected", true);
            this.classList.add("active");

            this.closest(".tab-list").querySelectorAll(".tab-panel").forEach(function(panel) {
                panel.setAttribute("aria-hidden", true);
            });

            targetElement.setAttribute("aria-hidden", false);
        });
    });

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

});
