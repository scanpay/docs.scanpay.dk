<!DOCTYPE HTML><html lang="en">
<link href="/a/docs.css?{{ csst }}" rel="stylesheet">
<script defer src="/a/docs.js?{{ jst }}"></script>
<title>{{ title }}</title>
<meta name="description" content="{{ meta }}">
<link rel="canonical" href="https://docs.scanpay.dk{{ url }}">

<nav class="sidebar--">
  <div class="sidebar--head">
    <div class="sidebar--c">
      <a href="https://scanpay.dk" class="sidebar--home" title="Back to Scanpay frontpage">
        {% include "src/assets/img/home.svg" %} scanpay
      </a>
    </div>
    <form id="search" action="/search">
      <input class="sidebar--search" type="text" name="q" placeholder="Search the docs">
    </form>
  </div>
  <ul class="sidebar--ul">{{ sidebar }}</ul>
</nav>

<div class="c">
  <div id="bg">
    <main>
      <header class="header">
        <a rel="nofollow" href="https://github.com/scanpaydk/docs.scanpay.dk/blob/main/src/{{ path }}" class="git">
          {% include "src/assets/img/github.svg" %} Edit on GitHub
        </a>
        <nav class="breadcrumb">
          <a href="/">Docs</a> {{ breadcrumb }}
        </nav>
      </header>
      <article>
