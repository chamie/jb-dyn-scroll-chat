import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import { Chat } from './features/chat/Chat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="top-menu">
          <Link to="/chats/floodZone">FloodZone chat</Link>
          <Link to="/chats/anotherOne">…and another one</Link>
        </div>
        <Routes>
          <Route path="/" element={<>Select a chat from above ↑</>} />
          <Route path="/chats/:chatId" element={<Chat />}/>
        </Routes>
      </header>
    </div>
  );
}

export default App;
