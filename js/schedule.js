Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

function scheduleBuilder(endpoint, baseUrl, target) {
    var oReq = new XMLHttpRequest();
    oReq.onreadystatechange = function() {
        if ( oReq.readyState === XMLHttpRequest.DONE ) {
            if ( oReq.status === 200 ) {
                var result = JSON.parse(oReq.responseText);
                if ( target === "speakerBackfill" ) {
                    backfillSpeakerDetails(result, baseUrl);
                } else {
                    populateSchedule(result, baseUrl);
                }
            }
        }
    }
    oReq.open('GET', endpoint);
    oReq.send();

}

function getTrackLength(trackName) {
    if ( trackName == "Workshops" ) {
        return 2
    }
    return 1
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
        return "Workshop (L.76)";
    }

    return trackName;
}

function createSchedule(scheduleGrid, baseUrl) {
    var scheduleWrapper = document.getElementById("schedule-wrapper");

    var day = 1;
    for (var i=0; i<scheduleGrid.length; i++) {
        console.log(scheduleGrid[i].date);
        var scheduleDay = new Date(scheduleGrid[i].date + " EDT")

        var scheduleTable = document.createElement("div");
        scheduleTable.classList.add("schedule-table");
        scheduleTable.classList.add("col-lg-8");
        scheduleTable.classList.add("col-md-10");
        scheduleTable.classList.add("col-md-offset-1");

        var heading = document.createElement("h4");
        heading.classList.add("schedule-table-heading");
        heading.innerText = scheduleDay.toDateString();
        scheduleTable.append(heading);

        var stickHeader = document.createElement("div");
        stickHeader.classList.add("timeslot");
        stickHeader.classList.add("track-header");
        stickHeader.classList.add("stick-header");

        var trackHeader = document.createElement("div");
        trackHeader.classList.add("track-header-label");
        trackHeader.innerText = "Day " + day;
        stickHeader.append(trackHeader);

        var timeSlotElements = document.createElement("div");
        timeSlotElements.classList.add("timeslot-elements");
        timeSlotElements.classList.add("flexbox-wrapper");

        var trackColWidth = Math.floor(12 / scheduleGrid[i].rooms.length);
        for (var x=0; x<scheduleGrid[i].rooms.length; x++) {
            var trackHeaderSlot = document.createElement("div");
            trackHeaderSlot.classList.add("track-header-slot");
            trackHeaderSlot.classList.add("col-md-" + trackColWidth );
            trackHeaderSlot.classList.add("flexbox-item-height");
            //trackHeaderSlot.classList.add("hidden-xs");

            var trackHeaderTitle = document.createElement("h5");
            trackHeaderTitle.classList.add("track-header-title");
            trackHeaderTitle.innerText = scheduleGrid[i].rooms[x].name;
            trackHeaderSlot.append(trackHeaderTitle);
            timeSlotElements.append(trackHeaderSlot);
        }
        var spacer = document.createElement("div");
        spacer.classList.add("track-header-slot");
        spacer.classList.add("col-xs-12");
        spacer.classList.add("visibile-xs");

        var spacerDetail = document.createElement("h5");
        spacerDetail.classList.add("slot-detail");
        spacerDetail.classList.add("track-header-title");
        spacer.append(spacerDetail);
        // timeSlotElements.append(spacer);
        stickHeader.append(timeSlotElements);
        scheduleTable.append(stickHeader);

        for (var x=0; x<scheduleGrid[i].timeSlots.length; x++) {
            var timeslot = document.createElement("div");
            timeslot.classList.add("timeslot");
            timeslot.setAttribute("itemtype", "http://schema.org/subEvent");

            var timeslotLabel = document.createElement("div");
            timeslotLabel.classList.add("timeslot-label")
            console.log(scheduleDay.toLocaleString());

            const slotStartTime = new Date(
                scheduleDay.toString().split("T")[0] + "T" +
                scheduleGrid[i].timeSlots[x].slotStart)

            var startTime = document.createElement("time");
            startTime.classList.add("start-time");
            startTime.setAttribute("itemprop", "startDate");
            startTime.setAttribute("datetime", slotStartTime);


            var mhs = scheduleGrid[i].timeSlots[x].slotStart.split(":")
            var startTimeMinute = document.createElement("span");
            startTimeMinute.innerText = mhs[1]
            startTime.append(mhs[0], startTimeMinute);
            timeslotLabel.append(startTime);

            /*

            var endTime = document.createElement("time");
            endTime.classList.add("end-time");
            endTime.setAttribute("itemprop", "endDate");
            endTime.setAttribute("datetime", slotStartTime.addHours(getTrackLength(scheduleGrid[i].rooms[x])))
            timeslotLabel.append(endTime);
            */

            timeslot.append(timeslotLabel);

            var timeslotElements = document.createElement("div");
            timeslotElements.classList.add("timeslot-elements");
            timeslotElements.classList.add("flexbox-wrapper");

            for (var y=0; y<scheduleGrid[i].timeSlots[x].rooms.length; y++) {
                var trackName = scheduleGrid[i].timeSlots[x].rooms[y].name;
                var session = scheduleGrid[i].timeSlots[x].rooms[y].session;

                var trackSlot = document.createElement("div");
                trackSlot.classList.add("slot");
                trackSlot.classList.add("col-md-" + trackColWidth );
                trackSlot.classList.add("col-xs-12");
                trackSlot.classList.add("flexbox-item-height");
                trackSlot.id = "session-" + session.id;
                trackSlot.setAttribute("data-slot-detail", trackName);
                trackSlot.setAttribute("data-toggle", "modal");
                trackSlot.setAttribute("data-target", "#sessionDetail-" + session.id);

                var line = document.createElement("div");
                line.classList.add("color-line");
                line.classList.add(normalizeTrackName(trackName));
                trackSlot.append(line);

                var slotContent = document.createElement("div");
                slotContent.classList.add("slot-content");
                slotContent.classList.add(normalizeTrackName(trackName));

                var slotTitle = document.createElement("h5");
                slotTitle.classList.add("slot-title");
                slotTitle.setAttribute("itemprop", "name");
                slotTitle.innerText = session.title;
                slotContent.append(slotTitle);

                var slotTrack = document.createElement("small");
                slotTrack.innerText = getTrackNameAndRoom(trackName);
                slotContent.append(slotTrack);

                var slotSpeakers = document.createElement("ul");
                slotSpeakers.classList.add("slot-speakers");

                /*
                 * We have the majority of information we need to create 
                 * the session modals, so lets do that then backfill speaker
                 * information later
                 */
                createSessionModal("session-modals", session.id, session.title, session.description,
                    trackName, session.speakers, baseUrl);

                for ( var z=0; z<session.speakers.length; z++ ) {
                    var performer = document.createElement("li");
                    performer.setAttribute("itemprop", "performer");

                    var speakerImage = document.createElement("div");
                    speakerImage.classList.add("speaker-img");
                    speakerImage.classList.add("flow-img");
                    speakerImage.classList.add("img-circle");
                    speakerImage.id = "speakerImage-" + session.speakers[z].id;

                    performer.append(speakerImage);
                    slotSpeakers.append(performer);

                    var speakerName = document.createElement("p");
                    speakerName.classList.add("speaker-name");
                    
                    var speakerPosition = document.createElement("span");
                    speakerPosition.classList.add("speaker-position");
                    speakerPosition.id = "speakerPosition-" + session.speakers[z].id;
                    speakerPosition.innerText = undefined; 
                    speakerName.append(session.speakers[z].name, speakerPosition);
                    slotSpeakers.append(speakerName);
                }
                slotContent.append(slotSpeakers);
                trackSlot.append(slotContent);
                timeslotElements.append(trackSlot);
            }
            timeslot.append(timeslotElements);
            scheduleTable.append(timeslot);
        }
        
        scheduleWrapper.append(scheduleTable);
        day++;
    }
}

