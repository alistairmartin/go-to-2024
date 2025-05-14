window.onerror = function(message, source, lineno, colno, error) {
    console.log("JS Error:", message, source, lineno, colno, error);
};  

let byoBundleCounterItems = 0;
let byoBundleCounterPrice = 0;

document.addEventListener("DOMContentLoaded", function(event) {
    $(".product-item--BYO-ATC,.product-item--BYO-ATC-variant").on("click", function() {
        try {
          if (!$(this).hasClass("disabled")) {
            const productId = $(this).data("id");
            const productImage = $(this).data("image");
            const price = Number($(this).data("price")) || 0;
      
            if ($(this).hasClass("active")) {
              $(this).removeClass("active");
              byoBundleCounterPrice -= price;
              byoBundleCounterItems -= 1;
      
              $(".build-your-build--selected-items img[data-id='" + productId + "']").remove();
            } else {
              $(this).addClass("active");
              byoBundleCounterPrice += price;
              byoBundleCounterItems += 1;
      
              $(".build-your-build--selected-items").append(
                '<img src="' + productImage + '" data-id="' + productId + '" class="selected-item-image">'
              );
            }
      
            $(".build-your-bundle--cost").text((byoBundleCounterPrice / 100).toFixed(2));
      
            if (byoBundleCounterItems >= 4) {
              $(".add-bundle-to-cart").removeClass("under").prop("disabled", false);
            } else {
              $(".add-bundle-to-cart").addClass("under").prop("disabled", true);
            }
          }
        } catch (err) {
          console.error("Error in BYO click handler:", err);
        }
      });
    

    $(".add-bundle-to-cart").on("click", function() {

        var items = {

        }

        if($(this).hasClass("under")){
            
        } else {
            $(this).addClass("loading");
            $(this).prop("disabled", true);

            $('.product-item--BYO-ATC.active,.product-item--BYO-ATC-variant.active').each(function(index, obj){
                var newObject = {
                  quantity: 1,
                  id: $(obj).data("id"),
                  properties: {
                    'BYO Bundle': 'Select four or more unique products. Then we’ll knock off 10%.',
                    '_tags': `${$(obj).data("tags")}`
                  }
                }
                items[index] = newObject;
            });


            $.ajax({
                url:	"/cart/add.js",
                type:	'POST',
                data: {items},
                dataType: 'json'
              })
              .done(function(data) {
           
                async function refreshCart() {
                    try {
                        const response = await fetch(`${window.themeVariables.routes.cartUrl}.js`, { cache: 'reload' });
                        if (!response.ok) {
                            throw new Error(`Failed to fetch cart data: ${response.status} ${response.statusText}`);
                        }
                        const cartContent = await response.json();
                        document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart: cartContent } }));
                        document.getElementById('mini-cart').open = true;
                    } catch (error) {
                        console.error('Error refreshing cart:', error);
                    }
                }
                
                refreshCart();

                // document.getElementById('mini-cart').open = true;
                console.log(data);
                byoBundleCounterPrice = 0;
                byoBundleCounterItems = 0;
                $(".build-your-build--selected-items").empty();
                $(".add-bundle-to-cart").removeClass("loading").addClass("under");
                $(".build-your-bundle--cost").text("0.00");
                $('.product-item--BYO-ATC.active, .product-item--BYO-ATC-variant.active').removeClass("active");
              })
        }
  
    });
});


      // console.log('clicked')
        // let $targetElement = "#" + $(this).attr("aria-controls");
        // let $tabList = $(this).closest("tab-list").find("tab-list--tab");

        // console.log($targetElement);
    
        // $tabList.attr("aria-selected",false);
        // $tabList.removeClass("link--primary").addClass("link--secondary");
        // $(this).attr("aria-selected",true)
        // $(this).addClass("link--primary");
        
        // $(this).closest("tab-list").find("tab-panel").attr("aria-hidden",true);
        // $($targetElement).attr("aria-hidden",false);