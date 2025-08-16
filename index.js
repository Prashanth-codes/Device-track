const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('send-location', (data) => {
        io.emit('location-update', {
            id: socket.id,
            ...data
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        io.emit('user-disconnected', { id: socket.id });
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});