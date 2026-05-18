// =========================
// MAPA
// =========================

const map = L.map('map');


// =========================
// MAPAS BASE
// =========================

const mapaClaro = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
        attribution:
        '&copy; OpenStreetMap & CARTO'
    }
);

const mapaOSM = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
        '&copy; OpenStreetMap'
    }
);

const mapaSatelital = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution:
        '&copy; Esri'
    }
);


// =========================
// MAPA INICIAL
// =========================

mapaClaro.addTo(map);


// =========================
// CONTROL CAPAS
// =========================

const mapasBase = {

    "Minimal": mapaClaro,

    "OpenStreetMap": mapaOSM,

    "Satélite": mapaSatelital

};

L.control.layers(
    mapasBase
).addTo(map);


// =========================
// ELEMENTOS DASHBOARD
// =========================

const cantidadEl =
document.getElementById('cantidad');

const montoEl =
document.getElementById('monto');


// =========================
// CAPA PROYECTOS
// =========================

let proyectosLayer;


// =========================
// TITLE CASE
// =========================

function titleCase(texto) {

    return texto
        .toLowerCase()
        .replace(
            /\b\w/g,
            letra => letra.toUpperCase()
        );

}


// =========================
// COLORES POR FUENTE
// =========================

function obtenerColor(fuente) {

    if (!fuente) {
        return '#2563eb';
    }

    fuente =
    fuente.toUpperCase();

    switch(fuente) {

        case 'ACELERADORA DE ENERGÍA MUNICIPAL':
            return '#facc15';

        case 'CAP. I D.S.N° 27 MINVU':
            return '#2563eb';

        case 'F.N.D.R. - CIRCULAR 33':
            return '#92400e';

        case 'F.N.D.R. - F.R.I.L.':
            return '#b59f00';

        case 'F.N.D.R TRADICIONAL':
            return '#06b6d4';

        case 'MINISTERIO DE SALUD':
            return '#7c3aed';

        case 'PMB':
            return '#f97316';

        case 'PMU EMERGENCIA':
            return '#000000';

        case 'PMU TRADICIONAL':
            return '#ff0000';

        case 'MINVU- QMB':
            return '#0f766e';

        case 'SERVIU PAVIPART':
            return '#ec4899';

        default:
            return '#2563eb';

    }

}


// =========================
// CARGAR GEOJSON
// =========================

fetch('proyectos.geojson')

.then(response => response.json())

.then(data => {

    proyectosLayer = L.geoJSON(data, {

        // =========================
        // SIMBOLOGIA
        // =========================

        pointToLayer:
        function(feature, latlng) {

            const color =
            obtenerColor(
                feature.properties.FUENTE
            );

            // =========================
            // ID
            // =========================

            const id =
            feature.properties.ID || '';

            // =========================
            // ICONO HTML
            // =========================

            const icono = L.divIcon({

                className: 'custom-marker',

                html: `

                    <div
                        style="
                            position: relative;
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            background: ${color};
                            border: 2px solid white;
                            box-shadow: 0 0 12px rgba(0,0,0,0.35);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: 700;
                            color: white;
                        "
                    >

                        ${id}

                    </div>

                `,

                iconSize: [28, 28],

                iconAnchor: [14, 14]

            });

            return L.marker(
                latlng,
                {
                    icon: icono
                }
            );

        },


        // =========================
        // POPUP
        // =========================

        onEachFeature:
        function(feature, layer) {

            const titulo =
            titleCase(
                feature.properties.PROY
            );

            const montoNumerico =
            Number(
                String(feature.properties.MONTO)
                .replace(/\./g, '')
                .replace(',', '.')
            );

            const montoFormateado =
            montoNumerico.toLocaleString(
                'es-CL'
            );

            layer.bindPopup(`

                <div class="popup-container">

                    <div class="popup-title">
                        ${titulo}
                    </div>

                    <table class="popup-table">

                        <tr>
                            <td>ID</td>
                            <td>
                                ${feature.properties.ID}
                            </td>
                        </tr>

                        <tr>
                            <td>Estado</td>
                            <td>
                                ${feature.properties.ESTADO}
                            </td>
                        </tr>

                        <tr>
                            <td>Fuente</td>
                            <td>
                                ${feature.properties.FUENTE}
                            </td>
                        </tr>

                        <tr>
                            <td>Monto</td>
                            <td>
                                $${montoFormateado}
                            </td>
                        </tr>

                    </table>

                </div>

            `);

        }

    }).addTo(map);


    // =========================
    // AJUSTAR VISTA
    // =========================

    map.fitBounds(
        proyectosLayer.getBounds()
    );


    // =========================
    // ACTUALIZAR DASHBOARD
    // =========================

    actualizarDashboard();


    // =========================
    // EVENTOS
    // =========================

    map.on(
        'moveend zoomend',
        actualizarDashboard
    );

})

