import React from 'react';

function CommandeFormHeader({ errorMessage, successMessage }) {
  return (
    <div>
      <h1>Nouvelle Commande</h1>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
}

export default CommandeFormHeader;