function populateSchedule(scheduleGrid, baseUrl) {
    createSchedule(scheduleGrid, baseUrl);
}

function addSessionToSessionModal(sessionId, sessionTitle, sessionDescription, trackName, modalBody) {
    var title = document.createElement("h4");
    title.innerText = sessionTitle;
    modalBody.append(title);

    var room = document.createElement("span");
    room.classList.add("theme-metadata");

    var caption = document.createElement("span");
    caption.classList.add("caption");
    caption.innerText = "Track: ";
    room.append(caption, trackName);
    modalBody.append(room);

    var description = document.createElement("p");
    description.classList.add("theme-description");
    description.innerText = sessionDescription;
    modalBody.append(description);

}

function addSpeakerToSessionModal(speakerId, speakerFullName, modalBody) {
    var peopleDetails = document.createElement("div");
    peopleDetails.classList.add("people-details");

    var row = document.createElement("div");
    row.classList.add("row");

    var headshot = document.createElement("div");
    headshot.classList.add("col-md-2");
    headshot.classList.add("col-sm-2");

    var speakerHeadshot = document.createElement("div");
    speakerHeadshot.id = "speakerProfileUrl-" + speakerId;
    speakerHeadshot.classList.add("flow-img");
    speakerHeadshot.classList.add("img-circle");
    speakerHeadshot.classList.add("people-img");
    speakerHeadshot.setAttribute("style", undefined);
    headshot.append(speakerHeadshot);
    row.append(headshot);

    var details = document.createElement("div");
    details.classList.add("col-md-10")
    details.classList.add("col-sm-10")
    details.classList.add("details")

    var name = document.createElement("p");
    name.classList.add("name");
    name.innerText = speakerFullName;

    var tagline = document.createElement("span");
    tagline.id = "speakerTagLine-" + speakerId;
    tagline.classList.add("position");
    name.append(tagline);
    details.append(name);

    var bio = document.createElement("p");
    bio.id = "speakerBio-" + speakerId;
    bio.classList.add("about");
    details.append(bio);
    row.append(details);

    peopleDetails.append(row);
    modalBody.append(peopleDetails);
}

