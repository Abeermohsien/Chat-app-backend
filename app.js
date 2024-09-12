const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic user model
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String,
    profilePicture: String,
    bio: String,
}));

// Simple chat history schema
const Message = mongoose.model('Message', new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
}));

// JWT Authentication middleware
const auth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Unauthorized');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = decoded;
        next();
    });
};

// User signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User created');
});

// User login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
    res.json({ token });
});

// WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);
        const newMessage = new Message(parsedMessage);
        await newMessage.save();

        // Broadcast message to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(newMessage));
            }
        });
    });
});

// Fetch chat history
app.get('/history', auth, async (req, res) => {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
});

server.listen(5000, () => console.log('Server running on port 5000'));

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/profile', auth, upload.single('profilePicture'), async (req, res) => {
    const user = await User.findOne({ username: req.user.username });
    user.profilePicture = req.file.path;
    user.bio = req.body.bio || user.bio;
    await user.save();
    res.json({ message: 'Profile updated' });
});
