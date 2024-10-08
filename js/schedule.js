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

function sessionizeScheduleGetTrackHeading(dayNumber, rooms) {
    /*
     * Header Row
     */
    var stickHeader = document.createElement("div");
    stickHeader.classList.add("timeslot");
    stickHeader.classList.add("track-header");
    stickHeader.classList.add("stick-header");

    var trackHeader = document.createElement("div");
    trackHeader.classList.add("track-header-label");
    trackHeader.innerText = "Day " + dayNumber;
    stickHeader.append(trackHeader);

    var timeSlotElements = document.createElement("div");
    timeSlotElements.classList.add("timeslot-elements");
    timeSlotElements.classList.add("flexbox-wrapper");

    var trackColWidth = Math.floor(12 / rooms.length);
    for (var i=0; i<rooms.length; i++) {
        var room = rooms[i];
        var trackHeaderSlot = document.createElement("div");
        trackHeaderSlot.classList.add("track-header-slot");
        trackHeaderSlot.classList.add("col-md-" + trackColWidth );
        trackHeaderSlot.classList.add("flexbox-item-height");

        var trackHeaderTitle = document.createElement("h5");
        trackHeaderTitle.classList.add("track-header-title");
        trackHeaderTitle.append(getTrackNameAndRoomHtml(room.name, true));
        trackHeaderSlot.append(trackHeaderTitle);
        timeSlotElements.append(trackHeaderSlot);
    }
    stickHeader.append(timeSlotElements);

    return stickHeader;
}

