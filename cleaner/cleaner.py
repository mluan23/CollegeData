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
    # replace the em dash, definitely is a better way to do this...
    df[row] = df[row].str.replace('Ã¢â¬â', ' - ')
    #df.drop_duplicates(subset=[row])
    df.to_csv(filename, index=False, encoding='Latin1')

def main():

    # # Sample DataFrame
    # data = {'text': ['This is a sample text with an em—dash and an en–dash.']}
    # df = pd.DataFrame(data)
    # print(df)
    #
    # # Replace em and en dashes with a space and a hyphen
    # df['text'] = df['text'].str.replace('—', ' - ').str.replace('–', ' - ')
    #
    # print(df)

    remove_em_dash('name')

if __name__ == '__main__':
    main()