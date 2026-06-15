import React, { useEffect, useState } from 'react';
import ResourcePage from '../components/ResourcePage';
import { useAuth } from '../contexts/AuthContext';

const statusOptions = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'a_configurer', label: 'A configurer' }
];

const fields = [
  { name: 'module', label: 'Module', required: true, placeholder: 'Normes, rapports, utilisateurs...' },
  { name: 'valeur', label: 'Configuration', required: true, placeholder: 'Parametre ou modele active', full: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'actif' }
];

const columns = [
  { name: 'module', label: 'Module' },
  { name: 'valeur', label: 'Configuration' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Parametres() {
  const { user, updateProfile, roleLabels } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    fonction: '',
    photo: ''
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      fonction: user?.fonction || roleLabels?.[user?.role] || '',
      photo: user?.photo || ''
    });
  }, [roleLabels, user]);

  const updateField = (name, value) => {
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

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
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        updateField('photo', canvas.toDataURL('image/jpeg', 0.78));
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

  return (
    <div className="pageStack">
      <div className="pageHeader">
        <div>
          <h2>Parametrage et personnalisation</h2>
          <p>Mon profil, normes utilisees, modeles de rapports, activation des modules et droits d'acces.</p>
        </div>
      </div>

      <form className="profileSettingsPanel" onSubmit={saveProfile}>
        <div className="profilePhotoBlock">
          <div className="profilePhotoPreview">
            {profileForm.photo ? <img src={profileForm.photo} alt="Profil" /> : <span>{user?.initials || 'TL'}</span>}
          </div>
          <label className="photoUploadButton">
            Ajouter une photo
            <input type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} />
          </label>
        </div>
        <div className="profileFields">
          <div className="formHeader">
            <strong>Mon profil</strong>
            <span>{roleLabels?.[user?.role] || 'Utilisateur'}</span>
          </div>
          <div className="formGrid">
            <label>
              <span>Nom affiche</span>
              <input value={profileForm.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={profileForm.email} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label>
              <span>Telephone</span>
              <input value={profileForm.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+229..." />
            </label>
            <label>
              <span>Fonction</span>
              <input value={profileForm.fonction} onChange={(event) => updateField('fonction', event.target.value)} />
            </label>
          </div>
          <div className="formActions">
            <button type="submit" className="primaryButton" disabled={savingProfile}>
              {savingProfile ? 'Synchronisation...' : 'Enregistrer mon profil'}
            </button>
          </div>
        </div>
      </form>

      <ResourcePage
        title="Parametres du logiciel"
        subtitle="Configurations generales partagees par le laboratoire."
        resource="parametres"
        fields={fields}
        columns={columns}
        primaryLabel="Nouveau parametre"
      />
    </div>
  );
}