function sessionizeScheduleGetDayHeading(dayNumber, daySchedule) {
    var heading = document.createElement("h4");
    heading.classList.add("schedule-table-heading");
    const options = {
      timeZone: "UTC",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    var scheduleDay = new Date(daySchedule.date);
    heading.innerText = scheduleDay.toLocaleDateString("en-US", options);
    return heading;
}

function addSessionToSchedule(trackSlot, trackName, session, createModals, baseUrl) {
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
    //slotTrack.innerText = getTrackNameAndRoom(trackName);
    slotTrack.append(getTrackNameAndRoomHtml(trackName, false));
    slotContent.append(slotTrack);

    slotContent.append(document.createElement("br"));

    var slotStartEnd = document.createElement("small");
    slotStartEnd.innerText = getStartEndString(session);
    slotContent.append(slotStartEnd);

    var slotSpeakers = document.createElement("ul");
    slotSpeakers.classList.add("slot-speakers");

    /*
     * We have the majority of information we need to create 
     * the session modals, so lets do that then backfill speaker
     * information later
     */
    if ( createModals ) {
        createSessionModal("session-modals", session.id, session.title, session.description,
            trackName, session.speakers, session, baseUrl);
    }

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
}

function spansMultipleSlots(session, slotEndTime) {
    var startTime = new Date(session.startsAt);
    var endTime = new Date(session.endsAt);

    if ( endTime > slotEndTime ) {
        return true;
    }
    return false;
}

function carryOverExpired( session, slotStartTime, slotEndTime) {
    var startTime = new Date(session.startsAt);
    var endTime = new Date(session.endsAt);

    if ( startTime > slotEndTime ) {
        return true;
    }

    if ( slotStartTime >= endTime ) {
        return true;
    }

    return false;
}

function carryOverCleanup(carryOver, slotStartTime, slotEndTime) {
    var newCarryOver = [];
    for ( var i=0; i<carryOver.length; i++ ) {
        if ( ! carryOverExpired(carryOver[i].session, slotStartTime, slotEndTime) ) {
            newCarryOver.push(carryOver[i]);
        } 
    }
    return newCarryOver;
}

function sessionizeScheduleGetTimeslotElement(room, timeslotRooms, trackColWidth, slotStartTime, 
    slotEndTime, carryOver, baseUrl) {
    var trackSlot = document.createElement("div");
    trackSlot.classList.add("slot");
    trackSlot.classList.add("col-md-" + trackColWidth );
    trackSlot.classList.add("col-xs-12");
    trackSlot.classList.add("flexbox-item-height");


    carryOver = carryOverCleanup(carryOver, slotStartTime, slotEndTime);

    /*
     * Check Carryover first
     */
    for ( var i=0; i<carryOver.length; i++ ) {
        if ( carryOver[i].roomId === room.id ) {
            /*
             * Add in the carryOver session to the schedule
             */
            addSessionToSchedule(
                trackSlot, 
                carryOver[i].roomName, 
                carryOver[i].session,
                false, // Do not create modals for carryOvers since they'll already exist
                baseUrl);

            /*
             * Return early if we find a match in carryover for a room since we expect
             * a blank from sessionize in this slot
             */
            return [ trackSlot, carryOver ];
        }
    }

    /* 
     * If we find the room/track, then use the info we have, otherwise it 
     * will be blank
     */
    for ( var i=0; i<timeslotRooms.length; i++ ) {
        var trackName = timeslotRooms[i].name;
        var session = timeslotRooms[i].session;

        if ( room.id === timeslotRooms[i].id ) {
            addSessionToSchedule(
                trackSlot, 
                trackName, 
                session, 
                true, // Create modals 
                baseUrl);

            if ( spansMultipleSlots(session, slotEndTime) ) {
                carryOver.push({ 
                    roomId: room.id,
                    roomName: room.name,
                    session: session
                })
            }
        } 
    }

    return [ trackSlot, carryOver ];

}

function sessionizeScheduleGetTimeslot(rooms, timeslot, scheduleDate, slotStartTime, 
    slotEndTime, carryOver, baseUrl) {

    var timeslotDiv = document.createElement("div");
    timeslotDiv.classList.add("timeslot");
    timeslotDiv.setAttribute("itemtype", "http://schema.org/subEvent");


    /*
     * First column (element) of row is the timeslot label
     */
    var timeslotLabel = document.createElement("div");
    timeslotLabel.classList.add("timeslot-label")

    var startTime = document.createElement("time");
    startTime.classList.add("start-time");
    startTime.setAttribute("itemprop", "startDate");
    startTime.setAttribute("datetime", slotStartTime);

    var startTimeMinute = document.createElement("span");
    startTimeMinute.innerText = padMinutes(slotStartTime);
    startTime.append(slotStartTime.getHours(), startTimeMinute);
    timeslotLabel.append(startTime);
    timeslotDiv.append(timeslotLabel);

    /*
     * Build out each additional column
     */
    var timeslotElements = document.createElement("div");
    timeslotElements.classList.add("timeslot-elements");
    timeslotElements.classList.add("flexbox-wrapper");

    var trackColWidth = Math.floor(12 / rooms.length);
    for (var i=0; i<rooms.length; i++ ) {
        var trackSlot;
        [ trackSlot, carryOver ] = sessionizeScheduleGetTimeslotElement(rooms[i], timeslot.rooms, 
            trackColWidth, slotStartTime, slotEndTime, carryOver, baseUrl);
        timeslotElements.append(trackSlot);
    }
    timeslotDiv.append(timeslotElements);
    return [ timeslotDiv, carryOver ];


}

function getSlotStartEndTimes(day) {
    var startEndTimes = [];

    var startTime;
    var endTime;

    for ( var i=0; i<day.timeSlots.length; i++ ) {
        if ( startTime === undefined ) {
            startTime = day.timeSlots[i].slotStart;
        } else { 
            endTime = day.timeSlots[i].slotStart;
            startEndTimes.push([startTime, endTime]);

            startTime = endTime;
            endTime = undefined;
        }
    }

    return startEndTimes;
}

function getDateTime(day, hhmmss) {
    var [ hours, minutes, seconds ] = hhmmss.split(":");
    var dt = new Date(day)
    dt.setUTCHours(hours, minutes, seconds);
    return dt;
}

function sessionizeSchedule(scheduleGrid, baseUrl) {
    var scheduleWrapper = document.getElementById("schedule-wrapper");

    var day = 1;
    for (var i=0; i<scheduleGrid.length; i++) {
        /*
         * Sessionize returns a UTC timestamp string for the start of the day, 
         * if we convert that to ET, it will go to the previous day. 
         * We use UTC for the table header to hack around this
         */

        var scheduleTable = document.createElement("div");
        scheduleTable.classList.add("schedule-table");
        scheduleTable.classList.add("col-lg-10");
        scheduleTable.classList.add("col-md-10");
        scheduleTable.classList.add("col-md-offset-1");

        /*
         * Build out headings
         */
        var dayScheduleHeading = sessionizeScheduleGetDayHeading(day, scheduleGrid[i]);
        scheduleTable.append(dayScheduleHeading);

        var dayScheduleTrackHeading = sessionizeScheduleGetTrackHeading(day, scheduleGrid[i].rooms);
        scheduleTable.append(dayScheduleTrackHeading);

        /*
         * Get slot start and end times to help find talks that span multiple slots 
         * so we can duplicate them
         */
        const slotStartEndTimes = getSlotStartEndTimes(scheduleGrid[i]);

        /*
         * Build out timeslots
         */
        var carryOver = Array();
        for (var x=0; x<scheduleGrid[i].timeSlots.length; x++) {
            var slotStartTime = getDateTime(scheduleGrid[i].date, 
                scheduleGrid[i].timeSlots[x].slotStart);
            var slotEndTime, timeslot;

            /*
             * We'll need slotEndTime to calculate carryOver
             */
            for ( var z=0; z<slotStartEndTimes.length; z++ ) {
                if ( slotStartEndTimes[z][0] === scheduleGrid[i].timeSlots[x].slotStart ) {
                    slotEndTime = getDateTime(scheduleGrid[i].date, slotStartEndTimes[z][1]);
                }
            }

            [ timeslot, carryOver ] = sessionizeScheduleGetTimeslot(
                scheduleGrid[i].rooms, 
                scheduleGrid[i].timeSlots[x], 
                scheduleGrid[i].date,
                slotStartTime,
                slotEndTime, 
                carryOver, 
                baseUrl
            );
            scheduleTable.append(timeslot);
        }

        scheduleWrapper.append(scheduleTable);
        day++; 
    }
}

function populateSchedule(scheduleGrid, baseUrl) {
    //createSchedule(scheduleGrid, baseUrl);
    sessionizeSchedule(scheduleGrid, baseUrl);
}

function getSessionLevel(session) {
    var categoryLevelId = 75411;
    for ( var i=0; i<session.categories.length; i++ ) {
        if ( session.categories[i].id === categoryLevelId ) {
            for ( var x=0; x<session.categories[i].categoryItems.length; x++ ) {
                var level = session.categories[i].categoryItems[x].name;
                if ( level != null ) {
                    return level;
                }
            }
        }
    }
    return "Not provided - Open to All";
}

function addSessionToSessionModal(sessionId, sessionTitle, sessionDescription, trackName, session, modalBody) {
    var title = document.createElement("h4");
    title.innerText = sessionTitle;
    modalBody.append(title);

    var room = document.createElement("span");
    room.classList.add("theme-metadata");

    var caption = document.createElement("span");
    caption.classList.add("caption");
    caption.innerText = "Track: ";
    room.append(caption, getTrackNameAndRoom(trackName));

    var captionTime = document.createElement("span");
    captionTime.classList.add("caption");
    captionTime.innerText = "Time: " + getStartEndString(session);
    room.append( document.createElement("br"), captionTime);

    var level = document.createElement("span");
    level.classList.add("caption");
    level.innerText = "Session Level: " + getSessionLevel(session);
    room.append( document.createElement("br"), level);
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

    var pronouns = document.createElement("small");
    pronouns.id = "speakerPronouns-" + speakerId;
    details.append(pronouns);

    var bio = document.createElement("p");
    bio.id = "speakerBio-" + speakerId;
    bio.classList.add("about");
    details.append(bio);
    row.append(details);

    peopleDetails.append(row);
    modalBody.append(peopleDetails);
}

function createSessionModal(modalSectionId, sessionId, sessionTitle, sessionDescription, 
    trackName, speakers, session, baseUrl) {

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

    addSessionToSessionModal(sessionId, sessionTitle, sessionDescription, trackName, session, modalBody);
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
        if (document.querySelectorAll(selector).length > 0) {
            return resolve([document.querySelectorAll(selector), speaker]);
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelectorAll(selector).length > 0) {
                observer.disconnect();
                resolve([document.querySelectorAll(selector), speaker]);
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}

function getTwitterIcon(handle, baseUrl) {
    var twitterLink = document.createElement("a");
    twitterLink.href = "https://x.com/" + encodeURIComponent(normalizeTwitter(handle));

    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.classList.add("icon");
    svgIcon.classList.add("icon-twitter");
    svgIcon.setAttribute("viewBox", "0 0 30 32");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("href", baseUrl + "/img/sprites/sprites.svg#icon-twitter");
    svgIcon.append(icon);
    twitterLink.append(svgIcon);

    return twitterLink;

}

function isValidUrl(userInput) {
    try {
        new URL(userInput);
        return true;
    } catch (error) {
        return false;
    }
}

function getLinkedInIcon(url, baseUrl) {
    if ( ! isValidUrl(url) ) {
        return null
    }
    var link = document.createElement("a");
    link.href = url;

    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.classList.add("icon");
    svgIcon.classList.add("icon-twitter");
    svgIcon.setAttribute("viewBox", "0 0 30 32");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("href", baseUrl + "/img/sprites/sprites.svg#icon-linkedin");
    svgIcon.append(icon);
    link.append(svgIcon);

    return link;
}

function normalizeTwitter(handle) {
    if ( handle.startsWith("@") ) {
        return handle.substring(1);
    }

    if ( handle.startsWith("http") ) {
        var parts = handle.split("/");
        return parts.at(-1);
    }

    return handle;
}

function backfillSpeakerPronouns(speaker, element) {
    var categoryPronounsId = 75424;
    for ( var i=0; i<speaker.categories.length; i++ ) {
        if ( speaker.categories[i].id === categoryPronounsId ) {
            for ( var x=0; x<speaker.categories[i].categoryItems.length; x++ ) {
                var pronouns = speaker.categories[i].categoryItems[x].name;
                if ( pronouns != null ) {
                    element.innerText = "Pronouns: " + pronouns;
                }
            }
        }
    }
}

function backfillSpeakerSocial(speaker, tagLineElement, baseUrl) {
    /*
     * Twitter 
     */
    var socialMediaQuestionId = 75843;
    var socialMediaTwitter = "Twitter/X";

    for (var i=0; i<speaker.questionAnswers.length; i++) {
        if ( speaker.questionAnswers[i].id === socialMediaQuestionId ) {
            if ( speaker.questionAnswers[i].question === "Twitter/X" ) {
                var twitterHandle = speaker.questionAnswers[i].answer;
                if ( twitterHandle != null ) {
                    var twitter = getTwitterIcon(twitterHandle, baseUrl);
                    tagLineElement.append(twitter);
                }
            }
        }
    }

    /* 
     * LinkedIn
     */
    for (var i=0; i<speaker.links.length; i++) {
        if ( speaker.links[i].linkType === "LinkedIn" ) {
            var linkedIn = getLinkedInIcon(speaker.links[i].url, baseUrl);
            tagLineElement.append(linkedIn);
        }
    }

}

function skipModalForLinks() {
    /*
     * This disables anything with the "skip-modal" class from opening
     * a modal. It base use-case is to make links clickable that are within
     * a parent element set to open a modal. 
     */
    waitForElm(".skip-modal", undefined).then((result) => {
        var [elements, speaker] = result;
        for (var i=0; i<elements.length; i++ ) {
            elements[i].addEventListener('click', function(event) {
                event.stopPropagation(); // Stops the modal trigger from activating
            });
        }
    });

}

function backfillSpeakerDetails(speakers, baseUrl) {
    for (var i=0; i<speakers.length; i++) {
        /*
         * Backfill items on the schedule first
         */
        waitForElm("#speakerImage-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                if ( speaker.profilePicture != null ) {
                    elements[i].setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
                }
            }
        });
        waitForElm("#speakerPosition-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                elements[i].innerText = speaker.tagLine;
            }
        });

        /* 
         * Backfill items on the modals
         */
        waitForElm("#speakerProfileUrl-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                if ( speaker.profilePicture != null ) {
                    elements[i].setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
                }
            }
        });
        waitForElm("#speakerTagLine-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                elements[i].innerText = speaker.tagLine;
                backfillSpeakerSocial(speaker, elements[i], baseUrl);
            }
        });

        waitForElm("#speakerBio-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                elements[i].innerText = speaker.bio;
            }
        });

        waitForElm("#speakerPronouns-" + speakers[i].id, speakers[i]).then((result) => {
            var [elements, speaker] = result;
            for (var i=0; i<elements.length; i++ ) {
                backfillSpeakerPronouns(speaker, elements[i]);
            }
        });
    }
}

