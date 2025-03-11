import pandas as pd
import os
import json

filename = '../data/college.csv'

dir_path = '../data/territories_geo_json'
save_to = r"C:\Users\luanm\Projects\PersonalProjects\USGeoJSON\US.geojson"

def replace_incorrect_characters(text):
    # Load your CSV file without specifying encoding
    df = pd.read_csv(filename, encoding='Latin1')

    # Apply the replacement function to the entire DataFrame
    df['column_name'] = df['column_name'].apply(replace_incorrect_characters)

    # Save the cleaned data back to a CSV
    df.to_csv(filename, index=False, encoding='Latin1')

def remove_em_dash(row):
    df = pd.read_csv(filename, encoding='Latin1')
    #print(df.loc[[381], 'name'])
    # replace the em dash, probably is a better way to do this
    df[row] = df[row].str.replace('Ã¢â¬â', ' - ')
    #df.drop_duplicates(subset=[row])
    df.to_csv(filename, index=False, encoding='Latin1')

def separate_income_prices(row):
    incomes = eval(row['prices-by-income'])
    for key, value in incomes.items():
        row[key] = value
    return row

def convert_col_int(col_name,df):
    # Remove or fill non-numeric values
    df[col_name] = pd.to_numeric(df[col_name], errors='coerce')  # Converts invalid values to NaN
    df[col_name] = df[col_name].fillna(0).astype(int)           # Replace NaN with 0 and convert to int


def combine_geojson():
    combined = {"type": "FeatureCollection", "features": []}
    for file in os.listdir(dir_path):
        file_path = os.path.join(dir_path, file)  # Get the full path
        with open(file_path) as f:
            data = json.load(f)
            combined['features'].extend(data['features'])
        print(file_path)
    with open('C:/Users/luanm/Projects/PersonalProjects/CollegeData/data/US.geojson', 'w') as f:
        json.dump(combined, f)

# modifying alaska 
def modify_geojson(file):
    with open(file, 'r') as f:
        geojson_data = json.load(f)

def main():
    combine_geojson()
#     df = pd.read_csv(filename, encoding='utf-8')
#     #df = df.apply(separate_income_prices, axis=1)
#     #df = df.drop(columns=['majors'])
#     #df['tuition'] = ((df['in-state tuition'] + df['out-state tuition']) / 2).astype(int)
#     convert_col_int('part-time undergrads', df)
#     df['undergrads'] = df['full-time undergraduates'].astype(int) + df['part-time undergrads'].astype(int)
#     #print(df['full-time undergraduates'])
#         #print(df['part-time undergrads'])

#     df.to_csv(filename, index=False)
#   #  remove_em_dash('name')


if __name__ == '__main__':
    main()