import random
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd

from selenium.webdriver.support.wait import WebDriverWait

filename = '../data/college.csv'

def write_coordinates(file, col_name, col_based_on, driver):
    df = pd.read_csv(file, encoding='utf-8')
    if col_name not in df.columns:
        df[col_name] = None
    df[col_name] = df[col_name].astype(object) # have to cast to object to allow dataframe to store an array
    for index, row in df.iterrows():
        if pd.isna(row[col_name]):
            address = row[col_based_on]
            try:
                coords = get_coordinates(address, driver)
                print(coords)
                df.at[index, col_name] = coords
                df.to_csv(file, index=False)
               # df['coords'] = df['coords'].apply(lambda x: ['X', 'Y'])
                time.sleep(random.uniform(4,6))
                #print(coords)
            except AttributeError as e:
                pass


#def scrape():

#def get_address(file):

def get_coordinates(address, driver):
    #driver = webdriver.Chrome()
    #driver.get('https://gps-coordinates.org/coordinate-converter.php')

    driver.find_element(By.ID, 'latitude').clear()
    driver.find_element(By.ID, 'longitude').clear()
    address_input = driver.find_element(By.ID, 'address')
    address_input.clear()
    address_input.send_keys(address)

    get_coord_btn = driver.find_element(By.ID, 'btnGetGpsCoordinates')
    get_coord_btn.click()

    coords = [0, 0]

    #latitude_element = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, 'latitude')))
    wait = WebDriverWait(driver, 10)

    # lat/long fields have a . in them so just use that after clearing
    wait.until(EC.text_to_be_present_in_element_value((By.ID, 'latitude'), '.'))
    wait.until(EC.text_to_be_present_in_element_value((By.ID, 'longitude'), '.'))
    latitude_element = driver.find_element(By.ID, 'latitude')
    longitude_element = driver.find_element(By.ID, 'longitude')

    coords[0] = float(latitude_element.get_attribute('value'))
    coords[1] = float(longitude_element.get_attribute('value'))
    #finally:
    #driver.quit()

    return coords

def main():
    driver = webdriver.Chrome()
    driver.get('https://gps-coordinates.org/coordinate-converter.php')
    try:
        write_coordinates(filename, 'coordinates', 'address', driver)
        #print(get_coordinates('133 WALL ST NEW HAVEN, CT 06511', driver))
    finally:
        #print('a')
        driver.close()
    #print(get_coordinates('77 MASSACHUSETTS AVE CAMBRIDGE, MA 02139'))

if __name__ == '__main__':
    main()