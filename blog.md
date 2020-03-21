---
name: Blog
title: Blog
permalink: /blog
layout: default
---
<section tabindex="0" class="page-section" id="{{ page.title | downcase }}">
<h1>Recent posts</h1>
{% include posts.html post_count="16" %}
</section>