.catch(error => {

    console.error(
        'Error cargando GeoJSON:',
        error
    );

});


// =========================
// DASHBOARD DINAMICO
// =========================

function actualizarDashboard() {

    let cantidad = 0;

    let monto = 0;

    const bounds =
    map.getBounds();

    proyectosLayer.eachLayer(layer => {

        const feature =
        layer.feature;

        const geometry =
        feature.geometry;

        // =========================
        // POINT
        // =========================

        if (
            geometry.type === "Point"
        ) {

            const coords =
            geometry.coordinates;

            const punto =
            L.latLng(
                coords[1],
                coords[0]
            );

            if (
                bounds.contains(punto)
            ) {

                cantidad++;

                monto += Number(
                    String(
                        feature.properties.MONTO
                    )
                    .replace(/\./g, '')
                    .replace(',', '.')
                ) || 0;

            }

        }

        // =========================
        // MULTIPOINT
        // =========================

        else if (
            geometry.type === "MultiPoint"
        ) {

            let visible = false;

            geometry.coordinates.forEach(
                coords => {

                    const punto =
                    L.latLng(
                        coords[1],
                        coords[0]
                    );

                    if (
                        bounds.contains(punto)
                    ) {

                        visible = true;

                    }

                }
            );

            if (visible) {

                cantidad++;

                monto += Number(
                    String(
                        feature.properties.MONTO
                    )
                    .replace(/\./g, '')
                    .replace(',', '.')
                ) || 0;

            }

        }

    });

    // =========================
    // ACTUALIZAR HTML
    // =========================

    cantidadEl.textContent =
    cantidad;

    const montoTexto =
    '$' + monto.toLocaleString('es-CL');

    montoEl.textContent =
    montoTexto;

    // =========================
    // TAMAÑO DINAMICO
    // =========================

    const largo =
    montoTexto.length;

    if (largo > 18) {

        montoEl.style.fontSize =
        '14px';

    }

    else if (largo > 15) {

        montoEl.style.fontSize =
        '20px';

    }

    else if (largo > 12) {

        montoEl.style.fontSize =
        '26px';

    }

    else {

        montoEl.style.fontSize =
        '30px';

    }

}


// =========================
// LEYENDA
// =========================

const leyenda =
L.control({
    position: 'bottomright'
});

leyenda.onAdd =
function() {

    const div =
    L.DomUtil.create(
        'div',
        'info legend'
    );

    div.innerHTML = `

        <div style="
            background: white;
            padding: 18px;
            border-radius: 18px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            font-family: Inter, sans-serif;
            min-width: 250px;
        ">

            <div style="
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 16px;
            ">
                Fuente Financiamiento
            </div>

            ${crearItemLeyenda('#facc15', 'Aceleradora Energía')}
            ${crearItemLeyenda('#2563eb', 'CAP. I D.S.N° 27')}
            ${crearItemLeyenda('#92400e', 'FNDR Circular 33')}
            ${crearItemLeyenda('#b59f00', 'FNDR FRIL')}
            ${crearItemLeyenda('#06b6d4', 'FNDR Tradicional')}
            ${crearItemLeyenda('#7c3aed', 'Ministerio Salud')}
            ${crearItemLeyenda('#f97316', 'PMB')}
            ${crearItemLeyenda('#000000', 'PMU Emergencia')}
            ${crearItemLeyenda('#ff0000', 'PMU Tradicional')}
            ${crearItemLeyenda('#0f766e', 'MINVU QMB')}
            ${crearItemLeyenda('#ec4899', 'SERVIU Pavipart')}

        </div>

    `;

    return div;

};

leyenda.addTo(map);


// =========================
// ITEM LEYENDA
// =========================

function crearItemLeyenda(
    color,
    texto
) {

    return `

        <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        ">

            <div style="
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${color};
                border: 2px solid white;
                box-shadow: 0 0 6px rgba(0,0,0,0.25);
            ">
            </div>

            <span style="
                font-size: 14px;
                color: #111827;
            ">
                ${texto}
            </span>

        </div>

    `;

}