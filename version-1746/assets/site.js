(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle("is-active", idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle("is-active", idx === current);
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
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function uniqueSorted(cards, attr) {
    var set = {};
    cards.forEach(function (card) {
      var value = card.getAttribute(attr);
      if (value) {
        set[value] = true;
      }
    });
    return Object.keys(set).sort(function (a, b) {
      return b.localeCompare(a, "zh-CN");
    });
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function initLocalFilters() {
    var input = document.querySelector("[data-filter-input]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
    if (!input || !cards.length) {
      return;
    }
    var regionSelect = document.querySelector("[data-filter-select='region']");
    var yearSelect = document.querySelector("[data-filter-select='year']");
    fillSelect(regionSelect, uniqueSorted(cards, "data-region"));
    fillSelect(yearSelect, uniqueSorted(cards, "data-year"));

    function apply() {
      var keyword = normalize(input.value);
      var region = regionSelect ? regionSelect.value : "";
      var year = yearSelect ? yearSelect.value : "";
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var ok = (!keyword || haystack.indexOf(keyword) !== -1) &&
          (!region || card.getAttribute("data-region") === region) &&
          (!year || card.getAttribute("data-year") === year);
        card.classList.toggle("is-hidden", !ok);
      });
    }

    input.addEventListener("input", apply);
    if (regionSelect) {
      regionSelect.addEventListener("change", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
  }

  function initPlayer() {
    var containers = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    containers.forEach(function (container) {
      var video = container.querySelector("video");
      var playButton = container.querySelector("[data-play-button]");
      var status = container.querySelector("[data-player-status]");
      var sourceButtons = Array.prototype.slice.call(container.querySelectorAll("[data-source-url]"));
      var hlsInstance = null;
      var currentSource = container.getAttribute("data-default-src") || (sourceButtons[0] && sourceButtons[0].getAttribute("data-source-url"));

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function destroyHls() {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      }

      function loadSource(src, autoplay) {
        if (!video || !src) {
          return;
        }
        currentSource = src;
        destroyHls();
        setStatus("正在加载播放源...");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.addEventListener("loadedmetadata", function onLoaded() {
            video.removeEventListener("loadedmetadata", onLoaded);
            setStatus("播放源已就绪");
            if (autoplay) {
              video.play().catch(function () {
                setStatus("播放源已加载，请再次点击播放");
              });
            }
          });
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus("播放源已就绪");
            if (autoplay) {
              video.play().catch(function () {
                setStatus("播放源已加载，请再次点击播放");
              });
            }
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus("当前线路加载失败，请切换其他线路");
              destroyHls();
            }
          });
        } else {
          video.src = src;
          setStatus("浏览器不支持 HLS，可尝试 Safari 或支持 HLS 的浏览器");
        }
      }

      if (playButton) {
        playButton.addEventListener("click", function () {
          playButton.classList.add("is-hidden");
          loadSource(currentSource, true);
        });
      }

      sourceButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          sourceButtons.forEach(function (btn) {
            btn.classList.remove("is-active");
          });
          button.classList.add("is-active");
          if (playButton) {
            playButton.classList.add("is-hidden");
          }
          loadSource(button.getAttribute("data-source-url"), true);
        });
      });
    });
  }

  function initSearchPage() {
    var input = document.querySelector("[data-site-search-input]");
    var resultBox = document.querySelector("[data-search-results]");
    var summary = document.querySelector("[data-search-summary]");
    if (!input || !resultBox || !window.MOVIE_SEARCH_INDEX) {
      return;
    }
    var regionSelect = document.querySelector("[data-site-search-region]");
    var yearSelect = document.querySelector("[data-site-search-year]");
    var movies = window.MOVIE_SEARCH_INDEX;

    function fill(values, select) {
      if (!select) {
        return;
      }
      values.forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fill(Array.from(new Set(movies.map(function (movie) { return movie.region; }))).sort(), regionSelect);
    fill(Array.from(new Set(movies.map(function (movie) { return movie.year; }))).sort().reverse(), yearSelect);

    function card(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
      return [
        "<article class=\"movie-card\">",
        "  <a class=\"poster\" href=\"./" + movie.url + "\" aria-label=\"观看" + escapeHtml(movie.title) + "\">",
        "    <span class=\"poster-image\" style=\"background-image: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(37, 99, 235, 0.45)), url('./" + movie.cover + "');\"></span>",
        "    <span class=\"play-cover\">▶</span>",
        "  </a>",
        "  <div class=\"movie-card-body\">",
        "    <h3><a href=\"./" + movie.url + "\">" + escapeHtml(movie.title) + "</a></h3>",
        "    <p class=\"meta-line\">" + escapeHtml(movie.region) + " · " + escapeHtml(movie.year) + " · " + escapeHtml(movie.type) + "</p>",
        "    <p class=\"card-desc\">" + escapeHtml(movie.oneLine) + "</p>",
        "    <div class=\"tag-row\">" + tags + "</div>",
        "  </div>",
        "</article>"
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

    function getQueryParam() {
      var params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }

    function apply() {
      var keyword = normalize(input.value);
      var region = regionSelect ? regionSelect.value : "";
      var year = yearSelect ? yearSelect.value : "";
      var filtered = movies.filter(function (movie) {
        var text = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.category,
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" "));
        return (!keyword || text.indexOf(keyword) !== -1) &&
          (!region || movie.region === region) &&
          (!year || movie.year === year);
      });
      var limited = filtered.slice(0, 120);
      resultBox.innerHTML = limited.map(card).join("");
      if (summary) {
        summary.textContent = "共找到 " + filtered.length + " 部影片" + (filtered.length > limited.length ? "，当前显示前 " + limited.length + " 部" : "");
      }
    }

    input.value = getQueryParam();
    input.addEventListener("input", apply);
    if (regionSelect) {
      regionSelect.addEventListener("change", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
    apply();
  }

  ready(function () {
    initMenu();
    initHero();
    initLocalFilters();
    initPlayer();
    initSearchPage();
  });
})();
