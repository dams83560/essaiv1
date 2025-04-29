import React from 'react';

function HeureEtInfosClientSection({
  heureRetrait,
  handleHeureRetraitChange,
  heuresOuverture,
  nomClient,
  setNomClient,
  telephoneClient,
  setTelephoneClient
}) {
  return (
    <section className="form-section">
      <h2>Heure et Informations Client</h2>
      <fieldset>
        <legend>Détails du client et heure de retrait</legend>
        <div className="form-group">
          <label htmlFor="heureRetrait">Heure de retrait (entre 06h00 et 19h00):</label>
          <select id="heureRetrait" value={heureRetrait} onChange={handleHeureRetraitChange}>
            <option value="">Sélectionner une heure</option>
            {heuresOuverture.map(heure => (
              <option key={heure} value={heure}>{heure}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="nomClient">Nom du client:</label>
          <input type="text" id="nomClient" value={nomClient} onChange={(e) => setNomClient(e.target.value)} placeholder="Entrez le nom du client" />
        </div>
        <div className="form-group">
          <label htmlFor="telephoneClient">Téléphone:</label>
          <input type="tel" id="telephoneClient" value={telephoneClient} onChange={(e) => setTelephoneClient(e.target.value)} placeholder="Entrez le numéro de téléphone" />
        </div>
      </fieldset>
    </section>
  );
}

export default HeureEtInfosClientSection;