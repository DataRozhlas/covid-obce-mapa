# %%
import requests
from obyv import ob
import numpy as np
# %%
r = requests.get('https://data.irozhlas.cz/covid-uzis/obce_mapa_aktual.json')
# %%
vals = []
d = r.json()['data']
for o in d:
    try:
        vals.append((d[o][0] / ob[o]) * 10000)
    except:
        continue

# %%
o
# %%
vals
# %%
np.quantile(vals, [0.2, 0.4, 0.6, 0.8])
# %%
