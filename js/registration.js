function openRegistration(registrationOpen, registrationOpenDate, registrationLink, eventDate) {
    var openDate = new Date(registrationOpenDate);
    var eventDate = new Date(eventDate);
    var now = new Date();

    // If registrationOpen is False, we only show registration_closed content
    if ( (! registrationOpen) || ( now.getTime() < openDate.getTime() ) ) {
        var open = document.getElementById("registration_open");
        open.classList.add("d-none");

        var closed = document.getElementById("registration_closed_message");
        if ( now.getTime() < openDate.getTime() ) {
            closed.innerText = "Registration is currently set to open at " + openDate + ". Check back here at that time.";
        }
        return;
    }


    // Default to registration open

    var closed = document.getElementById("registration_closed");
    closed.classList.add("d-none");

    var link = document.getElementById("registration_link");
    link.href = registrationLink;

    var button = document.getElementById("registration_button");
    button.href = registrationLink;

}
