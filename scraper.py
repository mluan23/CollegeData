import csv
import random
import time

import pandas as pd
from bs4 import BeautifulSoup
import requests
import requests_cache
from fake_useragent import UserAgent
from urllib.request import Request, urlopen
from IPython.display import clear_output
import threading
import re
#from selenium import webdriver
#from selenium.webdriver.chrome.service import Service
#from selenium.webdriver.common.by import By
#from selenium.webdriver.chrome.options import Options

# so we might consider using rate limits in the future; for now let's not
l_bound = 10
u_bound = 12
requests_cache.install_cache('niche_data_colleges', expire_after=3600) # caching responses so less requests to server
ua = UserAgent()
proxies = []
cache_time = 10800 # Cache duration in seconds (3 hours)
lock = threading.Lock()
#colleges = []
filename = "colleges.csv"
#count = 1 # count the num colleges
# options = Options()
# options.headless = True # Run in headless mode
# service = Service("C:/Users/luanm/chromedriver-win64/chromedriver-win64/chromedriver.exe") # Update with the correct path to your chromedriver
# driver = webdriver.Chrome(service=service, options=options)
# bunch of random user agents
user_agents = [
    #Chrome
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    #Firefox
    'Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 6.2; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
    'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)'
]


def scrape_page(url):
    colleges = []

    colleges_written, initial_count = get_current_written(filename)
    headers, proxy = get_headers_and_proxy()
    initial_count += 1
    # proxy = random.choice(proxies)
    response = requests.get(url, headers=headers, proxies=proxy, timeout=10) # get the url
    if response.status_code != 200:  # 403 is forbidden, try a new proxy / header
        print(str(response.status_code) + " error for original link, agent:" + headers["User-Agent"])
        user_agents.remove(headers["User-Agent"])
        if response.status_code == 404 or len(headers) == 0:
            print("Retry again later")
            return None

        time.sleep(random.uniform(l_bound, u_bound))
        return scrape_page(url)
    if response.from_cache:
        print("ok")
    soup = BeautifulSoup(response.content, 'html.parser')  # parse the HTML of the response
    college_elements = soup.findAll('div', class_='card search-result') # get each college
    for college in college_elements:
        college_url = college.find('a', class_='MuiTypography-root MuiTypography-inherit MuiLink-root MuiLink-underlineHover search-result__link nss-6ozsqs')['href']
        if college.find('h2').text in colleges_written:
            continue
        colleges.append(get_college_info(college_url, college, initial_count))
        initial_count += 1
    if len(colleges) > 0:
        write_to_file(colleges, filename)
    return colleges, soup # return colleges, and bs if want to reuse it

# use this one for testing scraping some, but not all pages, so num_pages should always be less than all pages
def scrape_some_pages(url, num_pages):
    all_colleges = []
    for i in range(num_pages):
        collegess, soup = scrape_page(url)
        all_colleges.extend(collegess)
        #time.sleep(random.uniform(l_bound, u_bound))
        next_page = soup.find('a', {'aria-label': 'Go to next page'})
        url = next_page['href']
    return all_colleges
def scrape_all_pages(url):
    all_colleges = []
    while url:
        collegess, soup = scrape_page(url)
        all_colleges.extend(collegess)
        time.sleep(random.uniform(l_bound, u_bound))
        next_page = soup.find('a', {'aria-label': 'Go to next page'})
        if next_page:
            url = next_page['href']
        else:
            url = None
    return all_colleges
def get_college_info(url, college, count):  # get info about 1 college
    college_info = {'name': college.find('h2').text, 'url': url}
    headers, proxy = get_headers_and_proxy()
    response = requests.get(url, headers=headers, proxies=proxy)
    print("getting info for " + url + " , agent:" + headers["User-Agent"])
    if response.status_code != 200:  # 403 is forbidden, try a new proxy / header
        print(str(response.status_code) + " error for " + url + " , agent:" + headers["User-Agent"])
        user_agents.remove(headers["User-Agent"])
        time.sleep(random.uniform(l_bound, u_bound))
        get_college_info(url, college, count)
        return None
    college_info['rank'] = count
    soup = BeautifulSoup(response.content, 'html.parser')
    #cost = re.sub(r'[^\d]', '', cost)  # regex to make just the num
    college_info['net cost'] = find_net_cost(soup)  # add to the info
    college_info["median earnings"] = find_earnings(soup)
    college_info['location'] = find_location(soup)
    #add_to_colleges(college_info)
    if response.from_cache:
        print("from cache")
        pass
    else:
        time.sleep(random.uniform(l_bound, u_bound))
    return college_info
