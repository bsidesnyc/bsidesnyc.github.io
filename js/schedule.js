Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

async function scheduleBuilder(endpoint, baseUrl, target) {
    const response = await fetch(endpoint);
    const result = await response.json();
    if ( target === "speakerBackfill" ) {
        backfillSpeakerDetails(result, baseUrl);
    } else {
        populateSchedule(result, baseUrl);
    }
}

function sessionizeScheduleGetDayHeading(dayNumber, daySchedule) {
    const heading = document.createElement("h4");
    heading.classList.add("schedule-table-heading");
    const options = {
      timeZone: "UTC",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const scheduleDay = parseUtc(daySchedule.date);
    heading.innerText = scheduleDay.toLocaleDateString("en-US", options);
    return heading;
}

function addSessionToSchedule(trackSlot, trackName, session, createModals, baseUrl) {
    trackSlot.id = "session-" + session.id;
    trackSlot.setAttribute("data-slot-detail", trackName);
    trackSlot.setAttribute("data-bs-toggle", "modal");
    trackSlot.setAttribute("data-bs-target", "#sessionDetail-" + session.id);

    const line = document.createElement("div");
    line.classList.add("color-line");
    line.classList.add(normalizeTrackName(trackName));
    trackSlot.append(line);

    const slotContent = document.createElement("div");
    slotContent.classList.add("slot-content");
    slotContent.classList.add(normalizeTrackName(trackName));

    const slotTitle = document.createElement("h5");
    slotTitle.classList.add("slot-title");
    slotTitle.setAttribute("itemprop", "name");
    slotTitle.innerText = session.title;
    slotContent.append(slotTitle);

    const slotTrack = document.createElement("small");
    //slotTrack.innerText = getTrackNameAndRoom(trackName);
    slotTrack.append(getTrackNameAndRoomHtml(trackName, false));
    slotContent.append(slotTrack);

    slotContent.append(document.createElement("br"));

    const slotStartEnd = document.createElement("small");
    slotStartEnd.innerText = getStartEndString(session);
    slotContent.append(slotStartEnd);

    const slotSpeakers = document.createElement("ul");
    slotSpeakers.classList.add("slot-speakers");

    /*
     * We have the majority of information we need to create 
     * the session modals, so lets do that then backfill speaker
     * information later
     */
    if ( createModals ) {
        createSessionModal(session.id, session.title, session.description,
            trackName, session.speakers, session, baseUrl);
    }

    session.speakers.forEach(speaker => {
        /*
         * No photo here by design - the grid view stays text-only so it
         * loads fast on mobile. Headshots only load when a speaker's
         * modal is actually opened (see the show.bs.modal handler).
         */
        const performer = document.createElement("li");
        performer.setAttribute("itemprop", "performer");

        const speakerName = document.createElement("p");
        speakerName.classList.add("speaker-name");

        const speakerPosition = document.createElement("span");
        speakerPosition.classList.add("speaker-position");
        speakerPosition.id = "speakerPosition-" + speaker.id;
        speakerPosition.innerText = undefined;

        speakerName.append(speaker.name, speakerPosition);
        performer.append(speakerName);
        slotSpeakers.append(performer);
    });
    slotContent.append(slotSpeakers);
    trackSlot.append(slotContent);
}

function spansMultipleSlots(session, slotEndTime) {
    const startTime = parseUtc(session.startsAt);
    const endTime = parseUtc(session.endsAt);

    if ( endTime > slotEndTime ) {
        return true;
    }
    return false;
}

function carryOverExpired( session, slotStartTime, slotEndTime) {
    const startTime = parseUtc(session.startsAt);
    const endTime = parseUtc(session.endsAt);

    if ( startTime > slotEndTime ) {
        return true;
    }

    if ( slotStartTime >= endTime ) {
        return true;
    }

    return false;
}

function carryOverCleanup(carryOver, slotStartTime, slotEndTime) {
    return carryOver.filter(item => !carryOverExpired(item.session, slotStartTime, slotEndTime));
}

function sessionizeScheduleGetTimeslotElement(room, timeslotRooms, trackColWidth, slotStartTime, 
    slotEndTime, carryOver, baseUrl) {
    const slot = document.createElement("div");
    slot.classList.add("track-header-slot");
    slot.classList.add("col-11");
    slot.classList.add("col-xl");
    slot.classList.add("offset-1");
    slot.classList.add("offset-xl-0");
    slot.classList.add("slot");


    carryOver = carryOverCleanup(carryOver, slotStartTime, slotEndTime);

    /*
     * Check Carryover first
     */
    const carryOverMatch = carryOver.find(item => item.roomId === room.id);
    if (carryOverMatch) {
        /*
         * Add in the carryOver session to the schedule
         */
        addSessionToSchedule(
            slot, 
            carryOverMatch.roomName, 
            carryOverMatch.session,
            false, // Do not create modals for carryOvers since they'll already exist
            baseUrl);

        /*
         * Return early if we find a match in carryover for a room since we expect
         * a blank from sessionize in this slot
         */
        return [ slot, carryOver ];
    }

    /* 
     * If we find the room/track, then use the info we have, otherwise it 
     * will be blank
     */
    timeslotRooms.forEach(timeslotRoom => {
        const trackName = timeslotRoom.name;
        const session = timeslotRoom.session;

        if ( room.id === timeslotRoom.id ) {
            addSessionToSchedule(
                slot, 
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
    });

    return [ slot, carryOver ];

}

function sessionizeScheduleGetTrackHeading(rooms) {
    /*
     * Header Row
     */
    const row = document.createElement("div");
    row.classList.add("timeslot");
    row.classList.add("row");
    row.classList.add("track-header");

    const day = document.createElement("div");
    day.classList.add("col-12");
    day.classList.add("col-xl-2");
    day.classList.add("track-header-label");
    day.classList.add("track-header-slot");
    row.append(day);


    rooms.forEach(room => {
        const slot = document.createElement("div");
        slot.classList.add("track-header-slot");
        slot.classList.add("col-11");
        slot.classList.add("col-xl");
        slot.classList.add("offset-1");
        slot.classList.add("offset-xl-0");

        const title = document.createElement("h5");
        title.classList.add("track-header-title");
        title.append(getTrackNameAndRoomHtml(room.name, true));
        slot.append(title);
        row.append(slot);
    });

    return row;
}


function sessionizeScheduleGetTimeslot(rooms, timeslot, scheduleDate, slotStartTime, 
    slotEndTime, carryOver, baseUrl) {

    const row = document.createElement("div");
    row.classList.add("timeslot");
    row.classList.add("row");
    row.setAttribute("itemtype", "http://schema.org/subEvent");
    // Read by markCurrentTimeslot(); the last slot has no end, so give it an hour
    row.dataset.start = slotStartTime.toISOString();
    row.dataset.end = (slotEndTime || new Date(slotStartTime.getTime() + 3600000)).toISOString();


    /*
     * First column (element) of row is the timeslot label
     */
    const time = document.createElement("div");
    time.classList.add("col-12")
    time.classList.add("col-xl-2")
    time.classList.add("timeslot-label")
    time.classList.add("track-header-slot")

    const start = document.createElement("time");
    start.classList.add("start-time");
    start.setAttribute("itemprop", "startDate");
    start.setAttribute("datetime", slotStartTime);

    const startMinute = document.createElement("span");
    startMinute.innerText = padMinutes(slotStartTime);
    start.append(slotStartTime.getUTCHours(), startMinute);
    time.append(start);
    row.append(time);

    const trackColWidth = 0; // Not used
    rooms.forEach(room => {
        let slot;
        [ slot, carryOver ] = sessionizeScheduleGetTimeslotElement(room, 
            timeslot.rooms,
            trackColWidth,
            slotStartTime,
            slotEndTime,
            carryOver,
            baseUrl);
        row.append(slot);
    });
    return [ row, carryOver ];


}

function getSlotStartEndTimes(day) {
    const startEndTimes = [];

    let startTime;
    let endTime;

    day.timeSlots.forEach(slot => {
        if ( startTime === undefined ) {
            startTime = slot.slotStart;
        } else { 
            endTime = slot.slotStart;
            startEndTimes.push([startTime, endTime]);

            startTime = endTime;
            endTime = undefined;
        }
    });

    return startEndTimes;
}

function getDateTime(day, hhmmss) {
    const datePart = day.split("T")[0];
    return parseUtc(datePart + "T" + hhmmss);
}

function sessionizeSchedule(scheduleGrid, baseUrl) {
    const scheduleWrapper = document.getElementById("schedule-wrapper");


    scheduleGrid.forEach((gridItem, i) => {
        const day = i + 1;
        const schedule = document.createElement("div");
        schedule.classList.add("col-lg-10");
        schedule.classList.add("col-md-10");
        schedule.classList.add("offset-md-1");

        /*
         * Sessionize returns a UTC timestamp string for the start of the day, 
         * if we convert that to ET, it will go to the previous day. 
         * We use UTC for the table header to hack around this
         */
        const dayScheduleHeading = sessionizeScheduleGetDayHeading(day, gridItem);
        schedule.append(dayScheduleHeading);

        const scheduleTable = document.createElement("div");
        scheduleTable.classList.add("schedule-table");
        //scheduleTable.classList.add("d-flex");

        const dayScheduleTrackHeading = sessionizeScheduleGetTrackHeading(gridItem.rooms);
        scheduleTable.append(dayScheduleTrackHeading);

        /*
         * Get slot start and end times to help find talks that span multiple slots 
         * so we can duplicate them
         */
        const slotStartEndTimes = getSlotStartEndTimes(gridItem);

        /*
         * Build out timeslots
         */
        let carryOver = Array();
        gridItem.timeSlots.forEach(timeSlot => {
            const slotStartTime = getDateTime(gridItem.date, timeSlot.slotStart);
            let slotEndTime, timeslot;

            /*
             * We'll need slotEndTime to calculate carryOver
             */
            const timeMatch = slotStartEndTimes.find(time => time[0] === timeSlot.slotStart);
            if (timeMatch) {
                slotEndTime = getDateTime(gridItem.date, timeMatch[1]);
            }

            [ timeslot, carryOver ] = sessionizeScheduleGetTimeslot(
                gridItem.rooms, 
                timeSlot, 
                gridItem.date,
                slotStartTime,
                slotEndTime, 
                carryOver, 
                baseUrl
            );
            scheduleTable.append(timeslot);
            schedule.append(scheduleTable);
        });

        scheduleWrapper.append(schedule);
    });
}

function populateSchedule(scheduleGrid, baseUrl) {
    //createSchedule(scheduleGrid, baseUrl);
    sessionizeSchedule(scheduleGrid, baseUrl);
    scrollToCurrentTimeslot();
    setInterval(markCurrentTimeslot, 60000);
}

/*
 * Event-day "now": Sessionize times are ET wall-clock read as UTC (see
 * parseUtc), so build ET wall-clock now in that same frame. Add e.g.
 * ?now=2026-10-17T13:20 to the URL to try it out before the day.
 */
function etNowAsUtc() {
    const override = new URLSearchParams(location.search).get("now");
    if ( override ) {
        return parseUtc(override);
    }
    const parts = {};
    new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date()).forEach(p => parts[p.type] = p.value);
    return parseUtc(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
}

function markCurrentTimeslot() {
    /*
     * Marks and returns the slot that's on now (or next up, between
     * slots) - only while today's program is running
     */
    const now = etNowAsUtc();
    const today = now.toISOString().slice(0, 10);
    const rows = [...document.querySelectorAll(".timeslot[data-start]")]
        .filter(row => row.dataset.start.slice(0, 10) === today);
    const ended = row => now >= new Date(row.dataset.end);
    const current = rows.length && now >= new Date(rows[0].dataset.start)
        ? rows.find(row => !ended(row)) : undefined;

    rows.forEach(row => row.classList.toggle("timeslot-now", row === current));
    return current;
}

function scrollToCurrentTimeslot() {
    const current = markCurrentTimeslot();
    const nav = performance.getEntriesByType("navigation")[0];
    // A #link to something specific, or Back/Forward restoring a spot, wins
    if ( !current || location.hash || (nav && nav.type === "back_forward") ) {
        return;
    }

    const align = () => {
        const header = document.getElementById("top-header");
        const trackHeader = current.closest(".schedule-table").querySelector(".track-header");
        let offset = header ? header.offsetHeight : 0;
        if ( trackHeader && getComputedStyle(trackHeader).position === "sticky" ) {
            offset += trackHeader.offsetHeight;
        }
        window.scrollTo({ top: current.getBoundingClientRect().top + window.scrollY - offset - 8 });
        return window.scrollY;
    };
    const landed = align();
    // The nav shrinks once scrolled; re-align after that unless the visitor moved
    setTimeout(() => { if ( window.scrollY === landed ) align(); }, 400);
}

function backfillSpeakerPronouns(speaker, element) {
    const categoryPronounsId = 75424;
    if (!speaker.categories) return;
    const category = speaker.categories.find(cat => cat.id === categoryPronounsId);
    if (category) {
        const pronounsItem = category.categoryItems.find(item => item.name != null);
        if (pronounsItem) {
            element.innerText = "Pronouns: " + pronounsItem.name;
        }
    }
}

function backfillSpeakerSocial(speaker, tagLineElement, baseUrl) {
    /*
     * Twitter 
     */
    const socialMediaQuestionId = 75843;

    if (speaker.questionAnswers) {
        speaker.questionAnswers.forEach(qa => {
            if ( qa.id === socialMediaQuestionId ) {
                if ( qa.question === "Twitter/X" ) {
                    const twitterHandle = qa.answer;
                    if ( twitterHandle != null ) {
                        const twitter = getTwitterIcon(twitterHandle, baseUrl);
                        tagLineElement.append(twitter);
                    }
                }
            }
        });
    }

    /* 
     * LinkedIn
     */
    if (speaker.links) {
        speaker.links.forEach(link => {
            if ( link.linkType === "LinkedIn" ) {
                const linkedIn = getLinkedInIcon(link.url, baseUrl);
                if (linkedIn) {
                    tagLineElement.append(linkedIn);
                }
            }
        });
    }

}

function createSessionModal(sessionId, sessionTitle, sessionDescription, 
    trackName, speakers, session, baseUrl) {

    const { modal, body } = createBootstrapModal("sessionDetail-" + sessionId, "sessionDetailLabel-" + sessionId);

    addSessionContentToModal(body, session, trackName);
    speakers.forEach(speaker => {
        addSpeakerContentToModal(body, speaker, baseUrl);
    });

    document.body.append(modal);

}
const waitForElm = function (selector, speaker) {
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

function skipModalForLinks() {
    /*
     * This disables anything with the "skip-modal" class from opening
     * a modal. It base use-case is to make links clickable that are within
     * a parent element set to open a modal. 
     */
    waitForElm(".skip-modal", undefined).then(([elements, speaker]) => {
        elements.forEach(element => {
            element.addEventListener('click', function(event) {
                event.stopPropagation(); // Stops the modal trigger from activating
            });
        });
    });

}

function backfillSpeakerDetails(speakers, baseUrl) {
    speakers.forEach(speaker => {
        /*
         * Backfill items on the schedule first
         */
        waitForElm("#speakerPosition-" + speaker.id, speaker).then(([elements, speaker]) => {
            elements.forEach(element => {
                element.innerText = speaker.tagLine;
            });
        });

        /*
         * Backfill items on the modals. The headshot only gets a data-src
         * here (src only if its modal was already opened) so it doesn't
         * fetch until the modal opens - see show.bs.modal in scripts.js.
         */
        waitForElm("#speakerProfileUrl-" + speaker.id, speaker).then(([elements, speaker]) => {
            elements.forEach(element => {
                setSpeakerHeadshot(element, speaker.profilePicture, 0, true);
            });
        });
        waitForElm("#speakerTagLine-" + speaker.id, speaker).then(([elements, speaker]) => {
            elements.forEach(element => {
                element.innerText = speaker.tagLine;
                backfillSpeakerSocial(speaker, element, baseUrl);
            });
        });

        waitForElm("#speakerBio-" + speaker.id, speaker).then(([elements, speaker]) => {
            elements.forEach(element => {
                element.innerText = speaker.bio;
            });
        });

        waitForElm("#speakerPronouns-" + speaker.id, speaker).then(([elements, speaker]) => {
            elements.forEach(element => {
                backfillSpeakerPronouns(speaker, element);
            });
        });
    });
}
