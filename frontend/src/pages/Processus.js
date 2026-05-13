import React from 'react';

const phases = [
  ['1', 'Reception et enregistrement', 'Demande client, identifiant unique, fiche projet et revue initiale selon ISO 17025 section 7.1.'],
  ['2', 'Revue technique et faisabilite', 'Analyse des equipements, competences, methodes et contraintes avant validation.'],
  ['3', 'Devis et contractualisation', 'Generation du devis, signature du contrat et archivage dans le dossier projet.'],
  ['4', 'Planification des essais', 'Affectation du personnel, verification des equipements et validation du planning.'],
  ['5', 'Reception des echantillons', 'Identification, codification, QR code et declaration des non-conformites a reception.'],
  ['6', 'Realisation des essais', 'Execution selon methode normalisee, calculs automatiques et incertitude de mesure.'],
  ['7', 'Verification des resultats', 'Controle technique, validation et signalement des anomalies.'],
  ['8', 'Rapport d essai', 'Generation PDF/Word, verification qualite et signature electronique.'],
  ['9', 'Transmission client', 'Mise a disposition via portail securise et trace des telechargements.'],
  ['10', 'Archivage et tracabilite', 'Documents, resultats, echanges, journal d audit et sauvegardes.'],
  ['11', 'Reclamations et NC', 'Formulaire numerique, traitement, actions correctives et cloture.'],
  ['12', 'Amelioration continue', 'Indicateurs qualite et rapport de revue de direction.']
];

export default function Processus() {
  return (
    <div className="pageStack">
      <div className="welcomeBand">
        <div>
          <p className="eyebrow">ISO/IEC 17025</p>
          <h2>Processus complet d'une demande d'essai</h2>
          <p>Sequence issue du document Processus_SMARTLAB_ISO17025 : de la demande client jusqu'a l'archivage, aux reclamations et a l'amelioration continue.</p>
        </div>
        <strong>12 phases</strong>
      </div>

      <div className="processGrid">
        {phases.map(([number, title, text]) => (
          <article className="processCard" key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
