import pandas as pd

filename = '../data/college.csv'

import pandas as pd

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

def main():
    df = pd.read_csv(filename, encoding='Latin1')
    df = df.apply(separate_income_prices, axis=1)
    df = df.drop(columns=['prices-by-income'])
    df.to_csv(filename, index=False)
  #  remove_em_dash('name')

if __name__ == '__main__':
    main()