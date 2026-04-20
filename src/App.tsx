import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CreateSong from './pages/CreateSong';
import MySongs from './pages/MySongs';
import MemoryGallery from './pages/MemoryGallery';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden bg-[#FDF7F8]">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crear-cancion" element={<CreateSong />} />
          <Route path="/mis-canciones" element={<MySongs />} />
          <Route path="/galeria-recuerdos" element={<MemoryGallery />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
