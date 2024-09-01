function normalizeTrackName(trackName) {
    return trackName.replace(/\s/g, "").toLowerCase();;
}
function getTrackNameAndRoom(trackName) {
    if ( trackName == "Tech - Red" ) {
        return "Red (L.63)";
    }
    else if ( trackName == "Tech - Blue" ) {
        return "Blue (L2.84)";
    }
    else if ( trackName == "Tech - Other" ) {
        return "Other (L2.85)";
    } else if (trackName == "Workshop") {
        return "Workshop (L.61)";
    } else if (trackName == "Entrepreneur") {
        return "Entrepreneur (L.76)";
    }

    return trackName;
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
