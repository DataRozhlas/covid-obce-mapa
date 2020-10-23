/* eslint-disable no-undef */
const map = L.map('covid_mapa');
map.setView([49.7417, 15.3350], 7);
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  maxZoom: 19,
});

bg.addTo(map);

// extend Leaflet to create a GeoJSON layer from a TopoJSON file
L.TopoJSON = L.GeoJSON.extend({
  addData(data) {
    let geojson; let key;
    if (data.type === 'Topology') {
      for (key in data.objects) {
        if (data.objects.hasOwnProperty(key)) {
          geojson = topojson.feature(data, data.objects[key]);
          L.GeoJSON.prototype.addData.call(this, geojson);
        }
      }
      return this;
    }
    L.GeoJSON.prototype.addData.call(this, data);
    return this;
  },
});
L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options);
};

function getCol(val) {
  if (val <= 0.01) {
    return 'blue';
  }
  return 'red';
}

let data = null;
const geojson = L.topoJson(null, {
  style(feature) {
    const oid = feature.properties.kodob;
    return {
      color: '#000',
      opacity: 1,
      weight: 1,
      fillColor: getCol(data[oid][1] / data[oid][8]),
      fillOpacity: 0.8,
    };
  },
  onEachFeature(feature, layer) {
    const oid = feature.properties.kodob;
    layer.bindPopup(`${data[oid][0]}<br>Aktuálně ${Math.round((data[oid][1] / data[oid][8]) * 10000) / 10} nakažených na tis. obyvatel`);
  },
});
geojson.addTo(map);

fetch('./obce.json')
  .then((response) => response.json())
  .then((tjs) => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce_mapa.json')
      .then((response) => response.json())
      .then((dta) => {
        data = dta;
        const dkeys = Object.keys(data);
        tjs.objects.obce.geometries = tjs.objects.obce.geometries.filter((ob) => {
          if (dkeys.includes(ob.properties.kodob.toString())) {
            return true;
          }
          return false;
        });
        geojson.addData(tjs);
      });
  });
