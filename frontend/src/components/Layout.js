import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'DB' },
  { to: '/essais', label: "Objets d'essais", icon: 'OE', badge: '5' },
  { to: '/echantillons', label: 'Echantillons', icon: 'EC' },
  { to: '/rapports', label: 'Rapports', icon: 'RP' },
  { to: '/processus', label: 'Processus ISO 17025', icon: 'IS' },
  { to: '/equipements', label: 'Equipements', icon: 'EQ' },
  { to: '/personnel', label: 'Personnel & Habilitations', icon: 'RH' },
  { to: '/non-conformites', label: 'Non-Conformites', icon: 'NC', badge: '2' },
  { to: '/audits', label: 'Audits Qualite', icon: 'AQ' },
  { to: '/clients', label: 'Clients', icon: 'CL' },
  { to: '/devis', label: 'Devis', icon: 'DV' },
  { to: '/commandes', label: 'Commandes', icon: 'CM' },
  { to: '/projets', label: 'Projets', icon: 'PJ' },
  { to: '/parametres', label: 'Parametrage', icon: 'PR' }
];

const titles = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/essais': "Objets d'essais",
  '/devis': 'Devis',
  '/commandes': 'Commandes',
  '/projets': 'Projets',
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: 'pending', message: 'Connexion Supabase...' });
  const location = useLocation();

  const notifications = [
    {
      title: 'Connexion base',
      message: syncStatus.message,
      tone: syncStatus.status,
      path: '/'
    },
    {
      title: 'Devis',
      message: 'Les nouveaux devis envoyes aux clients apparaitront ici.',
      path: '/devis'
    },
    {
      title: 'Commandes',
      message: 'Les commandes creees depuis un devis seront signalees ici.',
      path: '/commandes'
    }
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event) => setSyncStatus(event.detail);
    window.addEventListener('smartlab:sync-status', handler);
    return () => window.removeEventListener('smartlab:sync-status', handler);
  }, []);

  const toggleNotifications = async () => {
    setNotificationsOpen((value) => !value);

    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    if (Notification.permission === 'granted') {
      new Notification('SMARTLAB', {
        body: 'Les notifications SMARTLAB sont activees.'
      });
    }
  };

  const openNotification = (path) => {
    setNotificationsOpen(false);
    navigate(path);
  };

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
          <div className="topbarActions">
            <button
              type="button"
              className="notificationButton"
              onClick={toggleNotifications}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <span className="notificationIcon" aria-hidden="true">🔔</span>
              <span>{notifications.length}</span>
            </button>
            {notificationsOpen && (
              <div className="notificationsPanel">
                <div className="notificationsHeader">
                  <strong>Notifications</strong>
                  <small>{notifications.length} alertes</small>
                </div>
                {notifications.map((notification) => (
                  <button
                    type="button"
                    className="notificationItem"
                    key={notification.title}
                    onClick={() => openNotification(notification.path)}
                  >
                    <span className={`notificationDot ${notification.tone || 'info'}`} />
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
