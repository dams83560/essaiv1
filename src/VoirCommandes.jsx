import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './App.css';

function VoirCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [dateFiltre, setDateFiltre] = useState('');
  const [nomFiltre, setNomFiltre] = useState('');
  const commandesCollection = collection(db, 'commandes');
  const statutGeneralChangeSource = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(commandesCollection, (snapshot) => {
      const commandesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommandes(commandesData);
    });

    return () => unsubscribe();
  }, []);

  const changerStatutCommande = useCallback(async (commandeId, nouveauStatut, updateArticles = true) => {
    const commandeRef = doc(db, 'commandes', commandeId);
    try {
      await updateDoc(commandeRef, { statut_general: nouveauStatut });
      console.log(`Statut général de la commande ${commandeId} mis à jour à ${nouveauStatut}`);
      if (updateArticles) {
        const updatedArticles = commandes.find(cmd => cmd.id === commandeId)?.articles.map(article => ({
          ...article,
          statut_article: nouveauStatut
        }));
        if (updatedArticles) {
          await updateDoc(commandeRef, { articles: updatedArticles });
        }
        statutGeneralChangeSource.current = 'commande';
      } else {
        statutGeneralChangeSource.current = 'article';
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut général de la commande ${commandeId}:`, error);
      alert(`Erreur lors de la mise à jour du statut général.`);
    }
  }, [commandes]);

  const changerStatutArticle = async (commandeId, articleIndex, nouveauStatut) => {
    const commandeRef = doc(db, 'commandes', commandeId);
    try {
      const updatedArticles = commandes.find(cmd => cmd.id === commandeId)?.articles.map((article, index) =>
        index === articleIndex ? { ...article, statut_article: nouveauStatut } : article
      );
      if (updatedArticles) {
        await updateDoc(commandeRef, { articles: updatedArticles });
        console.log(`Statut de l'article ${articleIndex} de la commande ${commandeId} mis à jour à ${nouveauStatut}`);
        const allEmballes = updatedArticles.every(article => article.statut_article === 'Emballée');
        const allRecuperes = updatedArticles.every(article => article.statut_article === 'Récupérée');
        let nouveauStatutGeneral = commandes.find(cmd => cmd.id === commandeId)?.statut_general;

        if (allRecuperes) {
          nouveauStatutGeneral = 'Récupérée';
        } else if (allEmballes) {
          nouveauStatutGeneral = 'Emballée';
        } else {
          nouveauStatutGeneral = 'En préparation';
        }

        if (nouveauStatutGeneral !== commandes.find(cmd => cmd.id === commandeId)?.statut_general) {
          await changerStatutCommande(commandeId, nouveauStatutGeneral, false);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de l'article ${articleIndex} de la commande ${commandeId}:`, error);
      alert(`Erreur lors de la mise à jour du statut de l'article.`);
    }
  };

  useEffect(() => {
    commandes.forEach(commande => {
      const allEmballes = commande.articles.every(article => article.statut_article === 'Emballée');
      const allRecuperes = commande.articles.every(article => article.statut_article === 'Récupérée');
      let nouveauStatutGeneral = commande.statut_general;

      if (allRecuperes) {
        nouveauStatutGeneral = 'Récupérée';
      } else if (allEmballes) {
        nouveauStatutGeneral = 'Emballée';
      } else {
        nouveauStatutGeneral = 'En préparation';
      }

      if (nouveauStatutGeneral !== commande.statut_general && statutGeneralChangeSource.current !== 'commande') {
        changerStatutCommande(commande.id, nouveauStatutGeneral, false);
      }
    });
    statutGeneralChangeSource.current = null;
  }, [commandes, changerStatutCommande]);

  const getCommandeClassName = (statutGeneral) => {
    switch (statutGeneral) {
      case 'En préparation':
        return 'commande-en-preparation';
      case 'Emballée':
        return 'commande-emballée';
      case 'Récupérée':
        return 'commande-recuperee';
      default:
        return '';
    }
  };

  const commandesFiltrees = commandes
    .filter(commande => !dateFiltre || commande.date_retrait === dateFiltre)
    .filter(commande => !nomFiltre || commande.nom_client.toLowerCase().includes(nomFiltre.toLowerCase()));

  const handleImprimerBonsProduction = () => {
    const pagesHTML = [];
    const bonsParPage = 12;
    let compteurBons = 0;
    let bonsPage = [];

    commandesFiltrees.forEach(commande => {
      commande.articles.forEach(article => {
        const unite = article.categorie === 'Entremets' ? ' part(s)' : ' pièce(s)';
        bonsPage.push(`
          <div class="bon-production">
            <h4 class="jour-retrait">${new Date(commande.date_retrait).toLocaleDateString('fr-FR', { weekday: 'long' }).charAt(0).toUpperCase() + new Date(commande.date_retrait).toLocaleDateString('fr-FR', { day: 'numeric' })}</h4>
            <h3 class="nom-article">${article.nom_article.toUpperCase()}</h3>
            <p class="quantite">${article.quantite}${unite}</p>
            ${commande.notes_speciales ? `<p class="note-speciale">${commande.notes_speciales}</p>` : ''}
            <p class="heure-retrait">${commande.heure_retrait}</p>
          </div>
        `);
        compteurBons++;

        if (compteurBons % bonsParPage === 0) {
          pagesHTML.push(`<div class="grid-container">${bonsPage.join('')}</div>`);
          bonsPage = [];
        }
      });
    });

    if (pagesHTML.length > 0) {
      const imprimerFenetre = window.open('', '_blank');
      imprimerFenetre.document.write(`
        <html>
          <head>
            <title>Bons de Production</title>
            <style>
              @media print {
                /* Suppression agressive des marges et paddings */
                body, html {
                  font-family: sans-serif;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important; /* Pour s'assurer que tout le contenu est rendu */
                }
                .grid-container {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  grid-template-rows: repeat(4, 1fr);
                  gap: 0;
                  width: 210mm !important; /* Largeur A4 */
                  height: 297mm !important; /* Hauteur A4 */
                  margin: 0 auto !important; /* Centrer sans marges */
                  padding: 0 !important; /* Enlever le padding autour de la grille pour tester */
                  box-sizing: border-box !important;
                  page-break-after: always;
                }
                .grid-container:last-child {
                  page-break-after: avoid;
                }
                .bon-production {
                  border-right: 1px solid black;
                  border-bottom: 1px solid black;
                  box-sizing: border-box !important;
                  padding: 10px !important;
                  font-size: 14px !important;
                  text-align: center !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-around !important;
                  align-items: center !important;
                  width: 100% !important;
                  height: 100% !important;
                  margin: 0 !important;
                }
                .bon-production:nth-child(3n) {
                  border-right: none !important;
                }
                .jour-retrait {
                  font-size: 1.1em !important;
                  font-weight: bold !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5em !important;
                }
                .nom-article {
                  font-size: 1.5em !important;
                  font-weight: bold !important;
                  margin-top: 0.5em !important;
                  margin-bottom: 0.5em !important;
                }
                .quantite {
                  font-size: 1.2em !important;
                  margin-bottom: 0.5em !important;
                }
                .note-speciale {
                  color: black !important;
                  font-size: 1em !important;
                  font-style: italic !important;
                  margin-bottom: 0.5em !important;
                }
                .heure-retrait {
                  font-size: 1.3em !important;
                  font-weight: bold !important;
                  margin-bottom: 0 !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 0mm !important; /* Tentative explicite de supprimer les marges */
                  padding: 0mm !important; /* Suppression du padding de la page au cas où */
                }
              }
            </style>
          </head>
          <body>
            ${pagesHTML.join('')}
          </body>
        </html>
      `);
      imprimerFenetre.document.close();
      imprimerFenetre.print();
    } else {
      alert('Aucun bon de production à imprimer selon les filtres actuels.');
    }
  };

  const getArticleRowClassName = (statutArticle) => {
    switch (statutArticle) {
      case 'En préparation':
        return 'article-en-preparation';
      case 'Emballée':
        return 'article-emballee';
      case 'Récupérée':
        return 'article-recuperee';
      default:
        return '';
    }
  };

  return (
    <div className="container">
      <h1>Voir Commandes</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <label htmlFor="filtreDate">Afficher les commandes du :</label>
          <input
            type="date"
            id="filtreDate"
            value={dateFiltre}
            onChange={(e) => setDateFiltre(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filtreNom">Filtrer par nom :</label>
          <input
            type="text"
            id="filtreNom"
            value={nomFiltre}
            onChange={(e) => setNomFiltre(e.target.value)}
            placeholder="Nom du client"
          />
        </div>
        <button onClick={handleImprimerBonsProduction}>Imprimer les bons de production</button>
      </div>
      {commandesFiltrees.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {commandesFiltrees.map(commande => {
            const afficherEntremets = commande.articles.some(article => article.categorie === 'Entremets');

            return (
              <div key={commande.id} className={`commande-card ${getCommandeClassName(commande.statut_general)}`}>
                <div className="commande-info">
                  <h3>Commande pour {commande.nom_client}</h3>
                  <p>Retrait le: {commande.dateRetrait} à {commande.heureRetrait} - Téléphone: {commande.telephoneClient}</p>
                  {commande.notes_speciales && <p>Notes: {commande.notes_speciales}</p>}
                  <div className="commande-statut">
                    Statut général:
                    <select
                      value={commande.statut_general}
                      onChange={(e) => changerStatutCommande(commande.id, e.target.value)}
                    >
                      <option value="En préparation">En préparation</option>
                      <option value="Emballée">Emballée</option>
                      <option value="Récupérée">Récupérée</option>
                    </select>
                  </div>
                </div>
                <table className="commande-table">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th>Nom</th>
                      <th>Quantité</th>
                      {afficherEntremets && <th>Entremets</th>} {/* Entremets avant Statut */}
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commande.articles.map((article, index) => (
                      <tr key={index} className={getArticleRowClassName(article.statut_article)}>  {/* Ajout de la classe dynamique */}
                        <td>{article.categorie}</td>
                        <td>{article.nom_article}</td>
                        <td>
                          {article.quantite} {article.categorie === 'Entremets' ? 'part(s)' : 'pièce(s)'}
                        </td>
                        {afficherEntremets && <td>{article.texte_entremets || '-'}</td>} {/* Entremets avant Statut */}
                        <td>
                          <div className="article-statut">
                            <select
                              value={article.statut_article}
                              onChange={(e) => changerStatutArticle(commande.id, index, e.target.value)}
                            >
                              <option value="En préparation">En préparation</option>
                              <option value="Emballée">Emballée</option>
                              <option value="Récupérée">Récupérée</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        dateFiltre || nomFiltre ? (
          <p>Aucune commande correspondant aux critères de filtre.</p>
        ) : (
          <p>Aucune commande enregistrée pour le moment.</p>
        )
      )}
    </div>
  );
}

export default VoirCommandes;