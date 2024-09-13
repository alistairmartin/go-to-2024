document.addEventListener("DOMContentLoaded", function (event) {

    document.querySelectorAll('.brand-switcher--brand path').forEach(path => {
        const bbox = path.getBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        path.style.setProperty('--origin-x', `${x}px`);
        path.style.setProperty('--origin-y', `${y}px`);
    });

    document.querySelectorAll("button[data-action='toggle-tab']").forEach(function (button) {
        button.addEventListener("click", function () {
            console.log('clicked');
            let targetElement = document.getElementById(this.getAttribute("aria-controls"));
            let tabList = this.closest(".tab-list").querySelectorAll(".tab-list--tab");

            console.log(targetElement);

            tabList.forEach(function (tab) {
                tab.setAttribute("aria-selected", false);
                tab.classList.remove("active");
            });

            this.setAttribute("aria-selected", true);
            this.classList.add("active");

            this.closest(".tab-list").querySelectorAll(".tab-panel").forEach(function (panel) {
                panel.setAttribute("aria-hidden", true);
            });

            targetElement.setAttribute("aria-hidden", false);
        });
    });


    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    function handleScrollHeader() {
        if (window.pageYOffset === 0) {
            document.querySelector('body').classList.add('header-position--top');
        } else {
            document.querySelector('body').classList.remove('header-position--top');
        }
    }
    
    var debouncedScrollHandler = debounce(handleScrollHeader, 100);
    
    document.addEventListener('scroll', debouncedScrollHandler);
});

function openAccessabilityWidget() {
    UserWay.widgetOpen();
    document.querySelector('.uwy').classList.add('show');
}



  function moveCarousel(direction, sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    const radios = section.querySelectorAll(`input[name="featured-product-carousel-${sectionId}"]`);
    let currentIndex;
    
    radios.forEach((radio, index) => {
      if (radio.checked) {
        currentIndex = index;
      }
    });

    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
      newIndex = radios.length - 1;
    } else if (newIndex >= radios.length) {
      newIndex = 0;
    }
    radios[newIndex].checked = true;
  }