function createSessionModal(modalSectionId, sessionId, sessionTitle, sessionDescription, 
    trackName, speakers, baseUrl) {

    var modal = document.createElement("div");
    modal.classList.add("modal");
    modal.classList.add("fade");
    modal.classList.add("text-left");
    modal.classList.add("people-modal");
    modal.id = "sessionDetail-" + sessionId;
    modal.tabIndex = "-1";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "sessionDetailLabel-" + sessionId );
    modal.setAttribute("aria-hidden", true );

    var modalDialog = document.createElement("div");
    modalDialog.classList.add("modal-dialog");

    var modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    var modalBody = document.createElement("div");
    modalBody.classList.add("modal-body");

    var close = document.createElement("div");
    close.classList.add("close");

    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.classList.add("icon");
    svgIcon.classList.add("icon-cross");
    svgIcon.setAttribute("viewBox", "0 0 32 32");
    svgIcon.setAttribute("x", "10px");
    svgIcon.setAttribute("y", "10px");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("href", baseUrl + "/img/sprites/sprites.svg#icon-cross");
    svgIcon.append(icon);
    close.append(svgIcon);

    var closeMask = document.createElement("div");
    closeMask.classList.add("close-mask");
    closeMask.setAttribute("data-dismiss", "modal");
    closeMask.setAttribute("aria-label", "Close");
    close.append(closeMask);

    modalBody.append(close);

    addSessionToSessionModal(sessionId, sessionTitle, sessionDescription, trackName, modalBody);
    for ( var i=0; i<speakers.length; i++ ) {
        addSpeakerToSessionModal(speakers[i].id, speakers[i].name, modalBody);
    }

    modalContent.append(modalBody);
    modalDialog.append(modalContent);
    modal.append(modalDialog);

    var modalSection = document.getElementById(modalSectionId);
    modalSection.append(modal);

}
var waitForElm = function (selector, speaker) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve([document.querySelector(selector), speaker]);
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve([document.querySelector(selector), speaker]);
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function backfillSpeakerDetails(speakers, baseUrl) {
    for (var i=0; i<speakers.length; i++) {
        /*
         * Backfill items on the schedule first
         */
        waitForElm("#speakerImage-" + speakers[i].id, speakers[i]).then((result) => {
            var [element, speaker] = result;
            element.setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
        });
        waitForElm("#speakerPosition-" + speakers[i].id, speakers[i]).then((result) => {
            var [element, speaker] = result;
            element.innerText = speaker.tagLine;
        });

        /* 
         * Backfill items on the modals
         */
        waitForElm("#speakerProfileUrl-" + speakers[i].id, speakers[i]).then((result) => {
            var [element, speaker] = result;
            element.setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
        });
        waitForElm("#speakerTagLine-" + speakers[i].id, speakers[i]).then((result) => {
            var [element, speaker] = result;
            element.innerText = speaker.tagLine;
        });
        waitForElm("#speakerBio-" + speakers[i].id, speakers[i]).then((result) => {
            var [element, speaker] = result;
            element.innerText = speaker.bio;
        });
    }
}

