const socket = io();

const map = L.map('map').setView([0, 0], 2);
const markers = new Map();
const statusDiv = document.getElementById('status');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function trackLocation() {
    if (!navigator.geolocation) {
        showStatus('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            socket.emit('send-location', { latitude, longitude });
            
            updateMarker(socket.id, latitude, longitude, 'Your Location (Blue)', true);
            
            if (!markers.has('initialized')) {
                map.setView([latitude, longitude], 13);
                markers.set('initialized', true);
            }
        },
        (error) => {
            showStatus(`Location error: ${error.message}`);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}

function updateMarker(id, lat, lng, label, isself = false) {
    if (markers.has(id)) {
        markers.get(id).setLatLng([lat, lng]);
    } else {
        const markerOptions = {
            icon: L.divIcon({
                className: isself ? 'my-location' : 'other-location',
                html: `<div style="background-color: ${isself ? '#0000ff' : '#ff0000'}; width: 10px; height: 10px; border-radius: 50%;"></div>`
            })
        };
        
        const marker = L.marker([lat, lng], markerOptions)
            .bindPopup(label)
            .addTo(map);
        markers.set(id, marker);
    }
}

function showStatus(message) {
    statusDiv.style.display = 'block';
    statusDiv.textContent = message;
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

socket.on('connect', () => {
    console.log('Connected to server');
    trackLocation();
});

socket.on('location-update', (data) => {
    if (data.id !== socket.id) {
        updateMarker(data.id, data.latitude, data.longitude, `Device ${data.id.substr(0, 6)}`);
    }
});

socket.on('user-disconnected', (data) => {
    if (markers.has(data.id)) {
        map.removeLayer(markers.get(data.id));
        markers.delete(data.id);
    }
});