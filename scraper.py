import csv
import random
import time

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

requests_cache.install_cache('niche_data_colleges', expire_after=3600) # caching responses so less requests to server
ua = UserAgent()
proxies = []
cache_time = 3600 # Cache duration in seconds (1 hour)
lock = threading.Lock()
colleges = []
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
    #'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    #Firefox
    'Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)',
    #'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
    #'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 6.2; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)',
    #'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
    'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)'
]


# def scrape_page(url):
#     threads = []
#     while True:
#         proxy = random.choice(proxies)
#         agent = ua.random
#         options.add_argument(f'user-agent={agent}')
#         options.add_argument(f'--proxy-server={proxy}')
#         try:
#             driver.get(url)
#             time.sleep(random.uniform(1,5))
#             soup = BeautifulSoup(driver.page_source, 'html.parser')
#             college_elements = soup.findAll('div', class_='card search-result')  # get each college
#             break
#         except Exception as e:
#             print(f"Request failed: {e}, trying a new proxy/user agent...")
#             time.sleep(random.uniform(1, 5))
#     driver.quit()
#

def scrape_page(url):
    threads = []
    #colleges = []

   # agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.1'
   #  agent = random.choice(user_agents)
    # we want a random agent, and preferred US english
    # headers = {"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    #     "Accept-Encoding": "gzip, deflate, br, zstd",
    #     "Accept-Language": "en-US,en;q=0.9",
    #     "Host": "httpbin.org",
    #     "Priority": "u=0, i",
    #     "Referer": "https://www.scrapehero.com/",
    #     "Sec-Ch-Ua": "\"Chromium\";v=\"130\", \"Microsoft Edge\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
    #     "Sec-Ch-Ua-Mobile": "?0",
    #     "Sec-Ch-Ua-Platform": "\"Windows\"",
    #     "Sec-Fetch-Dest": "document",
    #     "Sec-Fetch-Mode": "navigate",
    #     "Sec-Fetch-Site": "cross-site",
    #     "Sec-Fetch-User": "?1",
    #     "Upgrade-Insecure-Requests": "1",
    #     "User-Agent": agent,
    #     "X-Amzn-Trace-Id": "Root=1-674376af-1fde2d481b980b3a5ba04602"}
    # headers = {
    #     "User-Agent": agent,
    #     "Accept-Language": "en-US,en;q=0.9",
    # }

    headers, proxy = get_headers_and_proxy()
    # proxy = random.choice(proxies)
    response = requests.get(url, headers=headers, proxies=proxy, timeout=10) # get the url
    # if response.from_cache:
    #     print("From cache")
    if response.status_code != 200:  # 403 is forbidden, try a new proxy / header
        time.sleep(random.uniform(1, 5))
        print(str(response.status_code) + " error for original link, agent:" + headers["User-Agent"])
        #get_rand_proxy()
        return scrape_page(url)
    soup = BeautifulSoup(response.content, 'html.parser')  # parse the HTML of the response
    #print(bs.prettify())
    college_elements = soup.findAll('div', class_='card search-result') # get each college
    for college in college_elements:
        college_url = college.find('a', class_='MuiTypography-root MuiTypography-inherit MuiLink-root MuiLink-underlineHover search-result__link nss-6ozsqs')['href']
        thread = threading.Thread(target=get_college_info, args=(college_url, college))
        threads.append(thread)
        thread.start()
        time.sleep(random.uniform(1,3))
    for thread in threads:
        thread.join()
        #college_info = {'name': name, 'url': college_url}
        #colleges.append(college_info)
    return colleges, soup # return colleges, and bs if want to reuse it

# use this one for testing scraping some, but not all pages, so num_pages should always be less than all pages
def scrape_some_pages(url, num_pages):
    all_colleges = []
    for i in range(num_pages):
        collegess, soup = scrape_page(url)
        all_colleges.extend(collegess)
        time.sleep(random.uniform(1, 5))
        next_page = soup.find('a', {'aria-label': 'Go to next page'})
        url = next_page['href']
    return all_colleges
def scrape_all_pages(url):
    all_colleges = []
    while url:
        collegess, soup = scrape_page(url)
        all_colleges.extend(collegess)
        time.sleep(random.uniform(1, 5))
        next_page = soup.find('a', {'aria-label': 'Go to next page'})
        if next_page:
            url = next_page['href']
        else:
            url = None
    return all_colleges
def get_college_info(url, college):  # get info about 1 college
    college_info = {'name': college.find('h2').text, 'url': url}
    headers, proxy = get_headers_and_proxy()
    response = requests.get(url, headers=headers, proxies=proxy)
    print("getting info for " + url + " , agent:" + headers["User-Agent"])
    if response.status_code != 200:  # 403 is forbidden, try a new proxy / header
        time.sleep(random.uniform(1,5)) # make sure not too many requests
        print(str(response.status_code) + " error for " + url + " , agent:" + headers["User-Agent"])
        get_college_info(url, college)
        return None

    soup = BeautifulSoup(response.content, 'html.parser')
    bucket = soup.find('div', class_='scalar__bucket')  # we are finding the cost with this
    cost = bucket.find('div', class_='scalar__value').find('span').text  # the cost has no class so we need to dig through
    #cost = re.sub(r'[^\d]', '', cost)  # regex to make just
    college_info['cost'] = cost  # add to the info
    # bucket = soup.findAll('div', class_='profile__buckets')
    # buckets = bucket[10].find('div', class_='profile__bucket--1')
    earnings = find_earnings(soup)
    college_info["median earnings"] = earnings
    add_to_colleges(college_info)

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
    return earnings
def add_to_colleges(college_info):
    with lock:
        colleges.append(college_info)
def write_to_file(colleges):
    with open('colleges.csv', 'w', newline='') as file:
        fieldnames = ['name', 'url', 'cost']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        #writer = csv.writer(file)
        writer.writeheader()
        for college in colleges:
            writer.writerow(college)
def get_headers_and_proxy():
    agent = random.choice(user_agents)
    proxy = get_rand_proxy()
    headers = {"User-Agent": agent, "Accept-Language": "en-US,en;q=0.9"}
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
    with lock:
        proxies.clear()
        proxies.extend(new_proxies)
    return random.choice(new_proxies)


# Retrieve a random index proxy (we need the index to delete it if not working)
#def random_proxy():
 # return random.randint(0, len(proxies) - 1)
def main():
    base_url = "https://www.niche.com/colleges/search/best-colleges/"
    get_rand_proxy()
    c = scrape_some_pages(base_url, 1)
    for i in c:
       print(i)
    #write_to_file(c)
    #print(UserAgent().random)



if __name__ == '__main__':
    main()
