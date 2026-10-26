import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authProfiles } from '../config/permissions';

function RoleSelection() {
  const navigate = useNavigate();

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

        <div className="roleSelectionGrid">
          {authProfiles.map((profile) => (
            <button
              type="button"
              className="roleSelectionCard"
              key={profile.role}
              onClick={() => navigate(`/login?role=${encodeURIComponent(profile.role)}`)}
            >
              <span className="roleSelectionIcon">{profile.initials}</span>
              <span className="roleSelectionCardText">
                <strong>{profile.label}</strong>
                <small>Ouvrir mon espace</small>
              </span>
              <span className="roleSelectionArrow" aria-hidden="true">&gt;</span>
            </button>
          ))}
        </div>

        <p className="roleSelectionHint">Le role final est verifie avec votre compte Supabase avant l'ouverture du tableau de bord.</p>
      </main>
    </div>
  );
}

export default RoleSelection;
