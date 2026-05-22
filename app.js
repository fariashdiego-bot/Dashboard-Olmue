document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // VARIABLES
    // =========================

    let geojsonData;
    let proyectosLayer;
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

    const layersControl = L.control.layers(
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
L.control.zoom({
    position: 'topright'
}).addTo(map);
    // =========================
    // FIX CLICK CONTROLS
    // =========================

    document.querySelectorAll(
        '.custom-map-button'
    ).forEach(btn => {

        L.DomEvent.disableClickPropagation(btn);

    });

    // =========================
    // ELEMENTOS UI
    // =========================

    const cantidadEl = document.getElementById('cantidad');
    const montoEl = document.getElementById('monto');

    const cantidadMobileEl = document.getElementById('cantidad-mobile');
    const montoMobileEl = document.getElementById('monto-mobile');

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

    if (!fuente) return '#94a3b8';

    const f = fuente.toUpperCase();

    switch (f) {

        case 'ACELERADORA DE ENERGÍA MUNICIPAL':
            return '#f9c5d5'; // rosa pastel

        case 'CAP. I D.S.N° 27 MINVU':
            return '#93c5fd'; // azul soft

        case 'F.N.D.R. - CIRCULAR 33':
            return '#c4b5fd'; // lavanda

        case 'F.N.D.R. - F.R.I.L.':
            return '#fde68a'; // crema dorado

        case 'F.N.D.R. TRADICIONAL':
            return '#67e8f9'; // cyan pastel

        case 'MINISTERIO DE SALUD':
            return '#d8b4fe'; // lila suave

        case 'PMB':
            return '#fdba74'; // durazno

        case 'PMU EMERGENCIA':
            return '#85ace1'; // gris elegante

        case 'PMU TRADICIONAL':
            return '#fda4af'; // coral pastel

        case 'MINVU- QMB':
            return '#6ee7b7'; // verde mint

        case 'SERVIU PAVIPART':
            return '#f9a8d4'; // rosado moderno

        case 'SPD (SIEVAP)':
            return '#86efac'; // verde soft

        default:
            return '#cbd5e1'; // gris pastel
    }
}

    // =========================
    // VALIDACIÓN
    // =========================

    function esValido(feature) {

        const fuente = feature?.properties?.FUENTE;

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

    // =========================
    // CAPA GEOJSON
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

                const titulo = titleCase(
                    feature.properties.PROY
                );

                const monto = parseMonto(
                    feature.properties.MONTO
                );
                const color = obtenerColor(
                    feature.properties.FUENTE
                );

              layer.bindPopup(`
    <div
        class="popup-header"
        style="
            background: linear-gradient(
                135deg,
                ${color},
                ${color}dd
            );

            color: rgb(255, 255, 255);

            text-shadow:
                0 1px 2px rgba(255,255,255,0.25);
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
`);
            }
        });
    }

    // =========================
    // DASHBOARD
    // =========================

    function actualizarDashboard() {

        if (!proyectosLayer) return;

        let cantidad = 0;
        let monto = 0;

        const bounds = map.getBounds();

        proyectosLayer.eachLayer(layer => {

            const f = layer.feature;

            if (!f || !esValido(f)) return;

            const g = f.geometry;

            const check = c =>
                bounds.contains(
                    L.latLng(c[1], c[0])
                );

            if (g.type === "Point") {

                if (check(g.coordinates)) {

                    cantidad++;

                    monto += parseMonto(
                        f.properties.MONTO
                    );
                }

            } else if (g.type === "MultiPoint") {

                let visible = false;

                g.coordinates.forEach(c => {

                    if (check(c)) visible = true;
                });

                if (visible) {

                    cantidad++;

                    monto += parseMonto(
                        f.properties.MONTO
                    );
                }
            }
        });

        const texto =
            '$' + monto.toLocaleString('es-CL');

        cantidadEl.textContent = cantidad;
        montoEl.textContent = texto;

        if (cantidadMobileEl)
            cantidadMobileEl.textContent = cantidad;

        if (montoMobileEl)
            montoMobileEl.textContent = texto;

        const len = texto.length;

        montoEl.style.fontSize =
            len > 18 ? '20px' :
            len > 15 ? '22px' :
            len > 12 ? '26px' :
            '32px';
    }

    // =========================
    // LEYENDA
    // =========================

    function actualizarLeyenda() {

        const cont =
            document.getElementById(
                'leyenda-contenido'
            );

        if (!cont || !proyectosLayer) return;

        cont.innerHTML = '';

        const bounds = map.getBounds();

        const fuentesMap = new Map();

        proyectosLayer.eachLayer(layer => {

            const feature = layer.feature;

            if (!feature || !esValido(feature))
                return;

            const fuenteOriginal =
                feature.properties.FUENTE;

            if (!fuenteOriginal) return;

            const fuente =
                fuenteOriginal.trim();

            const fuenteKey =
                fuente.toUpperCase();

            const geom = feature.geometry;

            let visible = false;

            if (geom.type === "Point") {

                const c = geom.coordinates;

                visible = bounds.contains(
                    L.latLng(c[1], c[0])
                );

            } else if (
                geom.type === "MultiPoint"
            ) {

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

            if (
                visible &&
                !fuentesMap.has(fuenteKey)
            ) {

                fuentesMap.set(
                    fuenteKey,
                    fuente
                );
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

        fuentesMap.forEach((fuente) => {

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

    function crearFiltros() {

        const estados =
            [...new Set(
                geojsonData.features.map(
                    f => f.properties.ESTADO
                )
            )]
            .filter(v =>
                v &&
                String(v).toUpperCase() !== 'NULL'
            );

        const fuentes =
            [...new Set(
                geojsonData.features.map(
                    f => f.properties.FUENTE
                )
            )]
            .filter(v =>
                v &&
                String(v).toUpperCase() !== 'NULL'
            );

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

            estSel.innerHTML += `
                <option value="${e}">
                    ${e}
                </option>
            `;
        });

        fuentes.forEach(f => {

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

        map.removeLayer(proyectosLayer);

        proyectosLayer =
            crearCapaGeoJSON({

                type: "FeatureCollection",

                features: featuresFiltradas
            });

        proyectosLayer.addTo(map);

        actualizarDashboard();

        actualizarLeyenda();
    }

    // =========================
    // LOAD GEOJSON
    // =========================

    fetch('./proyectos.geojson')

        .then(r => r.json())

        .then(data => {

            geojsonData = {

                ...data,

                features:
                    data.features.filter(esValido)
            };

            featuresFiltradas =
                geojsonData.features;

            proyectosLayer =
                crearCapaGeoJSON({

                    type: "FeatureCollection",

                    features: featuresFiltradas
                });

            proyectosLayer.addTo(map);

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