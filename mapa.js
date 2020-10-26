/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
const map = L.map('covid_mapa', { scrollWheelZoom: false });
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, data <a target="_blank" href="https://www.uzis.cz/">ÚZIS</a>',
  subdomains: 'abcd',
  maxZoom: 15,
});

bg.addTo(map);

L.TopoJSON = L.GeoJSON.extend({
  addData(data) {
    let geojson; let key;
    if (data.type === 'Topology') {
      // eslint-disable-next-line no-restricted-syntax
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

const viewSel = ['aktual', 'tyden', 'dva', 'mesic', 'prazd_stop', 'prazd_start', 'velik'];
actSel = 'aktual';

let data = null;
let breaks = null;
let updated = null;

const geojson = L.topoJson(null, {
  style(feature) {
    const oid = feature.properties.kodob;
    return {
      color: 'lightgray',
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(oid, 'aktual'),
    };
  },
  onEachFeature(feature, layer) {
    const oid = feature.properties.kodob;
    layer.on('click', (e) => {
      const d = data[oid];
      const val = Math.round((d[viewSel.indexOf(actSel) + 1] / d[8]) * 10000) / 10;
      if ((val === Infinity) || (isNaN(val))) { return; }
      layer.bindPopup(`<b>${d[0]}</b><br>${val} nakažených na tis. obyvatel`).openPopup();
    });
  },
});
geojson.addTo(map);

fetch('https://data.irozhlas.cz/covid-obce-mapa/obce.json')
  .then((response) => response.json())
  .then((tjs) => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce_mapa.json')
      .then((response) => response.json())
      .then((dta) => {
        data = dta.data;
        updated = dta.upd;
        breaks = dta.brks;
        const dkeys = Object.keys(data);
        tjs.objects.obce.geometries = tjs.objects.obce.geometries.filter((ob) => {
          if (dkeys.includes(ob.properties.kodob.toString())) {
            return true;
          }
          return false;
        });
        geojson.addData(tjs);
        map.fitBounds(geojson.getBounds());
        if (screen.width < 600) {
          map.zoomIn(1);
        }
      });
  });

function getCol(oid, view) {
  const d = data[oid];
  const val = (d[viewSel.indexOf(view) + 1] / d[8]) * 1000;

  if ((val === Infinity) || (isNaN(val))) { return 'lightgray'; }

  if (val < 1) { return '#fee5d9'; }
  if (val < 5) { return '#fcae91'; }
  if (val < 15) { return '#fb6a4a'; }
  if (val < 25) { return '#de2d26'; }
  return '#a50f15';
}

function changeStyle(view) {
  geojson.eachLayer((layer) => {
    const oid = layer.feature.properties.kodob;
    layer.setStyle({
      fillColor: getCol(oid, view),
    });
  });
}

document.querySelectorAll('.stylesel').forEach((butt) => {
  butt.addEventListener('click', (e) => {
    const sel = e.target.className.split(' ')[1];
    actSel = sel;
    changeStyle(sel);
  });
});

const td = new Date();
document.querySelectorAll('.aktual')[0].innerText += ` (${td.getDate() - 1}. ${td.getMonth() + 1}.)`;

// geocoder
const form = document.getElementById('geocoder');
form.onsubmit = function submitForm(event) {
  event.preventDefault();
  const text = document.getElementById('inp-geocode').value;
  if (text === '') {
    return;
  }
  fetch(`https://api.mapy.cz/geocode?query=${text}, Česká republika`) // Mapy.cz geocoder
    .then((res) => res.text())
    .then((str) => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then((results) => {
      const res = results.firstChild.children[0];

      if (res.children.length === 0) {
        return;
      }
      const x = parseFloat(res.children[0].attributes.x.value);
      const y = parseFloat(res.children[0].attributes.y.value);

      map.flyTo([y, x], 11);
    })
    .catch((err) => { throw err; });
};
