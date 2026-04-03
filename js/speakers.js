async function onLoad(endpoint, baseUrl) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Network response was not ok: " + response.status);
        const result = await response.json();
        populateSpeakers(result, baseUrl);
    } catch (error) {
        console.error("onLoad: Failed to load speakers:", error);
    }
}

function addSpeakerToList(speaker, sessions, rooms, container) {
    try {
        const trackNames = [];
        if (speaker.sessions && sessions && rooms) {
            speaker.sessions.forEach(sessionId => {
                const session = sessions.find(s => s.id == sessionId);
                if (session) {
                    const room = rooms.find(r => r.id == session.roomId);
                    if (room && room.name) {
                        trackNames.push(room.name);
                    }
                }
            });
        }

        const wrapper = document.createElement("div");
        wrapper.className = "effect-wrapper col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6 text-end speaker-card";

        const effect = document.createElement("div");
        effect.className = "zoe-effect";
        effect.setAttribute("data-bs-toggle", "modal");
        effect.setAttribute("data-bs-target", "#speakerDetail-" + speaker.id);

        const headshot = document.createElement("figure");

        const bg = document.createElement("div");
        bg.className = "card-bg";
        if (speaker.profilePicture) {
            bg.style.backgroundImage = "url(" + speaker.profilePicture + ")";
        }
        headshot.append(bg);

        const ribbonWrapper = document.createElement("ul");
        ribbonWrapper.className = "ribbon-wrapper";

        trackNames.forEach(tn => {
            const track = document.createElement("li");
            track.classList.add(normalizeTrackName(tn));

            const ribbonAbbr = document.createElement("p");
            ribbonAbbr.className = "ribbon abbr";
            ribbonAbbr.innerText = tn.split(" ")[0];
            track.append(ribbonAbbr);

            const ribbonTitle = document.createElement("p");
            ribbonTitle.className = "ribbon full-title";
            ribbonTitle.innerText = tn;
            track.append(ribbonTitle);
            ribbonWrapper.append(track);
        });
        headshot.append(ribbonWrapper);

        const caption = document.createElement("figcaption");
        const name = document.createElement("h2");
        name.className = "name";
        name.innerText = speaker.fullName;
        caption.append(name);

        const position = document.createElement("span");
        position.className = "position";
        position.innerText = speaker.tagLine || "";
        caption.append(position);

        headshot.append(caption);
        effect.append(headshot);
        wrapper.append(effect);
        container.append(wrapper);
    } catch (e) {
        console.error("Error adding speaker to list:", speaker.fullName, e);
    }
}

function addSpeakerToModal(speaker, sessions, rooms, baseUrl) {
    try {
        const { modal, body } = createBootstrapModal("speakerDetail-" + speaker.id, "speakerDetailLabel-" + speaker.id);

        if (speaker.sessions && sessions) {
            speaker.sessions.forEach(sessionId => {
                const session = sessions.find(s => s.id == sessionId);
                if (session) {
                    const room = rooms ? rooms.find(r => r.id == session.roomId) : null;
                    addSessionContentToModal(body, session, room ? room.name : "");
                }
            });
        }
        
        addSpeakerContentToModal(body, speaker, baseUrl);
        document.body.append(modal);
    } catch (e) {
        console.error("Error creating modal for speaker:", speaker.fullName, e);
    }
}

function populateSpeakers(allData, baseUrl) {
    const speakerListDiv = document.getElementById('speaker-list');
    if (!speakerListDiv) return;
    
    if (!allData || !allData.speakers) return;

    allData.speakers.forEach(speaker => {
        addSpeakerToList(speaker, allData.sessions, allData.rooms, speakerListDiv);
        addSpeakerToModal(speaker, allData.sessions, allData.rooms, baseUrl);
    });
}