def find_net_cost(soup):
    bucket = soup.find('div', class_='scalar__bucket')  # we are finding the cost with this
    cost = bucket.find('div', class_='scalar__value').find('span').text  # the cost has no class so we need to dig through
    return convert_to_num(cost)
def find_location(soup):
    return soup.findAll('li', class_='postcard__attr postcard-fact')[1].text
def convert_to_num(original):
    num = re.sub(r'[^\d]', '', original)
    return int(num)

def get_current_written(filename):
    try:
        with open(filename, 'r', newline='') as file:
            reader = csv.DictReader(file)
            names = [row['name'] for row in reader]
            return names[0:], len(names)
    except FileNotFoundError:
        return [], 0


# used to just be 10th profile bucket on all, not sure why not now
def find_earnings(soup):
    buckets = soup.find_all('div', class_='profile__bucket--1')
    earnings = "$0"
    for bucket in buckets:
        try:
            value_label = bucket.find('div', class_='scalar__label').find('span').text
            if "Median" in value_label:
                earnings = bucket.find('div', class_='scalar__value').find('span').text
        except AttributeError:
            pass
    return convert_to_num(earnings)
# def add_to_colleges(college_info):
#     with lock:
#         colleges.append(college_info)
def write_to_file(some_colleges, namefile):
    with open(namefile, 'a', newline='') as file:
        fieldnames = ['rank', 'name', 'url', 'net cost', 'median earnings', 'location']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        #writer = csv.writer(file)
        a, b = get_current_written(namefile)
        if b == 0:
            writer.writeheader()
        for college in some_colleges:
            writer.writerow(college)
def get_headers_and_proxy():
    agent = random.choice(user_agents)
    proxy = get_rand_proxy()
    # headers = {"Accept-Language": "en-US,en;q=0.9",
    #            "accept-encoding": "gzip, deflate, br, zstd",
    #            "priority": "u=0, i",
    #            "referer": "https://niche.com/",
    #            "sec-ch-ua-mobile": "?0",
    #            "sec-ch-ua-platform": "Windows",
    #            "sec-fetch-dest": "document",
    #            "sec-fetch-mode": "navigate",
    #            "sec-fetch-site": "same-origin",
    #            "sec-fetch-user": "?1",
    #            "User-Agent": agent}
    headers = {"User-Agent": agent,
               "Accept-Language": "en-US,en;q=0.9"}
    return headers, proxy
def get_rand_proxy():
    # Retrieve latest proxies
    current_time = time.time()
    # check if there is a proxy
    if proxies and (current_time - proxies[0]['timestamp']) < cache_time:
        return random.choice(proxies)
    headers = {'User-Agent': ua.random}
    response = requests.get('https://www.sslproxies.org/', headers=headers)
    if response.status_code != 200:
        get_rand_proxy()
        return None
    #proxies_req.add_header('User-Agent', ua.random)
    #proxies_doc =

    #proxies_doc = urlopen(proxies_req).read().decode('utf8')

    soup = BeautifulSoup(response.content, 'html.parser')
    proxies_table = soup.find('div', class_='table-responsive fpl-list')
    new_proxies = []
    # Save proxies in the array
    for row in proxies_table.tbody.find_all('tr'):
        new_proxies.append({
            'ip': row.find_all('td')[0].string,
            'port': row.find_all('td')[1].string,
            'timestamp': current_time
        })

    # make sure we don't try to modify proxies in multiple threads
    # with lock:
    proxies.clear()
    proxies.extend(new_proxies)
    return random.choice(new_proxies)

def delete_row_by_number(name, row_number):
    with open(name, mode='r') as file:
        # Read the data into a list
        reader = csv.reader(file)
        rows = list(reader)

    # Check if the row_number is valid
    if row_number < 0 or row_number >= len(rows):
        raise ValueError("Row number out of range")

    # Delete the row by index
    del rows[row_number]

    with open(name, mode='w', newline='') as file:
        # Write the updated data back to the CSV file
        writer = csv.writer(file)
        writer.writerows(rows)


# Retrieve a random index proxy (we need the index to delete it if not working)
#def random_proxy():
 # return random.randint(0, len(proxies) - 1)
def main():
    base_url = "https://www.niche.com/colleges/search/best-colleges/"
    #base_url = "https://www.niche.com/colleges/search/best-colleges/?page=5"
    #get_current_written('colleges.csv')
    # get_rand_proxy()
    #delete_row_by_number(filename, 2)
    c = scrape_some_pages(base_url, 1)
    for i in c:
        print(i)
    #write_to_file(c)
    #print(UserAgent().random)



if __name__ == '__main__':
    main()
