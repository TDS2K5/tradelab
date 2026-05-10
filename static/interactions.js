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
    const buttons = document.querySelectorAll('.button--stroke, .tl-sidebar-nav a, .tl-sidebar-footer a, .tl-theme-toggle');

    buttons.forEach(btn => {
        const flair = btn.querySelector('.button__flair');
        if (!flair) return;

        // Create quickSetters for better performance (60fps)
        const xSet = gsap.quickSetter(flair, 'x', 'px');
        const ySet = gsap.quickSetter(flair, 'y', 'px');

        btn.addEventListener('mouseenter', (e) => {
            const rect = btn.getBoundingClientRect();
            // Start the flair at the cursor position
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
            // Follow cursor smoothly
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

    // 3. Magnetic Hover System (for links, cards, icons, nav items)
    // Avoid magnetic effect on mobile where hover doesn't make sense
    if (window.matchMedia("(hover: hover)").matches) {
        const magneticElements = document.querySelectorAll('a:not(.button):not(.tl-sidebar-nav a):not(.tl-sidebar-footer a), .hover-target');

        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Subtle x/y translation towards the mouse
                gsap.to(el, {
                    x: x * 0.15,
                    y: y * 0.15,
                    duration: 0.4,
                    ease: easeOut
                });
            });

            el.addEventListener('mouseleave', () => {
                // Reset translation
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.3)" // soft magnetic release
                });
            });
        });
    }

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
});
