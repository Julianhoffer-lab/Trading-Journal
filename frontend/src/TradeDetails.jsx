// src/TradeDetails.jsx
import React, { useState, useEffect } from 'react';

export default function TradeDetails({ trade, theme = {}, onClose, onUpdateTrade }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Formular-State für bearbeitbare Felder
    const [formData, setFormData] = useState({
        symbol: '',
        direction: 'LONG',
        riskAmount: '',
        finalRR: '',
        notes: ''
    });

    // Befüllt das Formular neu, wenn ein neuer Trade geöffnet wird
    useEffect(() => {
        if (trade) {
            setFormData({
                symbol: trade.symbol || '',
                direction: trade.direction || 'LONG',
                riskAmount: trade.riskAmount != null ? trade.riskAmount : '',
                finalRR: trade.finalRR != null ? trade.finalRR : '',
                notes: trade.notes || ''
            });
            setIsEditing(false);
        }
    }, [trade]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedData = {
                ...trade,
                symbol: formData.symbol,
                direction: formData.direction,
                riskAmount: formData.riskAmount !== '' ? parseFloat(formData.riskAmount) : null,
                finalRR: formData.finalRR !== '' ? parseFloat(formData.finalRR) : null,
                notes: formData.notes
            };

            const response = await fetch(`http://localhost:8080/api/trades/${trade.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern der Änderungen');

            const savedTrade = await response.json();
            onUpdateTrade(savedTrade);
            setIsEditing(false);
        } catch (err) {
            alert('Speichern fehlgeschlagen: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!trade) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div style={{
                backgroundColor: theme.cardBg || '#1e1e1e',
                border: `1px solid ${theme.border || '#333'}`,
                borderRadius: '12px',
                width: '100%', maxWidth: '700px',
                maxHeight: '90vh', overflowY: 'auto',
                color: theme.text || '#fff',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>

                {/* MODAL HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `1px solid ${theme.border || '#333'}`, paddingBottom: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: theme.heading || '#fff' }}>Trade #{trade.id} Details</h2>
                        <span style={{ fontSize: '0.85rem', color: theme.subText || '#aaa' }}>
                            Erfasst am: {trade.tradeDateTime ? new Date(trade.tradeDateTime).toLocaleString('de-DE') : '-'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                title="Trade bearbeiten"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${theme.border || '#444'}`,
                                    color: theme.text || '#fff',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                ✏️ Bearbeiten
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{
                                        backgroundColor: '#28a745', color: 'white', border: 'none',
                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    {isSaving ? 'Speichert...' : '💾 Speichern'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        backgroundColor: '#6c757d', color: 'white', border: 'none',
                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
                                    }}
                                >
                                    Abbrechen
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', color: theme.subText || '#aaa',
                                fontSize: '1.5rem', cursor: 'pointer', marginLeft: '8px'
                            }}
                        >
                            ✖
                        </button>
                    </div>
                </div>

                {/* DETAILS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

                    {/* Symbol */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: theme.subText || '#aaa', display: 'block' }}>Asset / Symbol</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                style={inputStyle(theme)}
                            />
                        ) : (
                            <strong style={{ fontSize: '1.1rem' }}>{trade.symbol}</strong>
                        )}
                    </div>

                    {/* Direction */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: theme.subText || '#aaa', display: 'block' }}>Richtung</label>
                        {isEditing ? (
                            <select name="direction" value={formData.direction} onChange={handleChange} style={inputStyle(theme)}>
                                <option value="LONG">LONG</option>
                                <option value="SHORT">SHORT</option>
                            </select>
                        ) : (
                            <span style={{
                                color: trade.direction === 'LONG' ? '#28a745' : '#dc3545',
                                fontWeight: 'bold', fontSize: '1.1rem'
                            }}>
                                {trade.direction}
                            </span>
                        )}
                    </div>

                    {/* Risiko Amount */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: theme.subText || '#aaa', display: 'block' }}>Risiko ($ / CHF)</label>
                        {isEditing ? (
                            <input
                                type="number"
                                name="riskAmount"
                                value={formData.riskAmount}
                                onChange={handleChange}
                                placeholder="z.B. 100"
                                style={inputStyle(theme)}
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                {trade.riskAmount != null ? `$${trade.riskAmount}` : <i style={{ color: '#dc3545' }}>Fehlt</i>}
                            </span>
                        )}
                    </div>

                    {/* Final RR */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: theme.subText || '#aaa', display: 'block' }}>Ergebnis (finalRR)</label>
                        {isEditing ? (
                            <input
                                type="number"
                                step="0.1"
                                name="finalRR"
                                value={formData.finalRR}
                                onChange={handleChange}
                                placeholder="z.B. 2.5"
                                style={inputStyle(theme)}
                            />
                        ) : (
                            <span style={{
                                fontSize: '1.1rem', fontWeight: 'bold',
                                color: parseFloat(trade.finalRR || 0) >= 0 ? '#28a745' : '#dc3545'
                            }}>
                                {trade.finalRR != null ? `${trade.finalRR} R` : '-'}
                            </span>
                        )}
                    </div>
                </div>

                {/* NOTIZEN AREA */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: theme.subText || '#aaa', display: 'block', marginBottom: '6px' }}>
                        📝 Trade-Notizen
                    </label>
                    {isEditing ? (
                        <textarea
                            name="notes"
                            rows={4}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Notizen zum Trade..."
                            style={{ ...inputStyle(theme), resize: 'vertical' }}
                        />
                    ) : (
                        <div style={{
                            padding: '12px',
                            backgroundColor: theme.cardBg || '#2a2a2a',
                            borderRadius: '6px',
                            border: `1px solid ${theme.border || '#444'}`,
                            minHeight: '60px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {trade.notes || <i style={{ color: theme.subText || '#aaa' }}>Keine Notizen erfasst.</i>}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

const inputStyle = (theme) => ({
    width: '100%',
    padding: '8px 10px',
    marginTop: '4px',
    backgroundColor: theme.cardBg || '#2a2a2a',
    border: `1px solid ${theme.border || '#444'}`,
    color: theme.text || '#fff',
    borderRadius: '6px',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
});