function getSessionizeThumbnail(url, size) {
    if (!url) return url;
    return url.replace(/-\d+o\d+o\d+-/, `-${size}o${size}o1-`);
}

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
        a.setAttribute("data-bs-dismiss", "modal");
        //a.setAttribute("aria-label", "close");
    }
    return a;
}

function getTrackNameAndRoom(trackName) {
    if ( !trackName ) {
        return "TBD";
    }
    var elem = trackToRoomElements(trackName);
    return elem.tight;
}

function getStartEndString(session) {
    if ( !session.startsAt || !session.endsAt ) {
        return "TBD";
    }
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

function createBootstrapModal(id, labelId) {
    var modal = document.createElement("div");
    modal.className = "modal fade text-start people-modal";
    modal.id = id;
    modal.tabIndex = "-1";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", labelId);
    modal.setAttribute("aria-hidden", "true");

    var modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog modal-lg";
    modalDialog.setAttribute("role", "document");

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "btn-close float-end";
    close.setAttribute("data-bs-dismiss", "modal");
    close.setAttribute("aria-label", "Close");
    modalBody.append(close);

    modalContent.append(modalBody);
    modalDialog.append(modalContent);
    modal.append(modalDialog);

    return {
        modal: modal,
        body: modalBody
    };
}

function getSessionLevel(session) {
    const categoryLevelId = 75411;
    if (!session || !session.categories) {
        return "TBD";
    }
    const category = session.categories.find(cat => cat.id === categoryLevelId);
    if (category && category.categoryItems) {
        const levelItem = category.categoryItems.find(item => item.name != null);
        if (levelItem) {
            return levelItem.name;
        }
    }
    return "TBD";
}

function addSessionContentToModal(modalBody, session, trackName) {
    const title = document.createElement("h4");
    title.innerText = session.title;
    modalBody.append(title);

    const room = document.createElement("span");
    room.classList.add("theme-metadata");

    const caption = document.createElement("span");
    caption.classList.add("caption");
    caption.innerText = "Track: ";
    room.append(caption, getTrackNameAndRoom(trackName));

    const captionTime = document.createElement("span");
    captionTime.classList.add("caption");
    captionTime.innerText = "Time: " + getStartEndString(session);
    room.append(document.createElement("br"), captionTime);

    const level = document.createElement("span");
    level.classList.add("caption");
    level.innerText = "Session Level: " + getSessionLevel(session);
    room.append(document.createElement("br"), level);
    modalBody.append(room);

    const description = document.createElement("p");
    description.classList.add("theme-description");
    description.innerText = session.description;
    modalBody.append(description);
}

function addSpeakerContentToModal(modalBody, speaker, baseUrl) {
    const peopleDetails = document.createElement("div");
    peopleDetails.classList.add("people-details");

    const row = document.createElement("div");
    row.classList.add("row");

    const headshot = document.createElement("div");
    headshot.classList.add("col-md-2", "col-12");

    const speakerHeadshot = document.createElement("img");
    speakerHeadshot.id = "speakerProfileUrl-" + speaker.id;
    speakerHeadshot.classList.add("flow-img", "img-circle", "people-img");
    speakerHeadshot.loading = "lazy";
    speakerHeadshot.decoding = "async";
    speakerHeadshot.alt = speaker.fullName || speaker.name || "";
    if (speaker.profilePicture) {
        speakerHeadshot.src = speaker.profilePicture;
    }
    headshot.append(speakerHeadshot);
    row.append(headshot);

    const details = document.createElement("div");
    details.classList.add("col-md-10", "col-12", "details");

    const name = document.createElement("p");
    name.classList.add("name", "mb-2");
    name.innerText = speaker.fullName || speaker.name || "";
    details.append(name);

    const tagline = document.createElement("p");
    tagline.id = "speakerTagLine-" + speaker.id;
    tagline.classList.add("position", "mb-1");
    tagline.innerText = speaker.tagLine || "";
    
    // Add social icons immediately if they exist
    if (speaker.questionAnswers || speaker.links) {
        backfillSpeakerSocial(speaker, tagline, baseUrl);
    }
    
    details.append(tagline);

    const pronouns = document.createElement("small");
    pronouns.id = "speakerPronouns-" + speaker.id;
    pronouns.classList.add("d-block", "mb-2");
    backfillSpeakerPronouns(speaker, pronouns);
    details.append(pronouns);

    const bio = document.createElement("p");
    bio.id = "speakerBio-" + speaker.id;
    bio.classList.add("about");
    bio.innerText = speaker.bio || "";
    details.append(bio);
    row.append(details);

    peopleDetails.append(row);
    modalBody.append(peopleDetails);
}

function normalizeTwitter(handle) {
    if (handle.startsWith("@")) return handle.substring(1);
    if (handle.startsWith("http")) {
        const parts = handle.split("/");
        return parts.at(-1);
    }
    return handle;
}

function getTwitterIcon(handle, baseUrl) {
    const twitterLink = document.createElement("a");
    twitterLink.classList.add("ms-2");
    twitterLink.href = "https://x.com/" + encodeURIComponent(normalizeTwitter(handle));

    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.classList.add("icon", "icon-twitter");
    svgIcon.setAttribute("viewBox", "0 0 30 32");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("href", "#icon-twitter");
    svgIcon.append(icon);
    twitterLink.append(svgIcon);

    return twitterLink;
}

function getLinkedInIcon(url, baseUrl) {
    const isValidUrl = (str) => {
        try { new URL(str); return true; } catch (e) { return false; }
    };
    if (!isValidUrl(url)) return null;

    const link = document.createElement("a");
    link.classList.add("ms-2");
    link.href = url;

    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.classList.add("icon", "icon-linkedin");
    svgIcon.setAttribute("viewBox", "0 0 30 32");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("href", "#icon-linkedin");
    svgIcon.append(icon);
    link.append(svgIcon);

    return link;
}
