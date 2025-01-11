from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC

from selenium.webdriver.support.wait import WebDriverWait


def get_coordinates(address):
    driver = webdriver.Chrome()
    driver.get('https://gps-coordinates.org/coordinate-converter.php')

    address_input = driver.find_element(By.ID, 'address')
    address_input.clear()
    address_input.send_keys(address)

    get_coord_btn = driver.find_element(By.ID, 'btnGetGpsCoordinates')
    get_coord_btn.click()

    coords = [0, 0]

    try:
        driver.find_element(By.ID, 'latitude').clear()
        driver.find_element(By.ID, 'longitude').clear()
        latitude_element = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, 'latitude')))
        longitude_element = driver.find_element(By.ID, 'longitude')

        coords[0] = float(latitude_element.get_attribute('value'))
        coords[1] = float(longitude_element.get_attribute('value'))
    finally:
        driver.quit()

    return coords

def main():
    print(get_coordinates('77 MASSACHUSETTS AVE CAMBRIDGE, MA 02139'))

if __name__ == '__main__':
    main()