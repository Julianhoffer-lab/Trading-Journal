import React, { useState, useEffect } from 'react';

export const TradeDetailsModal = ({ trade, isOpen, onClose, onSave, theme }) => {
    if (!isOpen || !trade) return null;

    // State für den Bearbeiten-Modus (Toggle)
    const [isEditing, setIsEditing] = useState(false);

    // State für Bild-Großansicht (Lightroom Modal)
    const [selectedImage, setSelectedImage] = useState(null);

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

    // State für alle Felder
    const [formData, setFormData] = useState({
        pair: trade.pair || trade.currencyPair || '',
        type: trade.type || trade.direction || 'LONG',
        entryPrice: trade.entryPrice ?? '',
        stopLoss: trade.stopLoss ?? '',
        exitPrice: trade.exitPrice ?? '',
        riskAmount: trade.riskAmount ?? '',
        rMultiple: trade.rMultiple ?? trade.finalRR ?? '',
        date: formatDateTimeForInput(trade.date || trade.timestamp || trade.tradeDateTime || new Date()),
        notes: trade.notes || '',
        screenshots: getInitialScreenshots(trade)
    });

    const [error, setError] = useState('');

    // Reset beim Öffnen / Ändern des Trades
    useEffect(() => {
        if (trade) {
            setFormData({
                pair: trade.pair || trade.currencyPair || '',
                type: trade.type || trade.direction || 'LONG',
                entryPrice: trade.entryPrice ?? '',
                stopLoss: trade.stopLoss ?? '',
                exitPrice: trade.exitPrice ?? '',
                riskAmount: trade.riskAmount ?? '',
                rMultiple: trade.rMultiple ?? trade.finalRR ?? '',
                date: formatDateTimeForInput(trade.date || trade.timestamp || trade.tradeDateTime || new Date()),
                notes: trade.notes || '',
                screenshots: getInitialScreenshots(trade)
            });
            setError('');
            setIsEditing(false); // Immer im Lese-Modus starten
        }
    }, [trade]);

    // Automatische Berechnung des R-Multiples
    useEffect(() => {
        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);
        const exit = parseFloat(formData.exitPrice);

        if (!isNaN(entry) && !isNaN(sl) && !isNaN(exit) && entry !== sl) {
            const risk = Math.abs(entry - sl);
            let priceChange = 0;
            if (formData.type === 'SHORT') {
                priceChange = entry - exit;
            } else {
                priceChange = exit - entry;
            }
            const calculatedR = (priceChange / risk).toFixed(2);
            setFormData((prev) => ({ ...prev, rMultiple: calculatedR }));
        }
    }, [formData.entryPrice, formData.stopLoss, formData.exitPrice, formData.type]);

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
            currencyPair: formData.pair.toUpperCase(),
            type: formData.type,
            direction: formData.type,
            entryPrice: parseFloat(formData.entryPrice),
            stopLoss: parseFloat(formData.stopLoss),
            exitPrice: formData.exitPrice !== '' ? parseFloat(formData.exitPrice) : null,
            riskAmount: parseFloat(formData.riskAmount) || 0,
            rMultiple: parseFloat(formData.rMultiple) || 0,
            finalRR: parseFloat(formData.rMultiple) || 0,
            date: new Date(formData.date).toISOString(),
            notes: formData.notes,
            screenshots: cleanedScreenshots
        };

        onSave(updatedTrade);
        setIsEditing(false);
        onClose();
    };

    // Theme Styles
    const isDark = theme?.isDark !== undefined
        ? theme.isDark
        : (theme?.cardBg ? theme.cardBg.includes('#1') || theme.cardBg.includes('#2') || theme.cardBg.includes('black') : true);

    const modalBg = theme?.cardBg || (isDark ? '#1e1e1e' : '#ffffff');
    const textColor = theme?.text || (isDark ? '#ffffff' : '#111111');
    const subTextColor = theme?.subText || (isDark ? '#aaa' : '#555');
    const borderColor = theme?.border || (isDark ? '#333333' : '#e0e0e0');
    const inputBg = theme?.inputBg || (isDark ? '#2a2a2a' : '#f8f9fa');

    // Dynamischer Hintergrund für die 3 Sektions-Karten:
    const sectionBg = isDark ? '#141414' : '#f8f9fa';

    const inputStyle = {
        width: '100%',
        padding: '9px 12px',
        backgroundColor: isEditing ? inputBg : (isDark ? '#1a1a1a' : '#ffffff'),
        border: isEditing ? `1px solid ${borderColor}` : `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
        color: textColor,
        WebkitTextFillColor: textColor, // Verhindert, dass ausgegrauter Text in disabled Inputs unlesbar wird
        opacity: 1, // Stellt sicher, dass disabled Inputs volle Deckkraft behalten
        borderRadius: '6px',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        colorScheme: isDark ? 'dark' : 'light',
        outline: 'none',
        transition: 'border-color 0.2s, background-color 0.2s'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '600',
        marginBottom: '4px',
        color: subTextColor,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const sectionTitleStyle = {
        fontSize: '1rem',
        fontWeight: '700',
        marginBottom: '12px',
        color: textColor,
        borderBottom: `2px solid ${borderColor}`,
        paddingBottom: '6px'
    };

    return (
        <div style={overlayStyle}>
            <div style={{ ...modalStyle, backgroundColor: modalBg, color: textColor, borderColor }}>

                {/* Header mit Edit-Button links und Schließen-Button rechts */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            style={{
                                ...buttonStyle,
                                backgroundColor: isEditing ? '#ff9800' : (isDark ? '#333' : '#e9ecef'),
                                color: isEditing ? '#ffffff' : textColor,
                                border: `1px solid ${borderColor}`,
                                fontSize: '0.85rem'
                            }}
                        >
                            {isEditing ? '🔒 Schreibschutz aktivieren' : '✏️ Bearbeiten'}
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', color: textColor }}>
                            {isEditing ? 'Trade bearbeiten' : 'Trade Steckbrief'}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ ...closeButtonStyle, color: textColor }}>&times;</button>
                </div>

                {error && (
                    <div style={errorBannerStyle}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* TEIL 1: STECKBRIEF */}
                    <div style={{ backgroundColor: sectionBg, padding: '16px', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <div style={sectionTitleStyle}>📌 Steckbrief & Parameter</div>
                        <div style={formGridStyle}>

                            {/* Datum */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Datum & Uhrzeit</label>
                                <input
                                    type="datetime-local"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            {/* Pair */}
                            <div>
                                <label style={labelStyle}>Währungspaar / Asset</label>
                                <input
                                    type="text"
                                    name="pair"
                                    value={formData.pair}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="z.B. EURUSD"
                                    style={{ ...inputStyle, fontWeight: '700' }}
                                    required
                                />
                            </div>

                            {/* Direction */}
                            <div>
                                <label style={labelStyle}>Richtung</label>
                                {isEditing ? (
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        style={inputStyle}
                                    >
                                        <option value="LONG">LONG</option>
                                        <option value="SHORT">SHORT</option>
                                    </select>
                                ) : (
                                    <div style={{
                                        padding: '8px 12px',
                                        fontWeight: 'bold',
                                        color: formData.type === 'LONG' ? '#2e7d32' : '#d32f2f',
                                        backgroundColor: formData.type === 'LONG' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                                        borderRadius: '6px',
                                        display: 'inline-block'
                                    }}>
                                        {formData.type}
                                    </div>
                                )}
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
                                    disabled={!isEditing}
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
                                    disabled={!isEditing}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            {/* Exit Price */}
                            <div>
                                <label style={labelStyle}>Exit Price</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="exitPrice"
                                    value={formData.exitPrice}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Noch offen"
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
                                    disabled={!isEditing}
                                    placeholder="100"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Ergebnis (R-Multiple) [Auto-Berechnet]</label>
                                <input
                                    type="text"
                                    name="rMultiple"
                                    value={formData.rMultiple ? `${formData.rMultiple} R` : '-'}
                                    readOnly
                                    disabled
                                    style={{
                                        ...inputStyle,
                                        fontWeight: 'bold',
                                        color: parseFloat(formData.rMultiple) > 0 ? '#4caf50' : (parseFloat(formData.rMultiple) < 0 ? '#f44336' : textColor),
                                        backgroundColor: isDark ? '#222' : '#e9ecef',
                                        border: `1px solid ${borderColor}`
                                    }}
                                />
                            </div>

                        </div>
                    </div>

                    {/* TEIL 2: NOTIZEN */}
                    <div style={{ backgroundColor: sectionBg, padding: '16px', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <div style={sectionTitleStyle}>📝 Notizen & Setup-Begründung</div>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={4}
                            placeholder={isEditing ? "Begründung für den Trade, Emotionen, Marktkontext..." : "Keine Notizen erfasst."}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* TEIL 3: SCREENSHOTS */}
                    <div style={{ backgroundColor: sectionBg, padding: '16px', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <div style={sectionTitleStyle}>🖼️ Screenshots & Chart-Analyse</div>

                        {/* URL Eingaben (nur im Bearbeiten-Modus) */}
                        {isEditing && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>TradingView Image URLs</label>
                                {formData.screenshots.map((url, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                                            placeholder="https://www.tradingview.com/x/..."
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
                        )}

                        {/* Klickbare Bild-Vorschau (Thumbnails) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '10px' }}>
                            {formData.screenshots.filter(s => s && s.trim() !== '').length > 0 ? (
                                formData.screenshots.filter(s => s && s.trim() !== '').map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedImage(url)}
                                        style={{
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            border: `1px solid ${borderColor}`,
                                            cursor: 'pointer',
                                            backgroundColor: '#000',
                                            height: '110px',
                                            position: 'relative'
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`Screenshot ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.85'}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentNode.innerText = '🖼️ Link öffnen';
                                                e.currentTarget.parentNode.style.display = 'flex';
                                                e.currentTarget.parentNode.style.alignItems = 'center';
                                                e.currentTarget.parentNode.style.justifyContent = 'center';
                                                e.currentTarget.parentNode.style.fontSize = '0.8rem';
                                            }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: isDark ? '#777' : '#888', fontStyle: 'italic' }}>
                                    Keine Screenshots vorhanden.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons (nur im Edit-Modus) */}
                    {isEditing && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                style={{ ...buttonStyle, backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: textColor }}
                            >
                                Abbrechen
                            </button>
                            <button
                                type="submit"
                                style={{ ...buttonStyle, backgroundColor: '#007bff', color: '#ffffff', border: 'none' }}
                            >
                                Änderungen Speichern
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* LIGHTROOM / VOLLBILD MODAL FÜR SCREENSHOTS */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }}>
                        <img
                            src={selectedImage}
                            alt="Großansicht"
                            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '-15px',
                                backgroundColor: '#ff4d4f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                fontSize: '1.2rem',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '15px'
};

const modalStyle = {
    width: '100%',
    maxWidth: '720px', // Breiteres Modal
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #333',
    boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
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
    fontSize: '1.8rem',
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
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'opacity 0.2s'
};

export default TradeDetailsModal;