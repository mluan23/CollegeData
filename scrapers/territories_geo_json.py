import geopandas as gpd
import os

# Load the GeoJSON file
geojson_file = '../data/cb_2018_us_state_500k.geojson'
gdf = gpd.read_file(geojson_file)
print(gdf.columns)

# Create a directory to save individual state GeoJSON files
output_dir = '../data/territories_geo_json'
os.makedirs(output_dir, exist_ok=True)
# Extract individual states/territories and save them as separate GeoJSON files
names = set()
for state_name in gdf['NAME'].unique():
    state_gdf = gdf[gdf['NAME'] == state_name]
    state_gdf.to_file(os.path.join(output_dir, f'{state_name}.geojson'), driver='GeoJSON')
    names.add(state_name)
with open('../data/territories_geo_json/State_Names.txt', mode='w') as file:
    for name in names:
        file.write(name + '\n')
print("Individual state GeoJSON files have been saved in the 'states_geojson' directory.")
