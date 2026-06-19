(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navMenu = document.querySelector('[data-nav-menu]');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var next = Number(dot.getAttribute('data-hero-dot')) || 0;
        show(next);
      });
    });

    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupCards() {
    var roots = Array.prototype.slice.call(document.querySelectorAll('[data-card-root]'));
    if (!roots.length) {
      return;
    }

    var searchInput = document.querySelector('[data-card-search]');
    var yearSelect = document.querySelector('[data-filter-year]');
    var regionSelect = document.querySelector('[data-filter-region]');
    var emptyBlocks = Array.prototype.slice.call(document.querySelectorAll('[data-empty]'));

    function getText(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-category')
      ].join(' ').toLowerCase();
    }

    function apply() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var anyVisible = false;

      roots.forEach(function (root) {
        var localVisible = false;
        var cards = Array.prototype.slice.call(root.querySelectorAll('[data-card]'));

        cards.forEach(function (card) {
          var textMatch = !keyword || getText(card).indexOf(keyword) !== -1;
          var yearMatch = !year || card.getAttribute('data-year') === year;
          var regionMatch = !region || card.getAttribute('data-region') === region;
          var visible = textMatch && yearMatch && regionMatch;
          card.hidden = !visible;
          localVisible = localVisible || visible;
          anyVisible = anyVisible || visible;
        });
      });

      emptyBlocks.forEach(function (block) {
        block.classList.toggle('is-visible', !anyVisible);
      });
    }

    [searchInput, yearSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  }

  function setupPlayer() {
    var box = document.querySelector('[data-player-box]');
    var video = document.querySelector('[data-player-video]');
    var start = document.querySelector('[data-player-start]');

    if (!box || !video || !start) {
      return;
    }

    var stream = video.getAttribute('data-stream');
    var attached = false;

    function attachStream() {
      if (attached || !stream) {
        return;
      }

      attached = true;

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        video.src = stream;
      }
    }

    function startPlay() {
      attachStream();
      box.classList.add('is-playing');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    start.addEventListener('click', startPlay);
    video.addEventListener('click', function () {
      if (video.paused) {
        startPlay();
      }
    });
  }

  setupHero();
  setupCards();
  setupPlayer();
})();
