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
    const buttons = document.querySelectorAll('.button--stroke');

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
        const magneticElements = document.querySelectorAll('a:not(.button), .tl-sidebar-nav a, .hover-target');

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

    // 4. Reveal on Scroll System
    const revealTargets = document.querySelectorAll('.tl-card, .tl-page-header, .tl-bento-stats, .tl-stock-grid > div, .tl-auth-container');
    
    revealTargets.forEach(target => {
        gsap.fromTo(target, 
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: easeOut,
                scrollTrigger: {
                    trigger: target,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });
});
