import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './App.css';

function NouvelleCommandeForm() {
  const [dateRetrait, setDateRetrait] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [nouveauNomArticle, setNouveauNomArticle] = useState('');
  const [nouvelleQuantite, setNouvelleQuantite] = useState(1);
  const [texteEntremets, setTexteEntremets] = useState('');
  const [articlesAjoutes, setArticlesAjoutes] = useState([]);
  const [notesSpeciales, setNotesSpeciales] = useState('');
  const [heureRetrait, setHeureRetrait] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [telephoneClient, setTelephoneClient] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [heuresOuverture, setHeuresOuverture] = useState([]);

  const entremetsQuantities = [4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  useEffect(() => {
    const heures = [];
    for (let heure = 6; heure < 19; heure++) {
      heures.push(`${heure.toString().padStart(2, '0')}:00`);
      heures.push(`${heure.toString().padStart(2, '0')}:30`);
    }
    heures.push('19:00');
    setHeuresOuverture(heures);
  }, []);

  const ajouterArticle = () => {
    if (nouveauNomArticle && nouvelleQuantite > 0 && nouvelleCategorie) {
      setArticlesAjoutes([...articlesAjoutes, {
        nom_article: nouveauNomArticle,
        quantite: nouvelleQuantite,
        categorie: nouvelleCategorie,
        texte_entremets: nouvelleCategorie === 'Entremets' ? texteEntremets : '',
        statut_article: 'En préparation'
      }]);
      setNouveauNomArticle('');
      setNouvelleQuantite(1);
      setNouvelleCategorie('');
      setTexteEntremets('');
    } else {
      setErrorMessage('Veuillez renseigner le nom, la quantité et la catégorie de l\'article.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const supprimerArticle = (index) => {
    const updatedArticles = articlesAjoutes.filter((_, i) => i !== index);
    setArticlesAjoutes(updatedArticles);
  };

  const enregistrerCommande = async () => {
    // Vérifie si tous les champs de base sont remplis
    if (dateRetrait && heureRetrait && nomClient.trim() && telephoneClient.trim()) {
      // Si aucun article n'a été ajouté explicitement, mais que les champs d'article sont remplis,
      // crée un tableau articlesAjoutes temporaire avec l'article actuel.
      let articlesPourEnregistrer = articlesAjoutes.length > 0 ? articlesAjoutes : 
        (nouveauNomArticle && nouvelleQuantite > 0 && nouvelleCategorie) ? 
        [{
          nom_article: nouveauNomArticle.trim(),
          quantite: nouvelleQuantite,
          categorie: nouvelleCategorie,
          texte_entremets: nouvelleCategorie === 'Entremets' ? texteEntremets.trim() : '',
          statut_article: 'En préparation'
        }] : [];

      // Vérifie si des articles sont présents (soit ajoutés explicitement, soit l'article unique)
      if (articlesPourEnregistrer.length > 0) {
        try {
          console.log("Début de l'enregistrement de la commande...");
          const commandesCollection = collection(db, 'commandes');
          const docRef = await addDoc(commandesCollection, {
            date_retrait: dateRetrait,
            heure_retrait: heureRetrait,
            nom_client: nomClient.trim(),
            telephone_client: telephoneClient.trim(),
            articles: articlesPourEnregistrer,
            notes_speciales: notesSpeciales.trim(),
            statut_general: 'En préparation',
            date_creation: new Date()
          });
          console.log("Commande enregistrée avec l'ID:", docRef.id);
          setSuccessMessage('Commande enregistrée avec succès!');
          setTimeout(() => setSuccessMessage(''), 3000);
          setDateRetrait('');
          setNouvelleCategorie('');
          setNouveauNomArticle('');
          setNouvelleQuantite(1);
          setTexteEntremets('');
          setArticlesAjoutes([]);
          setNotesSpeciales('');
          setHeureRetrait('');
          setNomClient('');
          setTelephoneClient('');
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la commande:', error);
          setErrorMessage('Erreur lors de l\'enregistrement de la commande.');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      } else {
        setErrorMessage('Veuillez ajouter au moins un article à la commande.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } else {
      setErrorMessage('Veuillez remplir tous les champs.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleHeureRetraitChange = (e) => {
    setHeureRetrait(e.target.value);
  };

  return (
    <div className="container">
      <h1>Nouvelle Commande</h1>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <section className="form-section">
        <h2>Date de Retrait</h2>
        <div className="form-group">
          <label htmlFor="dateRetrait">Date de retrait:</label>
          <input type="date" id="dateRetrait" value={dateRetrait} onChange={(e) => setDateRetrait(e.target.value)} />
        </div>
      </section>

      <section className="form-section">
        <h2>Articles</h2>
        <div className="form-group">
          <label htmlFor="nouvelleCategorie">Catégorie:</label>
          <select id="nouvelleCategorie" value={nouvelleCategorie} onChange={(e) => setNouvelleCategorie(e.target.value)}>
            <option value="">Sélectionner une catégorie</option>
            <option value="Boulangerie">Boulangerie</option>
            <option value="Patisserie">Patisserie</option>
            <option value="Entremets">Entremets</option>
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
        <button type="button" onClick={ajouterArticle}>Ajouter un article</button>
      </section>

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

      <section className="form-section">
        <h2>Détails Complémentaires</h2>
        <div className="form-group">
          <label htmlFor="notesSpeciales">Notes spéciales (Allergies, Bougies, etc.):</label>
          <textarea id="notesSpeciales" value={notesSpeciales} onChange={(e) => setNotesSpeciales(e.target.value)} placeholder="Entrez les notes spéciales" ></textarea>
        </div>
      </section>

      <section className="form-section">
        <h2>Heure et Informations Client</h2>
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
        <button type="button" onClick={enregistrerCommande}>Enregistrer la commande</button>
      </section>
    </div>
  );
}

export default NouvelleCommandeForm;