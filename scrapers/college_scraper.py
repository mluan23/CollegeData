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
encoding = 'utf-8'
l_bound = 10
u_bound = 12
requests_cache.install_cache('niche_data_colleges', expire_after=3600 * 24) # caching responses so less requests to server
ua = UserAgent()
proxies = []
cache_time = 3600 # Cache duration in seconds (1 hour)
#lock = threading.Lock()
#colleges = []
filename = "../data/college.csv"
start_time = time.time()
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
    initial_count += 1
    response = make_request(url)
    if response is None:
        return []
    if response.status_code != 200:  # 403 is forbidden, try a new proxy / header
        scrape_page(url)
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
        #time.sleep(random.uniform(l_bound, u_bound))
        next_page = soup.find('a', {'aria-label': 'Go to next page'})
        if next_page:
            url = next_page['href']
        else:
            url = None
    return all_colleges

def make_request(url):
    print("making request for: " + url)
    headers, proxy = get_headers_and_proxy()
    response = requests.get(url, headers=headers, proxies=proxy)
    if not response.from_cache:
        time.sleep(random.uniform(l_bound, u_bound))
    if response.status_code != 200:
        print(str(response.status_code) + " error for " + url + " , agent:" + headers["User-Agent"])
        user_agents.remove(headers["User-Agent"])
    if response.status_code == 404 or len(user_agents) < 1:
        print("retry again later")
        return None
    end = time.time()
    elapsed = end-start_time
    print(elapsed)
    return response
def get_college_info(url, college, count):  # get info about 1 college
    college_info = {'name': college.find('h2').text, 'url': url}
    response = make_request(url)
    if response is None:
        return []
    if response.status_code != 200:
        return get_college_info(url, college, count)
    print("getting info for " + college.find('h2').text)
    college_info['rank'] = count
    soup = BeautifulSoup(response.content, 'html.parser')
    college_info['net cost'] = find_net_cost(soup)  # add to the info
    college_info['aid'] = find_average_aid(soup)
    college_info['in-state tuition'], college_info['out-state tuition'], college_info['housing'], college_info['meals'], college_info['books'], college_info['prices-by-income'] = find_cost_breakdown(soup)
    college_info["median earnings"] = find_earnings(soup)
    college_info['location'] = find_location(soup)
    college_info['address'] = find_address(soup)
    college_info['student-faculty ratio'] = find_student_faculty_ratio(soup)
    college_info['majors'] = find_majors(soup)
    college_info['acceptance rate'] = find_acceptance_rate(soup)
    college_info['application deadline'] = find_application_deadline(soup)
    college_info['graduation rate'], college_info['employed 2 years post graduation'] \
        = find_graduation_rate_and_employment(soup)
    college_info['full-time undergraduates'], college_info['part-time undergrads'], college_info['undergrads over 25'], college_info['pell-grant recipients'], college_info['varsity athletes'] = find_enrolled_information(soup)
    college_info['public/private'] = find_public_private(soup)
    return college_info
def find_net_cost(soup):
    bucket = soup.find('div', class_='scalar__bucket')  # we are finding the cost with this
    try:
        cost = bucket.find('div', class_='scalar__value').find('span').text
    except AttributeError:
        return -1
    return convert_to_num(cost)
def find_average_aid(soup):
    buckets = soup.find_all('div', class_='block--cost__bucket')
    for bucket in buckets:
        try:
            if 'Average Total Aid Awarded' in bucket.find('div', class_='scalar__label').find('span').text:
                return convert_to_num(bucket.find('div', class_='scalar__value').find('span').text)
        except AttributeError:
            pass
    return -1
