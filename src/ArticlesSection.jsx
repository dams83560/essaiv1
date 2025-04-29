import React from 'react';

function ArticlesSection({
  nouvelleCategorie,
  setNouvelleCategorie,
  nouveauNomArticle,
  setNouveauNomArticle,
  nouvelleQuantite,
  setNouvelleQuantite,
  texteEntremets,
  setTexteEntremets,
  articlesAjoutes,
  setArticlesAjoutes,
  ajouterArticle,
  supprimerArticle,
  notesSpeciales, // Ajout de notesSpeciales comme prop
  setNotesSpeciales // Ajout de setNotesSpeciales comme prop
}) {
  const entremetsQuantities = [4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  return (
    <section className="form-section">
      <h2>Articles</h2>
      <fieldset>
        <legend>Détails de la commande</legend>
        <div className="form-group">
          <label htmlFor="nouvelleCategorie">Catégorie:</label>
          <select id="nouvelleCategorie" value={nouvelleCategorie} onChange={(e) => setNouvelleCategorie(e.target.value)}>
            <option value="">Sélectionner une catégorie</option>
            <option value="Boulangerie">Boulangerie</option>
            <option value="Patisserie">Patisserie</option>
            <option value="Entremets">Entremets</option>
            <option value="Snacking">Snacking</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="nouveauNomArticle">Nom de l'article:</label>
          <input type="text" id="nouveauNomArticle" value={nouveauNomArticle} onChange={(e) => setNouveauNomArticle(e.target.value)} placeholder="Entrez le nom de l'article" />
        </div>
        <div className="form-group">
          <label htmlFor="nouvelleQuantite">Quantité:</label>
          {nouvelleCategorie === 'Entremets' ? (
            <select id="nouvelleQuantite" value={nouvelleQuantite} onChange={(e) => setNouvelleQuantite(parseInt(e.target.value))}>
              {entremetsQuantities.map(qty => (
                <option key={qty} value={qty}>{qty} {qty > 1 ? 'parts' : 'part'}</option>
              ))}
            </select>
          ) : (
            <input type="number" id="nouvelleQuantite" value={nouvelleQuantite} min="1" onChange={(e) => setNouvelleQuantite(parseInt(e.target.value))} />
          )}
        </div>
        {nouvelleCategorie === 'Entremets' && (
          <div className="form-group">
            <label htmlFor="texteEntremets">Texte pour entremets:</label>
            <input type="text" id="texteEntremets" value={texteEntremets} onChange={(e) => setTexteEntremets(e.target.value)} placeholder="Entrez le texte pour l'entremets" />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="notesSpeciales">Notes spéciales (Allergies, Bougies, etc.):</label>
          <textarea id="notesSpeciales" value={notesSpeciales} onChange={(e) => setNotesSpeciales(e.target.value)} placeholder="Entrez les notes spéciales" ></textarea>
        </div>
        <button type="button" onClick={ajouterArticle}>Ajouter un article</button>
      </fieldset>
      {articlesAjoutes.length > 0 && (
        <section className="form-section">
          <h2>Articles ajoutés:</h2>
          <ul>
            {articlesAjoutes.map((article, index) => (
              <li key={index}>
                {article.nom_article} ({article.quantite} {article.quantite > 1 ? (article.categorie === 'Entremets' ? 'parts' : 'pièces') : (article.categorie === 'Entremets' ? 'part' : 'pièce')}) - {article.categorie} {article.texte_entremets && `(${article.texte_entremets})`}
                <button type="button" onClick={() => supprimerArticle(index)} className="delete-button">Supprimer</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export default ArticlesSection;