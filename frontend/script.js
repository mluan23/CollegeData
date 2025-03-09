var states = []
var map
var stateLayers = []
var allMajors = []
var data
var geoJSONMappings
var spatialIndex
var numCollegesByState

var FIRST = '#006400'
var SECOND = '#bef16e'
var THIRD = 'yellow'
var FOURTH = 'orange'
var FIFTH = 'red'
var UNLISTED = 'black'
//var colors = ['#006400','#bef16e','yellow','orange','red','black']
var colors = ['red','orange','yellow','#bef16e','#006400']

var colorScale

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

function makeEmptyMapping(map){
    for(const[abr, state] of abbreviationToState){
        map.set(state,0)
    }
    return map
}

//var states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
// retrieves the CSV data, and parses it
async function getCSVData(){
    try {
        var response = await fetch('../data/college.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        data = await response.text(); // entire CSV as a single string
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
    var mapping = makeEmptyMapping(new Map())
    var lBound = document.getElementById('lBound').value - 1
    var uBound = document.getElementById('uBound').value - 1
    var category = document.getElementById('category')
    var numColleges = makeEmptyMapping(new Map())
    var time = Date.now()
    numColleges = getNumCollegesPerState(numColleges, data, lBound, uBound)
    console.log(time - Date.now())
    numCollegesByState = numColleges
    var subOptions = {
        "<$30k": () => getCostByIncome(mapping, "<$30k", data, lBound, uBound),
        "$30-48k": () => getCostByIncome(mapping, "$30-48k", data, lBound, uBound),
        "$49-75k": () => getCostByIncome(mapping, "$49-75k", data, lBound, uBound),
        "$76-110k": () => getCostByIncome(mapping, "$76-110k", data, lBound, uBound),
        "$110k+": () => getCostByIncome(mapping, "$110k+", data, lBound, uBound),
        "In-State": () => getTuitions(mapping, data, lBound, uBound, 'in'),
        "Out-State": () => getTuitions(mapping, data, lBound, uBound, 'out'),
        "Full-Time": () => getUnderGrads(mapping, data, lBound, uBound, 'full'),
        "Part-Time": () => getUnderGrads(mapping, data, lBound, uBound, 'part')
    };
    var selectedOption = document.getElementById('multiSelect').value;
    if(subOptions[selectedOption]){
        mapping = subOptions[selectedOption]()
        removeStateLayers()
        colorMap(geoJSONMappings, mapping, getColorScale(getColorRanges(mapping)))
        deleteLegend()
        createLegend(mapping)
        return
    }
    
    switch (category.value){
        case "Nums":
            mapping = numCollegesByState
            break
        case "Median":
            mapping = getEarnings(mapping, data, lBound, uBound)
            mapping = getAverage(mapping, numCollegesByState)
            break
        case "Graduation":
            mapping = getPercentages(mapping, data, lBound, uBound, 'graduation rate', numCollegesByState)
            break
        case "Employed":
            mapping = getPercentages(mapping, data, lBound, uBound, 'employed 2 years post graduation', numCollegesByState)
            break
        case "Acceptance":
            mapping = getPercentages(mapping, data, lBound, uBound, 'acceptance rate', numCollegesByState)
            break
        case "Pell":
            mapping = getPercentages(mapping, data, lBound, uBound, 'pell-grant recipients', numCollegesByState)
            break
        case "Athletes":
            mapping = getPercentages(mapping, data, lBound, uBound, 'varsity athletes', numCollegesByState)
            break
        case "Net":
            mapping = getNetCost(mapping, data, lBound, uBound)
            mapping = getAverage(mapping, numCollegesByState)
            //mapping = getAverage(mapping, numCollegesByState)
            var options = ["<$30k", "$30-48k", "$49-75k", "$76-110k", "$110k+"]
            addOptions(options)
            //var selectedOption = document.getElementById('multiSelect').value;
            // if (netOptions[selectedOption]) {
            //     console.log('ok')
            //     mapping = netOptions[selectedOption](mapping, data, lBound, uBound, selectedOption);
            // }
            break
            // then we will add the option
        case "Tuition":
            mapping = getTuitions(mapping, data, lBound, uBound, 'total')
            var options = ["In-State", "Out-State"]
            addOptions(options)
            break
        case "Undergrads":
            mapping = getUnderGrads(mapping, data, lBound, uBound, 'total')
            var options = ["Full-Time", "Part-Time"]
            addOptions(options)
            break
    }
    removeStateLayers()
    colorMap(geoJSONMappings, mapping, getColorScale(getColorRanges(mapping)))
    deleteLegend()
    createLegend(mapping)
    //console.log(category.value)
}




function addOptions(options){
    var multiSelect = document.getElementById("multiSelect")
    multiSelect.innerHTML = ''
    multiSelect.appendChild(document.createElement("option"))
    options.forEach(option => {
        var o = document.createElement("option")
        o.value = option
        o.textContent = option
        multiSelect.appendChild(o)
    })
    multiSelect.style.display = 'inline'
}

function clearMultiSelect(){
    s = document.getElementById("multiSelect")
    s.style.display = 'none'
}

async function getTerritoryNames(){
    var response = await fetch('../data/territories_geo_json/State_Names.txt')
    var data = await response.text()
    states = data.split('\r\n')
    //console.log(states)
    // console.log(statess)
}

function initMap(){
// Initialize the map centered on a specific location
    map = L.map('map', {
        center: [39.8283, -98.5795], // US center
        zoom: 4,
        zoomSnap: 0, // don't snap zoom value
        maxZoom: 7
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
    var file = encodeURI(`../data/territories_geo_json/${state}.geojson`);
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

function geoLineStyle(feature, color, colorScale){
    return {
        fillColor: getColor(color, colorScale),
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
        click: zoomAndDisplay
    });
}

// Function to highlight feature on mouseover
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 1.5,
        color: layer.options.fillColor,
        dashArray: '',
        fillOpacity: 1
    });
    layer.bringToFront()
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
function zoomAndDisplay(e) {
    map.fitBounds(e.target.getBounds());
}


function checkPointInState(coords, stateGeoJSON){
    // since we need to reverse lat and long
    var x = coords[1]
    var y = coords[0]
    var coord = [x,y]
    var point = turf.point(coord)
    var stateGeo = 0
    try{
        stateGeo = turf.polygon(stateGeoJSON.geometry.coordinates)
    } catch(error){
        stateGeo = turf.multiPolygon(stateGeoJSON.geometry.coordinates)
    }

    return turf.booleanPointInPolygon(point, stateGeo)
}

function getStateFromLocation(location){
    const loc = location.split(', ')
    return abbreviationToState.get(loc[1])
}

// function getStateFromPoint(coord, geoJSONMappings){


//     // for each state, in their geoJSON representations
//     for(const [state, geoJSON] of geoJSONMappings.entries()){
//         if(checkPointInState(coord, geoJSON)){
//             console.log(geoJSON.hasOwnProperty('bbox'))
//             return state
//         }
//     }

//     // not sure why these two are not being registered, so just hard code
//     // University of Georgia
//     if(coord[0] == 25.660879 && coord[1] == 73.7751291)
//         return 'Georgia'
//     // Loyola University
//     if(coord[0] == 41.9987458 && coord[1] == -87.6555909){
//         return 'Illinois'
//     }
//     console.log(coord)
//     return 'not in a state'
// }


function getStateFromPoint(coord, geoJSONMappings) {
    // coord[1] is long, coord[0] is lat
    const results = spatialIndex.search({
        minX: coord[1],
        minY: coord[0],
        maxX: coord[1],
        maxY: coord[0]
    });
    for (const result of results) {
        if (checkPointInState(coord, result.geoJSON)) {
            return result.state;
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

    console.log("not in state", coord);
    
    return 'not in a state';
}

function createSpatialIndex(geoJSONMappings) {
    const index = new RBush();
    // geoJSONMappings.forEach((geoJSON, state) => {
    for(const [state, geoJSON] of geoJSONMappings.entries()){
        geoJSON.features.forEach((feature) => {
            addBoundingBoxToFeature(feature)
            const [minX, minY, maxX, maxY] = feature.bbox; // need to add bounding box if feature doesn't have it
            index.insert({
                minX,
                minY,
                maxX,
                maxY,
                state,
                geoJSON: feature
            });
        });
    };
    spatialIndex = index
}

function computeBoundingBox(coordinates) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    //console.log('Coordinates:', coordinates);

    coordinates.forEach(polygon => {
        // Check if polygon[0] is an array of coordinates
        if (Array.isArray(polygon[0][0])) {
            // Handle deeper nested structure (e.g., MultiPolygon)
            polygon.forEach(linearRing => {
                linearRing.forEach(coord => {
                   // console.log('Coord:', coord);
                    if (coord[0] < minX) minX = coord[0];
                    if (coord[1] < minY) minY = coord[1];
                    if (coord[0] > maxX) maxX = coord[0];
                    if (coord[1] > maxY) maxY = coord[1];
                });
            });
        } else {
            // Handle simpler structure (e.g., Polygon)
            polygon.forEach(coord => {
               // console.log('Coord:', coord);
                if (coord[0] < minX) minX = coord[0];
                if (coord[1] < minY) minY = coord[1];
                if (coord[0] > maxX) maxX = coord[0];
                if (coord[1] > maxY) maxY = coord[1];
            });
        }
    });
    return [minX, minY, maxX, maxY];
}


function addBoundingBoxToFeature(feature) {
    if (!feature.hasOwnProperty('bbox')) {
        feature.bbox = computeBoundingBox(feature.geometry.coordinates);
        //console.log(feature.bbox)
    }
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

// color territory based on the geoJSON data
function colorTerritory(stateGeoJSON, count, colorScale){
    stateLayers.push(L.geoJSON(stateGeoJSON, {
        style: geoLineStyle(stateGeoJSON, count, colorScale),
        onEachFeature: eachFeatureStyle
    }).addTo(map))
}

// so we need to figure out the color scale we using
function colorMap(geoJSONMappings, mapping, colorScale){
   // console.log(mapping)
    for(const [state, stateGeoJSON] of geoJSONMappings.entries()){
        colorTerritory(stateGeoJSON, mapping.get(state), colorScale)
    }
}

function createLegend(mapping){
    var bins = getColorRanges(mapping)
    var legend = L.control({ position: "topright" })
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "legend");
        //console.log(bins)
        div.innerHTML += "<h4>Legend</h4>";
        
        div.innerHTML += `<i class="square" style="background: ${colors[4]}"></i><span> ${bins[4]}+</span><br>`;
        div.innerHTML += `<i class="square" style="background: ${colors[3]}"></i><span> ${bins[3]} - ${bins[4]}</span><br>`;
        div.innerHTML += `<i class="square" style="background: ${colors[2]}"></i><span> ${bins[1]} - ${bins[2]}</span><br>`;
        div.innerHTML += `<i class="square" style="background: ${colors[1]}"></i><span> ${bins[0]} - ${bins[1]}</span><br>`;
        div.innerHTML += `<i class="square" style="background: ${colors[0]}"></i><span> <${bins[0]}</span><br>`;
        div.innerHTML += `<i class="square" style="background: ${UNLISTED}"></i><span> No data provided </span><br>`;

        return div;
    }
    legend.addTo(map)
}

// delete the current legend so a new one can be made
function deleteLegend(){
    var legend = document.querySelector('.legend');
    if (legend) {
        legend.parentNode.removeChild(legend);
    }
}

function getColorRanges(mapping) {
    //console.log(ss)
    var values = Array.from(mapping.values()).filter(value => !isNaN(value)).filter(value => value > 0);
    //console.log(mapping)
    //console.log(values)
    // console.log(mapping)

    //console.log(bins)
    // uses the jenks natural break algorithm to determine the breaks
    var bins = ss.ckmeans(values, Math.min(values.length, 5));
    for(var i = 0; i < bins.length; i++){
        if(i == bins.length - 1){
            bins[i] = bins[i][0].toFixed(0)
        }
        else{
            bins[i] = (bins[i+1][0]-1).toFixed(0)
        }
    }
    return bins
}

function getColorScale(bins){
    colorScale = d3.scaleThreshold()
        .domain(bins)
        .range(colors)
    return colorScale
}

function getColor(val, colorScale){
    if(isNaN(val) || val <= 0){
        return UNLISTED
    }
    return colorScale(val)
}



function drawMap(data) {
    var width = 800;
    var height = 600;

    var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Replace this with your own map drawing logic
    // Example: Draw circles for each state value
    Object.entries(data).forEach(([state, value]) => {
        svg.append("circle")
            .attr("cx", Math.random() * width)
            .attr("cy", Math.random() * height)
            .attr("r", value)
            .attr("fill", d3.interpolateBlues(value / 50));
    });
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


// function getColorByPercentages(count){
//     return count > 80 ? '#006400':
//            count > 60 ? '#bef16e':
//            count > 40 ? 'yellow':
//            count > 20 ? 'orange':
//            count >= 0 ? 'red':
//            'black';
// }
// function getDisplayCategory(){
//     category = document.getElementById('category')
//     if(category == 'Median')

// }

// count num colleges from lower to upper bound
function getNumCollegesPerState(numCollegesByState, data, lBound, uBound){
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

function getTuitions(mapping, data, lBound, uBound, category){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var instate = parseInt(row['in-state tuition'])
            var outstate = parseInt(row['out-state tuition'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
                console.log(s)
                return
            }
            switch(category){
                case 'in':
                    mapping.set(state, mapping.get(state) + instate)
                    break
                case 'out':
                    mapping.set(state, mapping.get(state) + outstate)
                    break
                default:
                    mapping.set(state, mapping.get(state) + (instate + outstate)/2)
            }
        }
    })
    //inState = getAverage(inState, numCollegesByState)
    //outState = getAverage(outState, numCollegesByState)
    //overall = getAverage(overall, numCollegesByState)
    return mapping
}

function getNetCost(netCosts, data, lBound, uBound){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var cost = parseInt(row['net cost'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
                console.log(s)
                return
            }
            netCosts.set(state, netCosts.get(state) + cost)
        }
    })
    //netCosts = getAverage(netCosts, numCollegesByState)
    return netCosts
}

