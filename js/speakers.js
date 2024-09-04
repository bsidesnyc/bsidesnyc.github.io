function onLoad(endpoint, baseUrl) {
    var oReq = new XMLHttpRequest();
    oReq.onreadystatechange = function() {
        if ( oReq.readyState === XMLHttpRequest.DONE ) {
            if ( oReq.status === 200 ) {
                var result = JSON.parse(oReq.responseText);
                populateSpeakers(result, baseUrl);
            }
        }
    }
    oReq.open('GET', endpoint);
    oReq.send();

}

function addSpeakerToList(speaker, sessions, rooms) {
    /* 
     * Building out the slider content first so 
     * we can extract session details needed 
     * for other components
     */
    var trackNames = [];
    var slider = document.createElement("ul");
    slider.classList.add("slider");

    for (var i=0; i<speaker.sessions.length; i++) {
        for (var x=0; x<sessions.length; x++) {
            if ( speaker.sessions[i] == sessions[x].id ) {
                var title = document.createElement("li");

                title.classList.add("title");
                title.classList.add("slider-item");
                title.classList.add("animated");
                title.classList.add("fadeInRight");
                title.classList.add("hidden");

                title.innerText = sessions[x].title;
                slider.append(title);

                /*
                 * Determine trackNames for each session
                 */
                for (var y=0; y<rooms.length; y++) {
                    if ( sessions[x].roomId == rooms[y].id ) {
                        trackNames.push(rooms[y].name);
                    }
                }
            }
        }
    }
    var effectWrapper = document.createElement("div");
    effectWrapper.classList.add("effect-wrapper");
    effectWrapper.classList.add("appear-animation");
    effectWrapper.classList.add("col-md-4");
    effectWrapper.classList.add("col-sm-6");
    effectWrapper.classList.add("col-xs-12");
    effectWrapper.classList.add("text-right");

    var lilyEffect = document.createElement("div");
    lilyEffect.classList.add("lily-effect");
    lilyEffect.classList.add("ribbon-activator");

    var lilyHeader = document.createElement("div");
    lilyHeader.classList.add("lily-head");
    lilyHeader.classList.add("lily-head-dark");
    lilyHeader.classList.add("waves-effect");
    lilyHeader.classList.add("waves-block");
    lilyHeader.classList.add("waves-light");
    lilyHeader.setAttribute("data-toggle", "modal");
    lilyHeader.setAttribute("data-target", "#speakerDetail-" + speaker.id );

    var speakerHeadshot = document.createElement("figure");
    /*
    speakerHeadshot.classList.add("waves-effect");
    speakerHeadshot.classList.add("waves-block");
    speakerHeadshot.classList.add("waves-light");
    */
    speakerHeadshot.classList.add("figure-circle");
    speakerHeadshot.classList.add("img-circle");
    if ( speaker.profilePicture != null ) {
        speakerHeadshot.setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
    }

    var overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.classList.add("solid-overlay");

    var ribbonWrapper = document.createElement("ul");
    ribbonWrapper.classList.add("ribbon-wrapper");

    for (var i=0; i<trackNames.length; i++) {
        /*
         * Expecting trackNames of:
         *  Tech - red, blue, other
         *  Entreprenuer
         *  Workshop
         *  
         *  If any others are added, update main.css for colors
         */
        var track = document.createElement("li");
        track.classList.add(normalizeTrackName(trackNames[i]));

        var ribbonAbbr = document.createElement("p");
        ribbonAbbr.classList.add("ribbon");
        ribbonAbbr.classList.add("abbr");
        ribbonAbbr.innerText = trackNames[i].split(" ")[0];
        track.append(ribbonAbbr);

        var ribbonTitle = document.createElement("p");
        ribbonTitle.classList.add("ribbon");
        ribbonTitle.classList.add("full-title");
        ribbonTitle.innerText = trackNames[i];
        track.append(ribbonTitle);
        ribbonWrapper.append(track);
    }
    speakerHeadshot.append(ribbonWrapper);

    var caption = document.createElement("figcaption");

    var name = document.createElement("h2");
    name.classList.add("name");
    name.innerText = speaker.fullName;
    caption.append(name);

    var position = document.createElement("p");
    position.classList.add("position");
    position.innerText = speaker.tagLine;
    caption.append(position);

    speakerHeadshot.append(caption);
    lilyHeader.append(speakerHeadshot);
    lilyEffect.append(lilyHeader);

    var lilyBottom = document.createElement("div");
    lilyBottom.classList.add("lily-bottom");
    /*
     * Appending slider from the top now
     */
    lilyBottom.append(slider);

    var next = document.createElement("a");
    next.classList.add("slider-next-item");
    next.innerText = "Next";
    if ( speaker.sessions.length < 2 ) {
        next.classList.add("hidden");
    }
    lilyBottom.append(next);

    lilyEffect.append(lilyBottom);
    effectWrapper.append(lilyEffect);

    var speakerListDiv = document.getElementById('speaker-list');
    speakerListDiv.append(effectWrapper);
}

function addSpeakerSessionToModal(speaker, sessions, rooms, modalBody) {
    for (var i=0; i<speaker.sessions.length; i++) {
        for (var x=0; x<sessions.length; x++) {
            if ( speaker.sessions[i] == sessions[x].id ) {
                var title = document.createElement("h4");
                title.innerText = sessions[x].title;
                modalBody.append(title);

                for (var y=0; y<rooms.length; y++) {
                    if ( sessions[x].roomId == rooms[y].id ) {
                        var room = document.createElement("span");
                        room.classList.add("theme-metadata");

                        var caption = document.createElement("span");
                        caption.classList.add("caption");
                        caption.innerText = "Track: ";
                        room.append(caption, getTrackNameAndRoom(rooms[y].name));

                        var captionTime = document.createElement("span");
                        captionTime.classList.add("caption");
                        captionTime.innerText = "Time: " + getStartEndString(sessions[x]);
                        room.append( document.createElement("br"), captionTime);
                        break;
                    }
                }
                modalBody.append(room);

                var description = document.createElement("p");
                description.classList.add("theme-description");
                description.innerText = sessions[x].description;
                modalBody.append(description);

            }
        }
    }

}

function addSpeakerToModal(speaker, sessions, rooms, baseUrl) {
    var modal = document.createElement("div");
    modal.classList.add("modal");
    modal.classList.add("fade");
    modal.classList.add("text-left");
    modal.classList.add("people-modal");
    modal.id = "speakerDetail-" + speaker.id;
    modal.tabIndex = "-1";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "speakerDetailLabel-" + speaker.id );
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

    addSpeakerSessionToModal(speaker, sessions, rooms, modalBody);
    addSpeakerToSessionModal(speaker.id, speaker.fullName, modalBody, baseUrl);

    modalContent.append(modalBody);
    modalDialog.append(modalContent);
    modal.append(modalDialog);

    var speakerModalDiv = document.getElementById('speaker-modals');
    speakerModalDiv.append(modal); 
}

function populateSpeakers(allData, baseUrl) {
    for (var i=0; i<allData["speakers"].length; i++) {
        addSpeakerToList(allData["speakers"][i], allData["sessions"], allData["rooms"]);
        addSpeakerToModal(allData["speakers"][i], allData["sessions"], allData["rooms"], baseUrl);
    }
    sliderHandlers();
}
