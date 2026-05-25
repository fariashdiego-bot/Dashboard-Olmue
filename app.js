document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // VARIABLES
    // =========================

    let geojsonData;

    let proyectosLayer;

    let lineasLayer;

    let polyLayer;

    let featuresFiltradas = [];

    // =========================
    // MAPA
    // =========================

    const map = L.map('map', {
        zoomControl: false
    });

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

    L.control.layers(
        {
            "Minimal": mapaClaro,
            "OpenStreetMap": mapaOSM,
            "Satélite": mapaSatelital
        },
        null,
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

    // =========================
    // ZOOM
    // =========================

    L.control.zoom({
        position: 'topright'
    }).addTo(map);

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
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                color:white;
                                font-size:11px;
                                font-weight:700;">
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

        const bounds = map.getBounds();

proyectosLayer.eachLayer(layer => {

    const feature = layer.feature;

    if (!feature) return;

    const geom = feature.geometry;

    let visible = false;

    // =========================
    // POINT
    // =========================

    if (geom.type === 'Point') {

        const c = geom.coordinates;

        visible = bounds.contains(
            L.latLng(c[1], c[0])
        );
    }

    // =========================
    // MULTIPOINT
    // =========================

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

    // =========================
    // LINESTRING
    // =========================

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

    const cont =
        document.getElementById(
            'leyenda-contenido'
        );

    if (!cont || !proyectosLayer) return;

    cont.innerHTML = '';

    const bounds = map.getBounds();

    const fuentesMap = new Map();

    // =========================
    // PUNTOS VISIBLES
    // =========================

    proyectosLayer.eachLayer(layer => {

        const feature =
            layer.feature;

        if (!feature) return;

        const geom =
            feature.geometry;

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

        if (!visible) return;

        const fuente =
            feature.properties.FUENTE;

        if (
            fuente &&
            !fuentesMap.has(fuente)
        ) {

            fuentesMap.set(
                fuente,
                fuente
            );
        }
    });

    // =========================
    // LÍNEAS VISIBLES
    // =========================

    lineasLayer.eachLayer(layer => {

        if (
            map.getBounds().intersects(
                layer.getBounds()
            )
        ) {

            const fuente =
                layer.feature.properties.FUENTE;

            if (
                fuente &&
                !fuentesMap.has(fuente)
            ) {

                fuentesMap.set(
                    fuente,
                    fuente
                );
            }
        }
    });

    // =========================
    // POLÍGONOS VISIBLES
    // =========================

    polyLayer.eachLayer(layer => {

        if (
            map.getBounds().intersects(
                layer.getBounds()
            )
        ) {

            const fuente =
                layer.feature.properties.FUENTE;

            if (
                fuente &&
                !fuentesMap.has(fuente)
            ) {

                fuentesMap.set(
                    fuente,
                    fuente
                );
            }
        }
    });

    // =========================
    // VACÍO
    // =========================

    if (fuentesMap.size === 0) {

        cont.innerHTML = `
            <div class="legend-empty">
                No hay proyectos visibles
            </div>
        `;

        return;
    }

    // =========================
    // RENDER LEYENDA
    // =========================

    fuentesMap.forEach(fuente => {

        cont.innerHTML += `
            <div class="legend-item">

                <div
                    class="legend-color"
                    style="
                        background:${obtenerColor(fuente)}
                    ">
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

        const estado =
            document.getElementById(
                'filtro-estados'
            ).value;

        const fuente =
            document.getElementById(
                'filtro-fuentes'
            ).value;

        featuresFiltradas =
            geojsonData.features.filter(f => {

                if (!esValido(f)) return false;

                return (

                    (estado === 'TODOS' ||
                        f.properties.ESTADO === estado)

                    &&

                    (fuente === 'TODOS' ||
                        f.properties.FUENTE === fuente)
                );
            });

        if (proyectosLayer) {

            map.removeLayer(proyectosLayer);
        }

        proyectosLayer =
            crearCapaGeoJSON({

                type: "FeatureCollection",

                features: featuresFiltradas
            });

        proyectosLayer.addTo(map);

        // =========================
        // FILTRAR LÍNEAS
        // =========================

        lineasLayer.eachLayer(layer => {

            const props =
                layer.feature.properties;

            const visible =

                (estado === 'TODOS' ||
                    props.ESTADO === estado)

                &&

                (fuente === 'TODOS' ||
                    props.FUENTE === fuente)

                &&

                props.FUENTE;

            if (visible) {

                map.addLayer(layer);

            } else {

                map.removeLayer(layer);
            }
        });

        // =========================
        // FILTRAR POLÍGONOS
        // =========================

        polyLayer.eachLayer(layer => {

            const props =
                layer.feature.properties;

            const visible =

                (estado === 'TODOS' ||
                    props.ESTADO === estado)

                &&

                (fuente === 'TODOS' ||
                    props.FUENTE === fuente)

                &&

                props.FUENTE;

            if (visible) {

                map.addLayer(layer);

            } else {

                map.removeLayer(layer);
            }
        });

        actualizarDashboard();

        actualizarLeyenda();
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

        estSel.innerHTML =
            `<option value="TODOS">Todos</option>`;

        fuenSel.innerHTML =
            `<option value="TODOS">Todos</option>`;

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
            .then(r => r.json())

    ])

    .then(([

        puntos,
        ptosLineas,
        ptosPoly,
        lineas,
        poly

    ]) => {

        const todasLasFeatures = [

            ...puntos.features,
            ...ptosLineas.features,
            ...ptosPoly.features

        ];

        geojsonData = {

            type: "FeatureCollection",

            features:
                todasLasFeatures.filter(esValido)
        };

        featuresFiltradas =
            geojsonData.features;

        // =========================
        // PUNTOS
        // =========================

        proyectosLayer =
            crearCapaGeoJSON({

                type: "FeatureCollection",

                features: featuresFiltradas
            });

        proyectosLayer.addTo(map);

        // =========================
        // LÍNEAS
        // =========================

        lineasLayer = L.geoJSON(lineas, {

            filter: feature => {

                return feature.properties.FUENTE;
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

        // =========================
        // POLÍGONOS
        // =========================

        polyLayer = L.geoJSON(poly, {

            filter: feature => {

                return feature.properties.FUENTE;
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

        polyLayer.addTo(map);

        // =========================
        // FIT BOUNDS
        // =========================

        map.fitBounds(
            proyectosLayer.getBounds()
        );

        crearFiltros();

        actualizarDashboard();

        actualizarLeyenda();

        map.on(
            'moveend zoomend',
            () => {

                actualizarDashboard();

                actualizarLeyenda();
            }
        );
    })

    .catch(error => {

        console.error(
            'ERROR GEOJSON:',
            error
        );
    });

    // =========================
    // UI EVENTS
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

    document
        .getElementById('leyenda-header')
        ?.addEventListener('click', () => {

            document
                .getElementById('leyenda-panel')
                .classList.toggle('collapsed');
        });

});