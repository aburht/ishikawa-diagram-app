// filepath: c:\Users\work\project\kla\ishikawa-app\apps\frontend\src\app\app.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import DiagramList from './components/DiagramList';
import CreateDiagram from './components/CreateDiagram';
import SvgFishbonePage from "./components/SvgFishbonePage";
import InteractiveSvgFishbonePage from "./components/InteractiveSvgFishbonePage";

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<DiagramList />} />
        <Route path="/new" element={<CreateDiagram />} />
        <Route path="/edit/:id" element={<InteractiveSvgFishbonePage />} />
        <Route path="/svg/:id" element={<SvgFishbonePage />} />
        <Route path="/interactive/:id" element={<InteractiveSvgFishbonePage />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;