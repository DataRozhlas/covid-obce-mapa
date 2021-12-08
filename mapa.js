/* eslint-disable no-undef */
let host = 'https://data.irozhlas.cz';
if (window.location.hostname === 'localhost') { host = 'http://localhost'; }

const map = L.map('covid_mapa', { scrollWheelZoom: false });
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, covid data <a target="_blank" href="https://www.uzis.cz/">ÚZIS</a>, počty obyvatel <a target="_blank" href="https://vdb.czso.cz/vdbvo2/">ČSÚ</a>',
  subdomains: 'abcd',
  maxZoom: 15,
});

map.on('click', () => map.scrollWheelZoom.enable());
bg.addTo(map);

L.TopoJSON = L.GeoJSON.extend({
  addData(data) {
    let geojson; let key;
    if (data.type === 'Topology') {
      // eslint-disable-next-line no-restricted-syntax
      for (key in data.objects) {
        if (Object.prototype.hasOwnProperty.call(data.objects, key)) {
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

L.topoJson = (data, options) => new L.TopoJSON(data, options);

let data = null;
let breaks = null;
let updated = null;

function getCol(prop) {
  const d = data[prop.kod];
  const nak = (d[0] / prop.obv) * 10000;
  if ((nak === Infinity) || (Number.isNaN(nak)) || (nak < 0)) { return 'lightgray'; }

  if (nak <= breaks[0]) { return '#fee5d9'; }
  if (nak <= breaks[1]) { return '#fcae91'; }
  if (nak <= breaks[2]) { return '#fb6a4a'; }
  if (nak <= breaks[3]) { return '#de2d26'; }
  return '#a50f15';
}

actSel = 'aktual';

const geojson = L.topoJson(null, {
  style(feature) {
    return {
      color: 'lightgray',
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(feature.properties, 'aktual'),
    };
  },
  onEachFeature(feature, layer) {
    const prop = feature.properties;
    layer.on('click', () => {
      const d = data[prop.kod];
      const val = Math.round((d[0] / prop.obv) * 10000);
      if ((val === Infinity) || (Number.isNaN(val))) { return; }
      layer.bindPopup(`<b>${prop.ob} (okres ${prop.ok})</b><br>${val} aktuálně nemocných na 10 tis. obyvatel`).openPopup();
    });
  },
});
geojson.addTo(map);

/*
function changeStyle(view) {
  geojson.eachLayer((layer) => {
    const oid = layer.feature.properties.kod;
    layer.setStyle({
      fillColor: getCol(oid, view),
    });
  });
}
*/

fetch(`${host}/covid-obce-mapa/obce.json`)
  .then((response) => response.json())
  .then((tjs) => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce_mapa_aktual.json')
      .then((response) => response.json())
      .then((dta) => {
        data = dta.data;
        const u = dta.upd.split('-');
        updated = `${parseInt(u[2], 10)}. ${parseInt(u[1], 10)}. ${u[0].slice(2)}`;

        breaks = dta.brks;
        const dkeys = Object.keys(data);
        tjs.objects.ob.geometries.filter((ob) => {
          if (dkeys.includes(ob.properties.kod.toString())) {
            return true;
          }
          return false;
        });
        geojson.addData(tjs);
        map.fitBounds(geojson.getBounds());

        // legenda
        const legend = L.control({ position: 'bottomleft' });
        legend.onAdd = () => {
          const div = L.DomUtil.create('div', 'info legend');
          div.innerHTML = `Aktuálně nemocní na 10. tis. obyvatel<br>${Math.round(breaks[0])} <span class="legendcol"></span>${Math.round(breaks[3])}+<br><i>aktualizováno ${updated}</i>`;
          return div;
        };
        legend.addTo(map);
      });
  });

const gcd = L.control({ position: 'topright' });
gcd.onAdd = () => {
  const div = L.DomUtil.create('div', 'info geocoder');
  div.innerHTML = `<form action="?" id='geocoder'>
    <div class="inputs">
      <input type="text" id="inp-geocode" placeholder="Zadejte obec či adresu...">
      <input type="submit" id="inp-btn" value="Najít">
    </div>
  </form>`;
  return div;
};
gcd.addTo(map);

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
