//import '../node_modules/leaflet-boundary-canvas'
// washington dc not a state but good enough
var states = []
//var states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
// retrieves the CSV
async function getCSVData(){
    try {
        var response = await fetch('../data/college.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        var data = await response.text(); // entire CSV as a single string
        //console.log('Got CSV')
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
                //console.log("Parsed Data:", r);
                //console.log(r)
                resolve(r)
            },
            error: function(error){
                reject(error)
            }
        });
    });
}

async function getTerritoryNames(){
    var response = await fetch('../data/territories_geo_json/State_Names.txt')
    var data = await response.text()
    states = data.split('\r\n')
    console.log(states)
    // console.log(statess)
}

function initMap(){
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
    var file = `../data/territories_geo_json/${state}.geojson`;
    // if(state == 'washington dc'){
    // const file = `https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/${state}.geojson`;
    // }
    return new Promise((resolve , reject) => {
        $.getJSON(file, function(data) {
            //console.log(data)
            //checkPointInState(data, [42.3591895, -71.0931647])
            // we need to reverse the latitude and longitude positions
            //checkPointInState(data, [-72.9279911, 41.3119])
            //checkPointInState([41.3119, -72.9279911], data)
            L.geoJSON(data, {
                style: geoLineStyle(data, 100),
                onEachFeature: eachFeatureStyle
            }).addTo(map);
            resolve(data)
        }).fail(function(){
            console.log('failure')
            reject(new Error(`fail to load geoJSON for ${state}`))
        })
    })

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

function checkPointInState(coords, stateGeoJSON){
    // since we need to reverse lat and long
    var x = coords[1]
    var y = coords[0]
    var coord = [x,y]
    //console.log(coord[0] + ", " + coord[1])
    var point = turf.point(coord)
    var stateGeo = 0
    //console.log(stateGeoJSON)
    //console.log(stateGeoJSON.features[0])
    try{
        stateGeo = turf.polygon(stateGeoJSON.features[0].geometry.coordinates)
    } catch(error){
        //console.log(error)
        stateGeo = turf.multiPolygon(stateGeoJSON.features[0].geometry.coordinates)
    }

    if(turf.booleanPointInPolygon(point, stateGeo)){
        //console.log(stateGeoJSON._id)
        return true
    }
   // console.log('non')
    return false
}




// function isPointInState(state, point) {
//     const pointFeature = turf.point(point); // Create a Turf.js point feature

//     // Check if the state's geometry type is MultiPolygon
//     if (state.geometry.type === 'MultiPolygon') {
//         for (const polygon of state.geometry.coordinates) {
//             const stateGeo = turf.multiPolygon([polygon]); // Create Turf.js MultiPolygon
//             if (turf.booleanPointInPolygon(pointFeature, stateGeo)) {
//                 console.log(state.properties.name)
//                 return state.properties.name; // Return the state name if the point is inside
//             }
//         }
//     } else if (state.geometry.type === 'Polygon') {
//         const stateGeo = turf.polygon(state.geometry.coordinates); // Create Turf.js Polygon
//         if (turf.booleanPointInPolygon(pointFeature, stateGeo)) {
//             console.log(state.properties.name)
//             return state.properties.name; // Return the state name if the point is inside
//         }
//     }
//     console.log('no')

//     return null; // Return null if the point is not in any part of the state
// }







function getStateFromPoint(coord, geoJSONMappings){
    // for each state, in their geoJSON representations
    for(const [state, geoJSON] of geoJSONMappings.entries()){
        if(checkPointInState(coord, geoJSON)){
            return state
        }
    }
    console.log(coord)
    return 'not in a state'
}

function getCounts(data, map, colName, state){ 
   // var count
    data.forEach(row => {
        // the coord is a string, with 
        const coords = JSON.parse(row['coordinates']); 
        const location = [coords[0], coords[1]];
        const name = row.rank
        //console.log(name)
        // Ensure the coordinates are valid numbers
        if (!isNaN(location[0]) && !isNaN(location[1])) {
            //console.log(location[0] + ', ' + location[1]);
            // L.marker(location).addTo(map);
        } else {
            console.error('Invalid coordinates:', coords);
        }
    });
   // return count
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

async function run(){
    await getTerritoryNames()
    var geoJSONMappings = new Map()
    var stateCounts = new Map()
    var promises = []
    //const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
    try{
        getCSVData().then(async data => {
            var map = initMap()
            //getCounts(data, map, 'coordinates')
            states.forEach(state => {
                const promise = loadStateGeoJSON(state, map).then(geoJSON => {
                    //if(state == 'washington')
                      //  console.log(checkPointInState([38.9076789, -77.0716024], geoJSON))
                    //const coords = JSON.parse(row['coordinates']);
                    //console.log(geoJSON)
                   // console.log(geoJSON)
                    geoJSONMappings.set(state, geoJSON)
                    //console.log(geoJSONMappings)
                    stateCounts.set(state,0)
                    //console.log(geoJSONMappings)
                    //[33.4218938, -111.9400681]         
                    //console.log(getStateFromPoint([-71.0931647, 42.3591895], geoJSONMappings))
                })
                promises.push(promise)
                //console.log(geoJSONMappings)
            })
            await Promise.all(promises)
            // states.forEach(state => {
            //      console.log(getStateFromPoint([38.9076789, -77.0716024], geoJSONMappings))
            // })

            // we need to wait for all promises to be resolved before we can attempt to get the stuff
            data.forEach(row => {
                const coords = JSON.parse(row['coordinates'])
                coords[0] = coords[0]
                coords[1] = coords[1]
                //console.log(geoJSONMappings)
                //console.log(states)
                var s = getStateFromPoint(coords, geoJSONMappings)
                stateCounts.set(s, stateCounts.get(s)+1)
            })
            console.log(stateCounts)
            var sum = 0
            states.forEach(state => {
                sum += stateCounts.get(state)
            })
            console.log(sum)
            //console.log(geoJSONMappings)
            //console.log(te)
            // initMap().then(map => {
            //     getCounts(data, map, 'coordinates')
            // //    loadStateGeoJSON(states[0], map)
            // //    loadStateGeoJSON('new york', map)
            //     states.forEach(state => {
            //         loadStateGeoJSON(state, map)
            //     })

            //})
           // console.log('test')
            //console.log(data)
        })
    } catch(error){
        console.log(error)
    }
}
// call getCSV when the page loads
document.addEventListener('DOMContentLoaded', run());
//document.addEventListener('DOMContentLoaded', getTerritoryNames());

//document.addEventListener('DOMContentLoaded', getCSV());

