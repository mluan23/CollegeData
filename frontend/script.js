


async function getCSV(){
    try {
        const response = await fetch('../data/college.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.text(); // entire CSV as a single string
        displayData(data);
    } catch (error) {
        console.error('Failed to fetch CSV file:', error);
    }
}

function initMap(){
// Initialize the map centered on a specific location
const map = L.map('map').setView([39.8283, -98.5795], 10); // approx US center

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker at the location
// const marker = L.marker([40.7128, -74.0060]).addTo(map)
//     .bindPopup('<a href="https://www.openstreetmap.org/search?query=40.7128,-74.0060" target="_blank">View Address</a>')
//     .openPopup();
}




function displayData(data){
    const lines = data.split('\n')
    const tableHeader = document.getElementById('tableHeader')
    const tableBody = document.getElementById('tableBody')
    tableHeader.innerHTML = ''
    tableBody.innerHTML = ''
    const headers = lines[0].split(',')
    const addrIndex = headers.indexOf('address')
    const rows = lines.slice(1)
    headers.forEach(header => {
        
        const th = document.createElement('th')
        th.innerHTML = header
        console.log("adding header: ", header)
        tableHeader.appendChild(th)
        
    });
    rows.forEach(row => {
        const tr = document.createElement('tr')
        const cols = row.split(',')
        cols.forEach(col => {
            const td = document.createElement('td')
            td.innerHTML = col
            tr.appendChild(td)
        })
        tableBody.appendChild(tr)
    })
}
// call getCSV when the page loads
//document.addEventListener('DOMContentLoaded', getCSV());
document.addEventListener('DOMContentLoaded', initMap());
