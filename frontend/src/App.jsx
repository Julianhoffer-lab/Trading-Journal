import TradeDetailsModal from './TradeDetails';
import AccountBalanceChart from './AccountBalanceChart';
import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts'

function App() {
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [editNotes, setEditNotes] = useState('');
  const [editScreenshots, setEditScreenshots] = useState([]);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(true)

  // Trade Details & Edit Modal
  // Das bleibt in App.jsx (steuert, ob das Modal offen ist und welcher Trade gezeigt wird)
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Lightbox / Bild-Großansicht
  const [previewImage, setPreviewImage] = useState(null)

  // Filter States (Gelten GLOBAL für Journal & Analytics)
  const [filterPair, setFilterPair] = useState('')
  const [filterDirection, setFilterDirection] = useState('ALL')
  const [filterOutcome, setFilterOutcome] = useState('ALL')
  const [filterDay, setFilterDay] = useState('ALL')
  const [filterNotes, setFilterNotes] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    currencyPair: '',
    entryPrice: '',
    stopLoss: '',
    exitPrice: '',
    direction: 'LONG',
    riskAmount: '100', // Standardwert z. B. 100 CHF/USD
    notes: ''
  });

  // Navigation State: 'journal' oder 'analytics'
  const [activeTab, setActiveTab] = useState('journal')

  // Graph X-Achse Mode: 'tradeCount' oder 'time'
  const [chartXAxisMode, setChartXAxisMode] = useState('tradeCount')

  // Paginierung States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [filterPair, filterDirection, filterOutcome, filterDay, filterNotes])

  useEffect(() => {
    if (selectedTrade) {
      // 1. Notizen laden
      setEditNotes(selectedTrade.notes || '');

      // 2. Screenshots-Array laden
      if (selectedTrade.screenshots && selectedTrade.screenshots.length > 0) {
        setEditScreenshots(selectedTrade.screenshots);
      } else {
        // Falls noch keine Screenshots da sind, 1 leeres Eingabefeld anbieten
        setEditScreenshots(['']);
      }
    }
  }, [selectedTrade]);

  // Theme-Farben
  const theme = {
    bg: darkMode ? '#121212' : '#f4f6f8',
    text: darkMode ? '#e0e0e0' : '#212529',
    heading: darkMode ? '#ffffff' : '#111111',
    cardBg: darkMode ? '#1e1e1e' : '#ffffff',
    border: darkMode ? '#333333' : '#dddddd',
    subText: darkMode ? '#aaaaaa' : '#666666',
    tableHeaderBg: darkMode ? '#2a2a2a' : '#f1f3f5',
    inputBg: darkMode ? '#2d2d2d' : '#ffffff',
    inputBorder: darkMode ? '#444444' : '#cccccc',
    chartGrid: darkMode ? '#333333' : '#e0e0e0',
    chartTooltipBg: darkMode ? '#2a2a2a' : '#ffffff'
  }

  const fetchData = () => {
    Promise.all([
      fetch('http://localhost:8081/api/trades').then(res => res.json()),
      fetch('http://localhost:8081/api/trades/stats').then(res => res.json())
    ])
      .then(([tradesData, statsData]) => {
        setTrades(Array.isArray(tradesData) ? tradesData : tradesData.content || [])
        setStats(statsData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openModal = (trade) => {
    setSelectedTrade(trade);
    setEditNotes(trade?.notes || '');

    if (Array.isArray(trade?.screenshots) && trade.screenshots.length > 0) {
      setEditScreenshots(trade.screenshots);
    } else {
      const legacyImages = [trade?.imageUrl1, trade?.imageUrl2, trade?.imageUrl3].filter(Boolean);
      setEditScreenshots(legacyImages.length > 0 ? legacyImages : ['']);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleScreenshotChange = (index, value) => {
    const updatedScreenshots = [...(formData.screenshots || [''])];
    updatedScreenshots[index] = value;
    setFormData({ ...formData, screenshots: updatedScreenshots });
  };

  const addScreenshotField = () => {
    setFormData({ ...formData, screenshots: [...(formData.screenshots || []), ''] });
  };

  const removeScreenshotField = (index) => {
    const updatedScreenshots = (formData.screenshots || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, screenshots: updatedScreenshots });
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')

    // 1. Risiko parsen und prüfen
    const parsedRisk = parseFloat(formData.riskAmount)
    if (isNaN(parsedRisk) || parsedRisk <= 0) {
      setErrorMsg('Ungültiges Risiko (das Risiko muss größer als 0 sein).')
      return
    }

    // 2. Datum formatieren
    let formattedDateTime = null
    if (formData.tradeDateTime && formData.tradeDateTime.trim() !== '') {
      formattedDateTime = formData.tradeDateTime.length === 16
        ? formData.tradeDateTime + ':00'
        : formData.tradeDateTime
    }

    // 3. Payload mit riskAmount zusammenstellen
    const payload = {
      currencyPair: formData.currencyPair,
      direction: formData.direction,
      entryPrice: parseFloat(formData.entryPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      riskAmount: parsedRisk, // <--- WICHTIG: Hier wird das Risiko als Zahl übergeben!
      tradeDateTime: formattedDateTime,
      notes: formData.notes || ''
    }

    // 4. API-Call an Backend
    fetch('http://localhost:8081/api/trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Server Fehler (${res.status}): ${text}`)
        }
        return res.json()
      })
      .then(() => {
        // Formular nach Erfolg zurücksetzen
        setFormData({
          currencyPair: 'EUR/USD',
          direction: 'LONG',
          entryPrice: '',
          stopLoss: '',
          exitPrice: '',
          riskAmount: '', // <--- Wieder leeren
          tradeDateTime: new Date().toISOString().slice(0, 16),
          notes: ''
        })
        fetchData()
      })
      .catch(err => setErrorMsg(err.message || 'Verbindung fehlgeschlagen'))
  }

  const handleSaveDetails = async () => {
    if (!selectedTrade) return;
    setIsSaving(true);

    const payload = {
      ...selectedTrade,
      notes: editNotes,
      screenshots: editScreenshots.filter(url => url && url.trim() !== '')
    };

    try {
      const response = await fetch(`http://localhost:8080/api/trades/${selectedTrade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server-Fehler: ${response.status}`);
      }

      const updatedTrade = await response.json();

      // Trades-Liste im State aktualisieren
      setTrades(prevTrades => prevTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
      setSelectedTrade(null);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Speichern fehlgeschlagen: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (!window.confirm(`Möchtest du diesen Trade wirklich löschen?`)) return

    fetch(`http://localhost:8081/api/trades/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          if (selectedTrade?.id === id) setSelectedTrade(null)
          fetchData()
        } else {
          alert('Fehler beim Löschen')
        }
      })
      .catch(err => console.error(err))
  }

  // Gefilterte Liste für BEIDE Tabs (Journal & Analytics)
  const filteredTrades = trades.filter(trade => {
    if (!trade) return false
    const matchesPair = (trade.currencyPair || '').toLowerCase().includes(filterPair.toLowerCase())
    const matchesDirection = filterDirection === 'ALL' || trade.direction === filterDirection

    const isWin = trade.finalRR !== null && trade.finalRR !== undefined && trade.finalRR > 0
    const matchesOutcome =
      filterOutcome === 'ALL' ||
      (filterOutcome === 'WIN' && isWin) ||
      (filterOutcome === 'LOSS' && !isWin)

    let matchesDay = true
    if (filterDay !== 'ALL' && trade.tradeDateTime) {
      const dayOfWeek = new Date(trade.tradeDateTime).getDay()
      matchesDay = dayOfWeek === parseInt(filterDay)
    }

    const matchesNotes = !filterNotes || (trade.notes && trade.notes.toLowerCase().includes(filterNotes.toLowerCase()))

    return matchesPair && matchesDirection && matchesOutcome && matchesDay && matchesNotes
  })

  const isFiltered = filterPair !== '' || filterDirection !== 'ALL' || filterOutcome !== 'ALL' || filterDay !== 'ALL' || filterNotes !== ''

  const resetFilters = () => {
    setFilterPair('')
    setFilterDirection('ALL')
    setFilterOutcome('ALL')
    setFilterDay('ALL')
    setFilterNotes('')
  }

  // Bereitet die Daten für die Equity Curve vor
  const formattedChartData = useMemo(() => {
    const validTrades = (filteredTrades || []).filter(
      t => t && t.finalRR !== null && t.finalRR !== undefined && !isNaN(Number(t.finalRR))
    )

    const sorted = [...validTrades].sort(
      (a, b) => new Date(a.tradeDateTime) - new Date(b.tradeDateTime)
    )

    let cumulative = 0
    return sorted.map((t, index) => {
      cumulative += Number(t.finalRR)
      const dateObj = new Date(t.tradeDateTime)
      return {
        tradeNum: index + 1,
        date: dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        timestamp: dateObj.getTime(),
        cumulativeR: Number(cumulative.toFixed(2))
      }
    })
  }, [filteredTrades])

  // Paginierung für Journal
  const indexOfLastTrade = currentPage * itemsPerPage
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade)
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage) || 1

  const getDayName = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // CSV-Export
  const exportToCSV = () => {
    if (filteredTrades.length === 0) {
      alert('Keine Trades zum Exportieren vorhanden!')
      return
    }

    const headers = ['Datum/Zeit', 'Waehrungspaar', 'Richtung', 'Entry', 'StopLoss', 'Exit', 'Ergebnis_R', 'Notizen']

    const rows = filteredTrades.map(trade => [
      trade.tradeDateTime || '',
      `"${trade.currencyPair || ''}"`,
      trade.direction || '',
      trade.entryPrice || 0,
      trade.stopLoss || 0,
      trade.exitPrice || 0,
      trade.finalRR ?? '',
      `"${(trade.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `trading_journal_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div style={{ padding: '2rem', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>Lade Daten vom Backend...</div>

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif', transition: 'all 0.2s ease' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header mit Tab-Navigation & Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0, color: theme.heading }}>Trading Journal Dashboard</h1>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: theme.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <button
              onClick={() => setActiveTab('journal')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'journal' ? '#007bff' : 'transparent',
                color: activeTab === 'journal' ? 'white' : theme.text,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📝 Journal
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'analytics' ? '#007bff' : 'transparent',
                color: activeTab === 'analytics' ? 'white' : theme.text,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📊 Analytics
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${theme.border}`,
                backgroundColor: '#28a745',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              📥 CSV Export
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBg,
                color: theme.text,
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        {/* GLOBALE FILTERLEISTE (Gilt für Journal AND Analytics) */}
        <div style={{ backgroundColor: theme.cardBg, padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: `1px solid ${theme.border}`, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.subText }}>🔍 Filter:</span>
          <input type="text" placeholder="Suche nach Paar..." value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} />
          <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} style={{ backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}>
            <option value="ALL">Alle Richtungen</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
          <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} style={{ backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}>
            <option value="ALL">Alle Ergebnisse</option>
            <option value="WIN">Gewinner (WIN)</option>
            <option value="LOSS">Verlierer (LOSS)</option>
          </select>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} style={{ backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}>
            <option value="ALL">Alle Wochentage</option>
            <option value="1">Montag</option>
            <option value="2">Dienstag</option>
            <option value="3">Mittwoch</option>
            <option value="4">Donnerstag</option>
            <option value="5">Freitag</option>
          </select>
          <input type="text" placeholder="Suche in Notizen..." value={filterNotes} onChange={(e) => setFilterNotes(e.target.value)} style={{ backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} />
          {isFiltered && <button onClick={resetFilters} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer' }}>Filter zurücksetzen</button>}
        </div>

        {/* TAB 1: JOURNAL */}
        {activeTab === 'journal' && (
          <div>
            {/* Formular zum Erfassen */}
            <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: `1px solid ${theme.border}` }}>
              <h3 style={{ marginTop: 0, color: theme.heading }}>Neuen Trade erfassen</h3>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Währungspaar</label>
                  <input type="text" name="currencyPair" value={formData.currencyPair} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Richtung</label>
                  <select name="direction" value={formData.direction} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Entry Preis</label>
                  <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Stop Loss</label>
                  <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Exit Preis</label>
                  <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Datum & Zeit</label>
                  <input
                    type="datetime-local"
                    name="tradeDateTime"
                    value={formData.tradeDateTime}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      backgroundColor: theme.inputBg || '#1f2937',
                      color: theme.text || '#ffffff',
                      border: `1px solid ${theme.inputBorder || '#374151'}`,
                      padding: '6px',
                      borderRadius: '4px',
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="riskAmount" style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Risiko (in CHF / $)</label>
                  <input
                    type="number"
                    step="any"
                    name="riskAmount"
                    value={formData.riskAmount || ''}
                    onChange={handleChange}
                    style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}
                    required
                  />
                </div>

                {/* Notizen Feld */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: theme.subText }}>Notizen</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ width: '100%', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px', minHeight: '60px' }} placeholder={"Begründung für den Trade, Emotionen, Marktkontext..."} />
                </div>

                {/* NEU: Screenshots & Chart-Analyse Bereich */}
                <div style={{ gridColumn: '1 / -1', backgroundColor: theme.inputBg, padding: '1rem', borderRadius: '6px', border: `1px solid ${theme.inputBorder}` }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: theme.heading, marginBottom: '0.5rem' }}>
                    🖼️ Screenshots & Chart-Analyse URLs
                  </label>

                  {(formData.screenshots || ['']).map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                        placeholder="https://www.tradingview.com/x/..."
                        style={{ width: '100%', backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '6px', borderRadius: '4px' }}
                      />
                      {(formData.screenshots || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScreenshotField(idx)}
                          style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addScreenshotField}
                    style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                  >
                    + Weitere URL hinzufügen
                  </button>

                  {/* Live Vorschau der eingegebenen URLs */}
                  {(formData.screenshots || []).filter(s => s && s.trim() !== '').length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '12px' }}>
                      {formData.screenshots.filter(s => s && s.trim() !== '').map((url, idx) => (
                        <div key={idx} style={{ borderRadius: '4px', overflow: 'hidden', border: `1px solid ${theme.inputBorder}`, height: '90px', backgroundColor: '#000' }}>
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentNode.innerText = '🖼️ Link ungültig';
                              e.currentTarget.parentNode.style.display = 'flex';
                              e.currentTarget.parentNode.style.alignItems = 'center';
                              e.currentTarget.parentNode.style.justifyContent = 'center';
                              e.currentTarget.parentNode.style.fontSize = '0.75rem';
                              e.currentTarget.parentNode.style.color = '#ff4d4f';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ width: '100%', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Trade Speichern
                  </button>
                </div>

              </form>
              {errorMsg && <div style={{ color: '#dc3545', marginTop: '0.5rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
            </div>

            {/* Tabelle */}
            <div style={{ backgroundColor: theme.cardBg, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
              Klicke auf einen Trade, um Details & Notizen zu sehen oder zu bearbeiten.
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}` }}>
                    <th style={{ padding: '12px' }}>Datum</th>
                    <th style={{ padding: '12px' }}>Paar</th>
                    <th style={{ padding: '12px' }}>Richtung</th>
                    <th style={{ padding: '12px' }}>Entry</th>
                    <th style={{ padding: '12px' }}>SL</th>
                    <th style={{ padding: '12px' }}>Exit</th>
                    <th style={{ padding: '12px' }}>Ergebnis (R)</th>
                    <th style={{ padding: '12px' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.length === 0 ? (
                    <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'left', color: theme.subText }}>Keine Trades für diese Filterkriterien gefunden.</td></tr>
                  ) : (
                    currentTrades.map(trade => (
                      <tr key={trade.id} onClick={() => openModal(trade)} style={{ borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background-color 0.15s' }}>
                        <td style={{ padding: '12px' }}>{getDayName(trade.tradeDateTime)}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{trade.currencyPair}</td>
                        <td style={{ padding: '12px', color: trade.direction === 'LONG' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>{trade.direction}</td>
                        <td style={{ padding: '12px' }}>{trade.entryPrice}</td>
                        <td style={{ padding: '12px' }}>{trade.stopLoss}</td>
                        <td style={{ padding: '12px' }}>{trade.exitPrice || '-'}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: (trade.finalRR || 0) >= 0 ? '#28a745' : '#dc3545' }}>
                          {trade.finalRR !== null && trade.finalRR !== undefined ? `${trade.finalRR} R` : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button onClick={(e) => handleDelete(trade.id, e)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Löschen</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginierung */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>Zurück</button>
                <span>Seite {currentPage} von {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '4px', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>Weiter</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (() => {
          const safeTrades = Array.isArray(filteredTrades) ? filteredTrades : []
          const tradesWithRR = safeTrades.filter(t => t && t.finalRR !== null && t.finalRR !== undefined && !isNaN(Number(t.finalRR)))
          const totalCount = safeTrades.length

          const winRList = tradesWithRR.map(t => Number(t.finalRR)).filter(r => r > 0)
          const lossRList = tradesWithRR.map(t => Number(t.finalRR)).filter(r => r < 0)

          const winCount = winRList.length
          const calculatedWinRate = totalCount > 0 ? (winCount / totalCount) * 100 : 0
          const totalR = tradesWithRR.reduce((acc, t) => acc + (Number(t.finalRR) || 0), 0)

          const sumWins = winRList.reduce((acc, r) => acc + r, 0)
          const sumLosses = Math.abs(lossRList.reduce((acc, r) => acc + r, 0))

          let calculatedProfitFactor = 'N/A'
          if (sumLosses > 0) calculatedProfitFactor = (sumWins / sumLosses).toFixed(2)
          else if (sumWins > 0) calculatedProfitFactor = '∞'

          const bestR = tradesWithRR.length > 0 ? Math.max(...tradesWithRR.map(t => Number(t.finalRR))) : null
          const worstR = tradesWithRR.length > 0 ? Math.min(...tradesWithRR.map(t => Number(t.finalRR))) : null
          const avgWin = winRList.length > 0 ? (sumWins / winRList.length) : null
          const avgLoss = lossRList.length > 0 ? (lossRList.reduce((acc, r) => acc + r, 0) / lossRList.length) : null

          const displayWinRate = (!isFiltered && stats && stats.winRate !== undefined) ? stats.winRate : calculatedWinRate
          const displayTotalR = (!isFiltered && stats && stats.totalR !== undefined) ? stats.totalR : totalR
          const displayProfitFactor = (!isFiltered && stats && stats.profitFactor !== undefined) ? stats.profitFactor : calculatedProfitFactor
          const displayBestR = (!isFiltered && stats && stats.bestTradeR !== undefined) ? stats.bestTradeR : bestR
          const displayWorstR = (!isFiltered && stats && stats.worstTradeR !== undefined) ? stats.worstTradeR : worstR
          const displayAvgWin = (!isFiltered && stats && stats.avgWinR !== undefined) ? stats.avgWinR : avgWin
          const displayAvgLoss = (!isFiltered && stats && stats.avgLossR !== undefined) ? stats.avgLossR : avgLoss

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.85rem', color: theme.subText }}>Gefilterte Trades</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: theme.heading, marginTop: '4px' }}>{totalCount}</div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.85rem', color: theme.subText }}>Winrate</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: Number(displayWinRate) >= 50 ? '#28a745' : '#dc3545', marginTop: '4px' }}>
                    {typeof displayWinRate === 'number' ? `${displayWinRate.toFixed(1)}%` : displayWinRate}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.85rem', color: theme.subText }}>Akkumuliertes R</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: Number(displayTotalR) >= 0 ? '#28a745' : '#dc3545', marginTop: '4px' }}>
                    {typeof displayTotalR === 'number' ? `${displayTotalR.toFixed(2)} R` : displayTotalR}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.85rem', color: theme.subText }}>Profit Factor</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: theme.heading, marginTop: '4px' }}>{displayProfitFactor}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.8rem', color: theme.subText }}>Bester Trade</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#28a745' }}>
                    {displayBestR !== null && displayBestR !== undefined ? `${Number(displayBestR).toFixed(2)} R` : '-'}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.8rem', color: theme.subText }}>Schlechtester Trade</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#dc3545' }}>
                    {displayWorstR !== null && displayWorstR !== undefined ? `${Number(displayWorstR).toFixed(2)} R` : '-'}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.8rem', color: theme.subText }}>Durchschnittlicher Gewinner</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#28a745' }}>
                    {displayAvgWin !== null && displayAvgWin !== undefined ? `${Number(displayAvgWin).toFixed(2)} R` : '-'}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: '0.8rem', color: theme.subText }}>Durchschnittlicher Verlierer</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#dc3545' }}>
                    {displayAvgLoss !== null && displayAvgLoss !== undefined ? `${Number(displayAvgLoss).toFixed(2)} R` : '-'}
                  </div>
                </div>
              </div>

              {/* ================= 1. EQUITY CURVE (IN R) ================= */}
              <div style={{ padding: '1.5rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, color: theme.heading }}>📈 Konto-Wachstum (Equity Curve in R)</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setChartXAxisMode('tradeCount')}
                      style={{
                        padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                        backgroundColor: chartXAxisMode === 'tradeCount' ? '#007bff' : theme.cardBg,
                        color: chartXAxisMode === 'tradeCount' ? 'white' : theme.text,
                        border: `1px solid ${theme.border}`, borderRadius: '4px'
                      }}
                    >
                      # Trade-Anzahl
                    </button>
                    <button
                      onClick={() => setChartXAxisMode('time')}
                      style={{
                        padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                        backgroundColor: chartXAxisMode === 'time' ? '#007bff' : theme.cardBg,
                        color: chartXAxisMode === 'time' ? 'white' : theme.text,
                        border: `1px solid ${theme.border}`, borderRadius: '4px'
                      }}
                    >
                      📅 Zeit
                    </button>
                  </div>
                </div>

                {(!formattedChartData || formattedChartData.length < 2) ? (
                  <div style={{ padding: '2rem', textAlign: 'left', color: theme.subText }}>
                    Keine ausreichenden Daten mit geschlossenen Trades (finalRR) für die Equity Curve vorhanden.
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height={350} minWidth={100} minHeight={300}>
                      <LineChart data={formattedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                        {chartXAxisMode === 'tradeCount' ? (
                          <XAxis dataKey="tradeNum" stroke={theme.subText} />
                        ) : (
                          <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} stroke={theme.subText} tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                        )}
                        <YAxis stroke={theme.subText} unit=" R" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: theme.chartTooltipBg, color: theme.text, borderRadius: '8px' }}
                          labelFormatter={(label) => chartXAxisMode === 'time' ? new Date(label).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : `Trade #${label}`}
                          formatter={(value) => [`${value} R`, 'Kumuliert']}
                        />
                        <Line type="monotone" dataKey="cumulativeR" stroke={(formattedChartData[formattedChartData.length - 1]?.cumulativeR || 0) >= 0 ? '#28a745' : '#dc3545'} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ================= 2. ABSOLUTER KONTOVERLAUF (SEPARATER CARD) ================= */}
              <AccountBalanceChart allTrades={trades} theme={theme} />
            </div>
          )
        })()}

        {/* TRADE DETAILS MODAL */}
        {selectedTrade && (
          <TradeDetailsModal
            isOpen={!!selectedTrade}
            trade={selectedTrade}
            theme={theme}
            onClose={() => setSelectedTrade(null)}
            onSave={(updatedTrade) => {
              // Trades im State aktualisieren
              setTrades((prevTrades) =>
                prevTrades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t))
              );
              setSelectedTrade(null);
            }}
          />
        )}

        {/* LIGHTBOX MODAL (GROSSANSICHT - Optional, da bereits im TradeDetailsModal enthalten) */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '2rem',
              cursor: 'zoom-out'
            }}
          >
            <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }}>
              <img
                src={previewImage}
                alt="Enlarged Trade Chart"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: '8px',
                  boxShadow: '0 0 25px rgba(255,255,255,0.2)'
                }}
              />
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '0',
                  color: 'white',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕ Schließen
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App