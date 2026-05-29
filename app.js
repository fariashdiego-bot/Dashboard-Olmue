document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // VARIABLES
    // =========================

    let geojsonData;

    let proyectosLayer;

    let lineasLayer;

    let polyLayer;
    
    let lineasData;
    
    let polyData;

    let limiteComunalLayer;

    let reservaBiosferaLayer;

    let unidadesVecinalesLayer;

    let uvGeoJSON = null;   // 🔥 AÑADE ESTO

    let uvSeleccionada = 'TODOS';
    
    let mapaListo = false;

    let featuresFiltradas = [];

    function actualizarUVStyle() {

    if (!unidadesVecinalesLayer) return;

    unidadesVecinalesLayer.setStyle(feature => {

        const nombre = feature.properties?.t_uv_nom;

        const activa =
            uvSeleccionada === 'TODOS' ||
            nombre === uvSeleccionada;

       return {
    color: '#475569',

    weight: activa ? 1 : 0,

    opacity: activa ? 0.8 : 0,

    fillColor: '#94a3b8',

    fillOpacity: activa ? 0.18 : 0,

    interactive: activa
};
    });
}

    // =========================
    // MAPA
    // =========================

    const map = L.map('map', {
        zoomControl: false
    });
 // =========================
 // PANE UV
 // =========================

 map.createPane('paneUV');

 map.getPane('paneUV').style.zIndex = 350;
    // =========================
    // BASEMAPS
    // =========================

    const mapaClaro = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
            attribution: '&copy; OpenStreetMap & CARTO'
        }
    );

    const mapaOSM = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '&copy; OpenStreetMap'
        }
    );

    const mapaSatelital = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            attribution: '&copy; Esri'
        }
    );

    mapaClaro.addTo(map);

    // =========================
    // CONTROL CAPAS
    // =========================

    const baseMaps = {
        "Minimal": mapaClaro,
        "OpenStreetMap": mapaOSM,
        "Satélite": mapaSatelital
    };

    const overlayMaps = {};

    const layerControl = L.control.layers(
        baseMaps,
        overlayMaps,
        {
            position: 'topright'
        }
    ).addTo(map);

    // =========================
    // BOTÓN GPS
    // =========================

    const gpsControl = L.control({
        position: 'topright'
    });

    gpsControl.onAdd = function () {

        const div = L.DomUtil.create(
            'div',
            'custom-map-button'
        );

        div.innerHTML = `
            <img src="https://www.freeiconspng.com/thumbs/target-icon/internet-keyword-targeting-seo-target-icon--22.png">
        `;

        div.title = 'Mi ubicación';

        div.onclick = function () {

            map.locate({
                setView: true,
                maxZoom: 16
            });
        };

        return div;
    };

    gpsControl.addTo(map);

    // =========================
    // BOTÓN HOME
    // =========================

    const homeControl = L.control({
        position: 'topright'
    });

    homeControl.onAdd = function () {

        const div = L.DomUtil.create(
            'div',
            'custom-map-button'
        );

        div.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/1946/1946436.png">
        `;

        div.title = 'Vista inicial';

        div.onclick = function () {

            if (proyectosLayer) {

                map.fitBounds(
                    proyectosLayer.getBounds(),
                    {
                        padding: [40, 40]
                    }
                );
            }
        };

        return div;
    };

    homeControl.addTo(map);
const tablaControl = L.control({
    position: 'topright'
});

tablaControl.onAdd = function () {

    const div = L.DomUtil.create('div', 'custom-map-button');

    div.innerHTML = `
        ▤
    `;

    div.title = 'Tabla de proyectos';

    L.DomEvent.disableClickPropagation(div);

    div.onclick = function () {

        let html = '<table style="width:100%;font-size:12px;">';
        html += '<tr><th>ID</th><th>Nombre</th></tr>';

        featuresFiltradas.forEach(f => {

            html += `
                <tr class="fila-tabla" data-id="${f.properties.ID}">
                    <td>${f.properties.ID || '-'}</td>
                    <td>${f.properties.PROY || '-'}</td>
                </tr>
            `;
        });

        html += '</table>';

        const panel = document.getElementById('tabla-panel');
        const cont = document.getElementById('tabla-contenido');

        cont.innerHTML = html;
        document.querySelectorAll('.fila-tabla').forEach(row => {

    row.addEventListener('click', () => {

        const id = row.dataset.id;

        proyectosLayer.eachLayer(layer => {

            const featureId = String(layer.feature?.properties?.ID || '');

            if (featureId === id) {

                if (layer.getLatLng) {

    // =========================
    // PROYECTOS PUNTUALES
    // =========================

    map.flyTo(
        layer.getLatLng(),
        17,
        {
            duration: 0.8
        }
    );

} else if (layer.getBounds) {

    // =========================
    // LÍNEAS / POLÍGONOS
    // =========================

    map.flyToBounds(
        layer.getBounds(),
        {
            padding: [120, 120],
            maxZoom: 17,
            duration: 0.8
        }
    );
}

layer.openPopup();
            }
        });
    });
});

        panel.classList.add('active');
    };

    return div;
};

tablaControl.addTo(map);
const geocoder = L.Control.geocoder({

    defaultMarkGeocode: false,

    placeholder: 'Buscar dirección...',

    errorMessage: '',

    collapsed: true,

    suggestMinLength: 2,

    suggestTimeout: 150,

    suggest: true,

    geocoder: new L.Control.Geocoder.Photon()

}).addTo(map);
    // =========================
    // ZOOM
    // =========================

    L.control.zoom({
        position: 'topright'
    }).addTo(map);



// mover mapa
geocoder.on('markgeocode', function(e) {

    map.fitBounds(e.geocode.bbox, {
        padding: [40, 40]
    });
});


// limpiar dropdown al borrar
const geocoderInput = document.querySelector(
    '.leaflet-control-geocoder input'
);

geocoderInput.addEventListener('input', () => {

    const alternatives = document.querySelector(
        '.leaflet-control-geocoder-alternatives'
    );

    if (!alternatives) return;

    if (!geocoderInput.value.trim()) {

        alternatives.innerHTML = '';
    }
});

    // =========================
    // ELEMENTOS UI
    // =========================

    const cantidadEl =
        document.getElementById('cantidad');

    const montoEl =
        document.getElementById('monto');

    const cantidadMobileEl =
        document.getElementById('cantidad-mobile');

    const montoMobileEl =
        document.getElementById('monto-mobile');

    // =========================
    // HELPERS
    // =========================

    function titleCase(texto) {

        return String(texto || '')
            .toLowerCase()
            .replace(
                /(^|\s|-|\/)\p{L}/gu,
                letra => letra.toUpperCase()
            );
    }

    function parseMonto(valor) {

        return parseFloat(
            String(valor ?? 0)
                .replace(/\$/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        ) || 0;
    }


function obtenerColor(fuente) {

    if (!fuente) return '#cbd5e1';

    const f = fuente.toUpperCase();

    switch (f) {

        case 'ACELERADORA DE ENERGÍA MUNICIPAL':
            return '#f9c5d5'; // rosa pastel

        case 'CAP. I D.S.N° 27 MINVU':
            return '#bfdbfe'; // azul pastel

        case 'F.N.D.R. - CIRCULAR 33':
            return '#d8b4fe'; // lavanda

        case 'F.N.D.R. - F.R.I.L.':
            return '#fde68a'; // amarillo crema

        case 'F.N.D.R. TRADICIONAL':
            return '#a5f3fc'; // cyan pastel

        case 'MINISTERIO DE SALUD':
            return '#f5d0fe'; // lila rosado

        case 'PMB':
            return '#fdba74'; // durazno

        case 'PMU EMERGENCIA':
            return '#cbd5e1'; // gris suave

        case 'PMU TRADICIONAL':
            return '#fda4af'; // coral pastel

        case 'MINVU- QMB':
            return '#86efac'; // verde mint

        case 'SERVIU PAVIPART':
            return '#f9a8d4'; // rosado moderno

        case 'SPD (SIEVAP)':
            return '#bef264'; // lima pastel

        case 'SUBDERE':
            return '#99f6e4'; // turquesa pastel

        default:
            return '#e2e8f0'; // gris claro
    }
}


function esValido(feature) {

    const fuente =
        feature?.properties?.FUENTE;

    if (!fuente) return false;

    const txt = String(fuente)
        .trim()
        .toUpperCase();

    return (
        txt !== '' &&
        txt !== 'NULL' &&
        txt !== 'UNDEFINED' &&
        !txt.includes('COMPROMISO ALCALDE')
    );
}

    function crearPopup(feature) {

        const titulo = titleCase(
            feature.properties.PROY
        );

        const monto = parseMonto(
            feature.properties.MONTO
        );

        const color = obtenerColor(
            feature.properties.FUENTE
        );

        return `
            <div
                class="popup-header"
                style="
                    background:
                    linear-gradient(
                        135deg,
                        ${color},
                        ${color}dd
                    );
                    color:white;
                "
            >
                ${titulo}
            </div>

            <div class="popup-body">

                <div class="popup-row">
                    <strong>Estado</strong>
                    <span>${feature.properties.ESTADO || '-'}</span>
                </div>

                <div class="popup-row">
                    <strong>Fuente</strong>
                    <span>${feature.properties.FUENTE || '-'}</span>
                </div>

                <div class="popup-row">
                    <strong>Monto</strong>
                    <span>$${monto.toLocaleString('es-CL')}</span>
                </div>

            </div>
        `;
    }

    // =========================
    // PUNTOS
    // =========================

    function crearCapaGeoJSON(data) {

        return L.geoJSON(data, {

            pointToLayer(feature, latlng) {

    const color = obtenerColor(
        feature.properties.FUENTE
    );

    const id =
        feature.properties.ID || '';

    return L.marker(latlng, {

        icon: L.divIcon({

            className: 'custom-marker',

            html: `
                <div style="
                    width:28px;
                    height:28px;
                    border-radius:50%;
                    background:${color};
                    border:2px solid rgba(255,255,255,0.95);
                    box-shadow:0 4px 10px rgba(0,0,0,0.12);
                    transition:all .2s ease;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:white;
                    font-size:11px;
                    font-weight:700;
                ">
                    ${id}
                </div>
            `,

            iconSize: [28, 28],
            iconAnchor: [14, 14]
        })
    });
},
            onEachFeature(feature, layer) {

                layer.bindPopup(
                    crearPopup(feature)
                );

                layer.on({

                    mouseover: () => {

                        const el = layer._icon?.firstElementChild;

                        if (el) {

                            el.style.transform =
                                'scale(1.35)';
                        }
                    },

                    mouseout: () => {

                        const el = layer._icon?.firstElementChild;

                        if (el) {

                            el.style.transform =
                                'scale(1)';
                        }
                    }
                });
            }
        });
    }

    // =========================
    // DASHBOARD
    // =========================

    function actualizarDashboard() {

        if (!map._loaded) return;

        if (!proyectosLayer) return;

        let cantidad = 0;

        let monto = 0;

        let bounds;

        try {
            bounds = map.getBounds();
        } catch (e) {
            return;
        }

        proyectosLayer.eachLayer(layer => {

            const feature = layer.feature;

            if (!feature) return;

            const geom = feature.geometry;

            let visible = false;

            if (geom.type === 'Point') {

                const c = geom.coordinates;

                visible = bounds.contains(
                    L.latLng(c[1], c[0])
                );
            }

            else if (geom.type === 'MultiPoint') {

                geom.coordinates.forEach(c => {

                    if (
                        bounds.contains(
                            L.latLng(c[1], c[0])
                        )
                    ) {
                        visible = true;
                    }
                });
            }

            else if (
                geom.type === 'LineString' ||
                geom.type === 'MultiLineString' ||
                geom.type === 'Polygon' ||
                geom.type === 'MultiPolygon'
            ) {

                visible = map.getBounds().intersects(
                    layer.getBounds()
                );
            }

            if (!visible) return;

            cantidad++;

            monto += parseMonto(
                feature.properties.MONTO
            );
        });

        const texto =
            '$' + monto.toLocaleString('es-CL');

        cantidadEl.textContent =
            cantidad;

        montoEl.textContent =
            texto;

        const largo = texto.length;

        if (largo > 20) {

            montoEl.style.fontSize = '18px';

        } else if (largo > 17) {

            montoEl.style.fontSize = '22px';

        } else if (largo > 14) {

            montoEl.style.fontSize = '26px';

        } else {

            montoEl.style.fontSize = '32px';
        }

        if (cantidadMobileEl)
            cantidadMobileEl.textContent =
                cantidad;

        if (montoMobileEl)
            montoMobileEl.textContent =
                texto;
    }

function actualizarLeyenda() {

    const cont = document.getElementById('leyenda-contenido');
    if (!cont) return;

    cont.innerHTML = '';

    const bounds = map.getBounds();

    const fuentesMap = new Map();

    featuresFiltradas.forEach(f => {

        const geom = f.geometry;
        if (!geom) return;

        let visibleEnMapa = false;

        // =========================
        // POINT
        // =========================
        if (geom.type === 'Point') {

            visibleEnMapa = bounds.contains(
                L.latLng(geom.coordinates[1], geom.coordinates[0])
            );
        }

        // =========================
        // MULTIPOINT
        // =========================
        else if (geom.type === 'MultiPoint') {

            geom.coordinates.forEach(c => {
                if (bounds.contains(L.latLng(c[1], c[0]))) {
                    visibleEnMapa = true;
                }
            });
        }

        // =========================
        // LÍNEAS / POLÍGONOS
        // =========================
        else {

            const temp = L.geoJSON(f);
            if (temp.getBounds && bounds.intersects(temp.getBounds())) {
                visibleEnMapa = true;
            }
        }

        if (!visibleEnMapa) return;

        const fuente = f.properties.FUENTE;

        if (fuente && !fuentesMap.has(fuente)) {
            fuentesMap.set(fuente, fuente);
        }
    });

    if (fuentesMap.size === 0) {

        cont.innerHTML = `
            <div class="legend-empty">
                No hay proyectos visibles
            </div>
        `;
        return;
    }

    fuentesMap.forEach(fuente => {

        cont.innerHTML += `
            <div class="legend-item">

                <div class="legend-color"
                    style="background:${obtenerColor(fuente)}">
                </div>

                <span>${fuente}</span>

            </div>
        `;
    });
}

    // =========================
    // FILTROS
    // =========================


 function actualizarFiltros() {

    const estado = document.getElementById('filtro-estados').value;
    const fuente = document.getElementById('filtro-fuentes').value;

    // 1. filtro base (atributos)
    let base = geojsonData.features.filter(f => {

        if (!esValido(f)) return false;

        return (
            (estado === 'TODOS' || f.properties.ESTADO === estado) &&
            (fuente === 'TODOS' || f.properties.FUENTE === fuente)
        );
    });

    // 2. filtro espacial UV
    featuresFiltradas = filtrarPorUV(base);
    actualizarUVStyle();

    // =========================
    // RECREAR CAPA
    // =========================

    if (proyectosLayer) {
        map.removeLayer(proyectosLayer);
    }

    proyectosLayer = crearCapaGeoJSON({
        type: "FeatureCollection",
        features: featuresFiltradas
    }).addTo(map);

    // =========================
    // LÍNEAS
    // =========================

if (lineasLayer) {
    map.removeLayer(lineasLayer);
}

lineasLayer = L.geoJSON(lineasData, {
    filter: feature => {

    const props = feature.properties;

    const cumpleAtributos =
        (estado === 'TODOS' || props.ESTADO === estado) &&
        (fuente === 'TODOS' || props.FUENTE === fuente);

    if (!cumpleAtributos) return false;

    // aplicar filtro UV también
    return filtrarPorUV([feature]).length > 0;
},
    style: feature => ({
        color: obtenerColor(feature.properties.FUENTE),
        weight: 2,
        opacity: 0.9
    }),
    onEachFeature(feature, layer) {
        layer.bindPopup(crearPopup(feature));
    }
}).addTo(map);



    // =========================
    // POLÍGONOS
    // =========================

if (polyLayer) {
    map.removeLayer(polyLayer);
}

polyLayer = L.geoJSON(polyData, {
    filter: feature => {

    const props = feature.properties;

    const cumpleAtributos =
        (estado === 'TODOS' || props.ESTADO === estado) &&
        (fuente === 'TODOS' || props.FUENTE === fuente);

    if (!cumpleAtributos) return false;

    return filtrarPorUV([feature]).length > 0;
},
    style: feature => ({
        color: obtenerColor(feature.properties.FUENTE),
        fillColor: obtenerColor(feature.properties.FUENTE),
        fillOpacity: 0.22,
        weight: 2
    }),
    onEachFeature(feature, layer) {
        layer.bindPopup(crearPopup(feature));
    }
}).addTo(map);

    actualizarDashboard();
    actualizarLeyenda();

    // =========================
    // ZOOM CORRECTO
    // =========================

    requestAnimationFrame(() => {

        setTimeout(() => {

            if (!proyectosLayer) return;
            if (featuresFiltradas.length === 0) return;

            const bounds = L.latLngBounds();

            featuresFiltradas.forEach(f => {

                const g = f.geometry;
                if (!g) return;

                if (g.type === 'Point') {
                    bounds.extend([g.coordinates[1], g.coordinates[0]]);
                }

                else if (g.type === 'MultiPoint') {
                    g.coordinates.forEach(c =>
                        bounds.extend([c[1], c[0]])
                    );
                }

                else if (g.type === 'LineString') {
                    g.coordinates.forEach(c =>
                        bounds.extend([c[1], c[0]])
                    );
                }

                else if (g.type === 'Polygon') {
                    g.coordinates[0].forEach(c =>
                        bounds.extend([c[1], c[0]])
                    );
                }
            });

            if (!bounds.isValid()) return;

            map.fitBounds(bounds, {
                padding: [40, 40],
                maxZoom: 16,
                animate: true
            });

        }, 150);
    });

}

    // =========================
    // CREAR FILTROS
    // =========================

    function crearFiltros() {

        const estados =
            [...new Set(
                geojsonData.features.map(
                    f => f.properties.ESTADO
                )
            )];

        const fuentes =
            [...new Set(
                geojsonData.features.map(
                    f => f.properties.FUENTE
                )
            )];

        const estSel =
            document.getElementById(
                'filtro-estados'
            );

        const fuenSel =
            document.getElementById(
                'filtro-fuentes'
            );

        estSel.innerHTML = '';
        fuenSel.innerHTML = '';
        estSel.innerHTML += `<option value="TODOS">Todos</option>`;
        fuenSel.innerHTML += `<option value="TODOS">Todos</option>`;

        estados.forEach(e => {

            if (!e) return;

            estSel.innerHTML += `
                <option value="${e}">
                    ${e}
                </option>
            `;
        });

        fuentes.forEach(f => {

            if (!f) return;

            fuenSel.innerHTML += `
                <option value="${f}">
                    ${f}
                </option>
            `;
        });

        estSel.addEventListener(
            'change',
            actualizarFiltros
        );

        fuenSel.addEventListener(
            'change',
            actualizarFiltros
        );
        document.getElementById('filtro-uv')
    ?.addEventListener('change', (e) => {

        uvSeleccionada = e.target.value;

        actualizarFiltros();
    });
    }
function filtrarPorUV(features) {

    if (uvSeleccionada === 'TODOS') return features;

    if (!uvGeoJSON) return features;

    const uvFeature = uvGeoJSON.features.find(
        f => f.properties.t_uv_nom === uvSeleccionada
    );

    if (!uvFeature) return features;

    // layer real de la UV
    const uvLayer = L.geoJSON(uvFeature);

    return features.filter(feature => {

        const geom = feature.geometry;

        if (!geom) return false;

        let puntos = [];

        // =========================
        // POINT
        // =========================

        if (geom.type === 'Point') {

            puntos = [geom.coordinates];
        }

        // =========================
        // MULTIPOINT
        // =========================

        else if (geom.type === 'MultiPoint') {

            puntos = geom.coordinates;
        }

        // =========================
        // LINESTRING
        // =========================

        else if (geom.type === 'LineString') {

            puntos = geom.coordinates;
        }

        // =========================
        // POLYGON
        // =========================

        else if (geom.type === 'Polygon') {

            puntos = geom.coordinates[0];
        }

        // =========================
        // MULTIPOLYGON
        // =========================

        else if (geom.type === 'MultiPolygon') {

            geom.coordinates.forEach(poly => {

                poly[0].forEach(coord => {

                    puntos.push(coord);
                });
            });
        }

        // =========================
        // VERIFICAR SI ALGÚN PUNTO
        // ESTÁ DENTRO DE LA UV
        // =========================

        return puntos.some(coord => {

            const latlng = L.latLng(
                coord[1],
                coord[0]
            );

            const inside = leafletPip.pointInLayer(
                latlng,
                uvLayer,
                true
            );

            return inside.length > 0;
        });
    });
}
function poblarFiltroUV(unidadesVecinales) {

    const uvSelect = document.getElementById('filtro-uv');
    if (!uvSelect) return;

    // limpiar primero (CLAVE)
    uvSelect.innerHTML = `<option value="TODOS">Todas las UV</option>`;

    const nombresUV = [...new Set(
        unidadesVecinales.features
            .map(f => f.properties.t_uv_nom)
            .filter(Boolean)
    )];

    nombresUV.sort().forEach(n => {

        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        uvSelect.appendChild(opt);
    });

    uvGeoJSON = unidadesVecinales;

}
    // =========================
    // LOAD GEOJSON
    // =========================

    Promise.all([

        fetch('./proyectos.geojson')
            .then(r => r.json()),

        fetch('./ptoslineas_proyectos.geojson')
            .then(r => r.json()),

        fetch('./ptospoly_proyectos.geojson')
            .then(r => r.json()),

        fetch('./lineas_proyectos.geojson')
            .then(r => r.json()),

        fetch('./poly_proyectos.geojson')
            .then(r => r.json()),

        fetch('./limitecomunal.geojson')
            .then(r => r.json()),

        fetch('./unidadesvecinales.geojson')
            .then(r => r.json()),
        fetch('./reservabiosfera.geojson')
            .then(r => r.json())

    ]).then(([
       puntos,
       ptosLineas,
       ptosPoly,
       lineas,
       poly,
       limiteComunal,
       unidadesVecinales,
       reservabiosfera
    ]) => {

       // =========================
       // GUARDAR DATOS GLOBALES
       // =========================
       lineasData = lineas;
       polyData = poly;
       uvGeoJSON = unidadesVecinales;

    // =========================
    // PROYECTOS (BASE)
    // =========================
    const todasLasFeatures = [
        ...puntos.features,
        ...ptosLineas.features,
        ...ptosPoly.features
    ];

        const featuresOrdenadas = todasLasFeatures
    .filter(esValido)
    .slice()
    .sort((a, b) => {
        return (parseInt(a.properties.ID) || 0) - (parseInt(b.properties.ID) || 0);
    });

geojsonData = {
    type: "FeatureCollection",
    features: featuresOrdenadas
};

featuresFiltradas = featuresOrdenadas;

        proyectosLayer =
            crearCapaGeoJSON({

                type: "FeatureCollection",

                features: featuresFiltradas
            });

        proyectosLayer.addTo(map);

        lineasLayer = L.geoJSON(lineasData, {

            filter: feature => {

                return esValido(feature);
            },

            style: feature => ({

                color: obtenerColor(
                    feature.properties.FUENTE
                ),

                weight: 2,

                opacity: 0.9
            }),

            onEachFeature(feature, layer) {

                layer.bindPopup(
                    crearPopup(feature)
                );

                layer.on({

                    mouseover: () => {

                        layer.setStyle({

                            weight: 5,

                            opacity: 1
                        });
                    },

                    mouseout: () => {

                        layer.setStyle({

                            weight: 2,

                            opacity: 0.9
                        });
                    }
                });
            }
        });

        lineasLayer.addTo(map);

        polyLayer = L.geoJSON(polyData, {

            filter: feature => {

                return esValido(feature);
            },

            style: feature => ({

                color: obtenerColor(
                    feature.properties.FUENTE
                ),

                fillColor: obtenerColor(
                    feature.properties.FUENTE
                ),

                fillOpacity: 0.22,

                weight: 2
            }),

            onEachFeature(feature, layer) {

                layer.bindPopup(
                    crearPopup(feature)
                );

                layer.on({

                    mouseover: () => {

                        layer.setStyle({

                            weight: 4,

                            fillOpacity: 0.38
                        });
                    },

                    mouseout: () => {

                        layer.setStyle({

                            weight: 2,

                            fillOpacity: 0.22
                        });
                    }
                });
            }
        });
        mapaListo = true;

        crearFiltros();
        actualizarDashboard();
        setTimeout(() => {
    actualizarLeyenda();
}, 100);

        map.on('moveend zoomend', () => {
            actualizarDashboard();
            actualizarLeyenda();
        });

        polyLayer.addTo(map);

        // =========================
        // LÍMITE COMUNAL
        // =========================

        limiteComunalLayer = L.geoJSON(
            limiteComunal,
            {
                style: {
                    color: '#6e7178',
                    weight: 2,
                    opacity: 1,
                    fill: false,
                    dashArray: '6 5'
                }
            }
        );

        // =========================
        // UNIDADES VECINALES
        // =========================

        unidadesVecinalesLayer = L.geoJSON(
            unidadesVecinales,
            {
                pane: 'paneUV',
                style: {
                    color: '#475569',
                    weight: 0.5,
                    opacity: 0.8,
                    fillColor: '#94a3b8',
                    fillOpacity: 0.08
                },
                  

onEachFeature(feature, layer) {

    const nombreUV =
        feature.properties.t_uv_nom || 'Unidad Vecinal';

    layer.bindTooltip(
        nombreUV,
        {
            permanent: false,
            direction: 'center',
            className: 'tooltip-uv'
        }
    );

    layer.on({

        mouseover: () => {

            const nombre =
                feature.properties.t_uv_nom;

            // =========================
            // SI LA UV ESTÁ OCULTA
            // NO HACER NADA
            // =========================

            if (
                uvSeleccionada !== 'TODOS' &&
                nombre !== uvSeleccionada
            ) {

                layer.closeTooltip();

                return;
            }

            // =========================
            // HOVER NORMAL
            // =========================

            layer.setStyle({

                weight: 2,

                fillOpacity: 0.18,

                color: '#1e1f20'
            });

            layer.openTooltip();
        },

        mouseout: () => {

            const nombre =
                feature.properties.t_uv_nom;

            const activa =
                uvSeleccionada === 'TODOS' ||
                nombre === uvSeleccionada;

            layer.setStyle({

                color: '#475569',

                weight: activa ? 1 : 0,

                opacity: activa ? 0.8 : 0,

                fillColor: '#94a3b8',

                fillOpacity: activa ? 0.18 : 0
            });

            layer.closeTooltip();
        }
    });

    // =========================
    // BLOQUEAR TOOLTIP
    // EN UVS OCULTAS
    // =========================

    layer.on('tooltipopen', () => {

        const nombre =
            feature.properties.t_uv_nom;

        if (
            uvSeleccionada !== 'TODOS' &&
            nombre !== uvSeleccionada
        ) {

            layer.closeTooltip();
        }
    });
}
    });
poblarFiltroUV(unidadesVecinales);
// =========================
// RESERVA BIOSFERA
// =========================

reservaBiosferaLayer = L.geoJSON(
    reservabiosfera,
    {
        style: {
            color: '#86efac',
            weight: 1,
            opacity: 0.8,
            fillColor: '#bbf7d0',
            fillOpacity: 0.4,
            dashArray: '4 6'
        },

        onEachFeature(feature, layer) {

            layer.bindTooltip(
                'Reserva de la Biosfera',
                {
                    permanent: true,
                    direction: 'center',
                    className: 'tooltip-biosfera'
                }
            );
        }
    }
);

        // =========================
        // AGREGAR AL CONTROL
        // =========================

        layerControl.addOverlay(
            limiteComunalLayer,
            'Límite Comunal Olmué'
        );

        layerControl.addOverlay(
            unidadesVecinalesLayer,
            'Unidades Vecinales'
        );
        map.on('baselayerchange', function(e) {

    if (e.name === 'Minimal') {

        if (!map.hasLayer(reservaBiosferaLayer)) {
            reservaBiosferaLayer.addTo(map);
        }

    } else {

        if (map.hasLayer(reservaBiosferaLayer)) {
            map.removeLayer(reservaBiosferaLayer);
        }
    }
});
// =========================
// CONTROL VISIBILIDAD FILTRO UV
// =========================

map.on('overlayadd', function (e) {

    if (e.name === 'Unidades Vecinales') {

        document.getElementById('contenedor-filtro-uv').style.display = 'block';
    }
});

map.on('overlayremove', function (e) {

    if (e.name === 'Unidades Vecinales') {

        document.getElementById('contenedor-filtro-uv').style.display = 'none';

        // reset filtro UV
        uvSeleccionada = 'TODOS';

        const sel = document.getElementById('filtro-uv');
        if (sel) sel.value = 'TODOS';

        actualizarFiltros();
    }
});
        // =========================
        // ACTIVAR POR DEFECTO
        // =========================

        limiteComunalLayer.addTo(map);
        

        if (proyectosLayer) {
            map.fitBounds(proyectosLayer.getBounds());
        }

        map.whenReady(() => {


            actualizarDashboard();
            actualizarLeyenda();
});


})
    .catch(error => {

        console.error(
            'ERROR GEOJSON:',
            error
        );
    });
function abrirTabla() {

    const cont = document.getElementById('tabla-contenido');
    const panel = document.getElementById('tabla-panel');

    cont.innerHTML = '';

    let html = `
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <thead>
            <tr>
                <th style="text-align:left;">ID</th>
                <th style="text-align:left;">Proyecto</th>
            </tr>
        </thead>
        <tbody>
    `;

    featuresFiltradas
    .slice()
    .sort((a, b) => {
        return (parseInt(a.properties.ID) || 0) - (parseInt(b.properties.ID) || 0);
    })
    .forEach(f => {
    });

    html += `</tbody></table>`;

    cont.innerHTML = html;

    panel.classList.toggle('active');
}
    // =========================
    // UI EVENTS
    // =========================

// =========================
// TOGGLE SIDEBAR
// =========================

document
    .getElementById('toggleSidebar')
    ?.addEventListener('click', () => {

        document
            .getElementById('sidebar')
            .classList.toggle('collapsed');

        document
            .getElementById('toggleSidebar')
            .classList.toggle('collapsed');
    });

// =========================
// BOTÓN FILTROS MOBILE
// =========================

document
    .getElementById('mobileFiltroBtn')
    ?.addEventListener('click', () => {

        document
            .getElementById('sidebar')
            .classList.toggle('mobile-open');
    });

// =========================
// LEYENDA
// =========================

document
    .getElementById('leyenda-header')
    ?.addEventListener('click', () => {

        document
            .getElementById('leyenda-panel')
            .classList.toggle('collapsed');
    });

});
document.getElementById('cerrar-tabla')?.addEventListener('click', () => {
    document.getElementById('tabla-panel')?.classList.remove('active');
});
