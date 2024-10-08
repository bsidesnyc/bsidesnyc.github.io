function normalizeTrackName(trackName) {
    return trackName.replace(/\s/g, "").toLowerCase();;
}

function trackToRoomElements(trackName) {
    var mapping = {
        "Tech - Red": {
            heading: "Tech - Red (L.63)",
            tight: "Red (L.63)",
            divId: "map-l"
        },
        "Tech - Blue": {
            heading: "Tech - Blue (L2.84)",
            tight: "Blue (L2.84)",
            divId: "map-l2"
        },
        "Tech - Other": {
            heading: "Tech - Other (L2.85)",
            tight: "Other (L2.85)",
            divId: "map-l2"
        },
        "Workshop": {
            heading: "Workshop (L.61)",
            tight: "Workshop (L.61)",
            divId: "map-l"
        },
        "Entrepreneur": {
            heading: "Entrepreneur (L.76)",
            tight: "Entrepreneur (L.76)",
            divId: "map-l"
        }
    }
    if ( mapping.hasOwnProperty(trackName) ) {
        return mapping[trackName];
    }

    return { full: trackName, tight: trackName, divId: undefined }
}

function getTrackNameAndRoomHtml(trackName, heading, closeModal) {
    /*
     * Returns tight track name and room, within a
     * html element meant to be .append()ed
     */
    var elem = trackToRoomElements(trackName);

    if ( elem.divId === undefined ) {
        return document.createTextNode(elem.tight);
    }

    var a = document.createElement("a");
    a.classList.add("skip-modal");
    a.href = "#" + elem.divId;
    if ( heading ) {
        a.innerText = elem.heading;
    } else {
        a.innerText = elem.tight;
    }

    if ( closeModal ) {
        a.setAttribute("data-dismiss", "modal");
        //a.setAttribute("aria-label", "close");
    }
    return a;
}

function getTrackNameAndRoom(trackName) {
    var elem = trackToRoomElements(trackName);
    return elem.tight;
}

function getStartEndString(session) {
    var start = new Date(session.startsAt);
    var end = new Date(session.endsAt);

    return start.getHours() + 
        ":" + 
        padMinutes(start) + 
        " - " + 
        end.getHours() + 
        ":" + 
        padMinutes(end);
}
function padMinutes(time) {
    if ( time.getMinutes() < 10 ) {
        return "0" + time.getMinutes();
    }
    return time.getMinutes();

}
