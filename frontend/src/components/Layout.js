import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listRecords, upsertRecord } from '../services/localStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'DB' },
  { to: '/essais', label: "Objets d'essais", icon: 'OE' },
  { to: '/rapports', label: 'Rapports', icon: 'RP' },
  { to: '/processus', label: 'Processus ISO 17025', icon: 'IS' },
  { to: '/documents-qualite', label: 'Gestion des documents qualite', icon: 'DQ' },
  { to: '/catalogue-essais', label: 'Catalogue des essais', icon: 'CE' },
  { to: '/resultats-essais', label: 'Resultats & calculs', icon: 'RC' },
  { to: '/equipements', label: 'Gestion des équipements', icon: 'EQ' },
  { to: '/personnel', label: 'Gestion du personnel', icon: 'RH' },
  { to: '/non-conformites', label: 'Gestion des non-conformités', icon: 'NC' },
  { to: '/reclamations', label: 'Gestion des réclamations', icon: 'GR' },
  { to: '/audits', label: 'Gestion des audits qualité', icon: 'AQ' },
  { to: '/clients', label: 'Clients', icon: 'CL' },
  { to: '/devis', label: 'Devis', icon: 'DV' },
  { to: '/commandes', label: 'Commandes', icon: 'CM' },
  { to: '/projets', label: 'Projets', icon: 'PJ' },
  { to: '/parametres', label: 'Parametrage', icon: 'PR' }
];

const menuByRole = {
  responsable_appel: ['/', '/clients', '/devis', '/commandes', '/projets', '/processus'],
  responsable_technique: ['/', '/clients', '/devis', '/commandes', '/rapports', '/resultats-essais', '/non-conformites', '/reclamations', '/personnel', '/processus', '/documents-qualite', '/catalogue-essais'],
  dg: navItems.map((item) => item.to),
  responsable_labo: ['/', '/commandes', '/essais', '/catalogue-essais', '/resultats-essais', '/rapports', '/equipements', '/personnel', '/non-conformites', '/reclamations', '/processus', '/documents-qualite'],
  receptionniste: ['/', '/commandes', '/essais', '/clients', '/non-conformites', '/reclamations', '/processus', '/documents-qualite']
};

const titles = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/essais': "Objets d'essais",
  '/devis': 'Devis',
  '/commandes': 'Commandes',
  '/projets': 'Projets',
  '/rapports': 'Rapports',
  '/catalogue-essais': 'Catalogue des essais',
  '/resultats-essais': 'Resultats & calculs',
  '/documents-qualite': 'Gestion des documents qualite',
  '/equipements': 'Gestion des équipements',
  '/audits': 'Gestion des audits qualité',
  '/non-conformites': 'Gestion des non-conformités',
  '/reclamations': 'Gestion des réclamations',
  '/personnel': 'Gestion du personnel',
  '/processus': 'Processus ISO 17025',
  '/parametres': 'Parametrage'
};

const DISMISSED_NOTIFICATIONS_KEY = 'smartlab_dismissed_notifications';
const CURRENT_ROLE_KEY = 'smartlab_current_role';
const THEME_KEY = 'smartlab_theme';
const APP_VERSION = window.SMARTLAB_VERSION || 'dev';
const NOTIFICATIONS_POLL_INTERVAL = 15000;
let notificationAudioContext = null;

function loadDismissedNotifications() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function getNotificationAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!notificationAudioContext) {
    notificationAudioContext = new AudioContext();
  }
  return notificationAudioContext;
}

async function unlockNotificationSound() {
  const audioContext = getNotificationAudioContext();
  if (!audioContext) return false;

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.connect(audioContext.destination);

  const oscillator = audioContext.createOscillator();
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.connect(gain);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.02);

  return audioContext.state === 'running';
}

async function playNotificationSound() {
  const audioContext = getNotificationAudioContext();
  if (!audioContext) return;

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.42);
  gain.connect(audioContext.destination);

  [880, 1175].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.14);
    oscillator.connect(gain);
    oscillator.start(audioContext.currentTime + index * 0.14);
    oscillator.stop(audioContext.currentTime + index * 0.14 + 0.16);
  });

  if ('vibrate' in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
}

