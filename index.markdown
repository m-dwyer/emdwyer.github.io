---
layout: default
title: Home
---

{% assign ordered_pages = site.pages | sort:'order' %}

{% for page in ordered_pages %}
{% if page.order %}
<section class="page-section" id="{{ page.title | downcase }}">
{{ page.content }}
</section>
{% endif %}
{% endfor %}