npm run build

npm run deploy

npm run watch



==== CLI Development for Blocks

1. Update the shopify.theme.toml file with latest theme ID.

2. shopify theme dev --store go-to-skincare --environment development

3. Run another tab with `npm run watch` to start compiling for SCSS / JS changes. 

==== Flickity Carousel Example: 


```
<flickity-carousel
    id="split-slide-{{ block.id }}"
    class="slide1 split-slide-carousel"
    flickity-config='{"cellSelector":".carousel-cell","cellAlign":"left","contain":true,"wrapAround":true,"autoPlay":3000,"pauseAutoPlayOnHover":true,"imagesLoaded":true,"prevNextButtons":false,"pageDots":true,"draggable":">1","selectedAttraction":0.02,"friction":0.28}'>
    <div class="carousel-cell">
    {{ block.settings.split_slide_img1 | image_url: width: block.settings.image.width | image_tag: loading: "eagerly", sizes: sizes_attribute, widths: '600,700,800,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000', class: class_attribute }}
    </div>
    <div class="carousel-cell">
    {{ block.settings.split_slide_img2 | image_url: width: block.settings.image.width | image_tag: loading: "lazy", sizes: sizes_attribute, widths: '600,700,800,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000', class: class_attribute }}
    </div>
    <div class="carousel-cell">
    {{ block.settings.split_slide_img3 | image_url: width: block.settings.image.width | image_tag: loading: "lazy", sizes: sizes_attribute, widths: '600,700,800,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000', class: class_attribute }}
    </div>
</flickity-carousel>
```