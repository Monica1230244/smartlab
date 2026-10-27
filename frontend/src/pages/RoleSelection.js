import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { listRecords } from '../services/localStore';
import { normalizeRoleValue, resolveRole, roleLabels } from '../config/permissions';

function RoleSelection() {
  const navigate = useNavigate();
  const [roleInput, setRoleInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requestedRole = normalizeRoleValue(roleInput);
    const requestedKey = resolveRole(roleInput);
    if (!requestedRole) {
      setStatus('Renseignez votre role pour continuer.');
      return;
    }

    setChecking(true);
    setStatus('Verification du role dans la base...');
    try {
      const profiles = await listRecords('profiles');
      const profile = profiles.find((item) => {
        if (item.actif === false || item.active === false) return false;
        const storedRole = resolveRole(item.role || item.fonction || item.poste || item.label);
        return storedRole === requestedKey || storedRole === requestedRole || normalizeRoleValue(item.role || item.fonction || item.poste || item.label) === requestedRole;
      });
      const resolved = resolveRole(profile?.role || profile?.fonction || profile?.poste || profile?.label || roleInput);
      if (!profile || !roleLabels[resolved]) {
        setStatus('Role introuvable dans les profils TESTLAB.');
        toast.error('Ce role n existe pas dans la base TESTLAB.');
        return;
      }
      setStatus('Role verifie. Ouverture de la connexion...');
      navigate(`/login?role=${encodeURIComponent(resolved)}`, { replace: true });
    } catch (error) {
      setStatus('Impossible de verifier les roles.');
      toast.error('La base Supabase est indisponible.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="loginPage roleSelectionPage">
      <main className="roleSelectionPanel">
        <div className="loginBrand">
          <div className="brandMark">TL</div>
          <h1>TEST<span>LAB</span></h1>
          <p>Plateforme de gestion du laboratoire</p>
        </div>

        <div className="roleSelectionHeader">
          <span className="eyebrow">Acces securise</span>
          <h2>Quel est votre role ?</h2>
          <p>Choisissez votre fonction pour ouvrir l'espace de travail qui vous concerne.</p>
        </div>

        <form className="roleLookupForm" onSubmit={handleSubmit}>
          <label>
            <span>Votre role professionnel</span>
            <input
              value={roleInput}
              onChange={(event) => { setRoleInput(event.target.value); setStatus(''); }}
              placeholder="Ex. Responsable technique"
              autoComplete="organization-title"
              autoFocus
              required
            />
          </label>
          <button type="submit" className="primaryButton" disabled={checking}>
            {checking ? 'Verification...' : 'Verifier mon role'}
          </button>
          {status && <p className={`roleLookupStatus ${status.includes('verifie') ? 'success' : 'error'}`} role="status">{status}</p>}
        </form>

        <p className="roleSelectionHint">Le role est recherche dans les profils TESTLAB. S il existe, vous serez redirige vers la connexion correspondante.</p>
      </main>
    </div>
  );
}

export default RoleSelection;
