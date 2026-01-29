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
      const tabListEl = this.closest(".tab-list");
      const targetElement = document.getElementById(this.getAttribute("aria-controls"));
      const tabList = Array.from(tabListEl.querySelectorAll(".tab-list--tab")).filter((tab) => tab.closest(".tab-list") === tabListEl);
      const tabPanels = Array.from(tabListEl.querySelectorAll(".tab-panel")).filter((panel) => panel.closest(".tab-list") === tabListEl);

      console.log(targetElement);

      tabList.forEach(function (tab) {
        tab.setAttribute("aria-selected", false);
        tab.classList.remove("active");
      });

      this.setAttribute("aria-selected", true);
      this.classList.add("active");

      tabPanels.forEach(function (panel) {
        panel.setAttribute("aria-hidden", true);
      });

      targetElement.setAttribute("aria-hidden", false);
    });
  });

  // Product description V2 tab scroll indicator
  function updateTabScrollIndicator(tabListOuter, indicator, bar) {
    const maxScroll = tabListOuter.scrollWidth - tabListOuter.clientWidth;
    const hasScroll = maxScroll > 1;
    tabListOuter.classList.toggle("has-scroll", hasScroll);

    if (!hasScroll) {
      indicator.style.opacity = "0";
      bar.style.transform = "translateX(0px)";
      return;
    }

    indicator.style.opacity = "1";
    const trackWidth = indicator.clientWidth;
    const visibleRatio = tabListOuter.clientWidth / tabListOuter.scrollWidth;
    const minBarWidth = 48;
    const barWidth = Math.max(minBarWidth, Math.round(trackWidth * visibleRatio));
    bar.style.width = `${barWidth}px`;

    const progress = tabListOuter.scrollLeft / maxScroll;
    const maxTranslate = Math.max(0, trackWidth - barWidth);
    bar.style.transform = `translateX(${Math.round(maxTranslate * progress)}px)`;
  }

  document.querySelectorAll(".product-content-description-V2 .tab-list--outer-main").forEach(function (tabListOuter) {
    const tabList = tabListOuter.closest(".tab-list");
    if (!tabList) {
      return;
    }

    const indicator = tabList.querySelector(".tab-list--scroll-indicator");
    const bar = indicator ? indicator.querySelector(".tab-list--scroll-indicator-bar") : null;
    if (!indicator || !bar) {
      return;
    }

    const rafUpdate = function () {
      requestAnimationFrame(function () {
        updateTabScrollIndicator(tabListOuter, indicator, bar);
      });
    };

    tabListOuter.addEventListener("scroll", rafUpdate, { passive: true });
    window.addEventListener("resize", rafUpdate);
    updateTabScrollIndicator(tabListOuter, indicator, bar);
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

  // Hide Tolstoy + liquid_eUQCzK blocks if Tolstoy notFound/empty after 4s
  setTimeout(function () {
    const tolstoyBlock = document.getElementById("shopify-block-AdnlsaHpwSzNydUo4K__tolstoy_shoppable_video_quiz_stories_block_8kd7Bk");
    if (!tolstoyBlock) {
      return;
    }

    const tolstoyStories = tolstoyBlock.querySelector("tolstoy-stories");
    const status = tolstoyStories ? tolstoyStories.getAttribute("data-status") : null;
    const isNotFound = status && status.toLowerCase() === "notfound";
    const isEmpty = tolstoyBlock.childElementCount === 0 && tolstoyBlock.textContent.trim() === "";

    if (!isNotFound && !isEmpty) {
      return;
    }

    tolstoyBlock.classList.add("hide");
    document.querySelectorAll('[data-block-id="liquid_eUQCzK"]').forEach(function (block) {
      block.classList.add("hide");
    });
  }, 2000);

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


function blockTextReadMore(blockId, buttonText) {

  console.log(blockId)
  const button = document.querySelector(`#${blockId} button`);
  const buttonInner = document.querySelector(`#${blockId} .button-text`);
  const content = document.querySelector(`#${blockId} .blocks--button-read-more`);

  if(button.classList.contains('active')) {
    button.classList.remove('active');
    content.classList.add('hide');
    buttonInner.textContent = buttonText;

  } else {
    button.classList.add('active');
    content.classList.remove('hide');
    buttonInner.textContent = "Show Less";
  }
}
