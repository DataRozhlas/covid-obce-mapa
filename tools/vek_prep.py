# %%
import pandas as pd
from obyv import ob
# %%
d = pd.read_excel('2020_vek_do_999.xlsx').append(
    pd.read_excel('2020_vek_nad_1000.xlsx'))
# %%
d.head()
# %%
sel = d[d.POH == 'celkem'][['ZUJ', 'Obec', 'Okres', 'Celkem']]
# %%
sel.to_csv('./data.csv', index=False, encoding='utf-8')
# %%
d
# %%
ob
# %%
d[d.Celkem != d.Celkem]
# %%
