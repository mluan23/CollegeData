//import '../node_modules/leaflet-boundary-canvas'
//const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
// retrieves the CSV
async function getCSVData(){
    try {
        var response = await fetch('../data/college.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        var data = await response.text(); // entire CSV as a single string
        console.log('Got CSV')
       // displayData(data);
    } catch (error) {
        console.error('Failed to fetch CSV file:', error);
    }
    // since papa parses async
    return new Promise((resolve, reject) => {
        Papa.parse(data, {
            header: true,
            complete: function(results) {
                // for some reason, the last data entry is just an empty name
                var r = results.data.slice(0,results.data.length-1)
                console.log("Parsed Data:", r);
                resolve(r)
            },
            error: function(error){
                reject(error)
            }
        });
    });
}

async function initMap(){
// Initialize the map centered on a specific location
var map = L.map('map', {
    center: [39.8283, -98.5795], // US center
    zoom: 4,
    zoomSnap: 0 // don't snap zoom value
})
// hide everything that is not the US
$.getJSON('https://cdn.rawgit.com/johan/world.geo.json/34c96bba/countries/USA.geo.json').then(function(geoJSON) {
  var osm = new L.TileLayer.BoundaryCanvas("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    boundary: geoJSON,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, US shape <a href="https://github.com/johan/world.geo.json">johan/world.geo.json</a>'
  });
  map.addLayer(osm);
  var usLayer = L.geoJSON(geoJSON);
  map.fitBounds(usLayer.getBounds());
});
return map
//const dataPromise = await getCSV();
//addAddressToMap(dataPromise, map)

// Add a tile layer to the map
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

// var locations = [
//     [40.7128, -74.0060], // NY
//     [34.0522, -118.2437] // LA
// ]
// locations.forEach(location => {
//     L.marker(location).addTo(map)
// })

// var bounds = new L.latLngBounds(locations)
// map.fitBounds(bounds)

// Add a marker at the location
// const marker = L.marker([40.7128, -74.0060]).addTo(map)
//     .bindPopup('<a href="https://www.openstreetmap.org/search?query=40.7128,-74.0060" target="_blank">View Address</a>')
//     .openPopup();
}

// function loadState(state){
//     const url = `https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/${state}.geojson`;
//     $.getJSON(url, function(data))
// }

// Function to load state GeoJSON data
function loadStateGeoJSON(state, map) {
    const url = `https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/${state}.geojson`;
    $.getJSON(url, function(data) {
        L.geoJSON(data, {
            style: geoLineStyle(data, 101),
            onEachFeature: eachFeatureStyle
        }).addTo(map);
    });
}

function geoLineStyle(feature, color){
    return {
        fillColor: getColor(color),
        weight: 1,
        opacity: 1,
        color: 'blue',
        fillOpacity: 0.7
    };
}

function eachFeatureStyle(feature, layer){
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Function to highlight feature on mouseover
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 1,
        color: 'red',
        dashArray: '',
        fillOpacity: 0.7
    });

    // if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    //     layer.bringToFront();
    // }
}

// Function to reset highlight on mouseout
function resetHighlight(e) {
    var layer = e.target
    layer.setStyle({
        fillColor: 'white',
        weight: 1,
        opacity: 1,
        color: 'blue',
        fillOpacity: 0.7
    })
}

// Function to zoom to feature on click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}




function plotOnMap(map){
    
}

// function parseData(data){
//     Papa.parse(data, {
//         header: true,
//         complete: function(results) {
//             // for some reason, the last data entry is just an empty name
//             var r = results.data.slice(0,results.data.length-1)
//             console.log("Parsed Data:", r);
//             return r
//         }
//     });
// }

function addCoordToMap(data, map, colName){
    console.log(data)
    data.forEach(row => {
        const coords = JSON.parse(row.coordinates.split(',')).map(parseFloat);
        const location = [coords[0], coords[1]];
        //const name = JSON.parse(row.name)
        //console.log(name)
        // Ensure the coordinates are valid numbers
        if (!isNaN(location[0]) && !isNaN(location[1])) {
            console.log(location[0] + ', ' + location[1]);
            // L.marker(location).addTo(map);
        } else {
            console.error('Invalid coordinates:', coords);
        }
    });
}


function addAddressToMap(data, map){
    var lines = data.split('\n')
    var headers = lines[0].split(',')
    var coordIndex = headers.indexOf('coordinates')
    if(coordIndex == -1){
        coordIndex = headers.indexOf('coordinates\r')
    }
    for(var i = 1; i < lines.length; i++){
        var l = lines[i].split(',')
        var coord = l[coordIndex]
        //console.log(headers)
        console.log(lines[i])
        //location = [l[0], l[1]]
        L.marker(location).addTo(map)
    }
    
}


// displays CSV data; should we use plotting here?
function displayData(data){
    var lines = data.split('\n')
    var tableHeader = document.getElementById('tableHeader')
    var tableBody = document.getElementById('tableBody')
    tableHeader.innerHTML = ''
    tableBody.innerHTML = ''
    var headers = lines[0].split(',')
    var addrIndex = headers.indexOf('address')
    var rows = lines.slice(1)
    headers.forEach(header => {
        
        var th = document.createElement('th')
        th.innerHTML = header
        console.log("adding header: ", header)
        tableHeader.appendChild(th)
        
    });
    rows.forEach(row => {
        var addrCount = 0
        var tr = document.createElement('tr')
        var cols = row.split(',')
        cols.forEach(col => {
            if(addrCount == addrIndex){
                
            }
            addrCount += 1
            var td = document.createElement('td')
            td.innerHTML = col
            tr.appendChild(td)
        })
        tableBody.appendChild(tr)
    })
}

function getColor(count){
    return count > 100 ? 'red':
           count > 50 ? 'orange':
           count > 25 ? 'yellow':
           count > 10 ? 'blue':
           count > 0 ? 'black':
           'white';
}

function run(){
    const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
    try{
        getCSVData().then(data => {
            initMap().then(map => {
                addCoordToMap(data, map, 'coordinates')
            //    loadStateGeoJSON(states[0], map)
            //    loadStateGeoJSON('new york', map)
                states.forEach(state => {
                    loadStateGeoJSON(state, map)
                })

            })
        })
    } catch(error){
        console.log(error)
    }
}
// call getCSV when the page loads
document.addEventListener('DOMContentLoaded', run());
//document.addEventListener('DOMContentLoaded', getCSV());

