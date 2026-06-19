(function () {
  var doc = document;

  function all(selector, root) {
    return Array.prototype.slice.call((root || doc).querySelectorAll(selector));
  }

  var menuButton = doc.querySelector('[data-menu-toggle]');
  var mobileMenu = doc.querySelector('[data-mobile-menu]');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var hero = doc.querySelector('[data-hero]');
  if (hero) {
    var slides = all('[data-hero-slide]', hero);
    var dots = all('[data-hero-dot]', hero);
    var active = 0;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        show(active + 1);
      }, 6200);
    }
  }

  var list = doc.querySelector('[data-filter-list]');
  var input = doc.querySelector('[data-filter-input]');
  var region = doc.querySelector('[data-filter-region]');
  var year = doc.querySelector('[data-filter-year]');
  if (list && (input || region || year)) {
    var cards = all('[data-filter-card]', list);
    var params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) {
      input.value = params.get('q');
    }

    function applyFilter() {
      var term = input ? input.value.trim().toLowerCase() : '';
      var regionValue = region ? region.value : '';
      var yearValue = year ? year.value : '';
      cards.forEach(function (card) {
        var text = card.getAttribute('data-text') || '';
        var okText = !term || text.indexOf(term) !== -1;
        var okRegion = !regionValue || card.getAttribute('data-region') === regionValue;
        var okYear = !yearValue || card.getAttribute('data-year') === yearValue;
        card.classList.toggle('is-filter-hidden', !(okText && okRegion && okYear));
      });
    }

    [input, region, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
    applyFilter();
  }

  var video = doc.querySelector('[data-player]');
  var trigger = doc.querySelector('[data-play-trigger]');
  if (video && trigger) {
    var started = false;

    function startVideo(autoplay) {
      var src = video.getAttribute('data-video-url');
      if (!src) {
        return;
      }
      if (!started) {
        started = true;
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            if (autoplay) {
              video.play().catch(function () {});
            }
          });
        } else {
          video.src = src;
          if (autoplay) {
            video.play().catch(function () {});
          }
        }
      } else if (autoplay) {
        video.play().catch(function () {});
      }
      trigger.classList.add('is-hidden');
    }

    trigger.addEventListener('click', function () {
      startVideo(true);
    });

    video.addEventListener('click', function () {
      startVideo(false);
    }, { once: true });
  }
})();
