import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'DB' },
  { to: '/essais', label: 'Gestion des Essais', icon: 'ES', badge: '5' },
  { to: '/echantillons', label: 'Echantillons', icon: 'EC' },
  { to: '/rapports', label: 'Rapports', icon: 'RP' },
  { to: '/processus', label: 'Processus ISO 17025', icon: 'IS' },
  { to: '/equipements', label: 'Equipements', icon: 'EQ' },
  { to: '/personnel', label: 'Personnel & Habilitations', icon: 'RH' },
  { to: '/non-conformites', label: 'Non-Conformites', icon: 'NC', badge: '2' },
  { to: '/audits', label: 'Audits Qualite', icon: 'AQ' },
  { to: '/clients', label: 'Clients', icon: 'CL' },
  { to: '/devis', label: 'Devis & Factures', icon: 'DV' },
  { to: '/commandes', label: 'Commandes', icon: 'CM' },
  { to: '/parametres', label: 'Parametrage', icon: 'PR' }
];

const titles = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/essais': 'Gestion des Essais',
  '/devis': 'Devis & Factures',
  '/commandes': 'Commandes',
  '/echantillons': 'Echantillons',
  '/rapports': 'Rapports',
  '/equipements': 'Equipements',
  '/audits': 'Audits Qualite',
  '/non-conformites': 'Non-Conformites',
  '/personnel': 'Personnel & Habilitations',
  '/processus': 'Processus ISO 17025',
  '/parametres': 'Parametrage'
};

function Layout() {
  const [open, setOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: 'pending', message: 'Connexion Supabase...' });
  const location = useLocation();

  useEffect(() => {
    const handler = (event) => setSyncStatus(event.detail);
    window.addEventListener('smartlab:sync-status', handler);
    return () => window.removeEventListener('smartlab:sync-status', handler);
  }, []);

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brandMark">SL</div>
          <div>
            <strong><span>SMART</span>LAB</strong>
            <small>Gestion ISO 17025</small>
          </div>
        </div>

        <div className="navSectionLabel">Principal</div>
        <nav className="navList">
          {navItems.slice(0, 5).map((item) => (
            <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
          ))}
        </nav>

        <div className="navSectionLabel">Qualite ISO</div>
        <nav className="navList">
          {navItems.slice(5, 10).map((item) => (
            <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
          ))}
        </nav>

        <div className="navSectionLabel">Administration</div>
        <nav className="navList">
          {navItems.slice(10).map((item) => (
            <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
          ))}
        </nav>

        <div className="userCard">
          <div className="avatar">SL</div>
          <div>
            <strong>SMARTLAB</strong>
            <span>Application mobile</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menuButton" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            Menu
          </button>
          <div className="topbarTitle">
            <p className="eyebrow">SMARTLAB mobile</p>
            <h1>{titles[location.pathname] || 'SMARTLAB'}</h1>
          </div>
          <div className="topbarSearch">
            <span>RE</span>
            <input placeholder="Rechercher un essai, client, echantillon..." />
          </div>
          <div className={`syncPill ${syncStatus.status}`}>{syncStatus.message}</div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function NavItem({ item, closeMenu }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}
      onClick={closeMenu}
    >
      <span className="navIcon">{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && <em>{item.badge}</em>}
    </NavLink>
  );
}

export default Layout;
