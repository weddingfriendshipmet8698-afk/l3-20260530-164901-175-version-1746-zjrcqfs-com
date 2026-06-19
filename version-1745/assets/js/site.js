(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function markMissingImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('image-missing');
        var holder = img.closest('.poster-frame, .ranking-cover, .detail-cover, .hero-poster');
        if (holder) {
          holder.classList.add('missing');
        }
      });
    });
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        play();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        play();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', play);
    show(0);
    play();
  }

  function initLocalFilter() {
    var input = document.querySelector('[data-local-filter]');
    var list = document.querySelector('[data-card-list]');
    if (!input || !list) {
      return;
    }
    var cards = Array.from(list.children);
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-region')
        ].join(' ').toLowerCase();
        card.hidden = q && text.indexOf(q) === -1;
      });
    });
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-play-button]');
      var source = box.getAttribute('data-src');
      var loaded = false;

      function attachSource() {
        if (loaded || !video || !source) {
          return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          video._hls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else {
          video.src = source;
        }
      }

      function start() {
        attachSource();
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            box.classList.remove('playing');
          });
        }
        box.classList.add('playing');
      }

      if (button) {
        button.addEventListener('click', start);
      }
      if (video) {
        video.addEventListener('play', function () {
          box.classList.add('playing');
        });
        video.addEventListener('pause', function () {
          if (video.currentTime === 0 || video.ended) {
            box.classList.remove('playing');
          }
        });
      }
    });
  }

  function movieCard(movie) {
    var tags = movie.genre.split(/[，,、\/\s]+/).filter(Boolean).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '' +
      '<article class="movie-card">' +
        '<a class="poster-link" href="' + movie.url + '">' +
          '<span class="poster-frame">' +
            '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
            '<span class="poster-fallback">' + escapeHtml(movie.title) + '</span>' +
            '<span class="poster-shade"></span>' +
            '<span class="play-dot">▶</span>' +
          '</span>' +
        '</a>' +
        '<div class="card-body">' +
          '<a class="card-title" href="' + movie.url + '">' + escapeHtml(movie.title) + '</a>' +
          '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>' +
          '<div class="tag-line">' + tags + '</div>' +
          '<p>' + escapeHtml(movie.one_line) + '</p>' +
        '</div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var form = document.querySelector('[data-search-form]');
    var results = document.querySelector('[data-search-results]');
    var count = document.querySelector('[data-search-count]');
    if (!form || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    form.q.value = params.get('q') || '';
    form.category.value = params.get('category') || '';
    form.sort.value = params.get('sort') || 'score';

    function render() {
      var q = form.q.value.trim().toLowerCase();
      var category = form.category.value;
      var sort = form.sort.value;
      var items = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.genre, movie.year, movie.one_line, movie.category].join(' ').toLowerCase();
        var matchQuery = !q || haystack.indexOf(q) !== -1;
        var matchCategory = !category || movie.category === category;
        return matchQuery && matchCategory;
      });
      items.sort(function (a, b) {
        if (sort === 'year') {
          return Number(b.year_num) - Number(a.year_num) || Number(b.score) - Number(a.score);
        }
        if (sort === 'title') {
          return a.title.localeCompare(b.title, 'zh-Hans-CN');
        }
        return Number(b.score) - Number(a.score) || Number(b.year_num) - Number(a.year_num);
      });
      if (count) {
        count.textContent = '找到 ' + items.length + ' 部相关影片';
      }
      results.innerHTML = items.slice(0, 240).map(movieCard).join('');
      markMissingImages();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var next = new URLSearchParams(new FormData(form));
      history.replaceState(null, '', 'search.html?' + next.toString());
      render();
    });
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();
  }

  ready(function () {
    markMissingImages();
    initMenu();
    initHero();
    initLocalFilter();
    initPlayers();
    initSearchPage();
  });
})();
