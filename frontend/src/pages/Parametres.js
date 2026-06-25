import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { listRecords } from '../services/localStore';

const THEME_KEY = 'smartlab_theme';

const sections = [
  {
    title: 'Configuration generale',
    items: [
      { key: 'societe', title: 'Informations societe', icon: 'IS', text: 'Identite, coordonnees, logo et informations officielles.' },
      { key: 'roles', title: 'Utilisateurs & roles', icon: 'UR', text: 'Comptes, permissions et acces par profil metier.' },
      { key: 'systeme', title: 'Preferences systeme', icon: 'PS', text: 'Theme, langue, fuseau horaire et preferences.' },
      { key: 'notifications', title: 'Notifications', icon: 'NT', text: 'Alertes, rappels et signaux sonores.' }
    ]
  },
  {
    title: 'Configuration metier',
    items: [
      { key: 'essais', title: 'Essais & methodes', icon: 'EM', text: 'Familles essais, methodes, unites, calculs et incertitudes.' },
      { key: 'equipements', title: 'Equipements', icon: 'EQ', text: 'Categories, fiches de vie, fiches signaletiques et etalonnages.' },
      { key: 'documents', title: 'Documents & modeles', icon: 'DM', text: 'Procedures, fiches, rapports et modeles documentaires.' },
      { key: 'workflows', title: 'Workflows & processus', icon: 'WF', text: 'Validations, circuits d approbation et processus ISO 17025.' },
      { key: 'champs', title: 'Champs personnalises', icon: 'CP', text: 'Champs specifiques pour les entites du laboratoire.' },
      { key: 'numerotation', title: 'Numerotation', icon: 'NO', text: 'Sequences automatiques des devis, commandes, essais et documents.' },
      { key: 'catalogue', title: 'Catalogue', icon: 'CA', text: 'Structure du catalogue, familles et classifications.' },
      { key: 'tarifs', title: 'Tarifs & facturation', icon: 'TF', text: 'Prix, taxes, remises et conditions de facturation.' }
    ]
  },
  {
    title: 'Donnees & integration',
    items: [
      { key: 'sauvegarde', title: 'Sauvegarde & restauration', icon: 'SR', text: 'Sauvegardes automatiques et restauration des donnees.' },
      { key: 'import', title: 'Import / Export', icon: 'IE', text: 'Importez ou exportez vos donnees Excel, Word, PDF ou CSV.' },
      { key: 'integrations', title: 'Integrations', icon: 'IN', text: 'Connexion Supabase, services externes et outils metier.' }
    ]
  },
  {
    title: 'Systeme',
    items: [
      { key: 'securite', title: 'Securite', icon: 'SE', text: 'Politique de mot de passe, session et acces.' },
      { key: 'journaux', title: 'Journaux systeme', icon: 'JS', text: 'Activite, evenements, synchronisation et erreurs.' },
      { key: 'maintenance', title: 'Maintenance', icon: 'MT', text: 'Nettoyage, optimisation et controle des donnees.' },
      { key: 'apropos', title: 'A propos', icon: 'AP', text: 'Version, licences et mentions legales.' }
    ]
  }
];

