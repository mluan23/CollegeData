import geopandas as gpd
import os

# Load the GeoJSON file
geojson_file = '../data/cb_2018_us_state_500k.geojson'
gdf = gpd.read_file(geojson_file)

# Create a directory to save individual state GeoJSON files
output_dir = 'states_geojson'
os.makedirs(output_dir, exist_ok=True)

# Extract individual states/territories and save them as separate GeoJSON files
for state_name in gdf['name'].unique():
    state_gdf = gdf[gdf['name'] == state_name]
    state_gdf.to_file(os.path.join(output_dir, f'{state_name}.geojson'), driver='GeoJSON')

print("Individual state GeoJSON files have been saved in the 'states_geojson' directory.")
