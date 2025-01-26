var states = []
var map
var stateLayers = []

const abbreviationToState = new Map([
    ["AL", "Alabama"],
    ["AK", "Alaska"],
    ["AZ", "Arizona"],
    ["AR", "Arkansas"],
    ["CA", "California"],
    ["CO", "Colorado"],
    ["CT", "Connecticut"],
    ["DE", "Delaware"],
    ["DC", "District of Columbia"],
    ["FL", "Florida"],
    ["GA", "Georgia"],
    ["HI", "Hawaii"],
    ["ID", "Idaho"],
    ["IL", "Illinois"],
    ["IN", "Indiana"],
    ["IA", "Iowa"],
    ["KS", "Kansas"],
    ["KY", "Kentucky"],
    ["LA", "Louisiana"],
    ["ME", "Maine"],
    ["MD", "Maryland"],
    ["MA", "Massachusetts"],
    ["MI", "Michigan"],
    ["MN", "Minnesota"],
    ["MS", "Mississippi"],
    ["MO", "Missouri"],
    ["MT", "Montana"],
    ["NE", "Nebraska"],
    ["NV", "Nevada"],
    ["NH", "New Hampshire"],
    ["NJ", "New Jersey"],
    ["NM", "New Mexico"],
    ["NY", "New York"],
    ["NC", "North Carolina"],
    ["ND", "North Dakota"],
    ["OH", "Ohio"],
    ["OK", "Oklahoma"],
    ["OR", "Oregon"],
    ["PA", "Pennsylvania"],
    ["RI", "Rhode Island"],
    ["SC", "South Carolina"],
    ["SD", "South Dakota"],
    ["TN", "Tennessee"],
    ["TX", "Texas"],
    ["UT", "Utah"],
    ["VT", "Vermont"],
    ["VA", "Virginia"],
    ["WA", "Washington"],
    ["WV", "West Virginia"],
    ["WI", "Wisconsin"],
    ["WY", "Wyoming"],
    ["AS", "American Samoa"],
    ["MP", "Commonwealth of the Northern Mariana Islands"],
    ["GU", "Guam"],
    ["PR", "Puerto Rico"],
    ["VI", "United States Virgin Islands"]
]);

//var states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
// retrieves the CSV data, and parses it
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
                console.log(results.meta.fields)
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

