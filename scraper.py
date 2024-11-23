import csv
import random
import time

from bs4 import BeautifulSoup
import requests

def scrape_page(url):
    # need to do this or get 403
    user_agents = [
        #'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; DEVICE INFO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.<OS Build #>',
        'Lynx: Lynx/2.8.8pre.4 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/2.12.23',
        'Wget: Wget/1.15 (linux-gnu)',
        'Curl: curl/7.35.0',
        'HTC: Mozilla/5.0 (Linux; Android 7.0; HTC 10 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
        'Google Nexus: Mozilla/5.0 (Linux; U; Android-4.0.3; en-us; Galaxy Nexus Build/IML74K) AppleWebKit/535.7 (KHTML, like Gecko) CrMo/16.0.912.75 Mobile Safari/535.7',
        'Samsung Galaxy Note 4: Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-N910F Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/44.0.2403.133 Mobile Safari/537.36',
        'Samsung Galaxy Note 3: Mozilla/5.0 (Linux; Android 5.0; SAMSUNG SM-N900 Build/LRX21V) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.1 Chrome/34.0.1847.76 Mobile Safari/537.36',
        'Samsung Phone: Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-G570Y Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/44.0.2403.133 Mobile Safari/537.36',
        #'Bing’s Search Engine Bot: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        #'Google’s Search Engine Bot: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Apple iPhone: Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
        'Apple iPad: Mozilla/5.0 (iPad; CPU OS 8_4_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12H321 Safari/600.1.4',
        'Microsoft Internet Explorer 10 / IE 10: Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0; MDDCJS)',
        'Microsoft Internet Explorer 9 / IE 9: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0; Trident/5.0)',
        'Microsoft Internet Explorer 8 / IE 8: Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)',
        'Microsoft Internet Explorer 7 / IE 7: Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)',
        'Microsoft Internet Explorer 6 / IE 6: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)',
        'Microsoft Edge: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        'Mozilla Firefox: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0',
        'Google Chrome: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'


    ]
    headers = {'User-Agent':         'Apple iPhone: Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
}
    #headers = {'User-Agent': random.choice(user_agents)}
    response = requests.get(url, headers=headers) # get the url
    # if(response != 200): # 200 is success
    #     return None
    bs = BeautifulSoup(response.content, 'html.parser') # parse the HTML of the response
    colleges = []
    #print(bs.prettify())
    college_elements = bs.findAll('div', class_='card search-result') # get each college
    for college in college_elements:
        name = college.find('h2').text # get the college name
        colleges.append(name)
    return colleges, bs # return colleges, and bs if want to reuse it

def scrape_all_pages(url):
    all_colleges = []
    while url:
        colleges, bs = scrape_page(url)
        all_colleges.extend(colleges)
        time.sleep(random.uniform(1, 5))
        next_page = bs.find('a', {'aria-label': 'Go to next page'})
        if next_page:
            url = next_page['href']
        else:
            url = None
    return all_colleges

def write_to_file(colleges):
    with open('colleges.csv', 'w', newline='') as file:
        fieldnames = ['name']
        #writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer = csv.writer(file)
        writer.writerow(['name'])
        for college in colleges:
            writer.writerow([college])

def main():
    base_url = "https://www.niche.com/colleges/search/best-colleges/"
    c,s = scrape_page(base_url)
    for i in c:
       print(i)
    write_to_file(c)



if __name__ == '__main__':
    main()
