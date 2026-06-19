(function () {
  var ready = function (fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  function initMenu() {
    var button = document.querySelector(".js-menu-toggle");
    var panel = document.querySelector(".js-mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initSearchForms() {
    document.querySelectorAll(".js-site-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        var action = form.getAttribute("action") || "./search.html";
        window.location.href = value ? action + "?q=" + encodeURIComponent(value) : action;
      });
    });
  }

  function initHero() {
    document.querySelectorAll(".js-hero-slider").forEach(function (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
      var prev = slider.querySelector("[data-hero-prev]");
      var next = slider.querySelector("[data-hero-next]");
      if (!slides.length) {
        return;
      }
      var index = 0;
      var timer = null;
      var show = function (nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === index);
        });
      };
      var restart = function () {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      };
      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          restart();
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          restart();
        });
      }
      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(Number(dot.getAttribute("data-hero-index") || 0));
          restart();
        });
      });
      restart();
    });
  }

  function initFilters() {
    var grid = document.querySelector(".js-filter-grid");
    if (!grid) {
      return;
    }
    var keyword = document.querySelector(".js-filter-keyword");
    var type = document.querySelector(".js-filter-type");
    var year = document.querySelector(".js-filter-year");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
    var apply = function () {
      var q = keyword ? keyword.value.trim().toLowerCase() : "";
      var t = type ? type.value : "";
      var y = year ? year.value : "";
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year")
        ].join(" ").toLowerCase();
        var ok = true;
        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }
        if (t && card.getAttribute("data-type") !== t) {
          ok = false;
        }
        if (y && card.getAttribute("data-year") !== y) {
          ok = false;
        }
        card.classList.toggle("is-hidden-card", !ok);
      });
    };
    [keyword, type, year].forEach(function (el) {
      if (el) {
        el.addEventListener("input", apply);
        el.addEventListener("change", apply);
      }
    });
  }

  function movieCardHtml(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="card-link" href="' + movie.url + '">',
      '    <span class="poster-frame">',
      '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '      <span class="poster-shade"></span>',
      '      <span class="play-badge">▶</span>',
      '      <span class="type-badge">' + escapeHtml(movie.type) + '</span>',
      '      <span class="year-badge">' + escapeHtml(movie.year) + '</span>',
      '    </span>',
      '    <span class="card-body">',
      '      <strong>' + escapeHtml(movie.title) + '</strong>',
      '      <span class="card-desc">' + escapeHtml(movie.oneLine) + '</span>',
      '      <span class="card-meta">' + escapeHtml(movie.year + ' · ' + movie.region + ' · ' + movie.type) + '</span>',
      '    </span>',
      '  </a>',
      '</article>'
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initSearchPage() {
    var results = document.querySelector(".js-search-results");
    if (!results || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    var form = document.querySelector(".js-search-page-form");
    var input = form ? form.querySelector("input[name='q']") : null;
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    if (input) {
      input.value = query;
    }
    var render = function (value) {
      var q = value.trim().toLowerCase();
      var list = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine]
          .join(" ")
          .toLowerCase();
        return !q || text.indexOf(q) !== -1;
      }).slice(0, 96);
      results.innerHTML = list.map(movieCardHtml).join("");
    };
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input ? input.value.trim() : "";
        var url = value ? "./search.html?q=" + encodeURIComponent(value) : "./search.html";
        window.history.replaceState(null, "", url);
        render(value);
      });
    }
    render(query);
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".js-hls-player"));
    if (!players.length) {
      return;
    }
    players.forEach(function (video) {
      var src = video.getAttribute("data-hls");
      var cover = video.parentElement ? video.parentElement.querySelector(".js-player-cover") : null;
      if (!src) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        video.src = src;
      }
      var play = function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      };
      if (cover) {
        cover.addEventListener("click", play);
      }
      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initSearchForms();
    initHero();
    initFilters();
    initSearchPage();
    initPlayers();
  });
})();
