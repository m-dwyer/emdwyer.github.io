---
layout: default
title: Home
permalink: /
---

{% assign ordered_pages = site.pages | sort:'order' %}

{% for page in ordered_pages %}
{% if page.order %}
<section tabindex="0" class="page-section" id="{{ page.title | downcase }}">
{{ page.content }}
</section>
{% endif %}
{% endfor %}