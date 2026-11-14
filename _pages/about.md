---
permalink: /
layout: home
title: "Lucas Robinet"
redirect_from:
  - /about/
  - /about.html
---

<section class="section reveal" id="about" markdown="1">
<p class="label">// about</p>

<div class="about" markdown="1">
<img class="about__avatar" src="{{ '/images/avatar.png' | relative_url }}" alt="Lucas Robinet" width="120" height="120" loading="lazy">

<div markdown="1">
I'm a PhD student at [IRT Saint Exupéry](https://www.irt-saintexupery.com/) and [Oncopole Claudius Regaud](https://www.iuct-oncopole.fr/), working at the intersection of **multimodal deep learning** and **oncology**. My work focuses on self-supervised learning, multimodal modeling, and flexible architectures capable of reasoning across radiology, histopathology, and omics modalities.

Before starting my PhD, I worked on deep learning for satellite imagery and built large-scale training pipelines at Airbus Defence & Space. I also hold an MSc in Machine Learning from [ISAE Supaero](https://www.isae-supaero.fr/en/) and an MSc in Applied Mathematics & Operations Research from [Université de Toulouse](https://www.univ-tlse3.fr/).

I support open science.
</div>
</div>
</section>

<section class="section reveal" markdown="1">
<p class="label">// research</p>

Interested in multimodal self-supervised learning and in developing novel computational paradigms for oncology. The overarching goal is to design models that integrate heterogeneous biomedical data in order to uncover underlying biological mechanisms and advance our understanding of cancer.

<ul class="chips">
  <li>representation learning</li>
  <li>foundation models in medicine</li>
  <li>generative modeling</li>
  <li>physics-informed neural networks</li>
  <li>deformable image registration</li>
</ul>
</section>

<section class="section reveal">
  <p class="label">// selected papers <a class="label__more" href="{{ '/publications/' | relative_url }}">all →</a></p>
  {% assign pubs = site.publications | sort: "date" | reverse %}
  <div class="papers">
    {% for paper in pubs limit: 3 %}
      {% include paper-card.html paper=paper %}
    {% endfor %}
  </div>
</section>

<section class="section reveal" markdown="1">
<p class="label">// open source</p>

<div class="oss">
  <a class="oss__card" href="https://github.com/Project-MONAI/MONAI">
    <span class="oss__repo mono">Project-MONAI/<b>MONAI</b></span>
    <span class="oss__desc">Medical Open Network for AI. Contributions on masked modeling, attention layers, transformer blocks and self-supervised learning.</span>
    <span class="oss__meta mono"><i class="dot dot--rad"></i>python · pytorch</span>
  </a>
</div>
</section>

<section class="section reveal" markdown="1">
<p class="label">// off the clock</p>

<dl class="kv">
  <dt>reading</dt><dd>science, philosophy, and literature, basically anything that hijacks my curiosity</dd>
  <dt>sports</dt><dd>football lover (Olympique de Marseille), ski enthusiast</dd>
  <dt>chess</dt><dd>recently learned the rules, <code>1. d4</code> enjoyer (no London system)</dd>
</dl>
</section>

<section class="section section--cta reveal">
  <p class="cta">Feel free to reach out. I'm always up for a coffee break <span class="coffee" aria-hidden="true">☕</span></p>
  <a class="btn mono" href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
</section>
