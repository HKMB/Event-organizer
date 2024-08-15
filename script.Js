// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Request permission for notifications
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.log('Notification permission denied.');
            }
        });
    } else {
        console.log('This browser does not support notifications.');
    }
}

// Function to show a notification
function showNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

// Call this function when the page loads to request permission
document.addEventListener('DOMContentLoaded', requestNotificationPermission);

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const event = {
        name: document.getElementById('eventName').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        notes: document.getElementById('eventNotes').value
    };

    const events = JSON.parse(localStorage.getItem('events')) || [];
    events.push(event);
    localStorage.setItem('events', JSON.stringify(events));

    displayEvents();
    this.reset();

    addMarker(event.location);  // Add a marker to the map for the event location

    // Show a notification for the new event
    showNotification('New Event Added', {
        body: `Event: ${event.name}\nDate: ${event.date} at ${event.time}`,
        icon: '' // Optional: Add an icon for the notification
    });
});

function displayEvents() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    displayFilteredEvents(events);
}

function displayFilteredEvents(events) {
    const eventsList = document.getElementById('eventsList');
    const fragment = document.createDocumentFragment();

    events.forEach((event, index) => {
        const eventItem = document.createElement('div');
        eventItem.classList.add('event-item');
        eventItem.innerHTML = `
            <p><strong>Event Name:</strong> ${event.name}</p>
            <p><strong>Date:</strong> ${event.date}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Notes:</strong> ${event.notes}</p>
            <div class="event-buttons">
                <button class="edit-btn" onclick="editEvent(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteEvent(${index})">Delete</button>
                <button class="share-btn" onclick="shareEvent(${index})">Share</button>
            </div>
        `;
        fragment.appendChild(eventItem);
    });

    eventsList.innerHTML = ''; // Clear existing content
    eventsList.appendChild(fragment); // Append new content in one go
    styleButtons(); // Style the buttons after they are added to the DOM
}

function styleButtons() {
    const buttons = document.querySelectorAll('.event-buttons button');
    buttons.forEach(button => {
        button.style.backgroundColor = '#f0f0f0';
        button.style.color = '#333';
        button.style.borderRadius = '5px';
        button.style.padding = '5px 10px';
        button.style.margin = '5px 2px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';
        button.style.border = '1px solid #ccc';
        button.style.display = 'inline-block';
        button.style.width = '80px';
    });

    // Add specific colors for each button
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.style.backgroundColor = '#4CAF50';  // Green
        button.style.color = 'white';
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.style.backgroundColor = '#f44336';  // Red
        button.style.color = 'white';
    });

    document.querySelectorAll('.share-btn').forEach(button => {
        button.style.backgroundColor = '#008CBA';  // Blue
        button.style.color = 'white';
    });
}

function addMarker(location) {
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=YOUR_API_KEY`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch location data');
            }
            return response.json();
        })
        .then(data => {
            if (data.results.length > 0) {
                const latlng = data.results[0].geometry;
                L.marker([latlng.lat, latlng.lng]).addTo(map)
                    .bindPopup(location)
                    .openPopup();
            } else {
                alert('Location not found.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load location data. Please try again.');
        });
}

function searchEvents() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const events = JSON.parse(localStorage.getItem('events')) || [];

    const filteredEvents = events.filter(event => {
        return event.name.toLowerCase().includes(searchQuery) ||
            event.date.includes(searchQuery) ||
            event.location.toLowerCase().includes(searchQuery) ||
            event.notes.toLowerCase().includes(searchQuery);
    });

    displayFilteredEvents(filteredEvents);
}

function editEvent(index) {
    const events = JSON.parse(localStorage.getItem('events'));
    const event = events[index];

    document.getElementById('eventName').value = event.name;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventNotes').value = event.notes;

    events.splice(index, 1);
    localStorage.setItem('events', JSON.stringify(events));
    displayEvents();
}

function deleteEvent(index) {
    const events = JSON.parse(localStorage.getItem('events'));
    events.splice(index, 1);
    localStorage.setItem('events', JSON.stringify(events));
    displayEvents();
}

function shareEvent(index) {
    const events = JSON.parse(localStorage.getItem('events'));
    const event = events[index];
    const url = window.location.href; // URL of your application
    const text = `Check out this event: ${event.name} on ${event.date} at ${event.location}.`;

    // Create share URLs for different platforms
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    const redditShareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(event.name)}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)} ${encodeURIComponent(url)}`;
    const instagramShareUrl = `https://www.instagram.com/?url=${encodeURIComponent(url)}`; // Note: Instagram sharing is limited to mobile apps

    // Open sharing options in new windows
    const shareWindow = window.open('', '_blank', 'width=600,height=400');
    shareWindow.document.write(`
        <html>
        <head>
            <title>Share this event</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                ul { list-style-type: none; padding: 0; }
                li { display: inline-block; margin: 10px; }
                a { text-decoration: none; color: inherit; }
                i { font-size: 24px; }
            </style>
        </head>
        <body>
            <h2>Share this event</h2>
            <ul>
                <li><a href="${facebookShareUrl}" target="_blank"><i class="fab fa-facebook"></i> Facebook</a></li>
                <li><a href="${twitterShareUrl}" target="_blank"><i class="fab fa-twitter"></i> Twitter</a></li>
                <li><a href="${redditShareUrl}" target="_blank"><i class="fab fa-reddit"></i> Reddit</a></li>
                <li><a href="${whatsappShareUrl}" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a></li>
                <li><a href="${instagramShareUrl}" target="_blank"><i class="fab fa-instagram"></i> Instagram</a></li>
            </ul>
        </body>
        </html>
    `);
}
