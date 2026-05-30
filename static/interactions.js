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

    // 8. Google Sign-In (Firebase)
    function handleGoogleSignIn(btn) {
        if (!btn || typeof firebase === 'undefined') return;

        btn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();

            // Add loading state
            btn.disabled = true;
            const originalText = btn.querySelector('span').textContent;
            btn.querySelector('span').textContent = 'Signing in...';

            firebase.auth().signInWithPopup(provider)
                .then(result => result.user.getIdToken())
                .then(idToken => {
                    return fetch('/google-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/';
                    } else {
                        alert(data.error || 'Google sign-in failed');
                        btn.disabled = false;
                        btn.querySelector('span').textContent = originalText;
                    }
                })
                .catch(err => {
                    console.error('Google sign-in error:', err);
                    // Don't alert on user-cancelled popup
                    if (err.code !== 'auth/popup-closed-by-user') {
                        alert('Google sign-in failed. Please try again.');
                    }
                    btn.disabled = false;
                    btn.querySelector('span').textContent = originalText;
                });
        });
    }

    handleGoogleSignIn(document.getElementById('google-signin-btn'));
    handleGoogleSignIn(document.getElementById('google-signup-btn'));

    // 9. Legacy Credentials Client-Side Validation
    const loginForm = document.querySelector('form[action="/login"]');
    const registerForm = document.querySelector('form[action="/register"]');

    function showError(form, message) {
        // Remove existing error message if any
        const existingError = form.querySelector('.tl-client-error');
        if (existingError) {
            existingError.remove();
        }

        // Create elegant error display element using TradeLab theme
        const errorDiv = document.createElement('div');
        errorDiv.className = 'tl-flash tl-client-error';
        errorDiv.style.cssText = 'border-color: var(--tl-red) !important; border-left-color: var(--tl-red) !important; margin-bottom: 1.25rem; font-weight: 500;';
        errorDiv.textContent = message;

        // Insert at the top of the form
        form.insertBefore(errorDiv, form.firstChild);

        // Subtle pop animation with GSAP
        gsap.fromTo(errorDiv, 
            { opacity: 0, y: -10, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.7)" }
        );
    }

    function validateCredentials(username, password) {
        // Bypass length constraints for 'admin/admin'
        if (username === 'admin' && password === 'admin') {
            return { valid: true };
        }

        if (username.length < 5) {
            return { valid: false, message: 'Username must be at least 5 characters long.' };
        }

        if (password.length <= 6) {
            return { valid: false, message: 'Password must be greater than 6 characters.' };
        }

        return { valid: true };
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            if (!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            const validation = validateCredentials(username, password);
            if (!validation.valid) {
                e.preventDefault();
                showError(loginForm, validation.message);
                
                // Animate/shake inputs slightly to grab attention
                gsap.to([usernameInput, passwordInput], {
                    x: (i) => i === 0 ? -6 : 6,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        gsap.set([usernameInput, passwordInput], { x: 0 });
                    }
                });
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            const usernameInput = document.getElementById('reg-username');
            const passwordInput = document.getElementById('reg-password');
            const confirmInput = document.getElementById('reg-confirm');
            if (!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // First run the standard validation
            const validation = validateCredentials(username, password);
            if (!validation.valid) {
                e.preventDefault();
                showError(registerForm, validation.message);
                
                gsap.to([usernameInput, passwordInput], {
                    x: (i) => i === 0 ? -6 : 6,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        gsap.set([usernameInput, passwordInput], { x: 0 });
                    }
                });
                return;
            }

            // Confirm password matches check
            if (confirmInput && password !== confirmInput.value) {
                e.preventDefault();
                showError(registerForm, "Passwords do not match.");
                gsap.to([passwordInput, confirmInput], {
                    x: (i) => i === 0 ? -6 : 6,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        gsap.set([passwordInput, confirmInput], { x: 0 });
                    }
                });
            }
        });
    }
});
