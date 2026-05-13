import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Essais from './pages/Essais';
import Devis from './pages/Devis';
import Commandes from './pages/Commandes';
import Echantillons from './pages/Echantillons';
import Rapports from './pages/Rapports';

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/essais" element={<Essais />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/echantillons" element={<Echantillons />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 2200 }} />
    </>
  );
}

export default App;
