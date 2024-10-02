document.addEventListener("DOMContentLoaded", function (event) {



  function debounce(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function handleScrollHeader() {
    requestAnimationFrame(() => {
      if (window.scrollY < 100) {
        document.querySelector('body').classList.add('header-position--top');
      } else {
        document.querySelector('body').classList.remove('header-position--top');
      }
    });
  }

  const debouncedScrollHandler = debounce(handleScrollHeader, 50);

  // Remove passive: true and add touchmove event listener for iOS
  document.addEventListener('scroll', debouncedScrollHandler);
  document.addEventListener('touchmove', debouncedScrollHandler);


  // Brand Switcher Animations

  document.querySelectorAll('.brand-switcher--brand path').forEach(path => {
    const bbox = path.getBBox();
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    path.style.setProperty('--origin-x', `${x}px`);
    path.style.setProperty('--origin-y', `${y}px`);
  });

  // Press Section
  if (window.innerWidth > 768) {
    const logoItems = document.querySelectorAll('.press-list__logo-item');
    const handleHover = function () {
      this.click();
    };

    logoItems.forEach(function (logoItem) {
      logoItem.addEventListener('mouseover', debounce(handleHover, 400, false));
    });
  }

  // Tabs 
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

  document.querySelectorAll(".change-custom-variant").forEach(function (button) {
    button.addEventListener('click', function (event) {
      // Get the data-index of the clicked element


      var target = event.target.closest('.change-custom-variant');

      if (target) {
        // Get the data-index of the clicked element
        var index = target.getAttribute('data-index');

        console.log(index);

        // Select all elements with the class 'product-sticky-form--custom-variants'
        var variants = document.querySelectorAll('.product-sticky-form--custom-variants');

        variants.forEach(function (variant) {
          if (variant.getAttribute('data-index') === index) {
            variant.classList.remove('hide');
            variant.setAttribute('open', '');
          } else {
            variant.classList.add('hide');
          }

          variant.setAttribute('aria-selected', 'false');
        });

    
      }
    });
  });

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

  // Handle wrapping
  if (newIndex < 0) {
    newIndex = radios.length - 1;
  } else if (newIndex >= radios.length) {
    newIndex = 0;
  }

  // Update the radio button to the newIndex
  radios[newIndex].checked = true;

  // Update the data-index of the text-container
  section.setAttribute('data-current', newIndex);
}


function miniCartRecommendationsLeft() {
  console.log('here')
  const scroller = document.querySelector('.mini-cart__recommendations-inner .scroller');
  if (scroller) {
    scroller.scrollBy({
      top: 0,
      left: -300,
      behavior: 'smooth'
    });
  }
}

function miniCartRecommendationsRight() {
  console.log('here')
  const scroller = document.querySelector('.mini-cart__recommendations-inner .scroller');
  if (scroller) {
    scroller.scrollBy({
      top: 0,
      left: 300,
      behavior: 'smooth'
    });
  }
}


