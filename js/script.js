// Creazione dei layer
const basePlanimetria = L.tileLayer('bari_basemap/Bari/{z}/{x}/{y}.png', {
  attribution: 'Cartografia storica: <a href="https://www.comune.bari.it/web/edilizia-e-territorio/cartografie-storiche" target="_blank">Comune di Bari</a> | autore della ricerca: <a href="https://www.sissco.it/soci/colaprice-vincenzo/" target="_blank">Vincenzo Colaprice</a>'
});

const baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a> | autore della ricerca: <a href="https://www.sissco.it/soci/colaprice-vincenzo/" target="_blank">Vincenzo Colaprice</a>'
});

// LayerGroup per overlay
const layerQuartieri = L.layerGroup();
const layerViolenze = L.layerGroup();
const layerSedi = L.layerGroup();
const layerAree = L.layerGroup();

// Mappa
const map = L.map('map', {
  center: [41.11917, 16.86365],
  zoom: 14,
  minZoom: 12,
  maxZoom: 18,
  maxBounds: [
    [41.05, 16.75],
    [41.18, 16.97]
  ],
  maxBoundsViscosity: 1.0,
  layers: [basePlanimetria, layerViolenze, layerQuartieri]
});

const miniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
});

const miniMap = new L.Control.MiniMap(miniMapLayer, {
  toggleDisplay: true,
  minimized: false
}).addTo(map);



// Layers control
L.control.layers(
  {
    "Planimetria PRG Bari 1971": basePlanimetria,
    "OpenStreetMap": baseOSM
  },
  {
    "Quartieri": layerQuartieri,
    "Violenze": layerViolenze,
    "Sedi politiche e culturali": layerSedi,
    "Aree studentesche": layerAree
  },
  { collapsed: false }
).addTo(map);

// Caricamento GeoJSON nei rispettivi gruppi
fetch('data/quartieri.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: 'black', weight: 3, opacity: 1, fillOpacity: 0
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.Nome) {
          layer.bindTooltip(feature.properties.Nome, { sticky: true });
        }
      }
    }).addTo(layerQuartieri);
  });

// Creazione del gruppo cluster
const clusterViolenze = L.markerClusterGroup({
  maxClusterRadius: 15,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true
});

fetch('data/violenze_68-78.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates;
      const latlng = L.latLng(coords[1], coords[0]);

      const esito = feature.properties.esito ?? "NA";
      const fonti = feature.properties.fonti ?? "NA";

      const popupContent = `
        <b>Anno:</b> ${feature.properties.anno}<br>
        <b>Giorno:</b> ${feature.properties.giorno}<br>
        <b>Luogo:</b> ${feature.properties.luogo}<br>
        <b>Indirizzo:</b> ${feature.properties.indirizzo}<br>
        <b>Autore:</b> ${feature.properties.autore}<br>
        <b>Vittima:</b> ${feature.properties.vittima}<br>
        <b>Tipo:</b> ${feature.properties.tipo_violenza}<br>
        <b>Esito:</b> ${esito}<br>
        <b>Fonti ulteriori:</b> ${fonti}
      `;

      // Usa un'icona SVG per simulare il circleMarker
      const svgIcon = L.divIcon({
        html: `<div style="
          background:#000; 
          border:2px solid white; 
          border-radius:50%; 
          width:18px; 
          height:18px;"></div>`,
        iconSize: [18, 18],
        className: ''
      });

      const marker = L.marker(latlng, { icon: svgIcon }).bindPopup(popupContent);
      clusterViolenze.addLayer(marker);
    });

    layerViolenze.addLayer(clusterViolenze);
  });


fetch('data/sedi.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const iconUrl = feature.properties.coll === 'dx' ? 'data/flag-black.png' : 'data/flag-red.png';
        const icon = L.icon({ iconUrl: iconUrl, iconSize: [20, 32] });
        return L.marker(latlng, { icon: icon })
          .bindPopup(`Sede ${feature.properties.nome}`);
      }
    }).addTo(layerSedi);
  });

fetch('data/aree.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#FFA500',
        weight: 2,
        dashArray: '4',
        fillColor: '#FFA500',
        fillOpacity: 0.2
      }
    }).addTo(layerAree);
  });

// Nascondi gruppi opzionali all'avvio
map.removeLayer(layerSedi);
map.removeLayer(layerAree);
