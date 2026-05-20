document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // VARIABLES
    // =========================

    let geojsonData;
    let proyectosLayer;
    let featuresFiltradas = [];
    let map;


    // =========================
    // MAPA
    // =========================

    map = L.map('map', {
        zoomControl: false
    });

    setTimeout(() => {
        if (map?.invalidateSize) map.invalidateSize();
    }, 300);


    // =========================
    // BASE MAPS
    // =========================

    const mapaClaro = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; OpenStreetMap & CARTO' }
    );

    const mapaOSM = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap' }
    );

    const mapaSatelital = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri' }
    );

    mapaClaro.addTo(map);


    L.control.layers({
        "Minimal": mapaClaro,
        "OpenStreetMap": mapaOSM,
        "Satélite": mapaSatelital
    }).addTo(map);


    // =========================
    // UI
    // =========================

    const cantidadEl = document.getElementById('cantidad');
    const montoEl = document.getElementById('monto');


    // =========================
    // HELPERS
    // =========================

    function titleCase(texto) {
        return String(texto || '')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function parseMonto(valor) {
        return parseFloat(
            String(valor ?? 0)
                .replace(/\$/g, '')
                .replace(/\s/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        ) || 0;
    }

    function obtenerColor(fuente) {

        if (!fuente) return '#2563eb';

        switch (fuente.toUpperCase()) {

            case 'ACELERADORA DE ENERGÍA MUNICIPAL': return '#facc15';
            case 'CAP. I D.S.N° 27 MINVU': return '#2563eb';
            case 'F.N.D.R. - CIRCULAR 33': return '#92400e';
            case 'F.N.D.R. - F.R.I.L.': return '#b59f00';
            case 'F.N.D.R. TRADICIONAL': return '#06b6d4';
            case 'MINISTERIO DE SALUD': return '#7c3aed';
            case 'PMB': return '#f97316';
            case 'PMU EMERGENCIA': return '#111827';
            case 'PMU TRADICIONAL': return '#ef4444';
            case 'MINVU- QMB': return '#0f766e';
            case 'SERVIU PAVIPART': return '#ec4899';
            case 'SPD (SIEVAP)': return '#69ca8b';

            default: return '#043013';
        }
    }


    // =========================
    // FILTRO GLOBAL (UN SOLO ORIGEN DE VERDAD)
    // =========================

    function esValido(feature) {

        const fuente = feature?.properties?.FUENTE;

        if (!fuente) return false;

        const txt = String(fuente).trim().toUpperCase();

        return (
            txt !== '' &&
            txt !== 'NULL' &&
            txt !== 'UNDEFINED' &&
            !txt.includes('COMPROMISO ALCALDE')
        );
    }


    // =========================
    // GEOJSON LAYER
    // =========================

    function crearCapaGeoJSON(data) {

        return L.geoJSON(data, {

            pointToLayer(feature, latlng) {

                const color = obtenerColor(feature.properties.FUENTE);
                const id = feature.properties.ID || '';

                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `
                            <div style="
                                width:28px;
                                height:28px;
                                border-radius:50%;
                                background:${color};
                                border:2px solid white;
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

                const titulo = titleCase(feature.properties.PROY);
                const monto = parseMonto(feature.properties.MONTO);

                layer.bindPopup(`
                    <div class="popup-header">${titulo}</div>
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
            if (!f?.geometry) return;
            if (!esValido(f)) return;

            const g = f.geometry;

            const check = c =>
                bounds.contains(L.latLng(c[1], c[0]));

            if (g.type === "Point") {

                if (check(g.coordinates)) {
                    cantidad++;
                    monto += parseMonto(f.properties.MONTO);
                }
            }

            else if (g.type === "MultiPoint") {

                let visible = false;

                g.coordinates.forEach(c => {
                    if (check(c)) visible = true;
                });

                if (visible) {
                    cantidad++;
                    monto += parseMonto(f.properties.MONTO);
                }
            }
        });

        const montoTexto = '$' + monto.toLocaleString('es-CL');

        cantidadEl.textContent = cantidad;
        montoEl.textContent = montoTexto;

        const len = montoTexto.length;

        if (len > 18) montoEl.style.fontSize = '22px';
        else if (len > 15) montoEl.style.fontSize = '24px';
        else if (len > 12) montoEl.style.fontSize = '28px';
        else montoEl.style.fontSize = '34px';
    }


    // =========================
    // LEYENDA
    // =========================

function actualizarLeyenda() {

    if (!proyectosLayer) return;

    const cont = document.getElementById('leyenda-contenido');
    if (!cont) return;

    cont.innerHTML = '';

    const bounds = map.getBounds();
    const fuentes = new Set();

    proyectosLayer.eachLayer(layer => {

        const feature = layer.feature;
        if (!feature) return;

        const geom = feature.geometry;
        if (!geom) return;

        // =========================
        // POINT
        // =========================
        if (geom.type === "Point") {

            const c = geom.coordinates;
            const latlng = L.latLng(c[1], c[0]);

            if (bounds.contains(latlng)) {
                fuentes.add(feature.properties.FUENTE);
            }
        }

        // =========================
        // MULTIPOINT
        // =========================
        else if (geom.type === "MultiPoint") {

            let visible = false;

            geom.coordinates.forEach(c => {

                const latlng = L.latLng(c[1], c[0]);

                if (bounds.contains(latlng)) {
                    visible = true;
                }
            });

            if (visible) {
                fuentes.add(feature.properties.FUENTE);
            }
        }

    });

    // =========================
    // RENDER
    // =========================

    if (fuentes.size === 0) {

        cont.innerHTML = `
            <div class="legend-empty">
                No hay proyectos visibles
            </div>
        `;

        return;
    }

    [...fuentes].forEach(fuente => {

        cont.innerHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background:${obtenerColor(fuente)}"></div>
                <span>${fuente}</span>
            </div>
        `;
    });
}

    // =========================
    // FILTROS
    // =========================

    function crearFiltros() {

        const estados = [...new Set(geojsonData.features.map(f => f.properties.ESTADO))].filter(v => v && String(v).toUpperCase() !== 'NULL');
        const fuentes = [...new Set(geojsonData.features.map(f => f.properties.FUENTE))].filter(v => v && String(v).toUpperCase() !== 'NULL');

        const estSel = document.getElementById('filtro-estados');
        const fuenSel = document.getElementById('filtro-fuentes');

        estSel.innerHTML = `<option value="TODOS">Todos</option>`;
        fuenSel.innerHTML = `<option value="TODOS">Todos</option>`;

        estados.forEach(e => estSel.innerHTML += `<option value="${e}">${e}</option>`);
        fuentes.forEach(f => fuenSel.innerHTML += `<option value="${f}">${f}</option>`);

        estSel.addEventListener('change', actualizarFiltros);
        fuenSel.addEventListener('change', actualizarFiltros);
    }


    function actualizarFiltros() {

        const estado = document.getElementById('filtro-estados').value;
        const fuente = document.getElementById('filtro-fuentes').value;

        featuresFiltradas = geojsonData.features.filter(f => {

            if (!esValido(f)) return false;

            return (
                (estado === 'TODOS' || f.properties.ESTADO === estado) &&
                (fuente === 'TODOS' || f.properties.FUENTE === fuente)
            );
        });

        map.removeLayer(proyectosLayer);

        proyectosLayer = crearCapaGeoJSON({
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
                features: data.features.filter(esValido)
            };

            featuresFiltradas = geojsonData.features;

            proyectosLayer = crearCapaGeoJSON({
                type: "FeatureCollection",
                features: featuresFiltradas
            });

            proyectosLayer.addTo(map);

            map.fitBounds(proyectosLayer.getBounds());

            crearFiltros();

            actualizarDashboard();
            actualizarLeyenda();

            map.on('moveend zoomend', () => {
                actualizarDashboard();
                actualizarLeyenda();
            });

        });


    // =========================
    // UI EVENTS
    // =========================

    document.getElementById('toggleSidebar')
        ?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

    document.getElementById('leyenda-header')
        ?.addEventListener('click', () => {
            document.getElementById('leyenda-panel').classList.toggle('collapsed');
        });

});