function getCostByIncome(costByIncome, colName, data, lBound, uBound){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var cost = parseInt(row[`${colName}`])
            // -1 means it was unlisted
            if(cost == -1){ 
                return
            }
            var s = row['location']
            var state = getStateFromLocation(s)

            if(state == undefined){
               // console.log(s)
                return
            }
            costByIncome.set(state, costByIncome.get(state) + cost)
        }
    })
    //costByIncome = getAverage(costByIncome, numCollegesByState)
    return costByIncome
}

function getAid(aid, data, lBound, uBound){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var a = parseInt(row['aid'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
               // console.log(s)
                return
            }

            aid.set(state, aid.get(state) + a)
        }
    })
    //aid = getAverage(aid, numCollegesByState)
    return aid
}

function getEarnings(earningsByState, data, lBound, uBound){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var earnings = parseInt(row['median earnings'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
                //console.log(s)
                return
            }

            earningsByState.set(state, earningsByState.get(state) + earnings)
        }
    })
    //earningsByState = getAverage(earningsByState, numCollegesByState)
    return earningsByState
}

function getNumMajor(majorByState, majorName, data, lBound, uBound){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var majors = JSON.parse(row[majors])
            var majorsMap = new Map(Object.entries(majors));
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
                //console.log(s)
                return
            }
            count = majorsMap.get(majorName)
            if(count == undefined){
                return
            }

            majorByState.set(state, majorByState.get(state) + count)
        }
    })
    return majorByState
}

