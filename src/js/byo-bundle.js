

let byoBundleCounterItems = 0;
let byoBundleCounterPrice = 0;

document.addEventListener("DOMContentLoaded", function(event) {
    $(".product-item--BYO-ATC,.product-item--BYO-ATC-variant").on("click", function() {

        if (!$(this).hasClass("disabled")) {

            const productId = $(this).data("id");
            const productImage = $(this).data("image");
    
            if ($(this).hasClass("active")) {

                $(this).removeClass("active");
                byoBundleCounterPrice -= $(this).data("price");
                byoBundleCounterItems -= 1;
    
                $(".build-your-build--selected-items img[data-id='" + productId + "']").remove();
            } else {
                $(this).addClass("active");
                byoBundleCounterPrice += $(this).data("price");
                byoBundleCounterItems += 1;
    
                $(".build-your-build--selected-items").append(
                    '<img src="' + productImage + '" data-id="' + productId + '" class="selected-item-image">'
                );
            }
    
            $(".build-your-bundle--cost").text((byoBundleCounterPrice / 100));
    
            if (byoBundleCounterItems >= 4) {
                $(".add-bundle-to-cart").removeClass("under").prop("disabled", false);
            } else {
                $(".add-bundle-to-cart").addClass("under").prop("disabled", true);
            }
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
                    'BYO Bundle': 'Select four or more unique products. Then we’ll knock off 10%.'
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
                document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
                    bubbles: true
                }));
                document.getElementById('mini-cart').open = true;
                console.log(data);
                byoBundleCounterPrice = 0;
                byoBundleCounterItems = 0;
                $(".build-your-build--selected-items").empty();
                $(".add-bundle-to-cart").removeClass("loading").prop("disabled", false);
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