# %%
import pandas as pd
import math

# %%
d = pd.read_csv('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/obce.csv')
d = d.append(pd.read_csv(
    'https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/mestske-casti.csv'))
# %%
ob = pd.read_csv('data.csv').merge(pd.read_csv('data65.csv'), on='ZUJ')
ob = ob[['ZUJ', 'Celkem', 'vek65+']]
ob.columns = ['obec_kod', 'obyvatel', 'obyvatel65+']


# %%
d = d[d.datum >= '2021-09-01']
# %%


def fix(ob, mc):
    if math.isnan(ob):
        return mc
    else:
        return ob


d['obec_kod'] = d.apply(lambda row: fix(
    row['obec_kod'], row['mc_kod']), axis=1)
# %%
d = d.merge(ob, on='obec_kod', how='left')

# %%
# %%
d.to_csv('./export.csv', index=False, encoding='utf-8')
# %%
