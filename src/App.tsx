import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CreateSong from './pages/CreateSong';
import MySongs from './pages/MySongs';
import MyMemories from './pages/MyMemories';
import MemoryGallery from './pages/MemoryGallery';
import MemoryCustomizer from './pages/MemoryCustomizer';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden bg-[#FDF7F8]">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crear-cancion" element={<CreateSong />} />
          <Route path="/mis-canciones" element={<MySongs />} />
          <Route path="/mis-recuerdos" element={<MyMemories />} />
          <Route path="/galeria-recuerdos" element={<MemoryGallery />} />
          <Route path="/personalizar-cuadro" element={<MemoryCustomizer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
