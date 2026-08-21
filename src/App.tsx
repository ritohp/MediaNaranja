import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AnalyticsTracker from './components/AnalyticsTracker';
import Home from './pages/Home';
import CreateSong from './pages/CreateSong';
import MySongs from './pages/MySongs';
import MyMemories from './pages/MyMemories';
import MemoryGallery from './pages/MemoryGallery';
import MemoryCustomizer from './pages/MemoryCustomizer';
import AdminDashboard from './pages/AdminDashboard';
import SongPlayer from './pages/SongPlayer';

import FatherLanding from './pages/FatherLanding';

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <div className="min-h-screen relative overflow-hidden bg-[#FDF7F8]">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/crear-cancion" element={<CreateSong />} />
          <Route path="/regalo-papa" element={<FatherLanding />} />
          <Route path="/cancion-para-papa" element={<FatherLanding />} />
          <Route path="/mis-canciones" element={<MySongs />} />
          <Route path="/cancion/:id" element={<SongPlayer />} />

          <Route path="/mis-recuerdos" element={<MyMemories />} />
          <Route path="/galeria-recuerdos" element={<MemoryGallery />} />
          <Route path="/personalizar-cuadro" element={<MemoryCustomizer />} />
          <Route path="/personalizar-cuadro/:id" element={<MemoryCustomizer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
