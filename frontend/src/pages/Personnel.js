import React, { useMemo, useState } from 'react';
import ResourcePage from '../components/ResourcePage';

const qualificationOptions = [
  { value: 'accepte', label: 'Accepte' },
  { value: 'en_suivi', label: 'En suivi' },
  { value: 'refuse', label: 'Refuse' }
];

const habilitationOptions = [
  { value: 'active', label: 'Active' },
  { value: 'a_renouveler', label: 'A renouveler' },
  { value: 'suspendue', label: 'Suspendue' }
];

const fields = [
  { name: 'nom', label: 'Nom', required: true, placeholder: 'Nom du personnel' },
  { name: 'role', label: 'Role', required: true, placeholder: 'Operateur, RT, RL, RQ...' },
  { name: 'atelier', label: 'Atelier / domaine', placeholder: 'Beton, sols, metrologie...' },
  { name: 'qualification', label: 'Qualification', options: qualificationOptions, defaultValue: 'en_suivi' },
  { name: 'habilitation', label: 'Habilitation', options: habilitationOptions, defaultValue: 'active' },
  { name: 'prochaine_revue', label: 'Prochaine revue', type: 'date' }
];

const columns = [
  { name: 'nom', label: 'Nom' },
  { name: 'role', label: 'Role' },
  { name: 'atelier', label: 'Domaine' },
  { name: 'qualification', label: 'Qualification', badge: true },
  { name: 'habilitation', label: 'Habilitation', badge: true },
  { name: 'prochaine_revue', label: 'Revue' }
];

export default function Personnel() {
  const [x1, setX1] = useState('');
  const [x2, setX2] = useState('');
  const [x3, setX3] = useState('');
  const [assigned, setAssigned] = useState('');
  const [sigma, setSigma] = useState('');

  const result = useMemo(() => {
    const values = [x1, x2, x3].map(Number).filter((value) => !Number.isNaN(value));
    const reference = Number(assigned);
    const deviation = Number(sigma);
    if (values.length < 3 || !reference || !deviation) return null;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const score = (average - reference) / deviation;
    return { average, score, accepted: Math.abs(score) <= 2 };
  }, [x1, x2, x3, assigned, sigma]);

  return (
    <div className="pageStack">
      <div className="infoGrid">
        <div className="infoPanel">
          <p className="eyebrow">Procedure competence</p>
          <h2>Qualification, habilitation et maintien</h2>
          <p>Formation pratique d'un mois, trois essais sur materiaux de reference, qualification par score Z, puis grille d'habilitation FIC-70 validee par la direction.</p>
          <p>Le maintien des competences est actualise tous les trois mois, avec recyclages annuels et suivi des reclamations clients.</p>
        </div>
        <div className="infoPanel">
          <p className="eyebrow">Calcul score Z</p>
          <div className="miniForm">
            <input value={x1} onChange={(event) => setX1(event.target.value)} type="number" placeholder="Essai 1" />
            <input value={x2} onChange={(event) => setX2(event.target.value)} type="number" placeholder="Essai 2" />
            <input value={x3} onChange={(event) => setX3(event.target.value)} type="number" placeholder="Essai 3" />
            <input value={assigned} onChange={(event) => setAssigned(event.target.value)} type="number" placeholder="Valeur assignee" />
            <input value={sigma} onChange={(event) => setSigma(event.target.value)} type="number" placeholder="Ecart-type assigne" />
          </div>
          <div className={`scoreBox ${result?.accepted ? 'ok' : 'ko'}`}>
            {result ? (
              <>
                <strong>Z = {result.score.toFixed(2)}</strong>
                <span>{result.accepted ? 'Performance satisfaisante : accepte' : 'Performance discutable : formation complementaire'}</span>
              </>
            ) : (
              <span>Renseignez les trois resultats, la valeur assignee et sigma.</span>
            )}
          </div>
        </div>
      </div>

      <ResourcePage
        title="Personnel et habilitations"
        subtitle="Qualification des operateurs, responsables pilotes et maintien des competences."
        resource="personnel"
        fields={fields}
        columns={columns}
        primaryLabel="Nouveau personnel"
      />
    </div>
  );
}
