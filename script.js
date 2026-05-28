document.addEventListener('DOMContentLoaded', () => {

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
       3. Custom Elegant Cursor
       -------------------------------------------------------------------------- */
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');
    if (cursor && cursorDot) {
        let mouseX = -100, mouseY = -100;
        let cursorX = -100, cursorY = -100;
        let dotX = -100, dotY = -100;
        
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Loop for smooth trailing interpolation
        const updateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.12;
            cursorY += (mouseY - cursorY) * 0.12;
            dotX += (mouseX - dotX) * 0.3;
            dotY += (mouseY - dotY) * 0.3;

            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
            cursorDot.style.left = `${dotX}px`;
            cursorDot.style.top = `${dotY}px`;

            requestAnimationFrame(updateCursor);
        };
        updateCursor();

        // Cursor interactions
        const hoverables = document.querySelectorAll('a, button, input, select, textarea, .filter-btn');
        hoverables.forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });

        const viewables = document.querySelectorAll('.gallery-item');
        viewables.forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('cursor-view'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('cursor-view'));
        });
        
        // Hide cursor when mouse leaves the document window
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            cursorDot.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
            cursorDot.style.opacity = '1';
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
            window.scrollTo({ top: offset, behavior: 'smooth' });

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
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });

        // Close mobile overlay on links click
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
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
        if (category === 'commercial') return 'Commercial';
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

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

    const updateLightboxImage = (index) => {
        if (index < 0) index = activeItems.length - 1;
        if (index >= activeItems.length) index = 0;

        currentImgIndex = index;
        const targetItem = activeItems[currentImgIndex];
        const img = targetItem.querySelector('img');
        const titleText = targetItem.querySelector('.gallery-title').textContent;
        const categoryText = targetItem.dataset.category;

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxTitle.textContent = titleText;
        lightboxCategory.textContent = formatCategory(categoryText);
    };

    const openLightbox = (index) => {
        activeItems = getActiveItems();
        if (activeItems.length === 0) return;

        updateLightboxImage(index);
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Lock back scroll
    };

    const closeLightbox = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Unlock back scroll
    };

    // Attach click events to gallery items
    galleryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            activeItems = getActiveItems();
            const index = activeItems.indexOf(item);
            if (index !== -1) {
                openLightbox(index);
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

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealTargets.forEach(el => observer.observe(el));

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
        
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
    };

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            // Clear previous errors
            form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
            form.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

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
                submitBtn.classList.add('shake');
                setTimeout(() => submitBtn.classList.remove('shake'), 400);
                return;
            }

            // Valid Form Submission Output
            const btn = form.querySelector('.btn-submit');
            const originalText = btn.textContent;
            btn.textContent = 'Message Sent ✓';
            btn.style.borderColor = '#6dbf67';
            btn.style.color = '#6dbf67';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.borderColor = '';
                btn.style.color = '';
                btn.disabled = false;
                form.reset();
            }, 4000);
        });
    }

});
