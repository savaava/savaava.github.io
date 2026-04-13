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
    let isSideNavScrubbing = false;

    function onScroll() {
        if (isSideNavScrubbing) return;
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

    // ---------- Touch Scrubbing for Side Navigation ----------
    const sideNavWrapper = document.querySelector('.side-nav-wrapper');
    if (sideNavWrapper) {
        let isScrubbing = false;
        let dotData = [];

        const updateDotData = () => {
            dotData = Array.from(sideDots).map(dot => {
                const rect = dot.getBoundingClientRect();
                return {
                    el: dot,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    section: dot.dataset.section,
                    href: dot.getAttribute('href')
                };
            });
        };

        const handleScrub = (e) => {
            if (!isScrubbing) return;
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;

            let closest = null;
            let minDist = Infinity;

            dotData.forEach(data => {
                const dist = Math.sqrt(Math.pow(x - data.x, 2) + Math.pow(y - data.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    closest = data;
                }
            });

            // Threshold of 50px to stay "on" the bar
            if (closest && minDist < 60) {
                // Only update and vibrate if we moved to a NEW dot
                if (!closest.el.classList.contains('active')) {
                    sideDots.forEach(dot => dot.classList.remove('active'));
                    closest.el.classList.add('active');
                    if ('vibrate' in navigator) navigator.vibrate(10);
                }

                const lastTarget = sideNavWrapper.getAttribute('data-scrub-target');
                if (lastTarget !== closest.section) {
                    sideNavWrapper.setAttribute('data-scrub-target', closest.section);
                    const target = document.querySelector(closest.href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        };

        sideNavWrapper.addEventListener('touchstart', (e) => {
            // Only trigger if touch starts near a dot or on the wrapper
            sideNavWrapper.classList.add('scrubbing');
            isSideNavScrubbing = true;
            isScrubbing = true;
            updateDotData();
            handleScrub(e);
        }, { passive: true });

        sideNavWrapper.addEventListener('touchmove', (e) => {
            if (!isScrubbing) return;
            // Prevent page scroll only if we are actively scrubbing over the dots
            if (e.cancelable) e.preventDefault();
            handleScrub(e);
        }, { passive: false });

        sideNavWrapper.addEventListener('touchend', () => {
            sideNavWrapper.classList.remove('scrubbing');
            // Keep isSideNavScrubbing true for a bit longer to prevent onScroll from
            // immediately overriding the active state while the smooth scroll is still moving.
            setTimeout(() => {
                isSideNavScrubbing = false;
                // Force an onScroll update to sync everything once scrub is done
                onScroll();
            }, 600);

            isScrubbing = false;
            sideNavWrapper.removeAttribute('data-scrub-target');
        });

        window.addEventListener('resize', updateDotData);
    }

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
        const cardDelay = isInitial ? index * 0.15 : 0.05;
        card.classList.add('reveal');
        card.style.transitionDelay = `${cardDelay}s`;
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
        const elements = document.querySelectorAll('.reveal, .reveal-fade, .word-span');
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

    // Only run the interactive spotlight if the device supports hover (desktop)
    if (heroImgContainer && sharpLayer && window.matchMedia("(hover: hover)").matches) {
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

        // Touch interaction for mobile is disabled here because we want a clear image on mobile
        // but kept for reference or if a mobile device supports hover (rare)
        
        heroImgContainer.addEventListener('mouseleave', () => {
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
    // ---------- Project Filtering & Show More Logic ----------
    const showMoreBtn = document.getElementById('show-more-projects-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    function updateProjectVisibility(isInitial = false) {
        let matchIndex = 0;
        const isShowingAll = showMoreBtn ? showMoreBtn.classList.contains('showing-all') : true;

        allProjectCards.forEach((card) => {
            const category = card.dataset.category;
            const isMatch = currentFilter === 'all' || category === currentFilter;

            if (isMatch) {
                card.style.display = '';

                const shouldHide = (currentFilter === 'all' && !isShowingAll && matchIndex >= visibleCount);

                if (shouldHide) {
                    card.classList.add('project-hidden');
                } else {
                    card.classList.remove('project-hidden');

                    if (!isInitial) {
                        // Reset reveal to re-trigger stagger when filtering
                        card.classList.remove('visible');
                        card.style.transitionDelay = `${matchIndex * 0.1}s`;
                        revealObserver.observe(card);
                    }
                }
                matchIndex++;
            } else {
                card.classList.add('project-hidden');
            }
        });

        if (showMoreBtn) {
            if (currentFilter === 'all' && allProjectCards.length > visibleCount) {
                showMoreBtn.style.display = 'block';
            } else {
                showMoreBtn.style.display = 'none';
            }
        }
    }

    updateProjectVisibility(true);

    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            const isShowingAll = showMoreBtn.classList.contains('showing-all');

            if (isShowingAll) {
                showMoreBtn.classList.remove('showing-all');
                showMoreBtn.textContent = 'Show More Projects';

                const targetProject = allProjectCards[visibleCount - 1];
                if (targetProject) {
                    const navOffset = 84;
                    const targetTop = targetProject.getBoundingClientRect().top + window.pageYOffset - navOffset;
                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                }
            } else {
                showMoreBtn.classList.add('showing-all');
                showMoreBtn.textContent = 'Show Less Projects';
            }
            updateProjectVisibility();
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateProjectVisibility();
        });
    });

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

            // ---------- Touch Scrubbing for Carousel Dots ----------
            let isScrubbing = false;
            let dotData = [];

            const updateDotData = () => {
                dotData = dots.map((dot, index) => {
                    const rect = dot.getBoundingClientRect();
                    return {
                        el: dot,
                        index,
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                });
            };

            const handleScrub = (e) => {
                if (!isScrubbing) return;
                const touch = e.touches[0];
                const x = touch.clientX;
                const y = touch.clientY;

                let closest = null;
                let minDist = Infinity;

                dotData.forEach(data => {
                    const dist = Math.sqrt(Math.pow(x - data.x, 2) + Math.pow(y - data.y, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        closest = data;
                    }
                });

                if (closest && minDist < 40) {
                    if (currentIndex !== closest.index) {
                        // Update UI immediately
                        dots.forEach(d => d.classList.remove('active'));
                        closest.el.classList.add('active');

                        updateCarousel(closest.index);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                    }
                }
            };

            nav.addEventListener('touchstart', (e) => {
                isScrubbing = true;
                updateDotData();
                handleScrub(e);
            }, { passive: true });

            nav.addEventListener('touchmove', (e) => {
                if (!isScrubbing) return;
                if (e.cancelable) e.preventDefault();
                handleScrub(e);
            }, { passive: false });

            nav.addEventListener('touchend', () => {
                isScrubbing = false;
            });
        }

        // Hide navigation if there is only 1 slide
        if (slides.length <= 1) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
            if (nav) nav.style.display = 'none';
        }

        function updateCarousel(index) {
            slides.forEach((slide, i) => {
                if (i === index) slide.classList.add('active');
                else slide.classList.remove('active');
            });

            if (slides.length <= 1) return;

            dots.forEach(d => d.classList.remove('active'));
            if (dots[index]) dots[index].classList.add('active');
            currentIndex = index;
        }

        // Initialize first slide as active
        updateCarousel(0);

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
    const lightboxTrack = document.getElementById('lightbox-track');
    const lightboxNav = document.getElementById('lightbox-nav');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxNext = lightbox ? lightbox.querySelector('.lightbox-btn.next') : null;
    const lightboxPrev = lightbox ? lightbox.querySelector('.lightbox-btn.prev') : null;
    const allSlides = document.querySelectorAll('.carousel-slide');

    let lbCurrentIndex = 0;
    let lbSlidesCount = 0;
    let lbDots = [];

    if (lightbox && lightboxTrack && lightboxClose) {

        function updateLightboxCarousel(index) {
            const lbItems = Array.from(lightboxTrack.children);
            lbItems.forEach((item, i) => {
                if (i === index) item.classList.add('active');
                else item.classList.remove('active');
            });

            // Update caption
            const activeImg = lbItems[index]?.querySelector('img');
            const captionPanel = document.getElementById('lightbox-caption-panel');
            if (activeImg && captionPanel) {
                const text = activeImg.dataset.caption || "Nessuna descrizione disponibile.";
                captionPanel.querySelector('.caption-text').textContent = text;
            }

            if (lbSlidesCount <= 1) return;

            lbDots.forEach(d => d.classList.remove('active'));
            if (lbDots[index]) lbDots[index].classList.add('active');
            lbCurrentIndex = index;
        }

        function initLightboxCarousel(originSlide) {
            // Find parent project carousel to get all images
            const parentCarousel = originSlide.closest('.carousel');
            if (!parentCarousel) return;

            const originTrack = parentCarousel.querySelector('.carousel-track');
            const projectSlides = Array.from(originTrack.children);
            lbSlidesCount = projectSlides.length;
            
            // Get index of clicked slide
            lbCurrentIndex = projectSlides.indexOf(originSlide);

            // Populate lightbox track
            lightboxTrack.innerHTML = '';
            projectSlides.forEach(slide => {
                const lbItem = document.createElement('div');
                lbItem.className = 'lightbox-item';

                const placeholder = slide.querySelector('.project-image-placeholder');
                if (placeholder) {
                    const clone = placeholder.cloneNode(true);
                    lbItem.appendChild(clone);
                } else if (slide.querySelector('img')) {
                    const originalImg = slide.querySelector('img');
                    const img = document.createElement('img');
                    img.src = originalImg.src;
                    if (originalImg.dataset.caption) {
                        img.dataset.caption = originalImg.dataset.caption;
                    }
                    lbItem.appendChild(img);
                }
                lightboxTrack.appendChild(lbItem);
            });

            // Populate dots
            lightboxNav.innerHTML = '';
            lbDots = [];
            if (lbSlidesCount > 1) {
                projectSlides.forEach((_, index) => {
                    const dot = document.createElement('button');
                    dot.classList.add('lightbox-dot');
                    if (index === lbCurrentIndex) dot.classList.add('active');
                    dot.addEventListener('click', () => updateLightboxCarousel(index));
                    lightboxNav.appendChild(dot);
                    lbDots.push(dot);
                });

                // ---------- Touch Scrubbing for Lightbox Dots ----------
                let isLbScrubbing = false;
                let lbDotData = [];

                const updateLbDotData = () => {
                    lbDotData = lbDots.map((dot, index) => {
                        const rect = dot.getBoundingClientRect();
                        return {
                            el: dot,
                            index,
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                        };
                    });
                };

                const handleLbScrub = (e) => {
                    if (!isLbScrubbing) return;
                    const touch = e.touches[0];
                    const x = touch.clientX;
                    const y = touch.clientY;

                    let closest = null;
                    let minDist = Infinity;

                    lbDotData.forEach(data => {
                        const dist = Math.sqrt(Math.pow(x - data.x, 2) + Math.pow(y - data.y, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            closest = data;
                        }
                    });

                    if (closest && minDist < 40) {
                        if (lbCurrentIndex !== closest.index) {
                            // Update UI immediately
                            lbDots.forEach(d => d.classList.remove('active'));
                            closest.el.classList.add('active');

                            updateLightboxCarousel(closest.index);
                            if ('vibrate' in navigator) navigator.vibrate(10);
                        }
                    }
                };

                lightboxNav.addEventListener('touchstart', (e) => {
                    isLbScrubbing = true;
                    updateLbDotData();
                    handleLbScrub(e);
                }, { passive: true });

                lightboxNav.addEventListener('touchmove', (e) => {
                    if (!isLbScrubbing) return;
                    if (e.cancelable) e.preventDefault();
                    handleLbScrub(e);
                }, { passive: false });

                lightboxNav.addEventListener('touchend', () => {
                    isLbScrubbing = false;
                });

                if (lightboxNext) lightboxNext.style.display = 'flex';
                if (lightboxPrev) lightboxPrev.style.display = 'flex';
                lightboxNav.style.display = 'flex';
            } else {
                if (lightboxNext) lightboxNext.style.display = 'none';
                if (lightboxPrev) lightboxPrev.style.display = 'none';
                lightboxNav.style.display = 'none';
            }

            // Sync initial position (set active class)
            updateLightboxCarousel(lbCurrentIndex);
            
            // Set default zoom state to maximized
            lightbox.classList.add('is-zoomed');
            
            lightbox.classList.add('active');
        }

        allSlides.forEach(slide => {
            slide.addEventListener('click', () => {
                initLightboxCarousel(slide);
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            lightbox.classList.remove('is-zoomed');
            document.getElementById('lightbox-caption-panel')?.classList.remove('active');
            lightbox.querySelector('.info-btn')?.classList.remove('active');
            // Reset track after transition to avoid flash on next open
            setTimeout(() => {
                lightboxTrack.innerHTML = '';
                lightboxNav.innerHTML = '';
            }, 200);
        };

        lightboxClose.addEventListener('click', closeLightbox);
        
        lightbox.addEventListener('click', (e) => {
            // Close if clicking the background OR the track container (not the image/buttons)
            if (e.target === lightbox || e.target.classList.contains('lightbox-carousel') || e.target.classList.contains('lightbox-track-container')) {
                closeLightbox();
            }
        });

        // Zoom & Info Controls Logic
        const zoomInBtn = lightbox.querySelector('.zoom-in');
        const zoomOutBtn = lightbox.querySelector('.zoom-out');
        const infoBtn = lightbox.querySelector('.info-btn');
        const captionPanel = document.getElementById('lightbox-caption-panel');

        if (zoomInBtn && zoomOutBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                lightbox.classList.add('is-zoomed');
            });
            zoomOutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                lightbox.classList.remove('is-zoomed');
            });
        }

        if (infoBtn && captionPanel) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                infoBtn.classList.toggle('active');
                captionPanel.classList.toggle('active');
            });

            const captionClose = document.getElementById('caption-close');
            if (captionClose) {
                captionClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    infoBtn.classList.remove('active');
                    captionPanel.classList.remove('active');
                });
            }
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', (e) => {
                e.stopPropagation();
                let next = lbCurrentIndex + 1;
                if (next >= lbSlidesCount) next = 0;
                updateLightboxCarousel(next);
            });
        }

        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                let prev = lbCurrentIndex - 1;
                if (prev < 0) prev = lbSlidesCount - 1;
                updateLightboxCarousel(prev);
            });
        }

        // Lightbox Swipe support
        let lbTouchStartX = 0;
        let lbTouchEndX = 0;

        lightbox.addEventListener('touchstart', (e) => {
            lbTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            lbTouchEndX = e.changedTouches[0].screenX;
            handleLightboxSwipe();
        }, { passive: true });

        function handleLightboxSwipe() {
            const threshold = 50;
            if (lbSlidesCount <= 1) return;

            if (lbTouchEndX < lbTouchStartX - threshold) {
                // Swipe Left -> Next
                let next = lbCurrentIndex + 1;
                if (next >= lbSlidesCount) next = 0;
                updateLightboxCarousel(next);
            }
            if (lbTouchEndX > lbTouchStartX + threshold) {
                // Swipe Right -> Prev
                let prev = lbCurrentIndex - 1;
                if (prev < 0) prev = lbSlidesCount - 1;
                updateLightboxCarousel(prev);
            }
        }

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') {
                let next = lbCurrentIndex + 1;
                if (next >= lbSlidesCount) next = 0;
                updateLightboxCarousel(next);
            }
            if (e.key === 'ArrowLeft') {
                let prev = lbCurrentIndex - 1;
                if (prev < 0) prev = lbSlidesCount - 1;
                updateLightboxCarousel(prev);
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

    // ---------- Color Mode Switch ----------
    const colorSwitch = document.getElementById('color-mode-switch');

    function setColorMode(mode) {
        if (mode === 'green') {
            document.documentElement.setAttribute('data-color-mode', 'green');
        } else {
            document.documentElement.removeAttribute('data-color-mode');
        }
        localStorage.setItem('colorMode', mode);
    }

    // Initialize from localStorage (fallback — early script in <head> handles FOUC)
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'green') {
        document.documentElement.setAttribute('data-color-mode', 'green');
    }

    if (colorSwitch) {
        colorSwitch.addEventListener('click', () => {
            const isGreen = document.documentElement.getAttribute('data-color-mode') === 'green';
            setColorMode(isGreen ? 'red' : 'green');
        });
    }

    renderCVPreview();

})();