function getAllMajors(data){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var majors = JSON.parse(row[majors])
            var majorsMap = new Map(Object.entries(majors));
            for(const [major, count] of majorsMap.entries()){
                if (!allMajors.includes(major)){
                    allMajors.push(major)
                }
            }
        }
    })
}

function getPercentages(percentages, data, lBound, uBound, colName, numCollegesByState){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var percent = parseFloat(row[`${colName}`])
            //console.log(percent)
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
                //console.log(s)
                return
            }
            percentages.set(state, percentages.get(state) + percent)
        }
    })
    console.log(percentages)
    percentages = getAverage(percentages, numCollegesByState)
    return percentages
}

function handleNan(){

}

function getUnderGrads(mapping, data, lBound, uBound, category){
    data.forEach((row, index) => {
        if(index >= lBound && index <= uBound){
            var fulltime = parseInt(row['full-time undergraduates'])
            var partime = parseInt(row['part-time undergrads'])
            var s = row['location']
            var state = getStateFromLocation(s)
            if(state == undefined){
               // console.log(s)
                return
            }
            switch(category){
                case 'full':
                    mapping.set(state, mapping.get(state) + fulltime)
                    break
                case 'part':
                    mapping.set(state, mapping.get(state) + partime)
                    break
                default:
                    mapping.set(state, mapping.get(state) + fulltime + partime)
            }
        }
    })
    return mapping
}


