document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize ScrollSmoother and ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    if (typeof ScrollSmoother !== 'undefined') {
        ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 1.5,
            effects: true
        });
    }

    const easeQuart = "power4.inOut";
    const easeOut = "power2.out";

    // 2. Button Hover System (Cursor-Follow Flair)
    window.initButtonFlairs = function () {
        const buttons = document.querySelectorAll('.button--stroke, .tl-sidebar-nav a, .tl-sidebar-footer a, .tl-theme-toggle');

        buttons.forEach(btn => {
            if (btn._flairInit) return;
            btn._flairInit = true;
            const flair = btn.querySelector('.button__flair');
            if (!flair) return;

            const xSet = gsap.quickSetter(flair, 'x', 'px');
            const ySet = gsap.quickSetter(flair, 'y', 'px');

            btn.addEventListener('mouseenter', (e) => {
                const rect = btn.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);

                gsap.to(flair, {
                    scale: 1,
                    duration: 0.4,
                    ease: easeOut,
                    overwrite: "auto"
                });
            });

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);
            });

            btn.addEventListener('mouseleave', (e) => {
                const rect = btn.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);

                gsap.to(flair, {
                    scale: 0,
                    duration: 0.4,
                    ease: easeOut,
                    overwrite: "auto"
                });
            });
        });
    };
    initButtonFlairs();



    // 5. MacOS Dock-style Hover System for Navbar (Vertical)
    const navDock = document.querySelector('.tl-sidebar');
    const navItems = document.querySelectorAll('.tl-sidebar-nav a, .tl-sidebar-footer a, .tl-theme-toggle');

    if (navDock && navItems.length > 0 && window.matchMedia("(hover: hover)").matches) {
        // Expand the sidebar smoothly when hovering anywhere over it
        navDock.addEventListener('mouseenter', () => {
            gsap.to(navDock, {
                width: 260,
                duration: 0.4,
                ease: "power3.out",
                overwrite: "auto"
            });
            // Expand all items to full width to reveal text
            gsap.to(navItems, {
                width: '210px',
                duration: 0.4,
                ease: "power3.out",
                overwrite: "auto"
            });
        });

        navDock.addEventListener('mousemove', (e) => {
            navItems.forEach(item => {
                const rect = item.getBoundingClientRect();

                // Check if mouse is directly hovering over THIS specific item
                const isHovered = e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;

                if (isHovered) {
                    gsap.to(item, {
                        scale: 1.1, // Magnify the hovered pill
                        duration: 0.3,
                        ease: "power3.out",
                        overwrite: "auto"
                    });
                } else {
                    gsap.to(item, {
                        scale: 1.1, // Keep non-hovered items normal size
                        duration: 0.3,
                        ease: "power3.out",
                        overwrite: "auto"
                    });
                }
            });
        });

        navDock.addEventListener('mouseleave', () => {
            // Shrink the sidebar back to its original width
            gsap.to(navDock, {
                width: 84,
                duration: 0.5,
                ease: "power3.out",
                overwrite: "auto"
            });

            // Shrink all items back to icon only and reset scale
            navItems.forEach(item => {
                gsap.to(item, {
                    scale: 1,
                    width: '56px',
                    duration: 0.4,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            });
        });
    }

    // 6. Stock Cards — GSAP Hover Animation (Top Gainers + Portfolio)
    window.initStockCardHovers = function () {
        const allStockCards = document.querySelectorAll('.tl-top-stock-card, .tl-stock-card');
        if (allStockCards.length === 0) return;

        const cs = getComputedStyle(document.documentElement);

        allStockCards.forEach(card => {
            if (card._hoverInit) return;
            card._hoverInit = true;

            // Create a flair element for the radial fill effect
            const flair = document.createElement('span');
            flair.className = 'tl-top-stock-flair';
            flair.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 0;
                transform: scale(0);
                transform-origin: 0 0;
                will-change: transform;
            `;

            // Inner circle for the radial fill
            const flairInner = document.createElement('span');
            flairInner.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 200%;
                aspect-ratio: 1/1;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;
            flair.appendChild(flairInner);
            card.style.position = 'relative';
            card.insertBefore(flair, card.firstChild);

            // Ensure card content stays above the flair
            Array.from(card.children).forEach(child => {
                if (child !== flair) {
                    child.style.position = 'relative';
                    child.style.zIndex = '1';
                }
            });

            const xSet = gsap.quickSetter(flair, 'x', 'px');
            const ySet = gsap.quickSetter(flair, 'y', 'px');

            card.addEventListener('mouseenter', (e) => {
                const rect = card.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);

                const currentIsLight = document.documentElement.getAttribute('data-theme') === 'light';
                const bgFill = currentIsLight ? '#000000' : '#000d7e70';
                const borderHoverColor = currentIsLight ? '#000000' : 'var(--tl-border-bright)';
                const textOnFill = '#FFFFFF';

                flairInner.style.backgroundColor = bgFill;

                gsap.to(flair, {
                    scale: 1,
                    duration: 0.45,
                    ease: easeOut,
                    overwrite: 'auto'
                });

                gsap.to(card, {
                    borderColor: borderHoverColor,
                    duration: 0.3,
                    ease: easeOut,
                    overwrite: 'auto'
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-symbol, .tl-stock-card-symbol'), {
                    color: '#FFFFFF',
                    duration: 0.3,
                    ease: easeOut
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-name, .tl-stock-card-shares'), {
                    color: '#ffffff',
                    duration: 0.3,
                    ease: easeOut
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-price, .tl-stock-card-price'), {
                    color: textOnFill,
                    duration: 0.3,
                    ease: easeOut
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-change'), {
                    color: textOnFill,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    duration: 0.3,
                    ease: easeOut
                });

                gsap.to(card.querySelectorAll('.tl-stock-card-total'), {
                    color: 'rgba(255,255,255,0.7)',
                    duration: 0.3,
                    ease: easeOut
                });

                gsap.to(card.querySelectorAll('.tl-stock-card-total span'), {
                    color: '#ffffffff',
                    duration: 0.3,
                    ease: easeOut
                });
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);
            });

            card.addEventListener('mouseleave', (e) => {
                const rect = card.getBoundingClientRect();
                xSet(e.clientX - rect.left);
                ySet(e.clientY - rect.top);

                gsap.to(flair, {
                    scale: 0,
                    duration: 0.4,
                    ease: easeOut,
                    overwrite: 'auto'
                });

                gsap.to(card, {
                    borderColor: '',
                    duration: 0.35,
                    ease: easeOut,
                    overwrite: 'auto',
                    clearProps: 'borderColor'
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-symbol, .tl-stock-card-symbol'), {
                    color: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color'
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-name, .tl-stock-card-shares'), {
                    color: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color'
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-price, .tl-stock-card-price'), {
                    color: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color'
                });

                gsap.to(card.querySelectorAll('.tl-top-stock-change'), {
                    color: '',
                    backgroundColor: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color,backgroundColor'
                });

                gsap.to(card.querySelectorAll('.tl-stock-card-total'), {
                    color: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color'
                });

                gsap.to(card.querySelectorAll('.tl-stock-card-total span'), {
                    color: '',
                    duration: 0.3,
                    ease: easeOut,
                    clearProps: 'color'
                });
            });
        });
    };

    // Run on initial load
    if (window.matchMedia("(hover: hover)").matches) {
        initStockCardHovers();
    }

    // 7. Password Visibility Toggle
    document.querySelectorAll('.tl-password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.classList.toggle('active', isPassword);
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    });
});
