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
        center: [24.02, 49.84],
        zoom: 14,
        maxZoom: 25,
    }
};

function loadMap() {
    map.addSource('source-tms-1', {
        'type': 'raster',
        'tiles': [ 'https://tiles.openaerialmap.org/6066cd43d8a0ef00061b9506/0/6066cd43d8a0ef00061b9507/{z}/{x}/{y}' ],
        'tileSize': 256
    });
    map.addLayer({
        'id': 'source-tms',
        'type': 'raster',
        'source': 'source-tms-1'
    }, '');

    map.addSource('detects-bboxes', {
        'type': 'geojson',
        'data': './detects.geojson'
    });
    map.addLayer({
        'id': 'bboxes',
        'type': 'line',
        'source': 'detects-bboxes',
        'layout': {},
        'paint': {
            'line-color': '#ff0000',
            'line-width': 2
        }
    });
}

async function initializeMap() {
    await credentials.getPromise();
    map = new maplibregl.Map({
        container: "map",
        center: [24.012, 49.811],
        maxZoom: 20,
        minZoom: 1,
        zoom: 13,
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
        map.boxZoom.enable();
        loadMap();
    });
}

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
