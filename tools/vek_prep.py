# %%
import pandas as pd
from obyv import ob
# %%
so = {"Praha 1": 500054, "Praha 2": 500089, "Praha 3": 500097, "Praha 4": 500119, "Praha 5": 500143, "Praha 6": 500178, "Praha 7": 500186, "Praha 8": 500208, "Praha 9": 500216, "Praha 10": 500224, "Praha 20": 538213,
      "Praha 22": 538931, "Praha 21": 538949, "Praha 16": 539601, "Praha 13": 539694, "Praha 11": 547034, "Praha 12": 547107, "Praha 17": 547174, "Praha 19": 547344, "Praha 14": 547361, "Praha 15": 547387, "Praha 18": 547417}
# %%
d = pd.read_excel('2020_vek_do_999.xlsx').append(
    pd.read_excel('2020_vek_nad_1000.xlsx'))

# %%
pso = pd.read_excel('Vek_Praha2000.xlsx', sheet_name='Správní obvody')

# %%
pso['ZUJ'] = pso['Obec'].apply(lambda x: so[x])
pso['Okres'] = 'Praha'

# %%
pso[['65-69', '70-74', '75-79', '80-84', '85+']]

d = d.append(pso)
# %%
sel = d[d.POH == 'celkem'][['ZUJ', 'Obec', 'Okres', 'Celkem']]
# %%
sel.to_csv('./data.csv', index=False, encoding='utf-8')
# %%
d
# %%
list(d.columns)
# %%
pso
# %%
cfuck = list(map(str, list(range(65, 85))))
# %%
cfuck.extend(['65-69', '70-74', '75-79', '80-84', '85+', '85+.1'])
# %%
cfuck
# %%
d['vek65+'] = d[cfuck].sum(axis=1)
# %%
d[[65]]
# %%
d.columns = list(map(str, d.columns))
# %%
sel = d[d.POH == 'celkem'][['ZUJ', 'Obec', 'Okres', 'vek65+']]
sel.to_csv('./data65.csv', index=False, encoding='utf-8')
# %%
