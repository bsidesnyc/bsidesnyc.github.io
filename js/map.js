function initMap(config) {
    const eventPlace = new google.maps.LatLng(config.eventPlaceCoordinates.lat, config.eventPlaceCoordinates.lng);
    const centerMap = new google.maps.LatLng(config.mapCenterCoordinates.lat, config.mapCenterCoordinates.lng);
    const mobileCenterMap = new google.maps.LatLng(config.mapMobileCenterCoordinates.lat, config.mapMobileCenterCoordinates.lng);
    const icon = config.baseurl + '/img/other/map-marker.svg';

    if (window.innerWidth <= 767) {
        const eventPlaceCoords = config.eventPlaceCoordinates.lat + ',' + config.eventPlaceCoordinates.lng;
        const mobileCenterMapCoords = config.mapMobileCenterCoordinates.lat + ',' + config.mapMobileCenterCoordinates.lng;
        const staticIcon = config.url + config.baseurl + '/img/other/map-marker.webp';
        
        const canvasMap = document.getElementById('canvas-map');
        if (canvasMap) {
            canvasMap.classList.add('image-section');
            canvasMap.style.backgroundImage = `url(https://maps.googleapis.com/maps/api/staticmap?zoom=17&center=${mobileCenterMapCoords}&size=${window.innerWidth}x700&scale=2&language=en&markers=icon:${staticIcon}|${eventPlaceCoords}&maptype=roadmap&style=visibility:on|lightness:40|gamma:1.1|weight:0.9&style=element:labels|visibility:off&style=feature:water|hue:0x0066ff&style=feature:road|visibility:on&style=feature:road|element:labels|saturation:-30)`;
        }
        return; // Mobile uses static image, no need to initialize full JS map
    }

    const MY_MAPTYPE_ID = 'custom_style';
    const zoomedOpts = [{ stylers: [{ lightness: 40 }, { visibility: 'on' }, { gamma: 1.1 }, { weight: 0.9 }] }, { elementType: 'labels', stylers: [{ visibility: 'off' }] }, { featureType: 'water', stylers: [{ color: '#5dc7ff' }] }, { featureType: 'road', stylers: [{ visibility: 'on' }] }, { featureType: 'road', elementType: "labels", stylers: [{ saturation: -30 }] }];

    const mapOptions = {
        zoom: 17,
        minZoom: 2,
        scrollwheel: false,
        panControl: false,
        draggable: true,
        zoomControl: false,
        scaleControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        center: centerMap,
        mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID] },
        mapTypeId: MY_MAPTYPE_ID
    };

    const mapEl = document.getElementById('canvas-map');
    if (!mapEl) return;
    
    const map = new google.maps.Map(mapEl, mapOptions);

    new google.maps.Marker({
        position: eventPlace,
        animation: google.maps.Animation.DROP,
        icon: icon,
        map: map
    });

    const zoomedMapType = new google.maps.StyledMapType(zoomedOpts, { name: 'Zoomed Style' });
    map.mapTypes.set('zoomed', zoomedMapType);
    map.setMapTypeId('zoomed');
}
