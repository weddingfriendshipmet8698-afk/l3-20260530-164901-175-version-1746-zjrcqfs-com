(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var links = document.querySelector("[data-nav-links]");
        if (!toggle || !links) {
            return;
        }
        toggle.addEventListener("click", function () {
            links.classList.toggle("open");
        });
    }

    function initGlobalSearch() {
        var forms = document.querySelectorAll("[data-global-search]");
        forms.forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";
                if (query) {
                    window.location.href = "./search.html?q=" + encodeURIComponent(query);
                } else {
                    window.location.href = "./search.html";
                }
            });
        });
    }

    function filterCards(query) {
        var normalized = normalize(query);
        var cards = document.querySelectorAll(".searchable-card");
        var visible = 0;
        cards.forEach(function (card) {
            var haystack = normalize((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-meta") || "") + " " + card.textContent);
            var matched = !normalized || haystack.indexOf(normalized) !== -1;
            card.hidden = !matched;
            if (matched) {
                visible += 1;
            }
        });
        var empty = document.querySelector("[data-empty]");
        if (empty) {
            empty.hidden = visible !== 0;
        }
    }

    function initLocalFilter() {
        var form = document.querySelector("[data-local-filter]");
        var input = document.querySelector("[data-local-search]");
        if (!form || !input) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        if (initial) {
            input.value = initial;
            filterCards(initial);
        }
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            filterCards(input.value);
        });
        input.addEventListener("input", function () {
            filterCards(input.value);
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(target) {
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function start() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
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
        start();
    }

    window.setupMoviePlayer = function (options) {
        var video = document.getElementById("movie-video");
        var stage = document.querySelector("[data-player-stage]");
        var button = document.querySelector("[data-play-button]");
        var hls = null;
        var loaded = false;

        if (!video || !stage || !button || !options || !options.source) {
            return;
        }

        function attachSource() {
            if (loaded) {
                return;
            }
            loaded = true;
            video.setAttribute("poster", options.poster || "");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = options.source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(options.source);
                hls.attachMedia(video);
            } else {
                video.src = options.source;
            }
        }

        function play() {
            attachSource();
            stage.classList.add("is-playing");
            video.setAttribute("controls", "controls");
            var attempt = video.play();
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(function () {});
            }
        }

        button.addEventListener("click", play);
        stage.addEventListener("click", function (event) {
            if (event.target === stage || event.target.closest("[data-play-button]")) {
                play();
            }
        });
        window.addEventListener("pagehide", function () {
            if (hls && typeof hls.destroy === "function") {
                hls.destroy();
            }
        });
    };

    ready(function () {
        initMenu();
        initGlobalSearch();
        initLocalFilter();
        initHero();
    });
})();