function getAverage(stateData, numCollegesByState){
    //console.log(stateData)
   // console.log(numCollegesByState)
    for(const [state, x] of stateData.entries()){
        stateData.set(state, stateData.get(state) / numCollegesByState.get(state))
    }
    return stateData
}

// something we need to do is reverse the tuition on the legend

async function run(){
    await getTerritoryNames()
    geoJSONMappings = new Map()
    var promises = []

    //const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
    try{
        getCSVData().then(async datas => {
            data = datas
            //getCounts(data, map, 'coordinates')
            states.forEach(state => {
                const promise = loadStateGeoJSON(state).then(geoJSON => {
                    geoJSONMappings.set(state, geoJSON)
                })
                promises.push(promise)
            })
            await Promise.all(promises)
            map = initMap()
            createSpatialIndex(geoJSONMappings)
            var t = Date.now()
            numCollegesByState = getNumCollegesPerState(makeEmptyMapping(new Map()), data, 0, 1800)
            console.log(t - Date.now())
            colorMap(geoJSONMappings, numCollegesByState, getColorScale(getColorRanges(numCollegesByState)))
            createLegend(numCollegesByState)

        })
    } catch(error){
        console.log(error)
    }
}
// call getCSV when the page loads
document.addEventListener('DOMContentLoaded', run);
document.getElementById("lBound").addEventListener("change", getDisplayCategory)
document.getElementById("uBound").addEventListener("change", getDisplayCategory)
//document.getElementById("category").addEventListener("change", clearMultiSelect)


//document.getElementById("category").addEventListener("change", clearMultiSelect);//document.addEventListener('DOMContentLoaded', getTerritoryNames());

//document.addEventListener('DOMContentLoaded', getCSV());

