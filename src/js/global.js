
document.addEventListener("DOMContentLoaded", function(event) {
    $("button[data-action='toggle-tab']").on("click", function() {
        console.log('clicked')
        let $targetElement = "#" + $(this).attr("aria-controls");
        let $tabList = $(this).closest("tab-list").find("tab-list--tab");

        console.log($targetElement);
    
        $tabList.attr("aria-selected",false);
        $tabList.removeClass("link--primary").addClass("link--secondary");
        $(this).attr("aria-selected",true)
        $(this).addClass("link--primary");
        
        $(this).closest("tab-list").find("tab-panel").attr("aria-hidden",true);
        $($targetElement).attr("aria-hidden",false);
    });
});


document.querySelectorAll('.brand-switcher--brand path').forEach(path => {
    const bbox = path.getBBox();
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
  
    // Set CSS variables on each path
    path.style.setProperty('--origin-x', `${x}px`);
    path.style.setProperty('--origin-y', `${y}px`);
});
