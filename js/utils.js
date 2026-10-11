function getSessionizeThumbnail(url, size) {
    if (!url) return url;
    return url.replace(/-\d+o\d+o\d+-/, `-${size}o${size}o1-`);
}

// Set by _layouts/default.html; empty when the site is served from the root
const SITE_BASEURL = window.siteBaseUrl || "";
const SPEAKER_PLACEHOLDER = SITE_BASEURL + "/img/other/speaker-placeholder.svg";

/*
 * Headshots: try the resized Sessionize thumbnail, then the original, then
 * the placeholder. Each step is logged so a broken headshot can be traced
 * to a missing photo vs. a URL that won't load. With lazy, the URL goes in
 * data-src for scripts.js to load when the modal opens.
 */
function setSpeakerHeadshot(img, url, size, lazy) {
    const name = img.alt || "a speaker";
    const sources = [];
    if ( url ) {
        const thumb = size ? getSessionizeThumbnail(url, size) : url;
        sources.push(thumb);
        if ( thumb !== url ) sources.push(url);
    } else {
        console.warn("No headshot in Sessionize for " + name + "; using placeholder");
    }
    sources.push(SPEAKER_PLACEHOLDER);

    img.onerror = () => {
        const failed = sources.shift();
        console.warn("Headshot for " + name + " failed to load: " + failed);
        if ( sources.length ) img.src = sources[0];
    };
    img.classList.toggle("is-placeholder", !url);
    if ( lazy && !img.getAttribute("src") ) {
        img.dataset.src = sources[0];
    } else {
        img.src = sources[0];
    }
}

/*
 * Sessionize's grid export ("Use UTC timezone for schedule") returns
 * date/time strings with no offset (e.g. "2026-10-17T10:00:00") whose
 * digits are the venue's actual ET wall-clock time, not real UTC. Treating
 * them as UTC keeps every session/slot time in the same reference frame
 * regardless of the visitor's own timezone - parse with this everywhere
 * a Sessionize date/time string is read, and read back with getUTC*.
 */
function parseUtc(dateTimeStr) {
    if (!dateTimeStr) return null;
    return /Z$|[+-]\d\d:\d\d$/.test(dateTimeStr) ? new Date(dateTimeStr) : new Date(dateTimeStr + "Z");
}

function normalizeTrackName(trackName) {
    return trackName.replace(/\s/g, "").toLowerCase();;
}

function trackToRoomElements(trackName) {
    /*
     * room must match a data-room attribute in _includes/floorplans/*.svg
     * so the room-map popup can highlight it; divId is its floor plan.
     */
    var mapping = {
        "Tech - Red": {
            heading: "Tech - Red (L.63)",
            tight: "Red (L.63)",
            room: "L.63",
            divId: "map-l",
            directions: "Level 1 (L), at the east end near the 59th St entrance. The large room next to Workshops (L.61)."
        },
        "Tech - Blue": {
            heading: "Tech - Blue (L2.84)",
            tight: "Blue (L2.84)",
            room: "L2.84",
            divId: "map-l2",
            directions: "Take the stairs by the Info booth down to the Lower Level (L2). L2.84 is at the bottom of the stairs, next to L2.85."
        },
        "Tech - Other": {
            heading: "Tech - Other (L2.85)",
            tight: "Other (L2.85)",
            room: "L2.85",
            divId: "map-l2",
            directions: "Take the stairs by the Info booth down to the Lower Level (L2). L2.85 is right at the bottom of the stairs, next to L2.84."
        },
        "Workshop": {
            heading: "Workshop (L.61)",
            tight: "Workshop (L.61)",
            room: "L.61",
            divId: "map-l",
            directions: "Level 1 (L), at the east end near the 59th St entrance, next to the Keynote room (L.63)."
        },
        "Entrepreneur": {
            heading: "Entrepreneur (L.76)",
            tight: "Entrepreneur (L.76)",
            room: "L.76",
            divId: "map-l",
            directions: "Level 1 (L). Head west along the main concourse, away from the 59th St entrance; L.76 is past the Mezzanine stairs and the first restrooms."
        }
    }
    if ( mapping.hasOwnProperty(trackName) ) {
        return mapping[trackName];
    }

    return { full: trackName, tight: trackName, divId: undefined }
}

