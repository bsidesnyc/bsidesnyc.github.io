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
                /*
                var title = document.createElement("li");

                title.classList.add("title");
                title.classList.add("slider-item");
                title.classList.add("animated");
                title.classList.add("fadeInRight");
                title.classList.add("hidden");

                title.innerText = sessions[x].title;
                slider.append(title);
                /*

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
    var wrapper = document.createElement("div");
    wrapper.classList.add("effect-wrapper");
    wrapper.classList.add("appear-animation");
    wrapper.classList.add("col-xl-2");
    wrapper.classList.add("col-lg-3");
    wrapper.classList.add("col-md-4");
    wrapper.classList.add("col-sm-4");
    wrapper.classList.add("col-6");
    wrapper.classList.add("text-right");
    wrapper.classList.add("speaker-card");

    var effect = document.createElement("div");
    effect.classList.add("zoe-effect");
    effect.setAttribute("data-toggle", "modal");
    effect.setAttribute("data-target", "#speakerDetail-" + speaker.id );

    var headshot = document.createElement("figure");
    headshot.classList.add("waves-effect");
    headshot.classList.add("waves-block");
    headshot.classList.add("waves-light");
    if ( speaker.profilePicture != null ) {
        headshot.setAttribute("style", "background-image: url(" + speaker.profilePicture + ")");
    }

    var overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.classList.add("solid-overlay");

    /* 
     * Add ribbon to indicate what track they're speaking on
     */
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
    headshot.append(ribbonWrapper);

    var caption = document.createElement("figcaption");

    var name = document.createElement("h2");
    name.classList.add("name");
    name.innerText = speaker.fullName;
    caption.append(name);

    var position = document.createElement("span");
    position.classList.add("position");
    position.innerText = speaker.tagLine;
    caption.append(position);

    headshot.append(caption);
    effect.append(headshot);
    wrapper.append(effect);

    var speakerListDiv = document.getElementById('speaker-list');
    speakerListDiv.append(wrapper);
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
    modal.setAttribute("aria-hidden", false);

    var modalDialog = document.createElement("div");
    modalDialog.classList.add("modal-dialog");
    modalDialog.classList.add("modal-lg");
    modalDialog.setAttribute("role", "document");

    var modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    var modalBody = document.createElement("div");
    modalBody.classList.add("modal-body");

    var close = document.createElement("div");
    close.classList.add("close");
    close.setAttribute("data-dismiss", "modal");
    close.setAttribute("aria-label", "Close");

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

    modalBody.append(close);

    addSpeakerSessionToModal(speaker, sessions, rooms, modalBody);
    addSpeakerToSessionModal(speaker.id, speaker.fullName, modalBody, baseUrl);

    modalContent.append(modalBody);
    modalDialog.append(modalContent);
    modal.append(modalDialog);

    document.body.append(modal)
}

function populateSpeakers(allData, baseUrl) {
    for (var i=0; i<allData["speakers"].length; i++) {
        addSpeakerToList(allData["speakers"][i], allData["sessions"], allData["rooms"]);
        addSpeakerToModal(allData["speakers"][i], allData["sessions"], allData["rooms"], baseUrl);
    }
    sliderHandlers();

}
