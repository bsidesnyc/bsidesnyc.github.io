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
                console.log(result);
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
        trackHeaderTitle.innerText = room.name;
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

function sessionizeScheduleGetTimeslotElement(room, timeslotRooms, trackColWidth, baseUrl) {
    var trackSlot = document.createElement("div");
    trackSlot.classList.add("slot");
    trackSlot.classList.add("col-md-" + trackColWidth );
    trackSlot.classList.add("col-xs-12");
    trackSlot.classList.add("flexbox-item-height");

    /* 
     * If we find the room/track, then use the info we have, otherwise it 
     * will be blank
     */
    for ( var i=0; i<timeslotRooms.length; i++ ) {
        var trackName = timeslotRooms[i].name;
        var session = timeslotRooms[i].session;

        if ( room.id === timeslotRooms[i].id ) {
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
            createSessionModal("session-modals", session.id, session.title, session.description,
                trackName, session.speakers, session, baseUrl);

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
        } else {
            //trackSlot.classList.add("hidden-xs");
            //trackSlot.classList.add("blank-col");
        }
    }

    return trackSlot;

}

function sessionizeScheduleGetTimeslot(rooms, timeslot, scheduleDate, baseUrl) {
    var [ hours, minutes, seconds ] = timeslot.slotStart.split(":");
    var timeslotStart = new Date(scheduleDate)
    timeslotStart.setUTCHours(hours, minutes, seconds);

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
    startTime.setAttribute("datetime", timeslotStart );

    var startTimeMinute = document.createElement("span");
    startTimeMinute.innerText = padMinutes(timeslotStart);
    startTime.append(timeslotStart.getHours(), startTimeMinute);
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
        var trackSlot = sessionizeScheduleGetTimeslotElement(rooms[i], timeslot.rooms, trackColWidth, baseUrl);
        timeslotElements.append(trackSlot);
    }
    timeslotDiv.append(timeslotElements);
    return timeslotDiv;


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
         * Build out timeslots
         */
        for (var x=0; x<scheduleGrid[i].timeSlots.length; x++) {
            var timeslot = sessionizeScheduleGetTimeslot(
                scheduleGrid[i].rooms, scheduleGrid[i].timeSlots[x], scheduleGrid[i].date, baseUrl);
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
    modalBody.append(room);

    var description = document.createElement("p");
    description.classList.add("theme-description");
    description.innerText = sessionDescription;
    modalBody.append(description);

}

function addSpeakerToSessionModal(speakerId, speakerFullName, modalBody, baseUrl) {
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
        addSpeakerToSessionModal(speakers[i].id, speakers[i].name, modalBody, baseUrl);
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
        observer.observe(document.body, {
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
        console.log("Invalid LinkedIn URL: " + url)
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

