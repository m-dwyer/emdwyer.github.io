---
name: Posts
title: Posts
order: 4
---

<h1>Recent posts</h1>
<div class="grid-container">
{% assign latest_posts = site.posts | order:'date' %}
{% for post in latest_posts limit:6 %}
<a href="{{ post.url }}" title="{{ post.date }}" class="grid-item" >
    <article >
    <header>{{ post.title }}</header>
    <hr>
    {{ post.excerpt}}
    </article>
</a>

{% endfor %}
</div>
