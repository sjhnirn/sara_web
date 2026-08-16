document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --------------------------------------------------------------------------
       1. Navbar Scroll Effect
       -------------------------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
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
       3. Smooth Scrolling
       -------------------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offset = window.pageYOffset + target.getBoundingClientRect().top - 80;
            window.scrollTo({ top: offset, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

            // Ensure mobile menu closes on click
            if (typeof burger !== 'undefined' && typeof mobileMenu !== 'undefined') {
                burger.classList.remove('open');
                mobileMenu.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                burger.setAttribute('aria-label', 'Open menu');
                document.body.style.overflow = '';
            }
        });
    });

    /* --------------------------------------------------------------------------
       4. Mobile Burger Menu
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

        // Close on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                setMenuState(false);
                burger.focus();
            }
        });
    }

    /* --------------------------------------------------------------------------
       5. Hero Interactive Theme Switcher
       -------------------------------------------------------------------------- */
    const heroThemeBtns = document.querySelectorAll('.hero-theme-btn');
    const heroMainImage = document.getElementById('heroMainImage');
    const heroBadgeCat = document.getElementById('heroBadgeCat');

    if (heroThemeBtns.length > 0 && heroMainImage) {
        heroThemeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;

                heroThemeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const newSrc = btn.dataset.src;
                const newAlt = btn.dataset.alt || '';
                const newCategory = btn.dataset.kicker || '';

                if (!prefersReducedMotion) {
                    heroMainImage.classList.add('fade-out');
                    setTimeout(() => {
                        heroMainImage.src = newSrc;
                        heroMainImage.alt = newAlt;
                        if (heroBadgeCat) heroBadgeCat.textContent = newCategory;
                        heroMainImage.classList.remove('fade-out');
                    }, 250);
                } else {
                    heroMainImage.src = newSrc;
                    heroMainImage.alt = newAlt;
                    if (heroBadgeCat) heroBadgeCat.textContent = newCategory;
                }
            });
        });
    }

    /* --------------------------------------------------------------------------
       6. Gallery Filter Transition & Loading
       -------------------------------------------------------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const gallery = document.getElementById('gallery');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const loadMoreBtn = document.getElementById('loadMoreGallery');
    const initialLimit = 18;
    let galleryExpanded = false;

    const categoryLabels = {
        product: 'Product & Commercial',
        portrait: 'Portrait & Fashion',
        food: 'Food & Beverage',
        editorial: 'Editorial & Documentary',
        children: 'Children & Family',
        all: 'All Works'
    };

    const formatCategory = (category) => categoryLabels[category] || category || 'Selected Work';

    const getActiveFilter = () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        return activeBtn ? activeBtn.dataset.filter : 'all';
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
            const shouldCollapse = filter === 'all' && !galleryExpanded && matchedCount > initialLimit;

            item.classList.toggle('is-collapsed', shouldCollapse);
            item.classList.toggle('hidden', false);

            if (!shouldCollapse) {
                void item.offsetWidth;
                item.classList.remove('fade-out');
            }
        });

        if (loadMoreBtn) {
            loadMoreBtn.hidden = filter !== 'all' || galleryExpanded || matchedCount <= initialLimit;
        }

        if (gallery) {
            gallery.scrollLeft = 0;
        }
    };

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;

                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                // Fade out current items
                galleryItems.forEach(item => {
                    if (!item.classList.contains('hidden') && !item.classList.contains('is-collapsed')) {
                        item.classList.add('fade-out');
                    }
                });

                setTimeout(updateGalleryVisibility, 200);
            });
        });

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                galleryExpanded = true;
                updateGalleryVisibility();
            });
        }

        updateGalleryVisibility();
    }

    /* --------------------------------------------------------------------------
       7. Interactive Lightbox Modal with Rich Metadata
       -------------------------------------------------------------------------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxImgNext = document.getElementById('lightboxImgNext');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCategory = document.getElementById('lightboxCategory');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxClientBadge = document.getElementById('lightboxClientBadge');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentImgIndex = 0;
    let activeItems = [];
    let lastActiveElement = null;

    const getActiveItems = () => {
        return Array.from(document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)'));
    };

    const updateLightboxImage = (index, animate = true) => {
        if (index < 0) index = activeItems.length - 1;
        if (index >= activeItems.length) index = 0;

        const isNext = (index > currentImgIndex && !(currentImgIndex === 0 && index === activeItems.length - 1)) || 
                       (currentImgIndex === activeItems.length - 1 && index === 0);

        currentImgIndex = index;
        const targetItem = activeItems[currentImgIndex];
        const img = targetItem.querySelector('img');
        const titleText = targetItem.dataset.title || targetItem.querySelector('.gallery-title')?.textContent || 'Untitled';
        const categoryKey = targetItem.dataset.category || 'work';
        const clientNote = targetItem.dataset.client || '';
        const year = targetItem.dataset.year || '';

        const activeImg = lightboxImg.classList.contains('active') ? lightboxImg : lightboxImgNext;
        const inactiveImg = activeImg === lightboxImg ? lightboxImgNext : lightboxImg;

        // Update Text & Counter
        if (lightboxTitle) lightboxTitle.textContent = titleText;
        if (lightboxCategory) lightboxCategory.textContent = formatCategory(categoryKey);
        if (lightboxCounter) {
            const formattedIndex = String(currentImgIndex + 1).padStart(2, '0');
            const formattedTotal = String(activeItems.length).padStart(2, '0');
            lightboxCounter.textContent = `${formattedIndex} / ${formattedTotal}`;
        }
        if (lightboxClientBadge) {
            lightboxClientBadge.textContent = clientNote || (year ? `Commission Year: ${year}` : '');
            lightboxClientBadge.style.display = (clientNote || year) ? 'block' : 'none';
        }

        if (animate && !prefersReducedMotion && lightbox.classList.contains('open')) {
            const outClass = isNext ? 'flip-next-out' : 'flip-prev-out';
            const inClass = isNext ? 'flip-next-in' : 'flip-prev-in';

            inactiveImg.src = img.src;
            inactiveImg.alt = img.alt || titleText;
            inactiveImg.className = 'lightbox-img ' + inClass;

            void inactiveImg.offsetWidth; // Force Reflow

            activeImg.className = 'lightbox-img ' + outClass;
            inactiveImg.className = 'lightbox-img active';

            setTimeout(() => {
                activeImg.className = 'lightbox-img';
            }, 550);
        } else {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || titleText;
            lightboxImg.className = 'lightbox-img active';
            lightboxImgNext.className = 'lightbox-img';
            lightboxImgNext.src = '';
        }
    };

    const openLightbox = (index, triggerElement) => {
        activeItems = getActiveItems();
        if (activeItems.length === 0) return;

        lastActiveElement = triggerElement;
        updateLightboxImage(index, false);
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lightbox.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        if (lastActiveElement) {
            lastActiveElement.focus();
        }
    };

    const openGalleryItem = (item) => {
        activeItems = getActiveItems();
        const index = activeItems.indexOf(item);
        if (index !== -1) {
            openLightbox(index, item);
        }
    };

    galleryItems.forEach(item => {
        const title = item.dataset.title || item.querySelector('.gallery-title')?.textContent?.trim() || 'photograph';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `View ${title} in full screen lightbox`);

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

    // Keyboard navigation inside lightbox & focus trap
    window.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            updateLightboxImage(currentImgIndex - 1);
        } else if (e.key === 'ArrowRight') {
            updateLightboxImage(currentImgIndex + 1);
        } else if (e.key === 'Tab') {
            // Trap focus within lightbox controls
            const focusable = lightbox.querySelectorAll('button:not([disabled])');
            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
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
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        updateLightboxImage(currentImgIndex - 1);
                    } else {
                        updateLightboxImage(currentImgIndex + 1);
                    }
                }
            } else {
                if (Math.abs(diffY) > 80 && diffY > 0) {
                    closeLightbox();
                }
            }
        }, { passive: true });
    }

    /* --------------------------------------------------------------------------
       8. ScrollSpy Active Nav Highlighting
       -------------------------------------------------------------------------- */
    const spySections = document.querySelectorAll('header, section, footer');
    const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');

    const scrollSpy = () => {
        const scrollPos = window.scrollY || document.documentElement.scrollTop;

        spySections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
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
    scrollSpy();

    /* --------------------------------------------------------------------------
       9. Scroll Reveal Observer
       -------------------------------------------------------------------------- */
    const revealTargets = document.querySelectorAll('.reveal-on-scroll');

    if (!prefersReducedMotion) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealTargets.forEach(el => observer.observe(el));
    } else {
        revealTargets.forEach(el => el.classList.add('is-visible'));
    }

    /* --------------------------------------------------------------------------
       10. Form Validation & Submissions with Accessible ARIA Feedback
       -------------------------------------------------------------------------- */
    const form = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    const setInputError = (input, errorSpanId, message) => {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        const errorSpan = document.getElementById(errorSpanId);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.classList.add('show');
        }
        if (!prefersReducedMotion) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
        }
    };

    const clearInputError = (input, errorSpanId) => {
        input.classList.remove('invalid');
        input.removeAttribute('aria-invalid');
        const errorSpan = document.getElementById(errorSpanId);
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.classList.remove('show');
        }
    };

    if (form) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        [nameInput, emailInput, messageInput].forEach(inp => {
            if (inp) {
                inp.addEventListener('input', () => {
                    if (inp === nameInput) clearInputError(nameInput, 'nameError');
                    if (inp === emailInput) clearInputError(emailInput, 'emailError');
                    if (inp === messageInput) clearInputError(messageInput, 'msgError');
                });
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            let firstInvalidField = null;

            clearInputError(nameInput, 'nameError');
            clearInputError(emailInput, 'emailError');
            clearInputError(messageInput, 'msgError');

            if (formStatus) {
                formStatus.textContent = '';
                formStatus.classList.remove('is-success');
            }

            // Name verification
            if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
                setInputError(nameInput, 'nameError', 'Please enter your full name or company (at least 2 letters)');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = nameInput;
            }

            // Email verification
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
                setInputError(emailInput, 'emailError', 'Please enter a valid email address');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailInput;
            }

            // Message verification
            if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
                setInputError(messageInput, 'msgError', 'Please include project details (at least 10 characters)');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = messageInput;
            }

            if (!isValid) {
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                return;
            }

            [nameInput, emailInput, messageInput].forEach(inp => {
                if (inp) {
                    inp.addEventListener('input', () => {
                        if (inp === nameInput) clearInputError(nameInput, 'nameError');
                        if (inp === emailInput) clearInputError(emailInput, 'emailError');
                        if (inp === messageInput) clearInputError(messageInput, 'msgError');
                    });
                }
            });

            // Simulation with real-feeling states
            const textDefault = submitBtn.querySelector('.btn-text-default');
            const textLoading = submitBtn.querySelector('.btn-text-loading');

            submitBtn.disabled = true;
            if (textDefault) textDefault.style.display = 'none';
            if (textLoading) textLoading.style.display = 'inline';

            setTimeout(() => {
                if (textLoading) textLoading.style.display = 'none';
                if (textDefault) {
                    textDefault.textContent = 'Inquiry Received ✓';
                    textDefault.style.display = 'inline';
                }
                submitBtn.classList.add('is-success');

                if (formStatus) {
                    formStatus.textContent = 'Thank you! Your message has been received. Sara will review your project and reply within 24–48 hours.';
                    formStatus.classList.add('is-success');
                }

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('is-success');
                    if (textDefault) textDefault.textContent = 'Send a Message';
                    form.reset();
                    if (formStatus) {
                        formStatus.textContent = '';
                        formStatus.classList.remove('is-success');
                    }
                }, 4000);
            }, 200);
        });
    }

});
