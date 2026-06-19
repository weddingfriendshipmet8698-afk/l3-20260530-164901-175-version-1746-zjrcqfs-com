
(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilter(area) {
    var input = area.querySelector('.card-filter');
    var year = area.querySelector('.year-filter');
    var grid = document.querySelector('.searchable-grid');
    if (!grid || !input) {
      return;
    }
    var keyword = normalize(input.value);
    var selectedYear = year ? year.value : '';
    var items = Array.prototype.slice.call(grid.querySelectorAll('.movie-card, .ranking-card'));

    items.forEach(function (item) {
      var haystack = normalize([
        item.getAttribute('data-title'),
        item.getAttribute('data-tags'),
        item.getAttribute('data-year'),
        item.getAttribute('data-region'),
        item.getAttribute('data-genre'),
        item.textContent
      ].join(' '));
      var itemYear = item.getAttribute('data-year') || '';
      var matchText = !keyword || haystack.indexOf(keyword) !== -1;
      var matchYear = !selectedYear || itemYear.indexOf(selectedYear) !== -1;
      item.classList.toggle('is-hidden', !(matchText && matchYear));
    });
  }

  var filterArea = document.querySelector('[data-filter-area]');
  if (filterArea) {
    var input = filterArea.querySelector('.card-filter');
    var year = filterArea.querySelector('.year-filter');
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && input) {
      input.value = q;
    }
    if (input) {
      input.addEventListener('input', function () {
        applyFilter(filterArea);
      });
    }
    if (year) {
      year.addEventListener('change', function () {
        applyFilter(filterArea);
      });
    }
    applyFilter(filterArea);
  }
})();
