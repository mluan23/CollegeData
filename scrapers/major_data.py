import pandas as pd
import json
import ast
import re

encoding = 'utf-8'
major_file = '../data/majors.csv'
college_file = '../data/college.csv'

def main():
    df_colleges = pd.read_csv(college_file, encoding=encoding)
    df_majors = df_colleges[['name','majors','location']]
    df_new = pd.DataFrame()
    #pd.json_normalize((df_majors['majors'].apply(lambda x: json.loads(x))))

    for s in zip(df_majors['name'], df_majors['majors'], df_majors['location']):
       df_new = pd.concat([df_new, dfMajors(s[0], s[1], s[2], pd.DataFrame())])
    df_new.to_csv(major_file, index=False, encoding=encoding)
    print("done writing")
    

def fix_json_format(data):
    # Replace single quotes around keys and values with double quotes
    # This regex matches single quotes only at the start or end of a word or value
    data = re.sub(r"(?<!\w)'|'(?!\w)", '"', data)
    # Escape any unescaped double quotes within the string
    data = data.replace('\\"', '\\\\"')
    return data

# write the major for each uni
def dfMajors(uni_name, majors, location, df):
    if majors == '[]': 
        return
    majors = fix_json_format(majors)
    #print(majors)
    majors = json.loads(majors)
    #print(majors)
    for key, value in majors.items():
        #print(majors)
        row = pd.DataFrame([{'name': uni_name, 'major': key, 'count': value, 'location': location }])
        df = pd.concat([df, row], ignore_index=True)
    #print(df)
    return df
if __name__ == '__main__':
    main()
