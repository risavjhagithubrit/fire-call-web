function openTab(evt, tabTitle) {
  var i, tabcontent, tablinks;
  const callTab = document.getElementById('callTab');
  
  if (tabTitle != 'Call') {
     callTab.className = callTab.className.replace("is-active", "");
  }
  tabcontent = document.getElementsByName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
       tablinks[i].className = tablinks[i].className.replace(" is-active", "");
  }
  document.getElementById(tabTitle).style.display = "block";
  evt.currentTarget.parentElement.className += " is-active";
}

async function markMap(mapObjectFromFunction, incident) {
  // console.log(location, call)
  const marker = L.marker([incident.location.lat, incident.location.long]).addTo(mapObjectFromFunction);
  const latlng = L.latLng(incident.location.lat, incident.location.long);
  const editBtn = L.DomUtil.create('a', 'edit');
  editBtn.innerHTML = '<a href="#manageForm" onclick="populateForm(this)">Edit</a>';     
  const popup = L.popup()
                .setLatLng(latlng)
                .setContent('<b>Call ID: </b>' + incident.call.call_id + '<br>' + '<b>Call Type: </b>' + incident.call.call_type + 
                '<br>' + '<b>Call Class: </b>' + incident.call.call_class + '<br>' + '<b>Call Time: </b>' + incident.call.call_time
                + '<br>' + editBtn.innerHTML + '<p hidden class="inc-id">' + incident.incident_id + '</p>')
                .openOn(mapObjectFromFunction);

  marker.bindPopup(popup).openPopup();
}

async function mapInit() {
    // follow the Leaflet Getting Started tutorial here
  document.getElementById('mapid').style.height = `${400}px`;
  const map = L.map('mapid').setView([38.88101, -77.10428], 13);
  
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicG9vbDAxMSIsImEiOiJja20zdmVjZHAwYzl2MnBsY2R3MWdoemEyIn0.cdvnKCusaIY45GptcuQcPQ'
  }).addTo(map);

  const mapInitRequest = await fetch('/api/mapInit');
  const mapInitJSON = await mapInitRequest.json();
  const mapInitData = mapInitJSON.data;

  mapInitData.forEach(async (point) => { await markMap(map, point); });

  return map;
}
  
async function dataHandler(mapObjectFromFunction) {
  const form = document.querySelector('.userform');
  const search = document.getElementById('search_value');
  const startDate = document.getElementById('start');
  const endDate = document.getElementById('end');
  const limit = document.getElementById('limit');
   
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const requestSearch = await fetch('/api/search?queryText=' + search.value + '&startDate=' + 
                              startDate.value + '&endDate=' + endDate.value + '&limit=' + limit.value);
    
    const searchToJSON = await requestSearch.json();
    const searchData = searchToJSON.data;
    try { 
      // Remove current markers here
      mapObjectFromFunction.eachLayer(function (layer) {
        if (layer.options.tileSize != 512) {
            mapObjectFromFunction.removeLayer(layer);
        }
      });
      searchData.reduce(async (acc, incident) => {
        await markMap(mapObjectFromFunction, incident);
      });
    } catch (err) {
      alert('No results found!');
    }
  });
}

async function populateForm(button) {
  const elem = button.parentElement;
  const idForEdit = elem.getElementsByClassName('inc-id')[0].innerHTML;
  console.log(idForEdit);
  const request = await fetch('/api/incidents/' + idForEdit);
  const requestToJSON = await request.json();
  const callToEdit = requestToJSON.data;
  const requestCall = await fetch('/api/calls/' + callToEdit[0].call_id);
  const requestCallToJSON = await requestCall.json();
  const call = requestCallToJSON.data;
  const manageID = document.getElementById('manageID');
  const manageType = document.getElementById('manageType');
  const manageClass = document.getElementById('manageClass');
  const manageTime = document.getElementById('manageTime');

  manageID.innerHTML = 'ID: ' + call[0].call_id;
  manageType.value = call[0].call_type;
  manageClass.value = call[0].call_class;
  manageTime.value = call[0].call_time;
}




async function sendUpdate(tableName, formData, id) {
  let reqBody = {};
  formData.forEach((column) => {
    reqBody[column.name] = column.value;
  });
  const request = await fetch('/api/'+tableName+id, {body: reqBody, mode: 'PUT'})
  const response = request.json();
  
  response = {message: 'Successfully updated a new tab.'}
  const messageBox = document.createElement('div');
  messageBox.classList.add('tag');
  response
  try {
    const message = response['message'];
    messageBox.classList.add('is-success');
    messageBox.innerHTML = `${message}<button id="success-tag" class="delete is-small"></button>`
  } catch (err) {
    const error = response['error'];
  }
  const tabContent = document.getElementById('Call');
  tabContent.append(messageBox);
  const deleteButton = document.getElementById("success-tag");
  deleteButton.onclick = (evt) => messageBox.remove();
}

async function windowActions() {
  const map = await mapInit();
  await dataHandler(map);
  sendUpdate('yadayada','yadayada', 'Integer');
}

window.onload = windowActions;
