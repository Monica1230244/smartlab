import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'DA' },
  { to: '/clients', label: 'Clients', icon: 'CL' },
  { to: '/essais', label: 'Essais', icon: 'ES' },
  { to: '/devis', label: 'Devis', icon: 'DV' },
  { to: '/commandes', label: 'Commandes', icon: 'CM' },
  { to: '/echantillons', label: 'Echantillons', icon: 'EC' },
  { to: '/rapports', label: 'Rapports', icon: 'RP' }
];

const titles = {
  '/': 'Tableau de bord',
  '/clients': 'Clients',
  '/essais': 'Essais',
  '/devis': 'Devis & factures',
  '/commandes': 'Commandes',
  '/echantillons': 'Echantillons',
  '/rapports': 'Rapports'
};

function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brandMark">SL</div>
          <div>
            <strong>SMARTLAB</strong>
            <span>ISO 17025</span>
          </div>
        </div>
        <nav className="navList">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="navIcon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menuButton" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            ☰
          </button>
          <div>
            <p className="eyebrow">SMARTLAB mobile</p>
            <h1>{titles[location.pathname] || 'SMARTLAB'}</h1>
          </div>
          <div className="syncPill">PWA prête</div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Layout;
