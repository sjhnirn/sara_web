document.addEventListener('DOMContentLoaded', () => {

    /* -------------------------
       1. Navbar Scroll Effect
    ------------------------- */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    /* -------------------------
       2. Smooth Scrolling
    ------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offset = window.pageYOffset + target.getBoundingClientRect().top - 80;
            window.scrollTo({ top: offset, behavior: 'smooth' });

            // Close mobile menu if open
            mobileMenu.classList.remove('open');
        });
    });

    /* -------------------------
       3. Mobile Burger Menu
    ------------------------- */
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    burger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });

    // Close on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });

    /* -------------------------
       4. Gallery Category Filter
    ------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            galleryItems.forEach(item => {
                const category = item.dataset.category;
                const show = filter === 'all' || category === filter;
                item.classList.toggle('hidden', !show);
            });
        });
    });

    /* -------------------------
       5. Scroll Reveal Observer
    ------------------------- */
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

    /* -------------------------
       6. Contact Form Handler
    ------------------------- */
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn-submit');
            btn.textContent = 'Message Sent ✓';
            btn.style.borderColor = '#6dbf67';
            btn.style.color = '#6dbf67';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = 'Send Message';
                btn.style.borderColor = '';
                btn.style.color = '';
                btn.disabled = false;
                form.reset();
            }, 4000);
        });
    }

});
