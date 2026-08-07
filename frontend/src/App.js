import React from 'react';
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
import Reclamations from './pages/Reclamations';
import Personnel from './pages/Personnel';
import Processus from './pages/Processus';
import DocumentsQualite from './pages/DocumentsQualite';
import Parametres from './pages/Parametres';
import Projets from './pages/Projets';
import CatalogueEssais from './pages/CatalogueEssais';
import ResultatsEssais from './pages/ResultatsEssais';
import AchatsApprovisionnement from './pages/AchatsApprovisionnement';
import SatisfactionClients from './pages/SatisfactionClients';
import { ActionsQualite, RisquesOpportunites, RevuesDirection, AssistantAuditISO } from './pages/IsoCore';
import { StocksConsommables, Contrats, FacturesAvancees, SignaturesElectroniques, PortailClient, PortailFournisseur, AnalyseDocumentaireIA, JournalActivites } from './pages/EmergingModules';
import { Gouvernance, DemandesPrestations, MissionsTerrain, PlanningProjets, CompetencesFormations, MetrologieAvancee, FinancesAvancees, ObjectifsQualite, MoteursSysteme } from './pages/ArchitectureModules';
import { canAccessPath, defaultRouteForRole } from './config/permissions';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isClientValidation = location.pathname === '/devis' && new URLSearchParams(location.search).has('validation');

  if (loading) return <div className="loadingScreen">Chargement TESTLAB...</div>;
  if (!user && !isClientValidation) return <Navigate to="/login" replace />;
  if (user && !isClientValidation && !canAccessPath(user.role, location.pathname)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }
  return <Layout publicMode={isClientValidation} />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/demandes-prestations" element={<DemandesPrestations />} />
          <Route path="/essais" element={<Essais />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/factures" element={<FacturesAvancees />} />
          <Route path="/finances-avancees" element={<FinancesAvancees />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/equipements" element={<Equipements />} />
          <Route path="/metrologie-avancee" element={<MetrologieAvancee />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/non-conformites" element={<NonConformites />} />
          <Route path="/reclamations" element={<Reclamations />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/competences-formations" element={<CompetencesFormations />} />
          <Route path="/processus" element={<Processus />} />
          <Route path="/documents-qualite" element={<DocumentsQualite />} />
          <Route path="/catalogue-essais" element={<CatalogueEssais />} />
          <Route path="/resultats-essais" element={<ResultatsEssais />} />
          <Route path="/achats-approvisionnement" element={<AchatsApprovisionnement />} />
          <Route path="/fournisseurs" element={<AchatsApprovisionnement />} />
          <Route path="/stocks-consommables" element={<StocksConsommables />} />
          <Route path="/contrats" element={<Contrats />} />
          <Route path="/signatures-electroniques" element={<SignaturesElectroniques />} />
          <Route path="/portail-client" element={<PortailClient />} />
          <Route path="/portail-fournisseur" element={<PortailFournisseur />} />
          <Route path="/analyse-documentaire-ia" element={<AnalyseDocumentaireIA />} />
          <Route path="/satisfaction-clients" element={<SatisfactionClients />} />
          <Route path="/actions-qualite" element={<ActionsQualite />} />
          <Route path="/objectifs-qualite" element={<ObjectifsQualite />} />
          <Route path="/risques-opportunites" element={<RisquesOpportunites />} />
          <Route path="/revues-direction" element={<RevuesDirection />} />
          <Route path="/assistant-audit-iso" element={<AssistantAuditISO />} />
          <Route path="/indicateurs-qualite" element={<Dashboard />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/planning-projets" element={<PlanningProjets />} />
          <Route path="/missions-terrain" element={<MissionsTerrain />} />
          <Route path="/gouvernance" element={<Gouvernance />} />
          <Route path="/moteurs-systeme" element={<MoteursSysteme />} />
          <Route path="/journal-activites" element={<JournalActivites />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 2200 }} />
    </>
  );
}

export default App;


