import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import { Chat } from './features/chat/Chat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Routes>
          <Route path="/" element={<Link to="/chats/floodZone">Go to the chat</Link>} />
          <Route path="/chats/:chatId" element={<Chat />}/>
        </Routes>
      </header>
    </div>
  );
}

export default App;
