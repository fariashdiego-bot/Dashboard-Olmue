// =========================
// MAPA
// =========================

const map = L.map('map').setView(
    [-33.0472, -71.6127],
    12
);

// =========================
// MAPA BASE
// =========================

L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
        attribution:
        '&copy; OpenStreetMap & CARTO'
    }
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
// CARGAR GEOJSON
// =========================

fetch('proyectos.geojson')

.then(response => response.json())

.then(data => {

    proyectosLayer = L.geoJSON(data, {

        // =========================
        // POPUP
        // =========================

        onEachFeature: function(feature, layer) {

            // -------------------------
            // TITULO
            // -------------------------

            const titulo =
            titleCase(
                feature.properties.PROY
            );

            // -------------------------
            // MONTO
            // -------------------------

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

            // -------------------------
            // POPUP HTML
            // -------------------------

            layer.bindPopup(`

                <div class="popup-container">

                    <div class="popup-title">
                        ${titulo}
                    </div>

                    <table class="popup-table">

                        <tr>
                            <td>Estado</td>
                            <td>
                                ${feature.properties.ESTADO}
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
    // ACTUALIZAR INICIAL
    // =========================

    actualizarDashboard();

    // =========================
    // EVENTOS MAPA
    // =========================

    map.on(
        'moveend zoomend',
        actualizarDashboard
    );

});

// =========================
// DASHBOARD DINAMICO
// =========================

function actualizarDashboard() {

    let cantidad = 0;

    let monto = 0;

    const bounds = map.getBounds();

    proyectosLayer.eachLayer(layer => {

        const geometry =
        layer.feature.geometry;

        // =========================
        // MULTIPOINT
        // =========================

        if (
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

            // =========================
            // SUMAR SOLO UNA VEZ
            // =========================

            if (visible) {

                cantidad++;

                monto += Number(
                    String(
                        layer.feature
                        .properties
                        .MONTO
                    )
                    .replace(/\./g, '')
                    .replace(',', '.')
                ) || 0;

            }

        }

        // =========================
        // POINT NORMAL
        // =========================

        else if (
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
                        layer.feature
                        .properties
                        .MONTO
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

    // =========================
    // MONTO COMPLETO
    // =========================

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
        '10px';

    }

    else if (largo > 15) {

        montoEl.style.fontSize =
        '20px';

    }

    else if (largo > 12) {

        montoEl.style.fontSize =
        '28px';

    }

    else {

        montoEl.style.fontSize =
        '36px';

    }

}