def find_cost_breakdown(soup):
    links = soup.find_all('a', class_='expansion-link__text')
    url = ''
    try:
        for link in links:
            if 'Explore Tuition & Cost Breakdown' in link.find('span').text:
                url = link['href']
                break
    except AttributeError:
        pass
    if url == '':
        return -1,-1,-1,-1,-1,{}
    response = make_request(url)
    if response is None:
        return -1,-1,-1,-1,-1,{}
    if response.status_code != 200:
        return find_cost_breakdown(soup)
    soup = BeautifulSoup(response.content, 'html.parser')
    buckets = soup.find_all('div', class_='blank__bucket')
    in_tution = -1
    out_tution = -1
    for bucket in buckets:
        try:
            label = bucket.find('div', class_='scalar__label').find('span').text
            value = convert_to_num(bucket.find('div', class_='scalar__value').find('span').text)
            if 'In-State Tuition' in label:
                in_tution = value
            elif 'Out-of-State Tuition' in label:
                out_tution = value
        except AttributeError or ValueError:
            pass
    housing = -1
    meal = -1
    books = -1
    for bucket in buckets:
        try:
            three = bucket.find_all('div', class_='scalar--three')
            #values = bucket.find_all('div', class_='scalar__value')
            for profile in three:
                try:
                    label = profile.find('div', class_='scalar__label').find('span').text
                    value = convert_to_num(profile.find('div', class_='scalar__value').find('span').text)
                    if 'Average Housing Cost' in label:
                        housing = value
                    elif 'Average Meal Plan Cost' in label:
                        meal = value
                    elif 'Books & Supplies' in label:
                        books = value
                except AttributeError or ValueError:
                    pass
        except AttributeError:
            pass
    prices_by_income = {}
    tables = soup.find_all('div', class_='profile__table')
    for table in tables:
        try:
            title = table.find('div', class_='profile__table__title').text
            if 'Net Price by Household Income' in title:
                rows = table.find_all('li', class_='fact__table__row')
                for row in rows:
                    label = row.find('div', class_='fact__table__row__label').text
                    value = convert_to_num(row.find('div', class_='fact__table__row__value').text)
                    prices_by_income[label] = value
        except AttributeError or ValueError:
            pass
    return in_tution, out_tution, housing, meal, books, prices_by_income

def find_location(soup):
    try:
        return soup.findAll('li', class_='postcard__attr postcard-fact')[1].text
    except IndexError:
        print('ONLINE LOCATION')
        return 'Online'
    except AttributeError:
        return 'Unlisted'

def find_address(soup):
    try:
        address = soup.find('address', class_='profile__address--compact')
        for br in address.find_all('br'):
            br.replace_with(' ')
        return address.get_text()
    except AttributeError:
        return 'Unlisted'
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
def find_student_faculty_ratio(soup):
    buckets = soup.find_all('div', class_='profile__bucket--1')
    ratio = 'unlisted'
    for bucket in buckets:
        try:
            value_label = bucket.find('div', class_='scalar__label').find('span').text
            if "Student" in value_label:
                ratio = bucket.find('div', class_='scalar__value').find('span').text
        except AttributeError:
            pass
    return ratio
def find_majors(soup):
    expansions = soup.find_all('div', class_='expansion-link')
    majors_url = ''
    for e in expansions:
        try:
            link_text = e.find('a', class_='expansion-link__text').find('span').text
            if "See All Majors" in link_text:
                majors_url = e.find('a', class_='expansion-link__text')['href']
                break
        except AttributeError:
            pass
    if majors_url == '':
        return []
    response = make_request(majors_url)
    if response is None:
        return []
    if response.status_code != 200:
        return find_majors(soup)
    # if not response.from_cache:
    #     time.sleep(random.uniform(l_bound, u_bound))
    soup = BeautifulSoup(response.content, 'html.parser')
    list_majors = soup.find_all('li', class_='majors-list-item')
    # list_majors = []
    # list_graduates = []
    majors = {}
    for major in list_majors:
        m = major.find('div', class_='majors-list-item-major').text
        grads = major.find('span', class_='majors-list-item--bold').text
        majors[m] = grads
    return majors

def find_acceptance_rate(soup):
    labels = soup.find_all('div', class_='MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-6 nss-1x0x05w')
    for label in labels:
        try:
            if 'Acceptance Rate' in label.find('div', class_='scalar__label').find('span').text:
                return int(convert_to_num(label.find('div', class_='scalar__value').text))
        except AttributeError:
            pass
    return -1

def find_application_deadline(soup):
    try:
        d = soup.find('div', class_='MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-6 block--admissions__application-deadline nss-1x0x05w')
        return d.find('div', class_='scalar__value').find('span').text
    except AttributeError:
        print("NO APPLICATION DEADLINE LISTED")
        return '-'
