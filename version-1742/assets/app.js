const MovieApp = (function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    const toggle = qs("[data-menu-toggle]");
    const menu = qs("[data-nav-menu]");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  function initHero() {
    const hero = qs("[data-hero]");
    if (!hero) return;
    const slides = qsa("[data-hero-slide]", hero);
    const dots = qsa("[data-hero-dot]", hero);
    const prev = qs("[data-hero-prev]", hero);
    const next = qs("[data-hero-next]", hero);
    if (!slides.length) return;
    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot") || 0));
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    const input = qs("[data-search-input]");
    const cards = qsa("[data-card]");
    const chips = qsa("[data-filter]");
    if (!cards.length) return;
    let filter = "all";

    function apply() {
      const keyword = input ? input.value.trim().toLowerCase() : "";
      cards.forEach(function (card) {
        const search = (card.getAttribute("data-search") || "").toLowerCase();
        const matchesKeyword = !keyword || search.indexOf(keyword) !== -1;
        const matchesFilter = filter === "all" || search.indexOf(filter.toLowerCase()) !== -1;
        card.classList.toggle("is-hidden", !(matchesKeyword && matchesFilter));
      });
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        filter = chip.getAttribute("data-filter") || "all";
        chips.forEach(function (item) {
          item.classList.toggle("active", item === chip);
        });
        apply();
      });
    });
  }

  function initPlayer(streamUrl) {
    const video = qs(".movie-video");
    const overlay = qs(".play-overlay");
    if (!video || !streamUrl) return;
    let prepared = false;
    let hls = null;

    function prepare() {
      if (prepared) return;
      prepared = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      prepare();
      if (overlay) overlay.classList.add("is-hidden");
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          if (overlay) overlay.classList.remove("is-hidden");
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", play);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });

    video.addEventListener("play", function () {
      if (overlay) overlay.classList.add("is-hidden");
    });

    video.addEventListener("pause", function () {
      if (overlay && video.currentTime === 0) overlay.classList.remove("is-hidden");
    });

    window.addEventListener("pagehide", function () {
      if (hls) hls.destroy();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initFilters();
  });

  return {
    initPlayer: initPlayer
  };
})();
