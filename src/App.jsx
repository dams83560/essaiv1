import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NouvelleCommandeForm from './NouvelleCommandeForm';
import VoirCommandes from './VoirCommandes';
import './App.css';

function App() {
    return (
        <Router>
            <nav style={{ display: 'flex', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--couleur-secondaire)', borderRadius: '8px', marginBottom: '20px' }}>
                <button style={{
                    backgroundColor: 'var(--couleur-accent)',
                    color: 'white',
                    padding: '10px 20px',
                    margin: '0 10px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    textDecoration: 'none'
                }}
                    onClick={() => window.location.href = "/"}>
                    Nouvelle Commande
                </button>
                <button style={{
                    backgroundColor: 'var(--couleur-accent)',
                    color: 'white',
                    padding: '10px 20px',
                    margin: '0 10px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    textDecoration: 'none'
                }}
                    onClick={() => window.location.href = "/commandes"}>
                    Voir Commandes
                </button>
            </nav>

            <Routes>
                <Route path="/" element={<NouvelleCommandeForm />} />
                <Route path="/commandes" element={<VoirCommandes />} />
            </Routes>
        </Router>
    );
}

export default App;