function getTrackNameAndRoomHtml(trackName, heading) {
    /*
     * Returns tight track name and room, within a
     * html element meant to be .append()ed. Rooms we have a floor plan
     * for become links that open the room-map popup (see showRoomMap);
     * without it they still lead to the plan on /map/.
     */
    if ( !trackName ) {
        return document.createTextNode("TBD");
    }
    var elem = trackToRoomElements(trackName);

    if ( elem.divId === undefined ) {
        return document.createTextNode(elem.tight);
    }

    var a = document.createElement("a");
    a.classList.add("skip-modal", "room-map-link");
    a.href = SITE_BASEURL + "/map/#" + elem.divId;
    a.dataset.roomMap = trackName;
    a.title = "Show " + elem.room + " on the map";
    if ( heading ) {
        a.innerText = elem.heading;
    } else {
        a.innerText = elem.tight;
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
    var start = parseUtc(session.startsAt);
    var end = parseUtc(session.endsAt);

    return start.getUTCHours() +
        ":" +
        padMinutes(start) +
        " - " +
        end.getUTCHours() +
        ":" +
        padMinutes(end);
}
function padMinutes(time) {
    if ( time.getUTCMinutes() < 10 ) {
        return "0" + time.getUTCMinutes();
    }
    return time.getUTCMinutes();

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
    room.append(caption, getTrackNameAndRoomHtml(trackName, false));

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
    // Modals are built up front but stay hidden until clicked - stash the
    // URL in data-src rather than src so the browser doesn't fetch it
    // until the modal is actually opened (see show.bs.modal in scripts.js).
    if ( "profilePicture" in speaker ) {
        setSpeakerHeadshot(speakerHeadshot, speaker.profilePicture, 0, true);
    } else {
        // Schedule-grid speakers carry no photo; backfillSpeakerDetails
        // (schedule.js) swaps in the real one once the speaker list loads
        speakerHeadshot.dataset.src = SPEAKER_PLACEHOLDER;
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

/*
 * Room-map popup: shows the floor plan for a session's room with the room
 * highlighted. Plans come from the <template>s in floorplan-templates.html.
 */
let roomMapModal;

function showRoomMap(trackName, fromModal) {
    const elem = trackToRoomElements(trackName);
    const tpl = document.getElementById("fp-tpl-" + elem.divId);
    if ( !tpl || typeof bootstrap === "undefined" ) {
        return false;
    }

    if ( !roomMapModal ) {
        const { modal } = createBootstrapModal("roomMapModal", "roomMapLabel");
        modal.classList.add("room-map-modal");
        modal.querySelector(".modal-dialog").classList.replace("modal-lg", "modal-xl");
        modal.addEventListener("shown.bs.modal", centerRoomMapTarget);
        document.body.append(modal);
        roomMapModal = modal;
    }

    const body = roomMapModal.querySelector(".modal-body");
    body.querySelectorAll(":scope > :not(.btn-close)").forEach(node => node.remove());

    const title = document.createElement("h4");
    title.id = "roomMapLabel";
    title.innerText = elem.heading;
    body.append(title);

    /*
     * Which floor first: the all-floors overview with the room's floor lit,
     * plus the floors between it and the entrance as the route
     */
    const overviewTpl = document.getElementById("vx-tpl");
    const floor = document.createElement("p");
    floor.classList.add("room-map-floor");
    const floorName = document.createElement("strong");
    floorName.innerText = tpl.dataset.floor;
    floor.append(floorName);
    body.append(floor);

    if ( overviewTpl ) {
        body.append(overviewTpl.content.cloneNode(true));
        const overview = body.querySelector(".venue-xsection");
        overview.classList.add("vx-focus");
        overview.querySelector(".vx-note")?.remove();
        overview.querySelectorAll("a").forEach(a => a.tabIndex = -1);

        const floors = [...overview.querySelectorAll(".vx-floor")];
        const spot = overview.querySelector('.vx-spot[data-room="' + elem.room + '"]');
        const targetIdx = floors.indexOf(spot?.closest(".vx-floor"));
        const entranceIdx = floors.findIndex(f => f.querySelector(".vx-entrance"));
        if ( targetIdx >= 0 ) {
            spot.classList.add("vx-target");
            floors[targetIdx].classList.add("vx-floor-target");
            if ( entranceIdx >= 0 ) {
                const lo = Math.min(targetIdx, entranceIdx), hi = Math.max(targetIdx, entranceIdx);
                floors.slice(lo, hi + 1).forEach(f => f.classList.add("vx-floor-route"));

                // Floors are listed top to bottom, so a higher index is further down
                const levels = targetIdx - entranceIdx;
                const count = Math.abs(levels) === 1 ? "one level" : Math.abs(levels) + " levels";
                // e.g. "one level down from the 59th St entrance"
                const entrance = floors[entranceIdx].querySelector(".vx-entrance")
                    .textContent.replace(/^\W+/, "").replace(/ Entrance$/, " entrance");
                floor.append(" \u00b7 " + (levels === 0
                    ? "same level as the " + entrance
                    : count + (levels > 0 ? " down" : " up") + " from the " + entrance));
            }
        }
    }

    const directions = document.createElement("p");
    directions.classList.add("room-map-directions");
    directions.innerText = elem.directions || "";
    body.append(directions);

    // Then where on that floor: the plan, open by default only on wide screens
    const plan = document.createElement("details");
    plan.classList.add("room-map-plan");
    plan.open = window.matchMedia("(min-width: 992px)").matches;
    const summary = document.createElement("summary");
    summary.innerText = "Floor plan: " + tpl.dataset.floor;
    plan.append(summary, tpl.content.cloneNode(true));
    plan.addEventListener("toggle", () => { if ( plan.open ) centerRoomMapTarget(); });
    body.append(plan);

    const svg = plan.querySelector("svg.fp");
    svg.classList.add("fp-focus");
    const target = svg.querySelector('[data-room="' + elem.room + '"]');
    if ( target ) {
        target.classList.add("fp-target");
    }

    const actions = document.createElement("div");
    actions.classList.add("room-map-actions");
    if ( fromModal ) {
        const back = document.createElement("button");
        back.type = "button";
        back.className = "btn btn-outline-secondary btn-sm";
        back.innerText = "\u2190 Back to session";
        back.addEventListener("click", () => {
            roomMapModal.addEventListener("hidden.bs.modal",
                () => bootstrap.Modal.getOrCreateInstance(fromModal).show(), { once: true });
            bootstrap.Modal.getInstance(roomMapModal).hide();
        });
        actions.append(back);
    }
    const all = document.createElement("a");
    all.href = SITE_BASEURL + "/map/";
    all.innerText = "Full venue map";
    actions.append(all);
    body.append(actions);

    const open = () => bootstrap.Modal.getOrCreateInstance(roomMapModal).show();
    if ( fromModal ) {
        // Bootstrap can't stack modals, so close the session first
        fromModal.addEventListener("hidden.bs.modal", open, { once: true });
        bootstrap.Modal.getInstance(fromModal).hide();
    } else {
        open();
    }
    return true;
}

function centerRoomMapTarget() {
    // On phones the plan scrolls sideways; bring the room into view
    const scroller = roomMapModal.querySelector(".fp-scroll");
    const target = roomMapModal.querySelector(".fp-target");
    if ( !scroller || !target ) {
        return;
    }
    const s = scroller.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    scroller.scrollLeft += (t.left + t.width / 2) - (s.left + s.width / 2);
}

// Capture phase on window, so this runs before the skip-modal handlers and
// before Bootstrap's data-bs-toggle handler (itself a capture listener on
// document) can open the session behind the map
window.addEventListener("click", event => {
    const link = event.target.closest("[data-room-map]");
    if ( !link ) {
        return;
    }
    if ( showRoomMap(link.dataset.roomMap, link.closest(".modal.show")) ) {
        event.preventDefault();
        event.stopPropagation();
    }
}, true);
