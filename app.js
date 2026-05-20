document.addEventListener('DOMContentLoaded', () => {
const isMobile = window.matchMedia("(max-width: 768px)").matches;

if (isMobile) {
    document.body.classList.add("mobile");
}
    // =========================
    // VARIABLES GLOBALES
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
    // MAPAS BASE
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

    const mapasBase = {
        "Minimal": mapaClaro,
        "OpenStreetMap": mapaOSM,
        "Satélite": mapaSatelital
    };

    L.control.layers(mapasBase).addTo(map);


    // =========================
    // CONTROL ZOOM
    // =========================

    L.control.zoom({
        position: 'topright'
    }).addTo(map);


    // =========================
    // POSICION CONTROLES
    // =========================

    setTimeout(() => {

        const controls = document.querySelector('.leaflet-top.leaflet-right');

        if (controls) {
            controls.style.top = '24px';
            controls.style.right = '24px';
        }

    }, 300);


    // =========================
    // ELEMENTOS DASHBOARD
    // =========================

    const cantidadEl = document.getElementById('cantidad');
    const montoEl = document.getElementById('monto');


    // =========================
    // TITLE CASE
    // =========================

    function titleCase(texto) {
        return String(texto || '')
            .toLowerCase()
            .replace(/\b\w/g, letra => letra.toUpperCase());
    }


    // =========================
    // COLORES
    // =========================

    function obtenerColor(fuente) {

        if (!fuente) return '#2563eb';

        fuente = fuente.toUpperCase();

        switch (fuente) {

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
    // LEYENDA ITEM
    // =========================

    function crearItemLeyenda(color, texto) {
        return `
            <div class="legend-item">
                <div class="legend-color" style="background:${color};"></div>
                <span>${texto}</span>
            </div>
        `;
    }


    // =========================
    // LEYENDA
    // =========================

    function actualizarLeyenda() {

        if (!proyectosLayer) return;

        const contenedor = document.getElementById('leyenda-contenido');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        const bounds = map.getBounds();
        const fuentesVisibles = new Set();

        proyectosLayer.eachLayer(layer => {

            procesar(layer);

        });

        function procesar(layer, parentFeature = null) {

            const feature = layer.feature || parentFeature;

            if (typeof layer.getLatLng === 'function') {

                const latlng = layer.getLatLng();

                if (bounds.contains(latlng)) {

                    const fuente = feature?.properties?.FUENTE;
                    if (fuente) fuentesVisibles.add(fuente);
                }
            }

            else if (typeof layer.eachLayer === 'function') {
                layer.eachLayer(sub => procesar(sub, feature));
            }
        }

        if (fuentesVisibles.size === 0) {
            contenedor.innerHTML = `<div class="legend-empty">No hay proyectos visibles</div>`;
            return;
        }

        [...fuentesVisibles].forEach(fuente => {
            contenedor.innerHTML += crearItemLeyenda(
                obtenerColor(fuente),
                fuente
            );
        });
    }


    // =========================
    // CAPA GEOJSON
    // =========================

    function parseMonto(valor) {

        return parseFloat(
            String(valor ?? 0)
                .replace(/\$/g, '')
                .replace(/\s/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        ) || 0;
    }


    function crearCapaGeoJSON(data) {

        return L.geoJSON(data, {

            pointToLayer(feature, latlng) {

                const color = obtenerColor(feature.properties.FUENTE);
                const id = feature.properties.ID || '';

                const icono = L.divIcon({

                    className: 'custom-marker',

                    html: `
                        <div style="
                            width:28px;
                            height:28px;
                            border-radius:50%;
                            background:${color};
                            border:2px solid white;
                            box-shadow:0 0 12px rgba(0,0,0,0.35);
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
                });

                return L.marker(latlng, { icon: icono });
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

    let cantidad = 0;
    let monto = 0;

    const bounds = map.getBounds();

    proyectosLayer.eachLayer(layer => {

        const feature = layer.feature;

        if (!feature || !feature.geometry) return;

        const geometry = feature.geometry;

        const parseMonto = (valor) => {
            return parseFloat(
                String(valor ?? 0)
                    .replace(/\$/g, '')
                    .replace(/\s/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.')
            ) || 0;
        };

        // =========================
        // POINT
        // =========================

        if (geometry.type === "Point") {

            const coords = geometry.coordinates;

            const punto = L.latLng(coords[1], coords[0]);

            if (bounds.contains(punto)) {

                cantidad++;

                monto += parseMonto(feature.properties.MONTO);
            }
        }

        // =========================
        // MULTIPOINT
        // =========================

        else if (geometry.type === "MultiPoint") {

            let visible = false;

            geometry.coordinates.forEach(coords => {

                const punto = L.latLng(coords[1], coords[0]);

                if (bounds.contains(punto)) {
                    visible = true;
                }
            });

            if (visible) {

                cantidad++;

                monto += parseMonto(feature.properties.MONTO);
            }
        }

    });

    // =========================
    // UI UPDATE
    // =========================

    cantidadEl.textContent = cantidad;

    const montoTexto = '$' + monto.toLocaleString('es-CL');

    montoEl.textContent = montoTexto;

    // =========================
    // FONT SIZE ADAPTATIVO
    // =========================

    const largo = montoTexto.length;

    if (largo > 18) montoEl.style.fontSize = '24px';
    else if (largo > 15) montoEl.style.fontSize = '24px';
    else if (largo > 12) montoEl.style.fontSize = '26px';
    else montoEl.style.fontSize = '30px';
}

    // =========================
    // FILTROS
    // =========================

    function crearFiltros() {

        const estados = [...new Set(geojsonData.features.map(f => f.properties.ESTADO))];
        const fuentes = [...new Set(geojsonData.features.map(f => f.properties.FUENTE))];

        const estadosSelect = document.getElementById('filtro-estados');
        const fuentesSelect = document.getElementById('filtro-fuentes');

        estadosSelect.innerHTML = `<option value="TODOS">Todos</option>`;
        fuentesSelect.innerHTML = `<option value="TODOS">Todos</option>`;

        estados.forEach(e => {
            if (!e) return;
            estadosSelect.innerHTML += `<option value="${e}">${e}</option>`;
        });

        fuentes.forEach(f => {
            if (!f) return;
            fuentesSelect.innerHTML += `<option value="${f}">${f}</option>`;
        });

        estadosSelect.addEventListener('change', actualizarFiltros);
        fuentesSelect.addEventListener('change', actualizarFiltros);
    }


    // =========================
    // FILTROS
    // =========================

    function actualizarFiltros() {

        const estado = document.getElementById('filtro-estados').value;
        const fuente = document.getElementById('filtro-fuentes').value;

        featuresFiltradas = geojsonData.features.filter(f => {

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
    // CARGA GEOJSON
    // =========================

    fetch('proyectos.geojson')
        .then(r => r.json())
        .then(data => {

            geojsonData = {
                ...data,
                features: data.features.filter(f => {

                    const fuente = f.properties.FUENTE;
                    if (!fuente) return false;

                    const t = String(fuente).trim().toUpperCase();

                    return !(t === '' || t === 'NULL' || t.includes('COMPROMISO ALCALDE'));
                })
            };

            featuresFiltradas = geojsonData.features;

            proyectosLayer = crearCapaGeoJSON({
                type: "FeatureCollection",
                features: featuresFiltradas
            });

            proyectosLayer.addTo(map);

            if (proyectosLayer.getBounds && proyectosLayer.getBounds().isValid()) {
                map.fitBounds(proyectosLayer.getBounds());
            }

            crearFiltros();
            actualizarDashboard();
            actualizarLeyenda();

            map.on('moveend zoomend', () => {
                actualizarDashboard();
                actualizarLeyenda();
            });

        })
        .catch(err => console.error('Error cargando GeoJSON:', err));


    // =========================
    // SIDEBAR
    // =========================

    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleSidebar.classList.toggle('collapsed');
    });


    // =========================
    // LEYENDA TOGGLE
    // =========================

    const leyendaHeader = document.getElementById('leyenda-header');
    const leyendaPanel = document.getElementById('leyenda-panel');

    leyendaHeader.addEventListener('click', () => {
        leyendaPanel.classList.toggle('collapsed');
    });

});
