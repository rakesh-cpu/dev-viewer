/**
 * DevViewer Analytics Module
 * Provides product analytics tracking for user interactions
 * All tracking is anonymous using randomly generated UUIDs
 */

(function () {
    'use strict';

    // Initialize user ID
    let uid = localStorage.getItem('dv_uid');
    if (!uid) {
        uid = crypto.randomUUID();
        localStorage.setItem('dv_uid', uid);
    }

    // Store globally for access
    window.DV_UID = uid;

    // Configure Google Analytics with user_id
    if (window.gtag) {
        gtag('config', 'G-BYRYTN12Q3', {
            user_id: uid,
            send_page_view: true
        });
    }

    /**
     * Track custom events
     * @param {string} event - Event name
     * @param {object} data - Additional event data
     */
    window.track = function (event, data = {}) {
        if (!window.gtag) {
            console.warn('📊 Analytics: gtag not available');
            return;
        }

        const eventData = {
            app_name: 'devviewer',
            user_id: window.DV_UID,
            ...data
        };

        gtag('event', event, eventData);
    };

    // Track first visit vs return visit
    const firstVisitKey = 'dv_first_visit';
    const firstVisit = localStorage.getItem(firstVisitKey);

    if (!firstVisit) {
        localStorage.setItem(firstVisitKey, Date.now());
        window.track('first_visit', {
            timestamp: Date.now()
        });
    } else {
        window.track('return_visit', {
            first_visit_timestamp: parseInt(firstVisit),
            days_since_first_visit: Math.floor((Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24))
        });
    }

    // Engagement heartbeat - tracks active usage
    let heartbeatInterval = null;
    let heartbeatCount = 0;

    function startHeartbeat() {
        if (heartbeatInterval) return; // Already running

        heartbeatInterval = setInterval(() => {
            heartbeatCount++;
            window.track('heartbeat', {
                count: heartbeatCount,
                session_duration_seconds: heartbeatCount * 20
            });
        }, 20000); // Every 20 seconds
    }

    function stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    // Start heartbeat when user interacts with the page
    let heartbeatStarted = false;
    function ensureHeartbeatStarted() {
        if (!heartbeatStarted) {
            startHeartbeat();
            heartbeatStarted = true;
        }
    }

    // Listen for user interactions to start heartbeat
    ['click', 'keydown', 'scroll', 'paste'].forEach(eventType => {
        document.addEventListener(eventType, ensureHeartbeatStarted, { once: true });
    });

    // Stop heartbeat when page is hidden/closed
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopHeartbeat();
        } else if (heartbeatStarted) {
            startHeartbeat();
        }
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
        if (heartbeatCount > 0) {
            window.track('session_end', {
                total_heartbeats: heartbeatCount,
                total_duration_seconds: heartbeatCount * 20
            });
        }
    });

})();
