import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const socket = new WebSocket('ws://localhost:5000');

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchChatHistory();
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
  }, [token]);

  const fetchChatHistory = async () => {
    const { data } = await axios.get('http://localhost:5000/history', {
      headers: { Authorization: token },
    });
    setMessages(data);
  };

  const sendMessage = () => {
    if (input.trim()) {
      const message = { sender: username, content: input };
      socket.send(JSON.stringify(message));
      setInput('');
    }
  };

  const login = async () => {
    const { data } = await axios.post('http://localhost:5000/login', { username, password: 'your_password' });
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div>
      {token ? (
        <div>
          <div className="chat-window">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <strong>{msg.sender}</strong>: {msg.content}
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      )}
    </div>
  );
};

export default App;
