// Shows the registration link once registrationOpenDate passes. If the page is
// already open at that time, the link appears automatically without a refresh.
function openRegistration(registrationOpen, registrationOpenDate, registrationLink) {
    // If registrationOpen is false, only the closed content is shown
    if (!registrationOpen) return;

    const openTime = new Date(registrationOpenDate).getTime();

    const reveal = () => {
        document.getElementById('registration_link').href = registrationLink;
        document.getElementById('registration_button').href = registrationLink;
        document.getElementById('registration_closed').hidden = true;
        document.getElementById('registration_open').hidden = false;
    };

    if (isNaN(openTime) || Date.now() >= openTime) {
        reveal();
        return;
    }

    const opensAt = new Date(openTime).toLocaleString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        timeZone: 'America/New_York'
    });
    document.getElementById('registration_closed_message').textContent =
        `Registration opens ${opensAt}.`;

    // Re-check against the clock every second rather than relying on one long
    // setTimeout, which browsers throttle or delay in background tabs / on sleep.
    const timer = setInterval(() => {
        if (Date.now() >= openTime) {
            clearInterval(timer);
            reveal();
        }
    }, 1000);
}
