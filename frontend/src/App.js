import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Layout from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { canAccessPath, defaultRouteForRole } from './config/permissions';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Essais = lazy(() => import('./pages/Essais'));
const Devis = lazy(() => import('./pages/Devis'));
const Commandes = lazy(() => import('./pages/Commandes'));
const Rapports = lazy(() => import('./pages/Rapports'));
const Equipements = lazy(() => import('./pages/Equipements'));
const Audits = lazy(() => import('./pages/Audits'));
const NonConformites = lazy(() => import('./pages/NonConformites'));
const Reclamations = lazy(() => import('./pages/Reclamations'));
const Personnel = lazy(() => import('./pages/Personnel'));
const Processus = lazy(() => import('./pages/Processus'));
const DocumentsQualite = lazy(() => import('./pages/DocumentsQualite'));
const Parametres = lazy(() => import('./pages/Parametres'));
const Projets = lazy(() => import('./pages/Projets'));
const CatalogueEssais = lazy(() => import('./pages/CatalogueEssais'));
const ResultatsEssais = lazy(() => import('./pages/ResultatsEssais'));
const AchatsApprovisionnement = lazy(() => import('./pages/AchatsApprovisionnement'));
const SatisfactionClients = lazy(() => import('./pages/SatisfactionClients'));
const ActionsQualite = lazy(() => import('./pages/IsoCore').then((module) => ({ default: module.ActionsQualite })));
const RisquesOpportunites = lazy(() => import('./pages/IsoCore').then((module) => ({ default: module.RisquesOpportunites })));
const RevuesDirection = lazy(() => import('./pages/IsoCore').then((module) => ({ default: module.RevuesDirection })));
const AssistantAuditISO = lazy(() => import('./pages/IsoCore').then((module) => ({ default: module.AssistantAuditISO })));
const StocksConsommables = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.StocksConsommables })));
const Contrats = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.Contrats })));
const FacturesAvancees = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.FacturesAvancees })));
const SignaturesElectroniques = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.SignaturesElectroniques })));
const PortailClient = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.PortailClient })));
const PortailFournisseur = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.PortailFournisseur })));
const AnalyseDocumentaireIA = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.AnalyseDocumentaireIA })));
const JournalActivites = lazy(() => import('./pages/EmergingModules').then((module) => ({ default: module.JournalActivites })));
const Gouvernance = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.Gouvernance })));
const DemandesPrestations = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.DemandesPrestations })));
const MissionsTerrain = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.MissionsTerrain })));
const PlanningProjets = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.PlanningProjets })));
const CompetencesFormations = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.CompetencesFormations })));
const MetrologieAvancee = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.MetrologieAvancee })));
const FinancesAvancees = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.FinancesAvancees })));
const ObjectifsQualite = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.ObjectifsQualite })));
const MoteursSysteme = lazy(() => import('./pages/ArchitectureModules').then((module) => ({ default: module.MoteursSysteme })));

function PageLoader() {
  return <div className="loadingScreen">Chargement du module TESTLAB...</div>;
}

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
      <Toaster position="top-right" toastOptions={{ duration: 2200 }} />
    </>
  );
}

export default App;