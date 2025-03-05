
=====
SETUP DEVELOPER ENVIRONMENT 
=====

1. npm install
2. To start watching for changes "npm run watch"
3. To build code "npm run build"


=====
HELPER CODE 
=====


```
{
    "type": "checkbox",
    "id": "hide_mobile",
    "label": "Hide On Mobile?"
},
{
    "type": "checkbox",
    "id": "hide_desktop",
    "label": "Hide On Desktop?"
}

```

{% if section.settings.hide_desktop %}hide-desktop{% endif %} {% if section.settings.hide_mobile %}hide-mobile{% endif %}



====
BRAND SELECTOR
====
{%- capture brand -%}{%- render 'brand' -%}{%- endcapture -%}
{%- if brand == "go-to" -%}
    {% render 'css-variables', direction: direction %}
{%- elsif brand == "bro-to" -%}
    {% render 'css-variables--bro-to', direction: direction %}
{%- elsif brand == "gro-to" -%}
    {% render 'css-variables--gro-to', direction: direction %}
{%- endif -%}





```
shopify theme dev -e au
```