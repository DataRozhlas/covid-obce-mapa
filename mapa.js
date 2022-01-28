/* eslint-disable no-undef */
let host = 'https://data.irozhlas.cz';
if (window.location.hostname === 'localhost') { host = 'http://localhost'; }

const container = document.getElementById('covid_mapa');

const mapTitle = document.createElement('div');
mapTitle.id = 'cmap-title';

const gcd = document.createElement('div');
gcd.id = 'cmap-geocoder';
gcd.innerHTML = `<form action="?" id="geocoder">
                  <div class="inputs">
                    <input type="text" id="inp-geocode" placeholder="Zadejte obec či adresu...">
                    <input type="submit" id="inp-btn" value="Najít">
                  </div>
                  </form>
                  <form action="?" id="reset-zoom">
                  <div class="inputs">
                    <input type="submit" id="inp-btn" value="&#8962;">
                  </div>
                  </form>
                  
                  `;

const mapTtip = document.createElement('div');
mapTtip.id = 'cmap-ttip';
mapTtip.innerHTML = '<i>Vyberte obec.</i>';

const mapDiv = document.createElement('div');
mapDiv.id = 'cmap-map';

const legend = document.createElement('div');
legend.id = 'cmap-legend';

container.append(mapTitle, gcd, mapTtip, mapDiv, legend);

const map = L.map('cmap-map', {
  scrollWheelZoom: false,
  maxBoundsViscosity: 0.8,
  zoomAnimation: false,
});

map.attributionControl.addAttribution('&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, covid data <a target="_blank" href="https://www.uzis.cz/">ÚZIS</a>, počty obyvatel <a target="_blank" href="https://vdb.czso.cz/vdbvo2/">ČSÚ</a>');

map.createPane('geonames');
map.getPane('geonames').style.zIndex = 1000;
map.getPane('geonames').style.pointerEvents = 'none';

const geonames = L.tileLayer('https://samizdat.cz/tiles/ton_l2/{z}/{x}/{y}.png', {
  maxZoom: 15,
  pane: 'geonames',
});

geonames.addTo(map);

map.on('click', () => map.scrollWheelZoom.enable());

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
      color: getCol(feature.properties, 'aktual'),
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(feature.properties, 'aktual'),
    };
  },
  onEachFeature(feature, layer) {
    const prop = feature.properties;
    layer.on('click', (e) => {
      geojson.resetStyle();
      e.target.setStyle({
        color: '#9ecae1',
        weight: 2,
      });
      const d = data[prop.kod];
      const val = Math.round((d[0] / prop.obv) * 10000);
      if ((val === Infinity) || (Number.isNaN(val))) { return; }
      mapTtip.innerHTML = `<b>${prop.ob} (okres ${prop.ok})</b><br>${val} nemocných na 10 tis. ob.`;
    });
  },
});
geojson.addTo(map);

fetch(`${host}/covid-obce-mapa/obce.json`)
  .then((response) => response.json())
  .then((tjs) => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce_mapa_aktual.json')
      .then((response) => response.json())
      .then((dta) => {
        data = dta.data;
        const u = dta.upd.split('-');
        updated = `${parseInt(u[2], 10)}. ${parseInt(u[1], 10)}. ${u[0].slice(2)}`;

        mapTitle.innerText = `Aktuálně nemocní k ${updated}`;

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
        map.setMaxBounds(geojson.getBounds());
        map.setMinZoom(map.getZoom());

        // legenda
        legend.innerHTML = `${Math.round(breaks[0])} <span class="legendcol"></span> ${Math.round(breaks[3])}+ (na 10. tis. obyvatel)`;
      });
  });

const formRes = document.getElementById('reset-zoom');
formRes.onsubmit = function submitForm(event) {
  event.preventDefault();
  map.fitBounds(geojson.getBounds(), { animate: false });
};

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

      map.flyTo([y, x], 11, { animate: false });
    })
    .catch((err) => { throw err; });
};