def find_enrolled_information(soup):
    buckets = soup.find_all('div', class_='profile__bucket--1')
    fulltime = -1
    parttime = -1
    over25 = -1  # % based
    pell = -1    # % based
    athletes = -1 # % based
    for bucket in buckets:
        try:
            label = bucket.find('div', class_='scalar__label').find('span').text
            if 'Full-Time Enrollment' in label:
                fulltime = convert_to_num(bucket.find('div', class_='scalar__value').find('span').text)
                threes = bucket.find_all('div', class_='scalar--three')
                for l in threes:
                    try:
                        lbl = l.find('div', class_='scalar__label').find('span').text
                        val = l.find('div', class_='scalar__value').find('span').text
                        if 'Part-Time Undergrads' in lbl:
                            parttime = val
                        elif 'Undergrads Over 25' in lbl:
                            over25 = convert_to_num(val)
                        elif 'Pell Grant' in lbl:
                            pell = convert_to_num(val)
                        elif 'Varsity Athletes' in lbl:
                            athletes = convert_to_num(val)
                    except AttributeError:
                        pass
        except AttributeError:
            pass
    return fulltime, parttime, over25, pell, athletes
def find_graduation_rate_and_employment(soup):
   # buckets = soup.find_all('div', class_='profile__bucket--2')
    three = soup.find_all('div', class_='scalar--three')
    g_rate = -1
    e_rate = -1
    for t in three:
        try:
            labels = t.find_all('div', class_='scalar__label')
            for label in labels:
                if 'Graduation Rate' in label.find('span').text:
                    g_rate = convert_to_num(t.find('div', class_='scalar__value').find('span').text)
                elif 'Employed 2 Years After Graduation' in label.find('span').text:
                    e_rate = convert_to_num(t.find('div', class_='scalar__value').find('span').text)
        except AttributeError:
            pass
    return g_rate, e_rate
def find_employment_rate_post_two_years(soup):
    buckets = soup.find_all('div', class_='profile__bucket--2')
    for bucket in buckets:
        try:
            label = bucket.find_all('div', class_='scalar__label')[2].find('span').text
            if 'Employed 2 Years After Graduation' in label:
                return convert_to_num(bucket.find('div', class_='scalar__value').find('span').text)
        except AttributeError:
            pass
        except IndexError:
            pass
    return -1

def find_public_private(soup):
    tags = soup.find_all('li', class_='search-tags__wrap__list__tag')
    for tag in tags:
        try:
            label = tag.find('a').text
            if 'Public' in label or 'Private' in label:
                return label
        except AttributeError:
            pass
    return ''
def convert_to_num(original):
    num = re.sub(r'[^\d]', '', original)
    try:
        return int(num)
    except ValueError:
        return -1


def get_current_written(filename):
    try:
        with open(filename, 'r', newline='', encoding=encoding) as file:
            reader = csv.DictReader(file)
            names = [row['name'] for row in reader]
            return names[0:], len(names)
    except FileNotFoundError:
        return [], 0
def write_to_file(some_colleges, namefile):
    with open(namefile, 'a', newline='', encoding=encoding) as file:
        fieldnames = some_colleges[0].keys()
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        #writer = csv.writer(file)
        a, b = get_current_written(namefile)
        if b == 0:
            writer.writeheader()
        for college in some_colleges: # we need to write each dict separately
            try:
                writer.writerow(college)
            except AttributeError:
                print(college)
                pass


# deletes the last row

def delete_row_by_number(name, row_number):
    with open(name, mode='r', encoding=encoding) as file:
        # Read the data into a list
        reader = csv.reader(file)
        rows = list(reader)

    # Check if the row_number is valid
    if row_number < 0 or row_number >= len(rows):
        raise ValueError("Row number out of range")

    # Delete the row by index
    del rows[len(rows)-1]

    with open(name, mode='w', newline='', encoding=encoding) as file:
        # Write the updated data back to the CSV file
        writer = csv.writer(file)
        writer.writerows(rows)
def get_headers_and_proxy():
    agent = random.choice(user_agents)
    proxy = get_rand_proxy()
    headers = {"User-Agent": agent,
               "Accept-Language": "en-US,en;q=0.9"}
    return headers, proxy
def get_rand_proxy():
    # Retrieve latest proxies
    current_time = time.time()
    # check if there is a proxy
    if proxies and (current_time - proxies[0]['timestamp']) < 10:
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



# Retrieve a random index proxy (we need the index to delete it if not working)
#def random_proxy():
 # return random.randint(0, len(proxies) - 1)
def main():
    #requests_cache.clear()
    #delete_row_by_number(filename, 0)
    base_url = "https://www.niche.com/colleges/search/best-colleges/?page=59"
    #base_url = "https://www.niche.com/colleges/search/best-colleges/?page=2"

    #delete_row_by_number(filename, 2)
    #c = scrape_some_pages(base_url, 2)
    c = scrape_all_pages(base_url)
    for i in c:
        print(i)



if __name__ == '__main__':
    main()
