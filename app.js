document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // VARIABLES
    // =========================

    let geojsonData;
    let proyectosLayer;
    let featuresFiltradas = [];

    const map = L.map('map', {
        zoomControl: false
    });

    // FIX: asegurar invalidateSize solo si existe mapa ya renderizado
    setTimeout(() => {
        map.invalidateSize();
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

    const txt = String(fuente)
        .trim()
        .toUpperCase();

    switch (txt) {

        case 'ACELERADORA DE ENERGÍA MUNICIPAL':
            return '#facc15';

        case 'CAP. I D.S.N° 27 MINVU':
            return '#2563eb';

        case 'F.N.D.R. - CIRCULAR 33':
            return '#92400e';

        case 'F.N.D.R. - F.R.I.L.':
            return '#b59f00';

        case 'F.N.D.R. TRADICIONAL':
            return '#06b6d4';

        case 'MINISTERIO DE SALUD':
            return '#7c3aed';

        case 'PMB':
            return '#f97316';

        case 'PMU EMERGENCIA':
            return '#111827';

        case 'PMU TRADICIONAL':
            return '#ef4444';

        case 'MINVU- QMB':
            return '#0f766e';

        case 'SERVIU PAVIPART':
            return '#ec4899';

        case 'SPD (SIEVAP)':
            return '#69ca8b';

        default:
            return '#043013';
    }
}

    // =========================
    // FILTRO VALIDEZ GLOBAL
    // =========================

    function esValido(f) {
        const fuente = f?.properties?.FUENTE;
        if (!fuente) return false;

        const t = String(fuente).trim().toUpperCase();

        return (
            t !== '' &&
            t !== 'NULL' &&
            t !== 'UNDEFINED' &&
            !t.includes('COMPROMISO ALCALDE')
        );
    }

    // =========================
    // GEOJSON
    // =========================

    function crearCapaGeoJSON(data) {

        return L.geoJSON(data, {

            pointToLayer(feature, latlng) {

                const color = obtenerColor(feature.properties.FUENTE);
                const id = feature.properties.ID || '';

                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: '',
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
    // DASHBOARD (SIN CAMBIOS ESTRUCTURALES)
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
                bounds.contains(L.latLng(c[1], c[0]));

            if (g.type === "Point") {

                if (check(g.coordinates)) {
                    cantidad++;
                    monto += parseMonto(f.properties.MONTO);
                }

            } else if (g.type === "MultiPoint") {

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

        cantidadEl.textContent = cantidad;

        const texto = '$' + monto.toLocaleString('es-CL');

        montoEl.textContent = texto;

        const len = texto.length;

        montoEl.style.fontSize =
            len > 18 ? '20px' :
            len > 15 ? '22px' :
            len > 12 ? '26px' : '32px';
    }

    // =========================
    // 🔥 FIX REAL DE LEYENDA
    // =========================

    function actualizarLeyenda() {

        if (!proyectosLayer) return;

        const cont = document.getElementById('leyenda-contenido');
        if (!cont) return;

        cont.innerHTML = '';

        const bounds = map.getBounds();
        const fuentes = new Set();

        proyectosLayer.eachLayer(layer => {

            const f = layer.feature;
            if (!f?.geometry) return;
            if (!esValido(f)) return;

            const g = f.geometry;

            const check = c =>
                bounds.contains(L.latLng(c[1], c[0]));

            if (g.type === "Point") {

                if (check(g.coordinates)) {
                    fuentes.add(f.properties.FUENTE);
                }
            }

            else if (g.type === "MultiPoint") {

                let visible = false;

                g.coordinates.forEach(c => {
                    if (check(c)) visible = true;
                });

                if (visible) {
                    fuentes.add(f.properties.FUENTE);
                }
            }
        });

        if (fuentes.size === 0) {
            cont.innerHTML = `<div class="legend-empty">No hay proyectos visibles</div>`;
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
    // FILTROS (SIN CAMBIOS)
    // =========================

    function crearFiltros() {

        const estados = [...new Set(geojsonData.features.map(f => f.properties.ESTADO))]
            .filter(v => v && String(v).toUpperCase() !== 'NULL');

        const fuentes = [...new Set(geojsonData.features.map(f => f.properties.FUENTE))]
            .filter(v => v && String(v).toUpperCase() !== 'NULL');

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
    // LOAD
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
    // SIDEBAR BUTTON FIX
    // =========================

    const btn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    btn?.addEventListener('click', () => {

        sidebar.classList.toggle('collapsed');
        btn.classList.toggle('collapsed');

        // 🔥 FIX: forzar repaint Leaflet
        setTimeout(() => map.invalidateSize(), 300);
    });
const leyendaHeader = document.getElementById('leyenda-header');

const leyendaPanel = document.getElementById('leyenda-panel');

if (leyendaHeader && leyendaPanel) {

    leyendaHeader.addEventListener('click', () => {

        leyendaPanel.classList.toggle('collapsed');

    });

}
});