function Layout({ publicMode = false }) {
  const { user, logout, roleLabels } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(loadDismissedNotifications);
  const [currentRole, setCurrentRole] = useState(user?.role || localStorage.getItem(CURRENT_ROLE_KEY) || 'responsable_appel');
  const notificationIdsRef = useRef([]);
  const notificationsReadyRef = useRef(false);
  const soundUnlockedRef = useRef(false);
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'dark');
  const location = useLocation();
  const navigate = useNavigate();
  const allowedMenuItems = navItems.filter((item) => (menuByRole[currentRole] || menuByRole.responsable_appel).includes(item.to));
  const principalItems = allowedMenuItems.filter((item) => ['/', '/essais', '/rapports', '/catalogue-essais', '/resultats-essais'].includes(item.to));
  const qualityItems = allowedMenuItems.filter((item) => ['/processus', '/documents-qualite', '/equipements', '/personnel', '/non-conformites', '/reclamations', '/audits'].includes(item.to));
  const administrationItems = allowedMenuItems.filter((item) => ['/clients', '/devis', '/commandes', '/projets', '/parametres'].includes(item.to));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (user?.role) {
      localStorage.setItem(CURRENT_ROLE_KEY, user.role);
      setCurrentRole(user.role);
      window.dispatchEvent(new CustomEvent('smartlab:role-changed', { detail: user.role }));
    }
  }, [user]);

  useEffect(() => {
    if (publicMode) return undefined;

    const unlockSound = async () => {
      soundUnlockedRef.current = await unlockNotificationSound();
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('keydown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };

    window.addEventListener('pointerdown', unlockSound, { once: true });
    window.addEventListener('keydown', unlockSound, { once: true });
    window.addEventListener('touchstart', unlockSound, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('keydown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
  }, [publicMode]);

  useEffect(() => {
    if (publicMode) return undefined;
    let cancelled = false;

    const refreshNotifications = async () => {
      const [essais, devis, commandes, nonConformites, reclamations, sharedNotifications] = await Promise.all([
        listRecords('essais'),
        listRecords('devis'),
        listRecords('commandes'),
        listRecords('nonConformites'),
        listRecords('reclamations'),
        listRecords('notifications')
      ]);

      if (cancelled) return;

      const nextNotifications = [];
      sharedNotifications
        .filter((item) => !item.read)
        .filter((item) => !item.targetRole || item.targetRole === currentRole || item.targetRole === 'all')
        .forEach((item) => {
          nextNotifications.push({
            id: item.id,
            title: item.title,
            message: item.message,
            tone: item.tone,
            path: item.path || '/',
            sharedRecord: item
          });
        });
      const essaisEnCours = essais.filter((item) => item.statut === 'en_cours').length;
      const devisRefuses = devis.filter((item) => item.statut === 'refuse').length;
      const latestRejectedQuote = devis.filter((item) => item.statut === 'refuse').slice(-1)[0];
      const devisOuverts = devis.filter((item) => !['paye', 'accepte', 'annule', 'refuse', 'commande_creee'].includes(item.statut)).length;
      const commandesActives = commandes.filter((item) => item.statut !== 'livree').length;
      const nonConformitesOuvertes = nonConformites.filter((item) => item.statut !== 'cloturee').length;
      const reclamationsOuvertes = reclamations.filter((item) => item.statut !== 'cloturee').length;

      if (essaisEnCours > 0) {
        nextNotifications.push({
          id: `essais-en-cours-${essaisEnCours}`,
          title: "Objets d'essais",
          message: `${essaisEnCours} objet${essaisEnCours > 1 ? 's' : ''} en cours.`,
          path: '/essais'
        });
      }

      if (devisOuverts > 0) {
        nextNotifications.push({
          id: `devis-ouverts-${devisOuverts}`,
          title: 'Devis',
          message: `${devisOuverts} devis a suivre ou a relancer.`,
          path: '/devis'
        });
      }

      if (devisRefuses > 0) {
        nextNotifications.push({
          id: `devis-refuses-${devisRefuses}-${latestRejectedQuote?.date_rejet_client || ''}`,
          title: 'Devis rejete',
          message: `${devisRefuses} devis rejete${devisRefuses > 1 ? 's' : ''}. Motif: ${latestRejectedQuote?.motif_refus || 'A consulter'}`,
          tone: 'offline',
          path: '/devis'
        });
      }

      if (commandesActives > 0) {
        nextNotifications.push({
          id: `commandes-actives-${commandesActives}`,
          title: 'Commandes',
          message: `${commandesActives} commande${commandesActives > 1 ? 's' : ''} active${commandesActives > 1 ? 's' : ''}.`,
          path: '/commandes'
        });
      }

      if (nonConformitesOuvertes > 0) {
        nextNotifications.push({
          id: `non-conformites-ouvertes-${nonConformitesOuvertes}`,
          title: 'Gestion des non-conformités',
          message: `${nonConformitesOuvertes} non-conformite${nonConformitesOuvertes > 1 ? 's' : ''} non cloturee${nonConformitesOuvertes > 1 ? 's' : ''}.`,
          tone: 'offline',
          path: '/non-conformites'
        });
      }

      if (reclamationsOuvertes > 0) {
        nextNotifications.push({
          id: `reclamations-ouvertes-${reclamationsOuvertes}`,
          title: 'Gestion des réclamations',
          message: `${reclamationsOuvertes} reclamation${reclamationsOuvertes > 1 ? 's' : ''} non cloturee${reclamationsOuvertes > 1 ? 's' : ''}.`,
          tone: 'offline',
          path: '/reclamations'
        });
      }

      const visibleNotifications = nextNotifications.filter((notification) => !dismissedNotificationIds.includes(notification.id));
      const previousIds = notificationIdsRef.current;
      const nextIds = visibleNotifications.map((notification) => notification.id);
      const hasNewNotification = nextIds.some((id) => !previousIds.includes(id));

      if (notificationsReadyRef.current && hasNewNotification && soundUnlockedRef.current) {
        playNotificationSound().catch(() => {});
      }

      notificationsReadyRef.current = true;
      notificationIdsRef.current = nextIds;
      setNotifications(visibleNotifications);
    };

    refreshNotifications();
    const refreshTimer = window.setInterval(refreshNotifications, NOTIFICATIONS_POLL_INTERVAL);
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'hidden') refreshNotifications();
    };
    window.addEventListener('smartlab:data-changed', refreshNotifications);
    window.addEventListener('focus', refreshNotifications);
    window.addEventListener('online', refreshNotifications);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('smartlab:data-changed', refreshNotifications);
      window.removeEventListener('focus', refreshNotifications);
      window.removeEventListener('online', refreshNotifications);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [dismissedNotificationIds, currentRole, publicMode]);

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
      new Notification('TESTLAB', {
        body: 'Les notifications TESTLAB sont activees.'
      });
    }
  };

  const openNotification = async (notification) => {
    if (notification.sharedRecord) {
      await upsertRecord('notifications', { ...notification.sharedRecord, read: true, read_at: new Date().toISOString() });
    }
    const nextDismissedIds = Array.from(new Set([...dismissedNotificationIds, notification.id]));
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(nextDismissedIds));
    setDismissedNotificationIds(nextDismissedIds);
    setNotifications((current) => {
      const nextNotifications = current.filter((item) => item.id !== notification.id);
      notificationIdsRef.current = nextNotifications.map((item) => item.id);
      return nextNotifications;
    });
    setNotificationsOpen(false);
    navigate(notification.path);
  };

  const toggleTheme = () => {
    setTheme((value) => (value === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="shell">
      {!publicMode && <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brandMark">TL</div>
          <div>
            <strong><span>TEST</span>LAB</strong>
            <small>Gestion ISO 17025</small>
          </div>
        </div>

        <div className="navSectionLabel">Principal</div>
        <nav className="navList">
          {principalItems.map((item) => (
            <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
          ))}
        </nav>

        {qualityItems.length > 0 && (
          <>
            <div className="navSectionLabel">Qualite ISO</div>
            <nav className="navList">
              {qualityItems.map((item) => (
                <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
              ))}
            </nav>
          </>
        )}

        {administrationItems.length > 0 && (
          <>
            <div className="navSectionLabel">Administration</div>
            <nav className="navList">
              {administrationItems.map((item) => (
                <NavItem key={item.to} item={item} closeMenu={() => setOpen(false)} />
              ))}
            </nav>
          </>
        )}

        <div className="userCard">
          <div className="avatar">{user?.initials || 'TL'}</div>
          <div>
            <strong>{user?.name || 'TESTLAB'}</strong>
            <span>{roleLabels?.[currentRole] || 'Utilisateur'} - Version {APP_VERSION}</span>
            <button type="button" className="refreshVersionButton" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Deconnexion</button>
          </div>
        </div>
      </aside>}

      <main className={publicMode ? 'main publicMain' : 'main'}>
        <header className="topbar">
          {!publicMode && <button className="menuButton" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            Menu
          </button>}
          <div className="topbarTitle">
            <p className="eyebrow">TESTLAB mobile</p>
            <h1>{titles[location.pathname] || 'TESTLAB'}</h1>
          </div>
          {!publicMode && <div className="topbarSearch">
            <span>RE</span>
            <input placeholder="Rechercher un essai, client, echantillon..." />
          </div>}
          {!publicMode && <div className="topbarActions">
            <span className="authRolePill">{roleLabels?.[currentRole] || currentRole}</span>
            <button
              type="button"
              className="themeToggleButton"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              type="button"
              className="notificationButton"
              onClick={toggleNotifications}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <span className="notificationIcon" aria-hidden="true">🔔</span>
              {notifications.length > 0 && <span>{notifications.length}</span>}
            </button>
            {notificationsOpen && (
              <div className="notificationsPanel">
                <div className="notificationsHeader">
                  <strong>Notifications</strong>
                  <small>{notifications.length} alertes</small>
                </div>
                {notifications.length === 0 ? (
                  <div className="notificationEmpty">Aucune notification active</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      className="notificationItem"
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                    >
                      <span className={`notificationDot ${notification.tone || 'info'}`} />
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>}
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
