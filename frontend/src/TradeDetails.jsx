import React, { useState, useEffect } from 'react';

export const TradeDetailsModal = ({ trade, isOpen, onClose, onSave, theme }) => {
    if (!isOpen || !trade) return null;

    // Helper zur Formatierung von ISO-Datum/Timestamp
    const formatDateTimeForInput = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const pad = (num) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Screenshots initialisieren
    const getInitialScreenshots = (t) => {
        if (Array.isArray(t?.screenshots) && t.screenshots.length > 0) {
            return t.screenshots;
        }
        const legacy = [t?.imageUrl1, t?.imageUrl2, t?.imageUrl3].filter(Boolean);
        return legacy.length > 0 ? legacy : [''];
    };

    // State für alle Felder inklusive Notes & Screenshots
    const [formData, setFormData] = useState({
        pair: trade.pair || '',
        type: trade.type || 'LONG',
        entryPrice: trade.entryPrice ?? '',
        stopLoss: trade.stopLoss ?? '',
        exitPrice: trade.exitPrice ?? '',
        riskAmount: trade.riskAmount ?? '',
        rMultiple: trade.rMultiple ?? '',
        date: formatDateTimeForInput(trade.date || trade.timestamp || new Date()),
        notes: trade.notes || '',
        screenshots: getInitialScreenshots(trade)
    });

    const [error, setError] = useState('');

    useEffect(() => {
        if (trade) {
            setFormData({
                pair: trade.pair || '',
                type: trade.type || 'LONG',
                entryPrice: trade.entryPrice ?? '',
                stopLoss: trade.stopLoss ?? '',
                exitPrice: trade.exitPrice ?? '',
                riskAmount: trade.riskAmount ?? '',
                rMultiple: trade.rMultiple ?? '',
                date: formatDateTimeForInput(trade.date || trade.timestamp || new Date()),
                notes: trade.notes || '',
                screenshots: getInitialScreenshots(trade)
            });
            setError('');
        }
    }, [trade]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    // Screenshot-Handling
    const handleScreenshotChange = (index, value) => {
        const updated = [...formData.screenshots];
        updated[index] = value;
        setFormData((prev) => ({ ...prev, screenshots: updated }));
    };

    const addScreenshotField = () => {
        setFormData((prev) => ({ ...prev, screenshots: [...prev.screenshots, ''] }));
    };

    const removeScreenshotField = (index) => {
        const updated = formData.screenshots.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, screenshots: updated.length > 0 ? updated : [''] }));
    };

    // Validierung (Long vs. Short)
    const validateForm = () => {
        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);

        if (isNaN(entry) || entry <= 0) {
            setError('Bitte gib einen gültigen Entry Price ein.');
            return false;
        }

        if (isNaN(sl) || sl <= 0) {
            setError('Bitte gib einen gültigen Stop Loss ein.');
            return false;
        }

        if (formData.type === 'LONG' && sl >= entry) {
            setError('Ungültiger Stop Loss: Bei LONG-Positionen muss der Stop Loss UNTER dem Entry Price liegen.');
            return false;
        }

        if (formData.type === 'SHORT' && sl <= entry) {
            setError('Ungültiger Stop Loss: Bei SHORT-Positionen muss der Stop Loss ÜBER dem Entry Price liegen.');
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const cleanedScreenshots = formData.screenshots.filter(s => s && s.trim() !== '');

        const updatedTrade = {
            ...trade,
            pair: formData.pair.toUpperCase(),
            type: formData.type,
            entryPrice: parseFloat(formData.entryPrice),
            stopLoss: parseFloat(formData.stopLoss),
            exitPrice: formData.exitPrice !== '' ? parseFloat(formData.exitPrice) : null,
            riskAmount: parseFloat(formData.riskAmount) || 0,
            rMultiple: parseFloat(formData.rMultiple) || 0,
            date: new Date(formData.date).toISOString(),
            notes: formData.notes,
            screenshots: cleanedScreenshots
        };

        onSave(updatedTrade);
        onClose();
    };

    // Theme Styles
    const isDark = theme?.isDark ?? true;
    const modalBg = theme?.cardBg || (isDark ? '#1e1e1e' : '#ffffff');
    const textColor = theme?.text || (isDark ? '#ffffff' : '#000000');
    const borderColor = theme?.border || (isDark ? '#333333' : '#cccccc');
    const inputBg = theme?.inputBg || (isDark ? '#2a2a2a' : '#f5f5f5');

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        backgroundColor: inputBg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        borderRadius: '6px',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        colorScheme: isDark ? 'dark' : 'light',
        outline: 'none'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: '600',
        marginBottom: '6px',
        color: isDark ? '#aaa' : '#555'
    };

    return (
        <div style={overlayStyle}>
            <div style={{ ...modalStyle, backgroundColor: modalBg, color: textColor, borderColor }}>
                <div style={headerStyle}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trade Details bearbeiten</h2>
                    <button onClick={onClose} style={{ ...closeButtonStyle, color: textColor }}>&times;</button>
                </div>

                {error && (
                    <div style={errorBannerStyle}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={formGridStyle}>
                    {/* Datum */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Datum & Uhrzeit</label>
                        <input
                            type="datetime-local"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Pair & Type */}
                    <div>
                        <label style={labelStyle}>Währungspaar / Asset</label>
                        <input
                            type="text"
                            name="pair"
                            value={formData.pair}
                            onChange={handleChange}
                            placeholder="z.B. EURUSD"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Richtung</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            style={inputStyle}
                        >
                            <option value="LONG">LONG</option>
                            <option value="SHORT">SHORT</option>
                        </select>
                    </div>

                    {/* Entry & Stop Loss */}
                    <div>
                        <label style={labelStyle}>Entry Price</label>
                        <input
                            type="number"
                            step="any"
                            name="entryPrice"
                            value={formData.entryPrice}
                            onChange={handleChange}
                            placeholder="1.08500"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Stop Loss (SL)</label>
                        <input
                            type="number"
                            step="any"
                            name="stopLoss"
                            value={formData.stopLoss}
                            onChange={handleChange}
                            placeholder="1.08200"
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Exit Price */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Exit Price</label>
                        <input
                            type="number"
                            step="any"
                            name="exitPrice"
                            value={formData.exitPrice}
                            onChange={handleChange}
                            placeholder="1.09100"
                            style={inputStyle}
                        />
                    </div>

                    {/* Risk & R-Multiple */}
                    <div>
                        <label style={labelStyle}>Risiko ($ / CHF)</label>
                        <input
                            type="number"
                            step="any"
                            name="riskAmount"
                            value={formData.riskAmount}
                            onChange={handleChange}
                            placeholder="100"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Ergebnis (R-Multiple)</label>
                        <input
                            type="number"
                            step="any"
                            name="rMultiple"
                            value={formData.rMultiple}
                            onChange={handleChange}
                            placeholder="z.B. 2.5 oder -1"
                            style={inputStyle}
                        />
                    </div>

                    {/* Notizen */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Notizen & Begründung</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Begründung für den Setup, Emotionen, etc..."
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* Screenshots */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Screenshot URLs</label>
                        {formData.screenshots.map((url, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                                    placeholder="https://... (TradingView Image Link)"
                                    style={inputStyle}
                                />
                                {formData.screenshots.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeScreenshotField(idx)}
                                        style={{ ...buttonStyle, backgroundColor: '#ff4d4f', color: '#fff', padding: '0 12px' }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addScreenshotField}
                            style={{ ...buttonStyle, backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: textColor, marginTop: '4px', fontSize: '0.8rem' }}
                        >
                            + Weitere URL hinzufügen
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ ...buttonStyle, backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: textColor }}
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            style={{ ...buttonStyle, backgroundColor: '#007bff', color: '#ffffff', border: 'none' }}
                        >
                            Speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Styles
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '15px'
};

const modalStyle = {
    width: '100%',
    maxWidth: '520px',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #333',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    lineHeight: '1'
};

const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px'
};

const errorBannerStyle = {
    backgroundColor: 'rgba(255, 77, 79, 0.15)',
    color: '#ff4d4f',
    border: '1px solid #ff4d4f',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '16px',
    fontSize: '0.88rem'
};

const buttonStyle = {
    padding: '10px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem'
};

export default TradeDetailsModal;