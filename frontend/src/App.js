import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Layout from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Essais from './pages/Essais';
import Devis from './pages/Devis';
import Commandes from './pages/Commandes';
import Rapports from './pages/Rapports';
import Equipements from './pages/Equipements';
import Audits from './pages/Audits';
import NonConformites from './pages/NonConformites';
import Personnel from './pages/Personnel';
import Processus from './pages/Processus';
import Parametres from './pages/Parametres';
import Projets from './pages/Projets';
import CatalogueEssais from './pages/CatalogueEssais';
import ResultatsEssais from './pages/ResultatsEssais';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isClientValidation = location.pathname === '/devis' && new URLSearchParams(location.search).has('validation');

  if (loading) return <div className="loadingScreen">Chargement SMARTLAB...</div>;
  if (!user && !isClientValidation) return <Navigate to="/login" replace />;
  return <Layout publicMode={isClientValidation} />;
}

function App() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handler = (event) => setWaitingWorker(event.detail);
    window.addEventListener('smartlab:update-ready', handler);
    return () => window.removeEventListener('smartlab:update-ready', handler);
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/essais" element={<Essais />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/equipements" element={<Equipements />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/non-conformites" element={<NonConformites />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/processus" element={<Processus />} />
          <Route path="/catalogue-essais" element={<CatalogueEssais />} />
          <Route path="/resultats-essais" element={<ResultatsEssais />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {waitingWorker && (
        <div className="updateBanner">
          <span>Nouvelle version SMARTLAB disponible.</span>
          <button type="button" onClick={applyUpdate}>Mettre a jour</button>
        </div>
      )}
      <Toaster position="top-right" toastOptions={{ duration: 2200 }} />
    </>
  );
}

export default App;
