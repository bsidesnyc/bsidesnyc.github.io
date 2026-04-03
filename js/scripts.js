(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Initial setup
        const container = document.querySelector('.st-container');
        if (container) {
            container.classList.remove('disable-scrolling');
        }
        
        const loadingAnimation = document.getElementById('loading-animation');
        if (loadingAnimation) {
            loadingAnimation.style.display = 'none';
        }
        
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.transition = 'opacity 0.8s';
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }

        const windowWidth = window.innerWidth;
        if (windowWidth > 1500) {
            document.querySelectorAll('.effect-wrapper').forEach(el => el.classList.add('col-lg-3'));
        }
        
        if (windowWidth < 768) {
            document.querySelectorAll('.animated').forEach(el => {
                el.classList.remove('animated');
                el.classList.remove('hiding');
            });
            document.querySelectorAll('.stat span').forEach(el => el.classList.remove('timer'));
            document.querySelectorAll('.timeslot-label').forEach(el => el.classList.add('stick-label'));
            const logo = document.querySelector('#logo-header .logo');
            if (logo) logo.classList.remove('logo-light');
        }

        if (window.innerHeight < 512) {
            const bottomNav = document.getElementById('bottom-navlinks');
            if (bottomNav) {
                bottomNav.classList.remove('bottom-navlinks');
                bottomNav.classList.add('bottom-navlinks-small');
            }
        }

        const header = document.getElementById('top-header');
        const logo = document.querySelector('#logo-header .logo');
        if (window.scrollY >= 100) {
            if (header) header.classList.add('after-scroll');
            if (logo) {
                logo.classList.remove('logo-light');
                logo.classList.add('logo-dark');
            }
        }

        // Scroll listener
        window.addEventListener('scroll', function() {
            const scroll = window.scrollY;
            const buyButton = document.querySelector('.right-nav-button');
            const topSection = document.querySelector('.top-section');
            const topSectionHeight = topSection ? topSection.offsetHeight : 0;

            if (scroll >= 100) {
                if (header) header.classList.add('after-scroll');
                if (logo) {
                    logo.classList.remove('logo-light');
                    logo.classList.add('logo-dark');
                }
            } else {
                if (header) header.classList.remove('after-scroll');
                if (logo) {
                    logo.classList.remove('logo-dark');
                    logo.classList.add('logo-light');
                }
            }

            if (buyButton && window.innerWidth > 767) {
                if (scroll >= topSectionHeight) {
                    buyButton.classList.remove('right-nav-button-hidden');
                } else {
                    buyButton.classList.add('right-nav-button-hidden');
                }
            }

            const trackHeaderSticky = document.querySelector('.track-header.sticky');
            if (trackHeaderSticky) {
                const headerHeight = header ? header.offsetHeight : 0;
                const trackHeaderHeight = document.querySelector('.track-header') ? document.querySelector('.track-header').offsetHeight : 0;
                const topOffset = headerHeight + trackHeaderHeight;

                document.querySelectorAll('.slot').forEach(slot => {
                    const currentPosition = slot.getBoundingClientRect().top;
                    const slotTitle = slot.querySelector('.slot-title');
                    const slotTitleHeight = slotTitle ? slotTitle.offsetHeight : 0;
                    const offsetActivator = topOffset + slotTitleHeight;
                    
                    if (currentPosition <= offsetActivator && currentPosition >= 0) {
                        const detail = trackHeaderSticky.querySelector('.slot-detail');
                        if (detail) detail.innerHTML = slot.dataset.slotDetail || '';
                    }
                });
            }
        }, { passive: true });

        // Resize listener
        window.addEventListener('resize', function() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            document.querySelectorAll('.effect-wrapper').forEach(el => {
                if (width > 1500) el.classList.add('col-lg-3');
                else el.classList.remove('col-lg-3');
            });

            if (width < 768) {
                document.querySelectorAll('.same-height').forEach(el => el.style.height = '100%');
                document.querySelectorAll('.timeslot-label').forEach(el => el.classList.add('stick-label'));
            } else {
                document.querySelectorAll('.timeslot-label').forEach(el => el.classList.remove('stick-label'));
                if (container && container.classList.contains('st-menu-open')) {
                    container.classList.remove('st-menu-open');
                    document.body.style.overflow = 'auto';
                }
            }

            const menu = document.querySelector('.st-menu');
            const bottomNav = document.getElementById('bottom-navlinks');
            if (height < 512) {
                if (menu) menu.classList.add('scrollable');
                if (bottomNav) {
                    bottomNav.classList.remove('bottom-navlinks');
                    bottomNav.classList.add('bottom-navlinks-small');
                }
            } else {
                if (menu) menu.classList.remove('scrollable');
                if (bottomNav) {
                    bottomNav.classList.remove('bottom-navlinks-small');
                    bottomNav.classList.add('bottom-navlinks');
                }
            }
        });

        // Prevent default for empty links
        document.addEventListener('click', function(e) {
            const anchor = e.target.closest('a[href="#"]');
            if (anchor) e.preventDefault();
        });

        // Hash handling for schedule
        if (window.location.href.indexOf("schedule") > -1 && window.location.hash) {
            const hash = window.location.hash;
            const targetEl = document.querySelector(hash);
            if (targetEl) targetEl.click();
        }

        // IntersectionObserver for animations
        if ('IntersectionObserver' in window) {
            const appearObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const animation = el.dataset.animation;
                        const delay = parseInt(el.dataset.delay || 0);
                        
                        setTimeout(() => {
                            el.classList.add(animation, 'visible');
                            el.classList.remove('hiding');
                            if (el.classList.contains('counter')) {
                                el.querySelectorAll('.timer').forEach(animateCountTo);
                            }
                        }, delay);
                        appearObserver.unobserve(el);
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.animated, .appear-animation-trigger').forEach(el => {
                if (el.classList.contains('appear-animation-trigger')) {
                    const appearChildObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const parent = el.parentElement;
                                if (parent) {
                                    parent.querySelectorAll('.appear-animation').forEach(target => {
                                        target.classList.add('visible');
                                    });
                                }
                                appearChildObserver.unobserve(el);
                            }
                        });
                    });
                    appearChildObserver.observe(el);
                } else {
                    appearObserver.observe(el);
                }
            });
        } else {
            document.querySelectorAll('.animated').forEach(el => el.classList.remove('hiding'));
            document.querySelectorAll('.appear-animation').forEach(el => el.classList.add('visible'));
            document.querySelectorAll('.timer').forEach(animateCountTo);
        }

        function animateCountTo(element) {
            const from = parseFloat(element.dataset.from || 0);
            const to = parseFloat(element.dataset.to || 0);
            const speed = parseInt(element.dataset.speed || 1000);
            const refreshInterval = parseInt(element.dataset.refreshInterval || 100);
            const decimals = parseInt(element.dataset.decimals || 0);
            
            const steps = Math.ceil(speed / refreshInterval);
            const increment = (to - from) / steps;
            let current = from;
            let stepCount = 0;
            
            const timer = setInterval(() => {
                current += increment;
                stepCount++;
                
                if (stepCount >= steps) {
                    clearInterval(timer);
                    current = to;
                }
                
                element.textContent = current.toFixed(decimals);
            }, refreshInterval);
        }

        // Side menu
        const menuTrigger = document.getElementById('menu-trigger');
        if (menuTrigger) {
            menuTrigger.addEventListener('click', function(event) {
                event.stopPropagation();
                if (container) container.classList.toggle('st-menu-open');
            });
        }

        const pusher = document.querySelector('.st-pusher');
        if (pusher) {
            pusher.addEventListener('click', function() {
                if (container && container.classList.contains('st-menu-open')) {
                    container.classList.remove('st-menu-open');
                }
            });
        }

        // Track header detail backfill
        document.querySelectorAll('.track-header').forEach(header => {
            const table = header.closest('.schedule-table');
            if (table) {
                const slots = table.querySelectorAll('.slot');
                for (let slot of slots) {
                    const detail = slot.dataset.slotDetail;
                    if (detail) {
                        const headerDetail = header.querySelector('.slot-detail');
                        if (headerDetail) headerDetail.innerHTML = detail;
                        break;
                    }
                }
            }
        });

        // Feature image backfill for posts
        document.querySelectorAll('#post-section .post-body p').forEach(p => {
            const featureImg = p.querySelector('.feature-image');
            if (featureImg) {
                const url = featureImg.src;
                const topSection = document.getElementById('top-section');
                if (topSection) {
                    topSection.style.backgroundImage = 'url(' + url + ')';
                    topSection.classList.add('enable-overlay');
                }
            }
        });

        // Modal iframe source reset on hide
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('hidden.bs.modal', function() {
                const iframe = modal.querySelector('iframe');
                if (iframe) {
                    iframe.src = iframe.src;
                }
            });
        });

        // Slot click hash update
        document.addEventListener('click', function(e) {
            const slot = e.target.closest('.slot');
            if (slot && slot.id) {
                location.hash = slot.id;
            }
        });
    });

    // Registration (Global scope fallback if needed)
    window.registration = function(registrationOpen, registrationOpenDate, registrationLink) {
        if (registrationOpen) {
            const div = document.getElementById("registration_closed");
            if (div) div.classList.add("d-none");
        } else {
            const div = document.getElementById("registration_open");
            if (div) div.classList.add("d-none");
        }
    };

})();
