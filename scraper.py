from bs4 import BeautifulSoup
import requests

def scrape_page(url):
    # need to do this or get 403
    headers = {'User-Agent': 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; DEVICE INFO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.<OS Build #>'}
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
    return colleges # return colleges, and bs if want to reuse it

def main():
    base_url = "https://www.niche.com/colleges/search/best-colleges/"
    c = scrape_page(base_url)
    for i in c:
       print(i)



if __name__ == '__main__':
    main()
