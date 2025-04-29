import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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

    const commandesFiltrees = React.useMemo(() => {
        return commandes.filter(commande =>
            (!dateFiltre || commande.date_retrait === dateFiltre) &&
            (!nomFiltre || commande.nom_client.toLowerCase().includes(nomFiltre.toLowerCase()))
        );
    }, [commandes, dateFiltre, nomFiltre]);

    const genererBonsProductionHTML = (bonsAImprimer) => {
        const pagesHTML = [];
        const bonsParPage = 12;
        for (let i = 0; i < bonsAImprimer.length; i += bonsParPage) {
            const pageBons = bonsAImprimer.slice(i, i + bonsParPage);
            pagesHTML.push(`<div class="grid-container">${pageBons.join('')}</div>`);
        }
        return pagesHTML.join('');
    };

    const handleImprimerBonsProduction = () => {
        const bonsAImprimer = [];

        commandesFiltrees.forEach(commande => {
            commande.articles.forEach(article => {
                const dateRetraitFormattee = new Date(commande.date_retrait).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric'
                });
                const nomJour = dateRetraitFormattee.charAt(0).toUpperCase() + dateRetraitFormattee.slice(1);
                const unite = article.categorie === 'Entremets' ? ' part(s)' : ' pièce(s)';

                bonsAImprimer.push(`
                    <div class="bon-production">
                        <h4 class="jour-retrait">${nomJour}</h4>
                        <h3 class="nom-article">${article.nom_article.toUpperCase()}</h3>
                        <p class="quantite">${article.quantite} ${unite}</p>
                        ${commande.notes_speciales ? `<p class="note-speciale">${commande.notes_speciales}</p>` : ''}
                        <p class="heure-retrait">${commande.heure_retrait}</p>
                    </div>
                `);
            });
        });

        if (bonsAImprimer.length > 0) {
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
                        ${genererBonsProductionHTML(bonsAImprimer)}
                    </body>
                </html>
            `);
            imprimerFenetre.document.close();
            imprimerFenetre.print();
            imprimerFenetre.location.href = "/commandes"; // Redirection après impression
        } else {
            alert('Aucun bon de production à imprimer selon les filtres actuels.');
        }
    };

    const imprimerCommande = (commande) => {
        const imprimerFenetre = window.open('', '_blank');
        imprimerFenetre.document.write(`
            <html>
                <head>
                    <title>Commande ${commande.id}</title>
                    <style>
                        body { font-family: sans-serif; }
                        .commande-details { border: 1px solid #000; padding: 10px; margin-bottom: 20px; }
                        .article-table { width: 100%; border-collapse: collapse; }
                        .article-table th, .article-table td { border: 1px solid #000; padding: 5px; text-align: left; }
                        .article-table th { background-color: #f0f0f0; }
                    </style>
                </head>
                <body>
                    <h1>Commande ${commande.id}</h1>
                    <div class="commande-details">
                        <p><strong>Client:</strong> ${commande.nom_client}</p>
                        <p><strong>Téléphone:</strong> ${commande.telephone_client}</p>
                        <p><strong>Date de Retrait:</strong> ${commande.date_retrait}</p>
                        <p><strong>Heure de Retrait:</strong> ${commande.heure_retrait}</p>
                        ${commande.notes_speciales ? `<p><strong>Notes:</strong> ${commande.notes_speciales}</p>` : ''}
                    </div>
                    <h2>Articles:</h2>
                    <table class="article-table">
                        <thead>
                            <tr>
                                <th>Catégorie</th>
                                <th>Nom</th>
                                <th>Quantité</th>
                                ${commande.articles.some(article => article.categorie === 'Entremets') ? '<th>Texte Entremets</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${commande.articles.map((article, index) => `
                                <tr>
                                    <td>${article.categorie}</td>
                                    <td>${article.nom_article}</td>
                                    <td>${article.quantite} ${article.quantite > 1 ? (article.categorie === 'Entremets' ? 'parts' : 'pièces') : (article.categorie === 'Entremets' ? 'part' : 'pièce')}</td>
                                    ${commande.articles.some(article => article.categorie === 'Entremets') ? `<td>${article.texte_entremets || ''}</td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        imprimerFenetre.document.close();
        imprimerFenetre.print();
        imprimerFenetre.location.href = "/commandes"; // Redirection après impression
    };

    const supprimerCommande = async (commandeId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
            try {
                await deleteDoc(doc(db, 'commandes', commandeId));
                console.log(`Commande ${commandeId} supprimée avec succès.`);
                // Pas besoin de mettre à jour l'état local, onSnapshot s'en chargera
            } catch (error) {
                console.error(`Erreur lors de la suppression de la commande ${commandeId}:`, error);
                alert(`Erreur lors de la suppression de la commande.`);
            }
        }
    };

    const modifierCommande = (commandeId) => {
        // Rediriger vers le formulaire de nouvelle commande avec l'ID de la commande à modifier
        window.location.href = `/?edit=${commandeId}`;
    };

    return (
        <div className="container">
            <h1>Voir Commandes</h1>
            <div className="filtres-container">
                <div className="filtre-date-container">
                    <label htmlFor="filtreDate">Afficher les commandes du :</label>
                    <input
                        type="date"
                        id="filtreDate"
                        value={dateFiltre}
                        onChange={(e) => setDateFiltre(e.target.value)}
                    />
                </div>
                <div className="filtre-nom-container">
                    <label htmlFor="filtreNom">Filtrer par nom :</label>
                    <input
                        type="text"
                        id="filtreNom"
                        value={nomFiltre}
                        onChange={(e) => setNomFiltre(e.target.value)}
                        placeholder="Nom du client"
                    />
                </div>
            </div>
            <button onClick={handleImprimerBonsProduction} className="print-button">Imprimer les bons</button>
            <div>
                {commandesFiltrees.length > 0 ? (
                    <div>
                        {commandesFiltrees.map(commande => {
                            const afficherEntremets = commande.articles.some(article => article.categorie === 'Entremets');

                            return (
                                <div key={commande.id} className={`commande-card ${getCommandeClassName(commande.statut_general)}`}>
                                    <div className="commande-info">
                                        <h3>Commande pour {commande.nom_client}</h3>
                                        <div className="commande-info-header"> {/* Nouveau conteneur */}
                                            <p className="commande-info-retrait">
                                                Retrait le: <strong>{commande.date_retrait}</strong> à <strong>{commande.heure_retrait}</strong> - Téléphone: <strong>{commande.telephone_client}</strong>
                                            </p>
                                            <div className="commande-statut"> {/* Statut sur la même ligne */}
                                                Statut:
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
                                        {commande.notes_speciales && <p>Notes: {commande.notes_speciales}</p>}
                                        <div className="commande-actions">
                                            <button onClick={() => modifierCommande(commande.id)} className="modifier-button">✏️</button> {/* Icône Modifier */}
                                            <button onClick={() => supprimerCommande(commande.id)} className="supprimer-button">🗑️</button> {/* Icône Supprimer */}
                                            <button onClick={() => imprimerCommande(commande)} className="imprimer-commande-button">🖨️</button> {/* Icône Imprimer */}
                                        </div>
                                    </div>
                                    <table className="commande-table">
                                        <thead>
                                            <tr>
                                                <th>Catégorie</th>
                                                <th>Nom</th>
                                                <th>Quantité</th>
                                                {afficherEntremets && <th>Entremets</th>}
                                                <th>Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commande.articles.map((article, index) => (
                                                <tr key={index} className={getArticleRowClassName(article.statut_article)}>
                                                    <td>{article.categorie}</td>
                                                    <td>{article.nom_article}</td>
                                                    <td>
                                                        {article.quantite} {article.categorie === 'Entremets' ? 'part(s)' : 'pièces(s)'}
                                                    </td>
                                                    {afficherEntremets && <td>{article.texte_entremets || '-'}</td>}
                                                    <td>
                                                        <div className="article-statut">
                                                            <select
                                                                value={article.statut_article}
                                                                onChange={(e) => changerStatutArticle(commande.id, index, e.target.value)}
                                                                className={article.statut_article === 'Récupérée' ? 'recuperee' : ''}
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
        </div>
    );
}

export default VoirCommandes;