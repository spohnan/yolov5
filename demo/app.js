// --- Set per deployment ---
const identityPoolId = "us-east-1:8238d46e-e118-4261-9afd-b8242931fbb5";
const mapName = "gs-app";
// - End of config settings -

let map;
const { Signer } = window.aws_amplify_core;
const credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: identityPoolId });
AWS.config.region = identityPoolId.split(":")[0];
const byId = document.getElementById.bind(document);

const datasets = {
    lviv: {
        center: [24.012, 49.811],
        zoom: 15,
        maxZoom: 21,
        tiles: ['https://tiles.openaerialmap.org/6066cd43d8a0ef00061b9506/0/6066cd43d8a0ef00061b9507/{z}/{x}/{y}']
    },
    winchelsea: {
        center: [0.708, 50.924],
        zoom: 17,
        maxZoom: 21,
        tiles: ['https://tiles.openaerialmap.org/632b17e89ee90900078a716d/0/632b17e89ee90900078a716e/{z}/{x}/{y}']
    }
};

let params = new URLSearchParams(window.location.search);
if(params.get('ds')) { 
    ds = datasets[params.get('ds')];
    byId("select-dataset").value = params.get('ds');
} else {
    ds = datasets[Object.keys(datasets)[0]]; 
}

function refreshMap() {
    if(map.getLayer('base')) { map.removeLayer('base'); }
    if(map.getLayer('bboxes')) { map.removeLayer('bboxes'); }
    if(map.getSource('base-tiles')) { map.removeSource('base-tiles'); }
    if(map.getSource('detects-bboxes')) { map.removeSource('detects-bboxes'); }

    map.addSource('base-tiles', {
        'type': 'raster',
        'tiles': ds.tiles,
        'tileSize': 256
    });
    map.addLayer({
        'id': 'base',
        'type': 'raster',
        'source': 'base-tiles'
    });
    map.addSource('detects-bboxes', {
        'type': 'geojson',
        'data': './' + byId("select-dataset").value + '-detects.geojson'
    });
    map.addLayer({
        'id': 'bboxes',
        'type': 'line',
        'source': 'detects-bboxes',
        'layout': {},
        'paint': {
            'line-color': [
                'case',
                ["has", "co"], ["get", "co"],
                '#ff0000'
            ],
            'line-width': 2
        }
    });
}

async function initializeMap() {
    await credentials.getPromise();
    map = new maplibregl.Map({
        container: "map",
        center: ds.center,
        maxZoom: ds.maxZoom,
        minZoom: 2,
        zoom: ds.zoom,
        style: mapName,
        transformRequest,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    map.addControl(new maplibregl.FullscreenControl());
    drawLayer = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true
        }
    });
    map.on('load', function() {
        refreshMap();
    });
}

byId("select-dataset").onchange = function() {
    ds = datasets[byId("select-dataset").value];
    map.setMaxZoom(ds.maxZoom);
    refreshMap();
    map.jumpTo({
        center: ds.center,
        zoom: ds.zoom,
    });
};

function transformRequest(url, resourceType) {
    if (resourceType === "Style" && !url.includes("://")) {
        url = `https://maps.geo.${AWS.config.region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
    }
    if (new URL(url).hostname.includes("amazonaws.com")) {
        return {
            url: Signer.signUrl(url, {
                access_key: credentials.accessKeyId,
                secret_key: credentials.secretAccessKey,
                session_token: credentials.sessionToken,
            }),
        };
    }
    return {
        url
    };
}

window.addEventListener('load', (event) => {
    initializeMap();
});
