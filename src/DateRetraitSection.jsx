import React from 'react';

function DateRetraitSection({ dateRetrait, setDateRetrait }) {
  return (
    <section className="form-section">
      <h2>Date de Retrait</h2>
      <fieldset>
        <legend>Sélectionnez la date de retrait</legend>
        <div className="form-group">
          <label htmlFor="dateRetrait">Date de retrait:</label>
          <input type="date" id="dateRetrait" value={dateRetrait} onChange={(e) => setDateRetrait(e.target.value)} />
        </div>
      </fieldset>
    </section>
  );
}

export default DateRetraitSection;