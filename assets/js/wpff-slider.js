/**
 * WP Fix Fast — Ken Burns Slider  |  Frontend script
 *
 * Responsibilities:
 *   – Activate the Ken Burns CSS animation on the first slide's image.
 *   – Cross-fade through slides on a configurable interval.
 *   – Sync the dot-nav indicator.
 *   – Pause auto-play on hover; resume on leave.
 *   – Handle dot clicks for manual navigation.
 */
(function () {
    'use strict';

    const TRANSITION_MS = 800; // must match CSS transition duration

    // -------------------------------------------------------------------------
    // Per-slider initialisation
    // -------------------------------------------------------------------------

    function initSlider(sliderEl) {
        const slides = Array.prototype.slice.call(sliderEl.querySelectorAll('.wpff-slide'));
        const dots   = Array.prototype.slice.call(sliderEl.querySelectorAll('.wpff-slider__dot'));

        if (slides.length === 0) return;

        const slideDuration = parseInt(sliderEl.dataset.slideDuration, 10) * 1000 || 6000;
        let currentIndex  = 0;
        let timer         = null;
        let isAnimating   = false;

        /* ---- Ken Burns helpers ---- */

        function startKenBurns(slide) {
            const img = slide.querySelector('.wpff-slide__image');
            if (!img) return;
            // Remove then re-add to force the CSS animation to restart from 0%.
            img.classList.remove('wpff-kb-active');
            void img.offsetWidth; // trigger reflow
            img.classList.add('wpff-kb-active');
        }

        function stopKenBurns(slide) {
            const img = slide.querySelector('.wpff-slide__image');
            if (img) img.classList.remove('wpff-kb-active');
        }

        /* ---- slide transition ---- */

        function goToSlide(nextIndex) {
            if (isAnimating || nextIndex === currentIndex) return;
            isAnimating = true;

            const prevIndex = currentIndex;
            const prevSlide = slides[prevIndex];
            const nextSlide = slides[nextIndex];

            // Update dots
            dots.forEach(function (dot, i) {
                dot.classList.toggle('wpff-slider__dot--active', i === nextIndex);
                dot.setAttribute('aria-current', i === nextIndex ? 'true' : 'false');
            });

            // The leaving slide rises to z-index 2 (above the incoming slide)
            // and fades out; the incoming slide fades in underneath it.
            prevSlide.classList.add('wpff-slide--leaving');
            stopKenBurns(prevSlide);

            nextSlide.classList.add('wpff-slide--active');
            startKenBurns(nextSlide);

            currentIndex = nextIndex;

            setTimeout(function () {
                prevSlide.classList.remove('wpff-slide--active', 'wpff-slide--leaving');
                isAnimating = false;
            }, TRANSITION_MS);
        }

        function advance() {
            goToSlide((currentIndex + 1) % slides.length);
        }

        /* ---- auto-play ---- */

        function startTimer() {
            if (slides.length > 1 && !timer) {
                timer = setInterval(advance, slideDuration);
            }
        }

        function stopTimer() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        /* ---- dot navigation ---- */

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                stopTimer();
                goToSlide(i);
                startTimer();
            });
        });

        /* ---- hover pause ---- */

        sliderEl.addEventListener('mouseenter', stopTimer);
        sliderEl.addEventListener('mouseleave', startTimer);

        /* ---- kick off ---- */

        startKenBurns(slides[0]);
        startTimer();
    }

    // -------------------------------------------------------------------------
    // Initialise all sliders on the page
    // -------------------------------------------------------------------------

    function initAll() {
        const sliders = document.querySelectorAll('.wpff-slider');
        for (let i = 0; i < sliders.length; i++) {
            initSlider(sliders[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
}());
