var states = []
var map
var stateLayers = []
var allMajors = []
var data
var geoJSONMappings
var spatialIndex
var numCollegesByState
var majorData
var currentMarkers = []

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

function showMap() {
    document.getElementById('map').style.display = 'block';
    document.getElementById('chart').style.display = 'none';

    document.getElementById('view-map').disabled = true;
    document.getElementById('view-chart').disabled = false;
}

function showChart() {
    document.getElementById('map').style.display = 'none';
    document.getElementById('chart').style.display = 'block';

    document.getElementById('view-map').disabled = false;
    document.getElementById('view-chart').disabled = true;
}


// retrieves the CSV data, and parses it
async function getCSVData(filename){
    try {
        var response = await fetch(filename);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        data = await response.text(); // entire CSV as a single string
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
                resolve(r)
            },
            error: function(error){
                reject(error)
            }
        });
    });
}

function getDisplayCategory(){
    map.setZoom(3)
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = []
    var mapping = makeEmptyMapping(new Map())
    var lBound = document.getElementById('lBound').value - 1
    if(lBound < 1){
        document.getElementById('lBound').value = 1
    }
    var uBound = document.getElementById('uBound').value - 1
    if(uBound > 1800){
        document.getElementById('uBound').value = 1800
    }
    var category = document.getElementById('category')
    var numColleges = makeEmptyMapping(new Map())
    var time = Date.now()
    numColleges = getNumCollegesPerState(numColleges, data, lBound, uBound)
    console.log(time - Date.now())
    numCollegesByState = numColleges
    switch (category.value){
        case "rank":
            mapping = numCollegesByState
            break
        case "median earnings":
            mapping = getEarnings(mapping, data, lBound, uBound)
            mapping = getAverage(mapping, numCollegesByState)
            break
        case "graduation rate":
            mapping = getPercentages(mapping, data, lBound, uBound, 'graduation rate', numCollegesByState)
            break
        case "employed 2 years post graduation":
            mapping = getPercentages(mapping, data, lBound, uBound, 'employed 2 years post graduation', numCollegesByState)
            break
        case "acceptance rate":
            mapping = getPercentages(mapping, data, lBound, uBound, 'acceptance rate', numCollegesByState)
            break
        case "pell-grant recipients":
            mapping = getPercentages(mapping, data, lBound, uBound, 'pell-grant recipients', numCollegesByState)
            break
        case "varsity atheletes":
            mapping = getPercentages(mapping, data, lBound, uBound, 'varsity athletes', numCollegesByState)
            break
        case "net cost":
            mapping = getNetCost(mapping, data, lBound, uBound)
            mapping = getAverage(mapping, numCollegesByState)
            break
        case "tuition":
            mapping = getTuitions(mapping, data, lBound, uBound, 'total')
            mapping = getAverage(mapping, numCollegesByState)
            break
        case "undergrads":
            mapping = getUnderGrads(mapping, data, lBound, uBound, 'total')
            var options = ["Full-Time", "Part-Time"]
            addOptions(options)
            break
    }
    removeStateLayers()
    colorMap(geoJSONMappings, mapping, getColorScale(getColorRanges(mapping)))
    deleteLegend()
    createLegend(mapping)
    var states = Array.from(mapping.keys());
    var values = Array.from(mapping.values());
    createBarChart(states, values);
    //console.log(category.value)
}

function createBarChart(states, values) {
    colors = 
    console.log(values)
    var data = [{
        x: states, // States on X-axis
        y: values, // Data on Y-axis
        type: 'bar',
        marker: { color: 'blue' }
    }];

    var layout = {
        title: 'Category Data by State',
        xaxis: { title: 'States', tickangle: -45 },
        yaxis: { title: 'Value' }
    };

    Plotly.newPlot('chart', data, layout);
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
    var response = await fetch('data/State_Names.txt')
    var data = await response.text()
    states = data.split('\r\n')
}

function initMap(){
    map = L.map('map', {
        center: [39.8283, 98.5795], // approx US center
        zoom: 3,
        zoomSnap: 0, // don't snap zoom value
        minZoom: 3
    })
    //https://cdn.rawgit.com/johan/world.geo.json/34c96bba/countries/USA.geo.json
    //https://cdn.rawgit.com/mluan23/US-GeoJSON/main/US.geojson
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
}

// Function to load state GeoJSON data
function loadStateGeoJSON(state) {
    var file = encodeURI(`data/territories_geo_json/${state}.geojson`);
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


// color territory based on the geoJSON data
function colorTerritory(stateGeoJSON, colorScale){
    stateLayers.push(L.geoJSON(stateGeoJSON, {
        style: geoLineStyle(stateGeoJSON, colorScale),
        onEachFeature: eachFeatureStyle
    }).addTo(map))
}

// so we need to figure out the color scale we using
function colorMap(geoJSONMappings, mapping){
    for(const [state, stateGeoJSON] of geoJSONMappings.entries()){
        stateGeoJSON.features[0].count = mapping.get(state)
        stateGeoJSON.features[0].name = state
        colorTerritory(stateGeoJSON, colorScale)
    }
}

function getColorRanges(mapping) {
    //console.log(ss)
    var values = Array.from(mapping.values()).filter(value => !isNaN(value)).filter(value => value > 0);
 
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

function getColor(val){
    if(isNaN(val) || val <= 0){
        return UNLISTED
    }
    return colorScale(val)
}

function addMarkersToState(state){
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = []
    data.forEach(row => {
        var s = getStateFromLocation(row['location'])
        var coord = JSON.parse(row['coordinates'])
        //var count = parseInt(row[])
        var category = document.getElementById('category').value
        var count = parseInt(row[category])
        var name = row["name"]
        if(s == state){
            marker = L.marker(coord).addTo(map)
            marker.bindTooltip(name + "<br>" + count)
            marker.bindPopup(name + "<br>" + count).openPopup()

            currentMarkers.push(marker)
        }
    })


}

function geoLineStyle(feature){
    //console.log("hello")
    //console.log(feature)
    //console.log(feature.features[0].name)
    return {
        fillColor: getColor(feature.features[0].count),
        weight: 1,
        opacity: 1,
        color: 'blue',
        fillOpacity: 0.7
    };
}

function eachFeatureStyle(feature, layer){
    //console.log(feature)
    layer.on({
        mouseover: function(event){
            highlightFeature(event, feature.name, feature.count)
        },
        mouseout: resetHighlight,
        click: onClick,
    });
}

// Function to highlight feature on mouseover
function highlightFeature(e, name, count) {
    var layer = e.target;
    layer.setStyle({
        weight: 1.5,
        color: layer.options.fillColor,
        dashArray: '',
        fillOpacity: 1
    });
    layer.bindTooltip(name + ": " + count.toFixed(0)).openTooltip()
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
function onClick(e) {
    var layer = e.target
    console.log(layer)
    addMarkersToState(layer.feature.name)
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


function removeStateLayers(){
    stateLayers.forEach(layer => {
        map.removeLayer(layer)  
    })
    stateLayers = []
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


function transformCoordinates(geometry, scale, translateX, translateY) {
    return geometry.map(coord => [
        coord[0] * scale + translateX, // Scale and translate longitude
        coord[1] * scale + translateY  // Scale and translate latitude
    ]);
}

// something we need to do is reverse the tuition on the legend

async function run(){
    await getTerritoryNames()
    geoJSONMappings = new Map()
    var promises = []
    //const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
    try{
        getCSVData('data/college.csv').then(async datas => {
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
            getDisplayCategory()            
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

