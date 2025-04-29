import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import './App.css';
import { useNavigate } from 'react-router-dom';

function NouvelleCommandeForm() {
  const [dateRetrait, setDateRetrait] = useState('');
  const [heureRetrait, setHeureRetrait] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [telephoneClient, setTelephoneClient] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [nouveauNomArticle, setNouveauNomArticle] = useState('');
  const [nouvelleQuantite, setNouvelleQuantite] = useState(1);
  const [texteEntremets, setTexteEntremets] = useState('');
  const [articlesAjoutes, setArticlesAjoutes] = useState([]);
  const [notesSpeciales, setNotesSpeciales] = useState('');
  const [erreurs, setErreurs] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [heuresOuverture, setHeuresOuverture] = useState([]);
  const [confirmation, setConfirmation] = useState(false);
  const [enregistrementSuccess, setEnregistrementSuccess] = useState(false);
  const [commandeId, setCommandeId] = useState(null);

  const navigate = useNavigate();

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      setCommandeId(editId);
      chargerCommande(editId);
    }
  }, []);

  const chargerCommande = async (id) => {
    try {
      const commandeRef = doc(db, 'commandes', id);
      const commandeSnap = await getDoc(commandeRef);
      if (commandeSnap.exists()) {
        const commandeData = commandeSnap.data();
        setDateRetrait(commandeData.date_retrait);
        setHeureRetrait(commandeData.heure_retrait);
        setNomClient(commandeData.nom_client);
        setTelephoneClient(commandeData.telephone_client);
        setArticlesAjoutes(commandeData.articles);
        setNotesSpeciales(commandeData.notes_speciales);
      } else {
        console.error(`Commande avec l'ID ${id} non trouvée.`);
        setErrorMessage(`Commande non trouvée.`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      setErrorMessage('Erreur lors du chargement de la commande.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const ajouterArticle = () => {
    let nouvellesErreurs = { ...erreurs };
    if (!nouvelleCategorie) {
      nouvellesErreurs.categorie = 'La catégorie est obligatoire.';
    }
    if (!nouveauNomArticle) {
      nouvellesErreurs.nomArticle = 'Le nom de l\'article est obligatoire.';
    }
    if (!nouvelleQuantite || nouvelleQuantite <= 0) {
      nouvellesErreurs.quantite = 'La quantité doit être supérieure à zéro.';
    }

    if (Object.keys(nouvellesErreurs).length > 0) {
      setErreurs(nouvellesErreurs);
      return;
    }

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
    setErreurs({});
  };

  const supprimerArticle = (index) => {
    const updatedArticles = articlesAjoutes.filter((_, i) => i !== index);
    setArticlesAjoutes(updatedArticles);
  };

  const validerFormulaire = () => {
    let nouvellesErreurs = {};

    if (!dateRetrait) {
      nouvellesErreurs.dateRetrait = 'La date de retrait est obligatoire.';
    } else if (new Date(dateRetrait) < new Date().setHours(0, 0, 0, 0)) {
      nouvellesErreurs.dateRetrait = 'La date de retrait ne peut pas être dans le passé.';
    }

    if (!heureRetrait) {
      nouvellesErreurs.heureRetrait = 'L\'heure de retrait est obligatoire.';
    }

    if (!nomClient.trim()) {
      nouvellesErreurs.nomClient = 'Le nom du client est obligatoire.';
    }

    if (!telephoneClient.trim()) {
      nouvellesErreurs.telephoneClient = 'Le numéro de téléphone est obligatoire.';
    } else if (!/^\d{10}$/.test(telephoneClient.trim())) {
      nouvellesErreurs.telephoneClient = 'Le numéro de téléphone doit contenir 10 chiffres.';
    }

    if (articlesAjoutes.length === 0 && !(nouveauNomArticle && nouvelleQuantite > 0 && nouvelleCategorie)) {
      nouvellesErreurs.articlesAjoutes = 'Veuillez ajouter au moins un article à la commande.';
    }

    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  const reinitialiserFormulaire = () => {
    setDateRetrait('');
    setHeureRetrait('');
    setNomClient('');
    setTelephoneClient('');
    setNouvelleCategorie('');
    setNouveauNomArticle('');
    setNouvelleQuantite(1);
    setTexteEntremets('');
    setArticlesAjoutes([]);
    setNotesSpeciales('');
    setErreurs({});
    setSuccessMessage('');
    setConfirmation(false);
    setEnregistrementSuccess(false);
    setCommandeId(null);
  };

  const enregistrerCommande = async () => {
    if (validerFormulaire()) {
      setConfirmation(true);
    }
  };

  const confirmerEnregistrement = async () => {
    setConfirmation(false);

    let articlesPourEnregistrer = articlesAjoutes.length > 0 ? articlesAjoutes :
      (nouveauNomArticle && nouvelleQuantite > 0 && nouvelleCategorie) ?
        [{
          nom_article: nouveauNomArticle.trim(),
          quantite: nouvelleQuantite,
          categorie: nouvelleCategorie,
          texte_entremets: nouvelleCategorie === 'Entremets' ? texteEntremets.trim() : '',
          statut_article: 'En préparation'
        }] : [];

    try {
      console.log("Début de l'enregistrement de la commande...");
      const commandesCollection = collection(db, 'commandes');
      if (commandeId) {
        // Mode édition
        const commandeRef = doc(db, 'commandes', commandeId);
        await updateDoc(commandeRef, {
          date_retrait: dateRetrait,
          heure_retrait: heureRetrait,
          nom_client: nomClient.trim(),
          telephone_client: telephoneClient.trim(),
          articles: articlesPourEnregistrer,
          notes_speciales: notesSpeciales.trim(),
          statut_general: 'En préparation',
          date_creation: new Date()
        });
        console.log("Commande mise à jour avec l'ID:", commandeId);
        setEnregistrementSuccess(true);
        setTimeout(() => {
          setEnregistrementSuccess(false);
          reinitialiserFormulaire(); // Réinitialiser le formulaire
          navigate('/'); // Rediriger vers la page d'accueil
        }, 3000);
      } else {
        // Mode création
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
        setEnregistrementSuccess(true);
        setTimeout(() => {
          setEnregistrementSuccess(false);
          reinitialiserFormulaire(); // Réinitialiser le formulaire
          navigate('/'); // Rediriger vers la page d'accueil
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la commande:', error);
      setErreurs({ enregistrement: 'Erreur lors de l\'enregistrement de la commande.' });
    }
  };

  const annulerConfirmation = () => {
    setConfirmation(false);
  };

  const fermerEnregistrementSuccess = () => {
    setEnregistrementSuccess(false);
  };

  const handleHeureRetraitChange = (e) => {
    setHeureRetrait(e.target.value);
    setErreurs({});
  };

  // Effet pour effacer le message de succès quand on modifie le formulaire
  useEffect(() => {
    if (dateRetrait || heureRetrait || nomClient || telephoneClient || nouvelleCategorie || nouveauNomArticle || nouvelleQuantite || texteEntremets || articlesAjoutes.length > 0 || notesSpeciales) {
      setSuccessMessage('');
    }
  }, [dateRetrait, heureRetrait, nomClient, telephoneClient, nouvelleCategorie, nouveauNomArticle, nouvelleQuantite, texteEntremets, articlesAjoutes, notesSpeciales]);

  const articlesSectionClassName = erreurs.articlesAjoutes ? 'form-section form-section-erreur' : 'form-section';

  return (
    <div className="container">
      <h1>{commandeId ? 'Modifier Commande' : 'Nouvelle Commande'}</h1>

      {Object.keys(erreurs).length > 0 && (
        <div className="error-message">
          Veuillez corriger les erreurs suivantes :
          <ul>
            {Object.values(erreurs).map(erreur => (
              <li key={erreur}>{erreur}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="success-message inline-message">
          {successMessage}
        </div>
      )}

      <section className="form-section"
        style={erreurs.dateRetrait ? { border: '2px solid var(--couleur-erreur)', backgroundColor: '#FFF0F0' } : {}}>
        <h2>Date de Retrait</h2>
        <fieldset>
          <legend>Sélectionnez la date de retrait</legend>
          <div className="form-group">
            <label htmlFor="dateRetrait">Date de retrait:</label>
            <input
              type="date"
              id="dateRetrait"
              value={dateRetrait}
              onChange={(e) => setDateRetrait(e.target.value)}
              className={erreurs.dateRetrait ? 'input-erreur' : ''}
            />
            {erreurs.dateRetrait && <div className="erreur-champ">{erreurs.dateRetrait}</div>}
          </div>
        </fieldset>
      </section>

      <section className="form-section"
        style={erreurs.categorie || erreurs.nomArticle || erreurs.quantite || erreurs.articlesAjoutes ? { border: '2px solid var(--couleur-erreur)', backgroundColor: '#FFF0F0' } : {}}>
        <h2>Articles</h2>
        <fieldset>
          <legend>Détails de la commande</legend>
          <div className="form-group">
            <label htmlFor="nouvelleCategorie">Catégorie:</label>
            <select
              id="nouvelleCategorie"
              value={nouvelleCategorie}
              onChange={(e) => setNouvelleCategorie(e.target.value)}
              className={erreurs.categorie ? 'input-erreur' : ''}
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Boulangerie">Boulangerie</option>
              <option value="Patisserie">Patisserie</option>
              <option value="Entremets">Entremets</option>
              <option value="Snacking">Snacking</option>
            </select>
            {erreurs.categorie && <div className="erreur-champ">{erreurs.categorie}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="nouveauNomArticle">Nom de l'article:</label>
            <input
              type="text"
              id="nouveauNomArticle"
              value={nouveauNomArticle}
              onChange={(e) => setNouveauNomArticle(e.target.value)}
              placeholder="Entrez le nom de l'article"
              className={erreurs.nomArticle ? 'input-erreur' : ''}
            />
            {erreurs.nomArticle && <div className="erreur-champ">{erreurs.nomArticle}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="nouvelleQuantite">Quantité:</label>
            {nouvelleCategorie === 'Entremets' ? (
              <select
                id="nouvelleQuantite"
                value={nouvelleQuantite}
                onChange={(e) => setNouvelleQuantite(parseInt(e.target.value))}
                className={erreurs.quantite ? 'input-erreur' : ''}
              >
                {entremetsQuantities.map(qty => (
                  <option key={qty} value={qty}>{qty} {qty > 1 ? 'parts' : 'part'}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                id="nouvelleQuantite"
                value={nouvelleQuantite}
                min="1"
                onChange={(e) => setNouvelleQuantite(parseInt(e.target.value))}
                className={erreurs.quantite ? 'input-erreur' : ''}
              />
            )}
            {erreurs.quantite && <div className="erreur-champ">{erreurs.quantite}</div>}
          </div>
          {nouvelleCategorie === 'Entremets' && (
            <div className="form-group">
              <label htmlFor="texteEntremets">Texte pour entremets:</label>
              <input
                type="text"
                id="texteEntremets"
                value={texteEntremets}
                onChange={(e) => setTexteEntremets(e.target.value)}
                placeholder="Entrez le texte pour l'entremets"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="notesSpeciales">Notes spéciales (Allergies, Bougies, etc.):</label>
            <textarea
              id="notesSpeciales"
              value={notesSpeciales}
              onChange={(e) => setNotesSpeciales(e.target.value)}
              placeholder="Entrez les notes spéciales"
            ></textarea>
          </div>
          <button type="button" onClick={ajouterArticle}>Ajouter un article</button>
        </fieldset>
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

      <section className="form-section"
        style={erreurs.heureRetrait || erreurs.nomClient || erreurs.telephoneClient ? { border: '2px solid var(--couleur-erreur)', backgroundColor: '#FFF0F0' } : {}}>
        <h2>Heure et Informations Client</h2>
        <fieldset>
          <legend>Détails du client et heure de retrait</legend>
          <div className="form-group">
            <label htmlFor="heureRetrait">Heure de retrait (entre 06h00 et 19h00):</label>
            <select
              id="heureRetrait"
              value={heureRetrait}
              onChange={handleHeureRetraitChange}
              className={erreurs.heureRetrait ? 'input-erreur' : ''}
            >
              <option value="">Sélectionner une heure</option>
              {heuresOuverture.map(heure => (
                <option key={heure} value={heure}>{heure}</option>
              ))}
            </select>
            {erreurs.heureRetrait && <div className="erreur-champ">{erreurs.heureRetrait}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="nomClient">Nom du client:</label>
            <input
              type="text"
              id="nomClient"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Entrez le nom du client"
              className={erreurs.nomClient ? 'input-erreur' : ''}
            />
            {erreurs.nomClient && <div className="erreur-champ">{erreurs.nomClient}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="telephoneClient">Téléphone:</label>
            <input
              type="tel"
              id="telephoneClient"
              value={telephoneClient}
              onChange={(e) => setTelephoneClient(e.target.value)}
              placeholder="Entrez le numéro de téléphone"
              className={erreurs.telephoneClient ? 'input-erreur' : ''}
            />
            {erreurs.telephoneClient && <div className="erreur-champ">{erreurs.telephoneClient}</div>}
          </div>
        </fieldset>
      </section>

      <section className="form-section enregistrer-section">
        <button type="button" onClick={enregistrerCommande}>
          {commandeId ? 'Mettre à jour la commande' : 'Enregistrer la commande'}
        </button>
        {Object.keys(erreurs).length > 0 && (
          <div className="error-message inline-message">
            Veuillez corriger les erreurs suivantes :
            <ul>
              {Object.values(erreurs).map(erreur => (
                <li key={erreur}>{erreur}</li>
              ))}
            </ul>
          </div>
        )}
        {successMessage && (
          <div className="success-message inline-message">
            {successMessage}
          </div>
        )}
      </section>

      {confirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-box">
            <h2>Confirmer la commande</h2>
            <p>Veuillez vérifier les informations de la commande avant de l'enregistrer.</p>
            <div className="confirmation-details">
              <p>Date de retrait: {dateRetrait}</p>
              <p>Heure de retrait: {heureRetrait}</p>
              <p>Nom du client: {nomClient}</p>
              <p>Téléphone: {telephoneClient}</p>
              {articlesAjoutes.map((article, index) => (
                <p key={index}>
                  {article.nom_article} ({article.quantite} {article.categorie})
                </p>
              ))}
              {notesSpeciales && <p>Notes spéciales: {notesSpeciales}</p>}
            </div>
            <div className="confirmation-buttons">
              <button type="button" onClick={confirmerEnregistrement}>Confirmer</button>
              <button type="button" onClick={annulerConfirmation}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {enregistrementSuccess && (
        <div className="confirmation-overlay">
          <div className="confirmation-box">
            <h2>Commande enregistrée</h2>
            <p>{commandeId ? 'La commande a été mise à jour avec succès !' : 'La commande a été enregistrée avec succès !'}</p>
            <div className="confirmation-buttons">
              <button type="button" onClick={fermerEnregistrementSuccess}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NouvelleCommandeForm;