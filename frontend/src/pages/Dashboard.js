import React, { useEffect, useState } from 'react';
import { getStats, listRecords } from '../services/localStore';

function Dashboard() {
  const [stats, setStats] = useState(getStats());
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    const refresh = () => {
      setStats(getStats());
      setLatest(listRecords('essais').slice(0, 5));
    };
    refresh();
    window.addEventListener('smartlab:data-changed', refresh);
    return () => window.removeEventListener('smartlab:data-changed', refresh);
  }, []);

  const cards = [
    { label: 'Clients', value: stats.clients, tone: 'blue' },
    { label: 'Essais en cours', value: stats.essaisEnCours, tone: 'green' },
    { label: 'Equipements suivis', value: stats.equipements, tone: 'amber' },
    { label: 'Habilitations actives', value: stats.habilitations, tone: 'green' },
    { label: 'Non-conformites', value: stats.nonConformites, tone: 'red' },
    { label: 'Commandes actives', value: stats.commandesActives, tone: 'blue' }
  ];

  return (
    <div className="pageStack">
      <div className="welcomeBand">
        <div>
          <p className="eyebrow">Vue generale</p>
          <h2>Gestion operationnelle du laboratoire</h2>
          <p>Les donnees ajoutees depuis le mobile restent disponibles sur l'appareil et se mettent a jour immediatement dans les ecrans.</p>
        </div>
        <strong>{stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA</strong>
      </div>

      <div className="statsGrid">
        {cards.map((card) => (
          <div key={card.label} className={`statCard ${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="tablePanel">
        <div className="tableTools">
          <strong>Derniers essais</strong>
        </div>
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>N essai</th>
                <th>Type</th>
                <th>Client</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((item) => (
                <tr key={item.id}>
                  <td>{item.numero}</td>
                  <td>{item.type_essai}</td>
                  <td>{item.client_nom}</td>
                  <td>{item.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
