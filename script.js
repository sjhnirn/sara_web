document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --------------------------------------------------------------------------
       1. Navbar Scroll Effect
       -------------------------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    /* --------------------------------------------------------------------------
       2. Scroll Progress Bar
       -------------------------------------------------------------------------- */
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            scrollProgress.style.width = scrolled + '%';
        });
    }

    /* --------------------------------------------------------------------------
       3. Hero Slider Carousel
       -------------------------------------------------------------------------- */
    const heroPrevBtn = document.querySelector('.hero-slider-nav .prev');
    const heroNextBtn = document.querySelector('.hero-slider-nav .next');
    const heroImg = document.querySelector('.hero-bg img');
    const heroSlideNum = document.querySelector('.slide-num');
    const progressRing = document.querySelector('.progress-ring__circle-progress');

    const heroSlides = [
        'images/gallery_2.webp',
        'images/gallery_4.webp',
        'images/gallery_11.webp',
        'images/gallery_13.webp'
    ];
    let activeSlideIndex = 0;
    const totalSlides = heroSlides.length;
    const ringCircumference = 339.29;

    const updateHeroSlide = (index) => {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;

        activeSlideIndex = index;

        // Fade image out
        if (heroImg) {
            heroImg.style.transition = 'opacity 0.35s ease-in-out';
            heroImg.style.opacity = '0';
            
            setTimeout(() => {
                heroImg.src = heroSlides[activeSlideIndex];
                heroImg.style.animation = 'none';
                void heroImg.offsetHeight; // trigger reflow
                heroImg.style.animation = 'heroKenBurns 28s ease-out forwards';
                heroImg.style.opacity = '0.28';
            }, 350);
        }

        // Update slide number
        if (heroSlideNum) {
            heroSlideNum.textContent = String(activeSlideIndex + 1).padStart(2, '0');
        }

        // Update progress ring
        if (progressRing) {
            const progress = (activeSlideIndex + 1) / totalSlides;
            const offset = ringCircumference * (1 - progress);
            progressRing.style.transition = 'stroke-dashoffset 0.4s ease';
            progressRing.style.strokeDashoffset = offset;
        }
    };

    if (heroPrevBtn && heroNextBtn) {
        heroPrevBtn.addEventListener('click', () => {
            updateHeroSlide(activeSlideIndex - 1);
        });

        heroNextBtn.addEventListener('click', () => {
            updateHeroSlide(activeSlideIndex + 1);
        });
    }

    /* --------------------------------------------------------------------------
       4. Smooth Scrolling (Offset adjustments)
       -------------------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offset = window.pageYOffset + target.getBoundingClientRect().top - 80;
            window.scrollTo({ top: offset, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

            // Ensure mobile menu closes on click
            if (typeof burger !== 'undefined' && typeof mobileMenu !== 'undefined') {
                burger.classList.remove('open');
                mobileMenu.classList.remove('open');
            }
        });
    });

    /* --------------------------------------------------------------------------
       5. Mobile Burger Menu & Transformation
       -------------------------------------------------------------------------- */
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        const setMenuState = (isOpen) => {
            burger.classList.toggle('open', isOpen);
            mobileMenu.classList.toggle('open', isOpen);
            burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        burger.addEventListener('click', () => {
            setMenuState(!burger.classList.contains('open'));
        });

        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => setMenuState(false));
        });
    }

    /* --------------------------------------------------------------------------
       6. Gallery Filter Transition
       -------------------------------------------------------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const loadMoreBtn = document.getElementById('loadMoreGallery');
    const initialGalleryLimit = 18;
    let galleryExpanded = false;

    const formatCategory = (category) => {
        if (!category) return '';
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    const getActiveFilter = () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        return activeBtn ? activeBtn.dataset.filter : 'product';
    };

    const updateGalleryVisibility = () => {
        const filter = getActiveFilter();
        let matchedCount = 0;

        galleryItems.forEach(item => {
            const category = item.dataset.category;
            const matchesFilter = filter === 'all' || category === filter;

            if (!matchesFilter) {
                item.classList.add('hidden');
                item.classList.remove('is-collapsed', 'fade-out');
                return;
            }

            matchedCount += 1;
            const shouldCollapse = filter === 'all' && !galleryExpanded && matchedCount > initialGalleryLimit;

            item.classList.toggle('is-collapsed', shouldCollapse);
            item.classList.toggle('hidden', false);

            if (!shouldCollapse) {
                void item.offsetWidth;
                item.classList.remove('fade-out');
            }
        });

        if (loadMoreBtn) {
            loadMoreBtn.hidden = filter !== 'all' || galleryExpanded || matchedCount <= initialGalleryLimit;
        }
    };

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;

                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 1. Fade out current view
                galleryItems.forEach(item => {
                    if (!item.classList.contains('hidden') && !item.classList.contains('is-collapsed')) {
                        item.classList.add('fade-out');
                    }
                });

                // 2. Arrange layouts during fade
                setTimeout(updateGalleryVisibility, 300);
            });
        });

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                galleryExpanded = true;
                updateGalleryVisibility();
            });
        }

        updateGalleryVisibility();

        if (window.location.hash) {
            setTimeout(() => {
                const target = document.querySelector(window.location.hash);
                if (!target) return;
                const offset = window.pageYOffset + target.getBoundingClientRect().top - 80;
                window.scrollTo({ top: offset, behavior: 'auto' });
            }, 50);
        }
    }

    /* --------------------------------------------------------------------------
       7. Interactive Lightbox Modal
       -------------------------------------------------------------------------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCategory = document.getElementById('lightboxCategory');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentImgIndex = 0;
    let activeItems = [];

    const getActiveItems = () => {
        return Array.from(document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)'));
    };

    const updateLightboxImage = (index, animate = true) => {
        if (index < 0) index = activeItems.length - 1;
        if (index >= activeItems.length) index = 0;

        currentImgIndex = index;
        const targetItem = activeItems[currentImgIndex];
        const img = targetItem.querySelector('img');
        const titleText = targetItem.querySelector('.gallery-title').textContent;
        const categoryText = targetItem.dataset.category;

        const applyImage = () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxTitle.textContent = titleText;
            lightboxCategory.textContent = formatCategory(categoryText);
            lightboxImg.classList.remove('is-fading');
        };

        if (animate && !prefersReducedMotion && lightbox.classList.contains('open')) {
            lightboxImg.classList.add('is-fading');
            setTimeout(applyImage, 180);
        } else {
            applyImage();
        }
    };

    const openLightbox = (index) => {
        activeItems = getActiveItems();
        if (activeItems.length === 0) return;

        updateLightboxImage(index);
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-active'); // Restore a visible pointer
        document.body.style.overflow = 'hidden'; // Lock back scroll
    };

    const closeLightbox = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-active');
        document.body.style.overflow = ''; // Unlock back scroll
    };

    const openGalleryItem = (item) => {
        activeItems = getActiveItems();
        const index = activeItems.indexOf(item);
        if (index !== -1) {
            openLightbox(index);
        }
    };

    galleryItems.forEach(item => {
        const title = item.querySelector('.gallery-title')?.textContent?.trim() || 'photograph';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `View ${title} in lightbox`);

        item.addEventListener('click', (e) => {
            e.preventDefault();
            openGalleryItem(item);
        });

        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openGalleryItem(item);
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            updateLightboxImage(currentImgIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            updateLightboxImage(currentImgIndex + 1);
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation inside lightbox
    window.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') updateLightboxImage(currentImgIndex - 1);
        if (e.key === 'ArrowRight') updateLightboxImage(currentImgIndex + 1);
    });

    // Touch swipe gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    if (lightbox) {
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipeGesture();
        }, { passive: true });
    }

    const handleSwipeGesture = () => {
        const threshold = 50; // minimum distance to qualify as swipe
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Check if horizontal swipe was larger than vertical swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    // Swipe right -> previous image
                    updateLightboxImage(currentImgIndex - 1);
                } else {
                    // Swipe left -> next image
                    updateLightboxImage(currentImgIndex + 1);
                }
            }
        } else {
            // Swipe vertically
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0) {
                    // Swipe down -> close lightbox
                    closeLightbox();
                }
            }
        }
    };

    /* --------------------------------------------------------------------------
       8. ScrollSpy Active Nav Highlighting
       -------------------------------------------------------------------------- */
    const spySections = document.querySelectorAll('header, section, footer');
    const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');

    const scrollSpy = () => {
        const scrollPos = window.scrollY || document.documentElement.scrollTop;

        spySections.forEach(section => {
            const sectionTop = section.offsetTop - 150; // offset header line
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run on boot

    /* --------------------------------------------------------------------------
       9. Scroll Reveal Observer
       -------------------------------------------------------------------------- */
    const revealTargets = document.querySelectorAll(
        '.gallery-item, .service-card, .testimonial-card, .about-text h2, .about-text p, .about-image, .footer-cta h2, .footer-cta .footer-sub'
    );

    revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));

    if (!prefersReducedMotion) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealTargets.forEach(el => observer.observe(el));
    } else {
        revealTargets.forEach(el => el.classList.add('is-visible'));
    }

    /* --------------------------------------------------------------------------
       10. Form Validation & Submissions
       -------------------------------------------------------------------------- */
    const form = document.getElementById('contactForm');
    
    const showError = (input, message) => {
        input.classList.add('invalid');
        let errorMsg = input.parentNode.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            input.parentNode.appendChild(errorMsg);
        }
        errorMsg.textContent = message;
        void errorMsg.offsetWidth; // Force Reflow
        errorMsg.classList.add('show');
        
        if (!prefersReducedMotion) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
        }
    };

    const formStatus = document.getElementById('formStatus');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
            form.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
            if (formStatus) {
                formStatus.textContent = '';
                formStatus.classList.remove('is-success');
            }

            // Name verification
            if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
                showError(nameInput, 'Full Name is required (at least 2 letters)');
                isValid = false;
            }

            // Email verification (RFC Standard regex)
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
                showError(emailInput, 'A valid email address is required');
                isValid = false;
            }

            // Message verification
            if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
                showError(messageInput, 'Message is required (at least 10 letters)');
                isValid = false;
            }

            if (!isValid) {
                const submitBtn = form.querySelector('.btn-submit');
                if (!prefersReducedMotion) {
                    submitBtn.classList.add('shake');
                    setTimeout(() => submitBtn.classList.remove('shake'), 400);
                }
                return;
            }

            const btn = form.querySelector('.btn-submit');
            const originalText = btn.textContent;
            btn.textContent = 'Message Sent';
            btn.classList.add('is-success');
            btn.disabled = true;
            if (formStatus) {
                formStatus.textContent = 'Thank you — your message has been received. I will reply within 48 hours.';
                formStatus.classList.add('is-success');
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('is-success');
                btn.disabled = false;
                form.reset();
                if (formStatus) {
                    formStatus.textContent = '';
                    formStatus.classList.remove('is-success');
                }
            }, 5000);
        });
    }

});
