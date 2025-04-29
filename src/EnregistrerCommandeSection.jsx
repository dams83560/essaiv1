import React from 'react';

function EnregistrerCommandeSection({ enregistrerCommande }) {
  return (
    <section className="form-section">
      <button type="button" onClick={enregistrerCommande}>Enregistrer la commande</button>
    </section>
  );
}

export default EnregistrerCommandeSection;