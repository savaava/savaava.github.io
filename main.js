/* ===================================================
   MAIN.JS — Clock, viewport, FPS, navbar,
   scroll reveal, cursor glow
   =================================================== */

(function () {
    'use strict';

    // ---------- Clock ----------
    const clockDigits = document.getElementById('clock-digits');
    const amIndicator = document.getElementById('am-indicator');
    const pmIndicator = document.getElementById('pm-indicator');
    const timeLabel = document.getElementById('time-label');

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const isAM = hours < 12;

        const displayHours = hours % 12 || 12;
        clockDigits.textContent = `${String(displayHours).padStart(2, '0')}:${minutes}`;

        if (isAM) {
            amIndicator.classList.add('active');
            pmIndicator.classList.remove('active');
        } else {
            pmIndicator.classList.add('active');
            amIndicator.classList.remove('active');
        }

        const offset = now.getTimezoneOffset();
        const offsetHours = Math.abs(Math.floor(offset / 60));
        const sign = offset <= 0 ? '+' : '-';
        timeLabel.textContent = `LOCAL TIME (UTC${sign}${offsetHours})`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // ---------- Viewport Size ----------
    const viewportSize = document.getElementById('viewport-size');

    function updateViewport() {
        viewportSize.textContent = `${window.innerWidth} x ${window.innerHeight}`;
    }

    updateViewport();
    window.addEventListener('resize', updateViewport);

    // ---------- FPS Counter ----------
    const fpsCounter = document.getElementById('fps-counter');
    let frameCount = 0;
    let lastFPSTime = performance.now();

    function measureFPS() {
        frameCount++;
        const now = performance.now();
        const delta = now - lastFPSTime;

        if (delta >= 1000) {
            const fps = Math.round((frameCount * 1000) / delta);
            fpsCounter.textContent = `↳${String(fps).padStart(3, '0')} FPS`;
            frameCount = 0;
            lastFPSTime = now;
        }

        requestAnimationFrame(measureFPS);
    }

    requestAnimationFrame(measureFPS);

    // ---------- Navbar Scroll Effect ----------
    const sections = document.querySelectorAll('section[id]');
    const sideDots = document.querySelectorAll('.side-nav-dot');

    function onScroll() {
        // Active section tracking (Scrollspy)
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        // Update Side Dots
        sideDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.dataset.section === current) {
                dot.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Smooth scroll for side dots and brand logo
    const brandLogo = document.getElementById('brand-logo');
    const scrollLinks = [...sideDots, brandLogo].filter(el => el);

    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---------- Scroll Reveal & Staggered Animations ----------
    const revealElements = document.querySelectorAll('.reveal, .reveal-fade');

    // Utility to split text into animated words
    function splitTextToWords(selector) {
        const elements = document.querySelectorAll(selector);
        let globalWordIndex = 0; // Use a global index to stagger words across all elements sequentially

        elements.forEach(element => {
            if (!element) return;

            const text = element.innerText.trim();
            const words = text.split(/\s+/);
            element.innerHTML = '';
            element.setAttribute('aria-label', text);

            words.forEach((word) => {
                if (word.length === 0) return;
                const span = document.createElement('span');
                span.innerText = word;
                span.className = 'reveal-fade word-span';
                span.style.transitionDelay = `${globalWordIndex * 40}ms`;
                element.appendChild(span);
                element.appendChild(document.createTextNode(' '));
                globalWordIndex++;
            });
        });
    }

    // Split any text that needs word-by-word reveal
    splitTextToWords('.bio-text');

    // Stagger logic for containers (Projects, Contacts, Badges)
    function applyStagger(containerSelector, childSelector, delayBase = 0.15) {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(container => {
            const children = container.querySelectorAll(childSelector);
            children.forEach((child, index) => {
                child.classList.add('reveal');
                child.style.transitionDelay = `${index * delayBase}s`;
            });
        });
    }

    // Apply staggers (Updated with slower timings)
    // Project-specific reveal (Initial 3 cards get a slower, cinematic stagger)
    const visibleCount = 3;
    const allProjectCards = document.querySelectorAll('.project-card');
    allProjectCards.forEach((card, index) => {
        const isInitial = index < visibleCount;
        const cardDelay = isInitial ? index * 0.4 : 0.05; // Minimal delay for hidden cards
        card.classList.add('reveal');
        card.style.transitionDelay = `${cardDelay}s`;

        const visuals = card.querySelector('.project-visuals');
        if (visuals) {
            visuals.classList.add('reveal-visuals');
            visuals.style.transitionDelay = `${cardDelay + 0.5}s`;
        }
    });

    applyStagger('.skills-grid', '.skill-tag', 0.15);
    applyStagger('.focus-list', '.focus-item', 0.3);
    applyStagger('.contact-links', '.contact-card', 0.2);

    // IntersectionObserver instance
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Cleanup inline transitionDelay ONLY after the reveal transition is complete.
                // This ensures that the stagger delay is respected, and then cleared to 
                // allow hover effects to react immediately.
                entry.target.addEventListener('transitionend', () => {
                    entry.target.style.transitionDelay = '';
                }, { once: true });

                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    function initReveal() {
        const elements = document.querySelectorAll('.reveal, .reveal-fade, .reveal-visuals, .word-span');
        elements.forEach(el => revealObserver.observe(el));
    }

    initReveal();

    // ---------- Cursor Glow ----------
    const glowEl = document.createElement('div');
    glowEl.id = 'cursor-glow';
    document.body.appendChild(glowEl);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        // Skip glow on touch devices if they trigger mousemove
        if ('ontouchstart' in window) return;
        mouseX = e.clientX;
        mouseY = e.clientY;
        glowEl.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
        glowEl.style.opacity = '0';
    });

    function animateGlow() {
        glowX += (mouseX - glowX) * 0.07;
        glowY += (mouseY - glowY) * 0.07;
        glowEl.style.left = glowX + 'px';
        glowEl.style.top = glowY + 'px';
        requestAnimationFrame(animateGlow);
    }

    requestAnimationFrame(animateGlow);

    // ---------- Hero Image Spotlight Effect ----------
    const heroImgContainer = document.getElementById('hero-image-container');
    const sharpLayer = document.getElementById('hero-img-sharp');
    const spotlightRadius = 200; // px radius of the clear area

    let heroMouseX = 0, heroMouseY = 0;
    let spotX = 0, spotY = 0;
    let isMouseInHero = false;

    if (heroImgContainer && sharpLayer) {
        const updateSpotlight = (x, y) => {
            const rect = heroImgContainer.getBoundingClientRect();
            heroMouseX = x - rect.left;
            heroMouseY = y - rect.top;
            isMouseInHero = true;
            sharpLayer.style.opacity = '1';
        };

        heroImgContainer.addEventListener('mousemove', (e) => {
            updateSpotlight(e.clientX, e.clientY);
        });

        // Touch interaction for mobile
        heroImgContainer.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                updateSpotlight(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        heroImgContainer.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                updateSpotlight(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        heroImgContainer.addEventListener('mouseleave', () => {
            isMouseInHero = false;
            sharpLayer.style.opacity = '0';
        });

        // Optional: Hide after release on touch? The user said "reveal on touch". 
        // Let's hide it when touch ends to keep the "interactive" feel.
        heroImgContainer.addEventListener('touchend', () => {
            isMouseInHero = false;
            sharpLayer.style.opacity = '0';
        });

        function animateSpotlight() {
            spotX += (heroMouseX - spotX) * 0.1;
            spotY += (heroMouseY - spotY) * 0.1;

            if (isMouseInHero) {
                const maskValue = `radial-gradient(circle ${spotlightRadius}px at ${spotX}px ${spotY}px, black 0%, black 55%, transparent 100%)`;
                sharpLayer.style.webkitMaskImage = maskValue;
                sharpLayer.style.maskImage = maskValue;
            }

            requestAnimationFrame(animateSpotlight);
        }

        requestAnimationFrame(animateSpotlight);
    }

    // ---------- Project card visibility & Show More ----------
    const showMoreBtn = document.getElementById('show-more-projects-btn');

    // Initial state setup for Project cards
    allProjectCards.forEach((card, i) => {
        if (i >= visibleCount) {
            card.classList.add('project-hidden');
        }
    });

    if (showMoreBtn) {
        showMoreBtn.style.display = 'block';

        showMoreBtn.addEventListener('click', () => {
            const isShowingAll = showMoreBtn.classList.contains('showing-all');

            if (isShowingAll) {
                // Determine the 3rd project card (index-based)
                const targetProject = allProjectCards[visibleCount - 1];

                // Hide extra projects with smooth transition
                allProjectCards.forEach((card, i) => {
                    if (i >= visibleCount) {
                        card.classList.add('project-hidden');
                        // Reset inline display if it was set by some other script
                        card.style.display = '';
                    }
                });

                showMoreBtn.textContent = 'Show More Projects';
                showMoreBtn.classList.remove('showing-all');

                // Smooth scroll to the 3rd project card
                if (targetProject) {
                    const navOffset = 84; // Navbar height (64) + buffer (20)
                    const targetTop = targetProject.getBoundingClientRect().top + window.pageYOffset - navOffset;

                    window.scrollTo({
                        top: targetTop,
                        behavior: 'smooth'
                    });
                }
            } else {
                // Show extra projects
                allProjectCards.forEach((card, i) => {
                    if (i >= visibleCount) {
                        // Ensure it's not display:none if it was set initially
                        card.style.display = '';
                        card.classList.remove('project-hidden');

                        // Apply a tighter stagger for the new batch to make it feel responsive
                        const batchIndex = i - visibleCount;
                        const newDelay = batchIndex * 0.1;
                        card.style.transitionDelay = `${newDelay}s`;

                        const visuals = card.querySelector('.project-visuals');
                        if (visuals) {
                            visuals.style.transitionDelay = `${newDelay + 0.3}s`;
                        }
                    }
                });
                showMoreBtn.textContent = 'Show Less Projects';
                showMoreBtn.classList.add('showing-all');
            }
        });
    }

    // ---------- Carousel & Lightbox Logic ----------
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        if (!track) return;
        const slides = Array.from(track.children);
        const nextBtn = carousel.querySelector('.carousel-btn.next');
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        const visuals = carousel.closest('.project-visuals');
        const nav = visuals ? visuals.querySelector('.carousel-nav') : carousel.querySelector('.carousel-nav');

        let currentIndex = 0;
        let dots = [];

        // Dynamically build pagination dots
        if (nav) {
            nav.innerHTML = '';
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                if (index === 0) dot.classList.add('active');

                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateCarousel(index);
                });

                nav.appendChild(dot);
                dots.push(dot);
            });
        }

        // Hide navigation if there is only 1 slide
        if (slides.length <= 1) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
            if (nav) nav.style.display = 'none';
        }

        function updateCarousel(index) {
            if (slides.length <= 1) return;
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach(d => d.classList.remove('active'));
            if (dots[index]) dots[index].classList.add('active');
            currentIndex = index;
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (slides.length <= 1) return;
                let nextIndex = currentIndex + 1;
                if (nextIndex >= slides.length) nextIndex = 0;
                updateCarousel(nextIndex);
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (slides.length <= 1) return;
                let prevIndex = currentIndex - 1;
                if (prevIndex < 0) prevIndex = slides.length - 1;
                updateCarousel(prevIndex);
            });
        }

        // Swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe Left -> Next
                let nextIndex = currentIndex + 1;
                if (nextIndex >= slides.length) nextIndex = 0;
                updateCarousel(nextIndex);
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe Right -> Prev
                let prevIndex = currentIndex - 1;
                if (prevIndex < 0) prevIndex = slides.length - 1;
                updateCarousel(prevIndex);
            }
        }
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxTarget = document.getElementById('lightbox-target');
    const lightboxClose = document.querySelector('.lightbox-close');
    const allSlides = document.querySelectorAll('.carousel-slide');

    if (lightbox && lightboxTarget && lightboxClose) {
        allSlides.forEach(slide => {
            slide.addEventListener('click', () => {
                const placeholder = slide.querySelector('.project-image-placeholder');
                if (placeholder) {
                    lightboxTarget.innerHTML = placeholder.innerHTML;
                    lightboxTarget.style.background = placeholder.style.background || 'var(--bg-card)';
                } else if (slide.querySelector('img')) {
                    const img = document.createElement('img');
                    img.src = slide.querySelector('img').src;
                    lightboxTarget.innerHTML = '';
                    lightboxTarget.appendChild(img);
                    lightboxTarget.style.background = 'transparent';
                }
                lightbox.classList.add('active');
            });
        });

        const closeLightbox = () => lightbox.classList.remove('active');

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // ---------- PDF CV Preview (PDF.js) ----------
    function renderCVPreview() {
        if (typeof pdfjsLib === 'undefined') {
            // Retry if PDF.js hasn't loaded yet
            setTimeout(renderCVPreview, 200);
            return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const canvas = document.getElementById('cv-preview-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const wrapper = canvas.parentElement;

        pdfjsLib.getDocument('assets/AndreaSavastanoCV.pdf').promise.then(pdf => {
            return pdf.getPage(1);
        }).then(page => {
            // Get wrapper dimensions for proper sizing
            const wrapperWidth = wrapper.offsetWidth;
            const wrapperHeight = wrapper.offsetHeight;
            const viewport = page.getViewport({ scale: 1 });

            // Calculate scale to fill the wrapper height
            const scale = (wrapperHeight * 2) / viewport.height; // 2x for retina
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            page.render(renderContext);
        }).catch(err => {
            console.warn('CV preview rendering failed:', err);
        });
    }

    // ---------- Back to Top / Home Button Logic ----------
    const backToTopBtn = document.getElementById('back-to-top');

    function handleScroll() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }

    if (backToTopBtn) {
        window.addEventListener('scroll', handleScroll);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    renderCVPreview();

})();