function getDisplayCategory(){
    var category = document.getElementById('category')
    console.log(category.value)
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
function loadStateGeoJSON(state) {
    var file = `../data/territories_geo_json/${state}.geojson`;
    // if(state == 'washington dc'){
    // const file = `https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/${state}.geojson`;
    // }
    return new Promise((resolve , reject) => {
        $.getJSON(file, function(data) {
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
    var style = layer.options.fillColor
    layer.setStyle({
        fillColor: style,
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

function getStateFromLocation(location){
    const loc = location.split(', ')
    return abbreviationToState.get(loc[1])
}

function getStateFromPoint(coord, geoJSONMappings){


    // for each state, in their geoJSON representations
    for(const [state, geoJSON] of geoJSONMappings.entries()){
        if(checkPointInState(coord, geoJSON)){
            return state
        }
    }

    // not sure why these two are not being registered, so just hard code
    // University of Georgia
    if(coord[0] == 25.660879 && coord[1] == 73.7751291)
        return 'Georgia'
    // Loyola University
    if(coord[0] == 41.9987458 && coord[1] == -87.6555909){
        return 'Illinois'
    }
    console.log(coord)
    return 'not in a state'
}

// get the counts for a specific state
function getCounts(data, colName, state){ 
    var count
    data.forEach(row => {
        // the coord is a string, with 
        const coords = JSON.parse(row[`${colName}`]); 
        const location = [coords[0], coords[1]];
        //const name = row.rank
        //console.log(name)
        // Ensure the coordinates are valid numbers
        // if (!isNaN(location[0]) && !isNaN(location[1])) {
        //     //console.log(location[0] + ', ' + location[1]);
        //     // L.marker(location).addTo(map);
        // } else {
        //     console.error('Invalid coordinates:', coords);
        // }
    });
    return count
}


// function addAddressToMap(data, map){
//     var lines = data.split('\n')
//     var headers = lines[0].split(',')
//     var coordIndex = headers.indexOf('coordinates')
//     if(coordIndex == -1){
//         coordIndex = headers.indexOf('coordinates\r')
//     }
//     for(var i = 1; i < lines.length; i++){
//         var l = lines[i].split(',')
//         var coord = l[coordIndex]
//         //console.log(headers)
//         console.log(lines[i])
//         //location = [l[0], l[1]]
//         L.marker(location).addTo(map)
//     }
// }

function removeStateLayers(){
    stateLayers.forEach(layer => {
        map.removeLayer(layer)  
    })
    stateLayers = []
}

function colorTerritory(stateGeoJSON, count){
    stateLayers.push(L.geoJSON(stateGeoJSON, {
        style: geoLineStyle(stateGeoJSON, count),
        onEachFeature: eachFeatureStyle
    }).addTo(map))
}

function colorMap(geoJSONMappings, counts){
    //console.log('coloring')
    //console.log(geoJSONMappings)
    console.log(counts)
    for(const [state, stateGeoJSON] of geoJSONMappings.entries()){
        colorTerritory(stateGeoJSON, counts.get(state))
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
    return count > 100 ? '#006400':
           count > 50 ? '#bef16e':
           count > 25 ? 'yellow':
           count > 10 ? 'orange':
           count > 0 ? 'red':
           'black';
}

function getColorByPercentages(count){
    return count > 80 ? '#006400':
           count > 60 ? '#bef16e':
           count > 40 ? 'yellow':
           count > 20 ? 'orange':
           count >= 0 ? 'red':
           'black';
}

// count num colleges from lower to upper bound
function countNumCollegesPerState(numCollegesByState, data, lBound, uBound, geoJSONMappings){
    //lBound -= 1 // just so we can index by 1
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var coords = JSON.parse(row['coordinates'])
            var s = getStateFromPoint(coords, geoJSONMappings)
            numCollegesByState.set(s, numCollegesByState.get(s)+1)
        }
    })
    return numCollegesByState
}

function getEarnings(earningsByState, data, lBound, uBound, numCollegesByState){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var earnings = JSON.parse(row['median earnings'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined)
                console.log(s)
            earningsByState.set(state, earningsByState.get(state) + earnings)
        }
    })
    return earningsByState
}

function getPercentages(percentages, data, lBound, uBound, colName, numCollegesByState){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var percent = parseFloat(row[`${colName}`])
            //console.log(percent)
            var s = row['location']
            var state = getStateFromLocation(s)
            percentages.set(state, percentages.get(state) + percent)
        }
    })
    for(const [state, percent] of percentages.entries()){
        percentages.set(state, percentages.get(state) / numCollegesByState.get(state))
    }
    return percentages
}


async function run(){
    await getTerritoryNames()
    var geoJSONMappings = new Map()
    var numCollegesByState = new Map()
    var earningsByState = new Map()
    var percentagesByGrad = new Map()
    var percentagesByAccept = new Map()
    var percentagesByEmployed = new Map()
    var percentPell = new Map()
    var percentAthletes = new Map()
    var promises = []
    //const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
    try{
        getCSVData().then(async data => {
            map = initMap()
            //getCounts(data, map, 'coordinates')
            states.forEach(state => {
                const promise = loadStateGeoJSON(state).then(geoJSON => {
                    geoJSONMappings.set(state, geoJSON)
                    numCollegesByState.set(state,0)
                    earningsByState.set(state,0)
                    percentagesByGrad.set(state,0)
                    percentagesByAccept.set(state,0)
                    percentagesByEmployed.set(state,0)
                })
                promises.push(promise)
            })
            await Promise.all(promises)

            // we need to wait for all promises to be resolved before we can attempt to get the stuff
            numCollegesByState = countNumCollegesPerState(numCollegesByState, data, 0, 1800, geoJSONMappings)
            console.log(numCollegesByState)
            var sum = 0
            states.forEach(state => {
                //colorTerritory(geoJSONMappings.get(state), numCollegesByState.get(state))
                sum += numCollegesByState.get(state)
            })
            //colorMap(geoJSONMappings, numCollegesByState)
           // console.log(sum)
            earningsByState = getEarnings(earningsByState, data, 0, 1800, numCollegesByState)
            //console.log(earningsByState)
            percentagesByGrad = getPercentages(percentagesByGrad, data, 0, 1000, 'graduation rate', numCollegesByState)
            //console.log(percentages)
            //colorMap(geoJSONMappings, earningsByState)
            //colorMap(geoJSONMappings, percentagesByGrad)
           // percentagesByAccept = getPercentages(percentagesByAccept, data, 0, 1800, 'acceptance rate', numCollegesByState)
            colorMap(geoJSONMappings, percentagesByGrad)
            removeStateLayers()
            colorMap(geoJSONMappings, numCollegesByState)

        })
    } catch(error){
        console.log(error)
    }
}
// call getCSV when the page loads
document.addEventListener('DOMContentLoaded', run());
//document.addEventListener('DOMContentLoaded', getTerritoryNames());

//document.addEventListener('DOMContentLoaded', getCSV());

