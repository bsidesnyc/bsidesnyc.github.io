let player;

function parseVideoSource(url) {
    if (!url) return null;

    // YouTube: extract 11-char ID
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
        return {
            type: 'video',
            sources: [{
                src: ytMatch[2],
                provider: 'youtube',
            }],
        };
    }

    // Archive.org: transform details URL to download URL
    if (url.indexOf('archive.org') !== -1) {
        try {
            const urlObj = new URL(url);
            const identifier = urlObj.pathname.split('/')[2];
            const file = urlObj.searchParams.get('file');
            if (identifier && file) {
                const directUrl = `https://archive.org/download/${identifier}/${file}`;
                return {
                    type: 'video',
                    sources: [{
                        src: directUrl,
                        type: 'video/mp4',
                    }],
                };
            }
        } catch (e) {
            console.error("Archive.js: Failed to parse Archive.org URL:", url, e);
        }
    }

    // Fallback: treat as direct video link
    return {
        type: 'video',
        sources: [{
            src: url,
            type: 'video/mp4',
        }],
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Plyr
    player = new Plyr('#player', {
        ratio: '16:9',
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
        settings: ['quality', 'speed', 'loop']
    });

    /* Ensure modals are moved to body to escape any parent stacking contexts */
    const videoModalEl = document.getElementById('videoModal');
    if (videoModalEl) {
        document.body.appendChild(videoModalEl);
        
        // Stop playback when modal is hidden
        videoModalEl.addEventListener('hidden.bs.modal', function () {
            if (player) {
                player.stop();
            }
        });
    }

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-watch-video');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();
        
        const videoUrl = btn.getAttribute('data-video-url') || '';
        const videoTitle = btn.getAttribute('data-video-title') || '';
        
        const titleEl = document.getElementById('videoModalTitle');
        if (titleEl) titleEl.textContent = videoTitle;

        const source = parseVideoSource(videoUrl);
        if (source && player) {
            player.source = source;
            const videoModal = bootstrap.Modal.getInstance(videoModalEl) || new bootstrap.Modal(videoModalEl);
            videoModal.show();
            
            // Auto-play after a short delay to allow source loading
            setTimeout(() => {
                player.play();
            }, 500);
        }
    });
});