function localStorageSize() {
  try {
    return Object.keys(localStorage).reduce((sum, key) => sum + key.length + String(localStorage.getItem(key) || '').length, 0);
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${bytes} o`;
}

function SettingCard({ item, active, onClick }) {
  return (
    <button type="button" className={`settingsTile ${active ? 'active' : ''}`} onClick={onClick}>
      <b>{item.icon}</b>
      <span><strong>{item.title}</strong><small>{item.text}</small></span>
      <em>›</em>
    </button>
  );
}

export default function Parametres() {
  const { user, updateProfile, roleLabels } = useAuth();
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState('societe');
  const [savingProfile, setSavingProfile] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'dark');
  const [emailNotifications, setEmailNotifications] = useState(localStorage.getItem('testlab_email_notifications') !== 'off');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', fonction: '', photo: '' });

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      fonction: user?.fonction || roleLabels?.[user?.role] || '',
      photo: user?.photo || ''
    });
  }, [roleLabels, user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [settings, clientList, equipmentList, staffList, documentList, catalogueList] = await Promise.all([
        listRecords('parametres'),
        listRecords('clients'),
        listRecords('equipements'),
        listRecords('personnel'),
        listRecords('documentsQualite'),
        listRecords('catalogueEssais')
      ]);
      if (!active) return;
      setRecords(settings);
      setClients(clientList);
      setEquipements(equipmentList);
      setPersonnel(staffList);
      setDocuments(documentList);
      setCatalogue(catalogueList);
    };
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => { active = false; window.removeEventListener('smartlab:data-changed', load); };
  }, []);

  const visibleSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(needle))
    })).filter((section) => section.items.length > 0);
  }, [query]);

  const activeItem = sections.flatMap((section) => section.items).find((item) => item.key === selectedKey) || sections[0].items[0];
  const normeSetting = records.find((item) => String(item.module || '').toLowerCase().includes('normes'));
  const rapportSetting = records.find((item) => String(item.module || '').toLowerCase().includes('rapports'));
  const moduleSetting = records.find((item) => String(item.module || '').toLowerCase().includes('modules'));
  const storage = localStorageSize();
  const storagePct = Math.min(100, Math.round((storage / (5 * 1024 * 1024)) * 100));

  const updateProfileField = (name, value) => setProfileForm((current) => ({ ...current, [name]: value }));

  const updatePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 420;
        const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        updateProfileField('photo', canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    await updateProfile(profileForm);
    setSavingProfile(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new CustomEvent('smartlab:theme-changed', { detail: nextTheme }));
  };

  const toggleEmailNotifications = () => {
    const nextValue = !emailNotifications;
    setEmailNotifications(nextValue);
    localStorage.setItem('testlab_email_notifications', nextValue ? 'on' : 'off');
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    toast.success('Cache vide. La prochaine ouverture rechargera la derniere version.');
  };

  return (
    <div className="settingsMockPage">
      <div className="dashMockHeader settingsHeader">
        <div><p className="eyebrow">TESTLAB MOBILE</p><h2>Parametres</h2><span className="achatSubtitle">Configurez et personnalisez votre environnement de travail.</span></div>
        <div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un parametre, configuration..." /></div>
      </div>

      <div className="settingsLayout">
        <main className="settingsMain">
          {visibleSections.map((section) => (
            <section className="settingsSection" key={section.title}>
              <h3>{section.title}</h3>
              <div className={`settingsGrid ${section.items.length <= 3 ? 'compact' : ''}`}>
                {section.items.map((item) => <SettingCard key={item.key} item={item} active={selectedKey === item.key} onClick={() => setSelectedKey(item.key)} />)}
              </div>
            </section>
          ))}
        </main>

        <aside className="settingsSide">
          <section className="dashPanel settingsCompany">
            <div className="dashPanelHeader"><strong>Informations societe</strong><button type="button" className="ghostButton">Modifier</button></div>
            <div className="companyIdentity"><b>TL</b><span><strong>TESTLAB</strong><small>Laboratoire d'Essais et d'Analyses<br />ISO 17025</small></span></div>
            <dl>
              <dt>Adresse</dt><dd>123 Avenue des Sciences</dd>
              <dt>Telephone</dt><dd>{profileForm.phone || '+229 XX XX XX XX'}</dd>
              <dt>Email</dt><dd>{profileForm.email || 'contact@testlab.fr'}</dd>
              <dt>Normes</dt><dd>{normeSetting?.valeur || 'ISO/IEC 17025, ISO 9001'}</dd>
            </dl>
          </section>

          <form className="dashPanel settingsProfile" onSubmit={saveProfile}>
            <div className="dashPanelHeader"><strong>Mon profil</strong><span>{roleLabels?.[user?.role] || 'Utilisateur'}</span></div>
            <div className="settingsProfileBody">
              <div className="profilePhotoPreview small">
                {profileForm.photo ? <img src={profileForm.photo} alt="Profil" /> : <span>{user?.initials || 'TL'}</span>}
              </div>
              <label className="photoUploadButton">Photo<input type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} /></label>
              <input value={profileForm.name} onChange={(event) => updateProfileField('name', event.target.value)} placeholder="Nom affiche" />
              <input type="email" value={profileForm.email} onChange={(event) => updateProfileField('email', event.target.value)} placeholder="Email" />
              <input value={profileForm.phone} onChange={(event) => updateProfileField('phone', event.target.value)} placeholder="Telephone" />
              <input value={profileForm.fonction} onChange={(event) => updateProfileField('fonction', event.target.value)} placeholder="Fonction" />
              <button type="submit" className="primaryButton" disabled={savingProfile}>{savingProfile ? 'Synchronisation...' : 'Enregistrer le profil'}</button>
            </div>
          </form>

          <section className="dashPanel settingsQuick">
            <div className="dashPanelHeader"><strong>Parametres rapides</strong></div>
            <div className="settingsQuickRows">
              <label><span>Theme sombre</span><button type="button" className={`switchControl ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme}><i /></button></label>
              <label><span>Notifications email</span><button type="button" className={`switchControl ${emailNotifications ? 'on' : ''}`} onClick={toggleEmailNotifications}><i /></button></label>
              <label><span>Langue</span><select defaultValue="fr"><option value="fr">Francais</option><option value="en">English</option></select></label>
              <label><span>Fuseau horaire</span><select defaultValue="porto"><option value="porto">Africa/Porto-Novo</option><option value="paris">Europe/Paris</option></select></label>
              <label><span>Format de date</span><select defaultValue="ddmmyyyy"><option value="ddmmyyyy">DD/MM/YYYY</option><option value="yyyymmdd">YYYY-MM-DD</option></select></label>
            </div>
          </section>

          <section className="dashPanel settingsDetail">
            <div className="dashPanelHeader"><strong>{activeItem.title}</strong><span>{activeItem.icon}</span></div>
            <p>{activeItem.text}</p>
            <div className="settingsStatsMini">
              <div><span>Clients</span><strong>{clients.length}</strong></div>
              <div><span>Equipements</span><strong>{equipements.length}</strong></div>
              <div><span>Personnel</span><strong>{personnel.length}</strong></div>
              <div><span>Documents</span><strong>{documents.length}</strong></div>
              <div><span>Catalogue</span><strong>{catalogue.length}</strong></div>
              <div><span>Configurations</span><strong>{records.length}</strong></div>
            </div>
            <small>{rapportSetting?.valeur || moduleSetting?.valeur || 'Configurations partagees entre les utilisateurs TESTLAB.'}</small>
          </section>

          <section className="dashPanel settingsStorage">
            <div className="dashPanelHeader"><strong>Espace de stockage</strong><span>{storagePct}%</span></div>
            <p>Utilisation locale : {formatBytes(storage)} / 5 Mo</p>
            <i><em style={{ width: `${storagePct}%` }} /></i>
            <button type="button" className="ghostButton" onClick={clearCache}>Vider le cache</button>
          </section>
        </aside>
      </div>
    </div>
  );
}