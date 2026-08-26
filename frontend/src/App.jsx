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

  // Dark Mode State (Standard: Dark Mode)
  const [darkMode, setDarkMode] = useState(true)

  // Selected Trade & State für Detail-Edit
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [images, setImages] = useState({ imageUrl1: '', imageUrl2: '', imageUrl3: '' })
  const [isSaving, setIsSaving] = useState(false)

  // State für vergrößertes Bild (Lightbox / Preview)
  const [previewImage, setPreviewImage] = useState(null)

  // Filter States (wirken GLOBAL auf Journal UND Analytics)
  const [filterPair, setFilterPair] = useState('')
  const [filterDirection, setFilterDirection] = useState('ALL')
  const [filterOutcome, setFilterOutcome] = useState('ALL')
  const [filterDay, setFilterDay] = useState('ALL')
  const [filterNotes, setFilterNotes] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    currencyPair: 'EUR/USD',
    direction: 'LONG',
    entryPrice: '',
    stopLoss: '',
    exitPrice: '',
    tradeDateTime: new Date().toISOString().slice(0, 16)
  })

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



  // Theme-Farben je nach Modus
  const theme = {
    bg: darkMode ? '#121212' : '#f4f6f8',
    text: darkMode ? '#e0e0e0' : '#212529',
    heading: darkMode ? '#ffffff' : '#111111',
    cardBg: darkMode ? '#1e1e1e' : '#ffffff',
    border: darkMode ? '#333333' : '#dddddd',
    subText: darkMode ? '#aaaaaa' : '#666666',
    tableHeaderBg: darkMode ? '#2a2a2a' : '#f1f3f5',
    tableHoverBg: darkMode ? '#2c2c2c' : '#f8f9fa',
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
    setSelectedTrade(trade)
    setEditNotes(trade.notes || '')
    setImages({
      imageUrl1: trade.imageUrl1 || '',
      imageUrl2: trade.imageUrl2 || '',
      imageUrl3: trade.imageUrl3 || ''
    })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')

    let formattedDateTime = null
    if (formData.tradeDateTime && formData.tradeDateTime.trim() !== '') {
      formattedDateTime = formData.tradeDateTime.length === 16
        ? formData.tradeDateTime + ':00'
        : formData.tradeDateTime
    }

    const payload = {
      currencyPair: formData.currencyPair,
      direction: formData.direction,
      entryPrice: parseFloat(formData.entryPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      exitPrice: parseFloat(formData.exitPrice) || 0,
      tradeDateTime: formattedDateTime,
      imageUrl1: null,
      imageUrl2: null,
      imageUrl3: null,
      notes: ''
    }

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
        setFormData({
          currencyPair: 'EUR/USD',
          direction: 'LONG',
          entryPrice: '',
          stopLoss: '',
          exitPrice: '',
          tradeDateTime: new Date().toISOString().slice(0, 16)
        })
        fetchData()
      })
      .catch(err => setErrorMsg(err.message || 'Verbindung fehlgeschlagen'))
  }

  const handlePasteImage = (e, slotKey) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        const reader = new FileReader()
        reader.onload = (event) => {
          setImages(prev => ({ ...prev, [slotKey]: event.target.result }))
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }

  const handleSaveDetails = () => {
    if (!selectedTrade) return
    setIsSaving(true)

    const updatedPayload = {
      ...selectedTrade,
      notes: editNotes,
      imageUrl1: images.imageUrl1,
      imageUrl2: images.imageUrl2,
      imageUrl3: images.imageUrl3
    }

    fetch(`http://localhost:8081/api/trades/${selectedTrade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    })
      .then(res => res.json())
      .then(data => {
        setSelectedTrade(data)
        setIsSaving(false)
        fetchData()
        alert('Details & Notizen erfolgreich gespeichert!')
      })
      .catch(err => {
        console.error('Fehler beim Speichern:', err)
        setIsSaving(false)
      })
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (!window.confirm(`Möchtest du Trade #${id} wirklich löschen?`)) return

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

  // Check, ob aktuell ein Filter aktiv ist
  const isFiltered = filterPair !== '' || filterDirection !== 'ALL' || filterOutcome !== 'ALL' || filterDay !== 'ALL' || filterNotes !== ''

  const resetFilters = () => {
    setFilterPair('')
    setFilterDirection('ALL')
    setFilterOutcome('ALL')
    setFilterDay('ALL')
    setFilterNotes('')
  }

  // Kumulierter Datenverlauf für den Graphen
  const chartData = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) return []

    // Nur Trades mit gültiger finalRR berücksichtigen
    const validTrades = filteredTrades
      .filter(t => t && t.finalRR !== null && t.finalRR !== undefined && !isNaN(Number(t.finalRR)))
      .sort((a, b) => new Date(a.tradeDateTime || 0) - new Date(b.tradeDateTime || 0))

    if (validTrades.length === 0) return []

    let cumulativeR = 0
    const dataPoints = [
      {
        tradeNum: 0,
        date: 'Start',
        tradeRR: 0,
        cumulativeR: 0
      }
    ]

    validTrades.forEach((trade, index) => {
      const rrVal = Number(trade.finalRR) || 0
      cumulativeR += rrVal

      const dateObj = trade.tradeDateTime ? new Date(trade.tradeDateTime) : null
      const formattedDate = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : `Trade #${index + 1}`

      dataPoints.push({
        tradeNum: index + 1,
        date: formattedDate,
        tradeRR: Number(rrVal.toFixed(2)),
        cumulativeR: Number(cumulativeR.toFixed(2))
      })
    })

    return dataPoints
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

    const headers = ['ID', 'Datum/Zeit', 'Waehrungspaar', 'Richtung', 'Entry', 'StopLoss', 'Exit', 'Ergebnis_R', 'Notizen']

    const rows = filteredTrades.map(trade => [
      trade.id,
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

  // Hilfskomponente für Info-Tooltips direkt mit Inline-Styles
  const Tooltip = ({ text }) => (
    <span
      title={text}
      style={{
        cursor: 'help',
        marginLeft: '6px',
        fontSize: '0.8rem',
        backgroundColor: theme.border,
        color: theme.subText,
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }}
    >
      ?
    </span>
  )

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

        {/* GLOBALE FILTER-LEISTE (Gilt für Journal AND Analytics) */}
        <div style={{ padding: '1rem', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: theme.heading }}>
              🔍 Globaler Filter (dieser Filter wirkt auf Journal & Analytics) {isFiltered && <span style={{ color: '#007bff', fontSize: '0.8rem' }}>(Aktiv: {filteredTrades.length} von {trades.length} Trades)</span>}
            </span>
            {isFiltered && (
              <button
                onClick={resetFilters}
                style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: theme.subText }}>Asset:</label>
              <input type="text" placeholder="z.B. EUR/USD..." value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}` }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: theme.subText }}>Richtung:</label>
              <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                <option value="ALL">Alle Richtungen</option>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: theme.subText }}>Ergebnis:</label>
              <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                <option value="ALL">Alle Trades</option>
                <option value="WIN">Gewinner (Win)</option>
                <option value="LOSS">Verlierer (Loss)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: theme.subText }}>Wochentag:</label>
              <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                <option value="ALL">Alle Tage</option>
                <option value="1">Montag</option>
                <option value="2">Dienstag</option>
                <option value="3">Mittwoch</option>
                <option value="4">Donnerstag</option>
                <option value="5">Freitag</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: theme.subText }}>Notiz-Suche:</label>
              <input type="text" placeholder="Stichwort..." value={filterNotes} onChange={(e) => setFilterNotes(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}` }} />
            </div>
          </div>
        </div>

        {/* TAB 1: JOURNAL */}
        {activeTab === 'journal' && (
          <>
            {/* Formular zum Anlegen */}
            <div style={{ padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px', marginBottom: '2rem', backgroundColor: theme.cardBg }}>
              <h2 style={{ marginTop: 0, color: theme.heading }}>Neuen Trade erfassen (Schnelleingabe)</h2>

              {errorMsg && (
                <div style={{ padding: '0.75rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '1rem' }}>
                  <strong>Fehler:</strong> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ color: theme.text }}>Asset:</label>
                  <input type="text" name="currencyPair" value={formData.currencyPair} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
                </div>

                <div>
                  <label style={{ color: theme.text }}>Richtung:</label>
                  <select name="direction" value={formData.direction} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: theme.text }}>Entry Preis:</label>
                  <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
                </div>

                <div>
                  <label style={{ color: theme.text }}>Stop Loss:</label>
                  <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
                </div>

                <div>
                  <label style={{ color: theme.text }}>Exit Preis:</label>
                  <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
                </div>

                <div>
                  <label style={{ color: theme.text }}>Datum & Uhrzeit des Trades:</label>
                  <input type="datetime-local" name="tradeDateTime" value={formData.tradeDateTime} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
                </div>

                <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Trade Speichern
                </button>
              </form>
            </div>

            {/* Tabellen-Übersicht */}
            <h2 style={{ color: theme.heading }}>Alle Trades ({filteredTrades.length})</h2>
            <p>(Klicke auf einen Trade, um die Details anzuzeigen und/oder zu bearbeiten)</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `2px solid ${theme.border}`, color: theme.heading }}>
                  <th style={{ padding: '12px' }}>Datum / Zeit</th>
                  <th style={{ padding: '12px' }}>Asset</th>
                  <th style={{ padding: '12px' }}>Richtung</th>
                  <th style={{ padding: '12px' }}>Entry</th>
                  <th style={{ padding: '12px' }}>Exit</th>
                  <th style={{ padding: '12px' }}>Ergebnis (R)</th>
                  <th style={{ padding: '12px' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {currentTrades.map(trade => {
                  const isWin = trade.finalRR !== null && trade.finalRR !== undefined && trade.finalRR > 0
                  return (
                    <tr
                      key={trade.id}
                      onClick={() => openModal(trade)}
                      style={{
                        backgroundColor: theme.cardBg,
                        color: theme.text,
                        borderBottom: `1px solid ${theme.border}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.tableHoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.cardBg}
                    >
                      <td style={{ padding: '12px', color: theme.subText, fontSize: '0.9rem' }}>{getDayName(trade.tradeDateTime)}</td>
                      <td style={{ padding: '12px' }}>{trade.currencyPair}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: trade.direction === 'LONG' ? (darkMode ? '#132f4c' : '#e3f2fd') : (darkMode ? '#3c1818' : '#fbe9e7'), color: trade.direction === 'LONG' ? '#64b5f6' : '#e57373', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {trade.direction}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{trade.entryPrice}</td>
                      <td style={{ padding: '12px' }}>{trade.exitPrice}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: isWin ? '#28a745' : '#dc3545' }}>
                        {trade.finalRR !== null && trade.finalRR !== undefined ? `${trade.finalRR} R` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={(e) => handleDelete(trade.id, e)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                          Löschen
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: currentPage === 1 ? theme.border : theme.cardBg,
                    color: currentPage === 1 ? theme.subText : theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  &laquo; Zurück
                </button>

                <span style={{ fontSize: '0.9rem', color: theme.text }}>
                  Seite <strong>{currentPage}</strong> von <strong>{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: currentPage === totalPages ? theme.border : theme.cardBg,
                    color: currentPage === totalPages ? theme.subText : theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Weiter &raquo;
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (() => {
          // Sicherstellen, dass filteredTrades ein Array ist
          const safeTrades = Array.isArray(filteredTrades) ? filteredTrades : []

          const tradesWithRR = safeTrades.filter(
            t => t && t.finalRR !== null && t.finalRR !== undefined && !isNaN(Number(t.finalRR))
          )
          const totalCount = safeTrades.length

          const winRList = tradesWithRR.map(t => Number(t.finalRR)).filter(r => r > 0)
          const lossRList = tradesWithRR.map(t => Number(t.finalRR)).filter(r => r < 0)

          const winCount = winRList.length
          const calculatedWinRate = totalCount > 0 ? (winCount / totalCount) * 100 : 0

          const totalR = tradesWithRR.reduce((acc, t) => acc + (Number(t.finalRR) || 0), 0)

          const sumWins = winRList.reduce((acc, r) => acc + r, 0)
          const sumLosses = Math.abs(lossRList.reduce((acc, r) => acc + r, 0))

          let calculatedProfitFactor = 'N/A'
          if (sumLosses > 0) {
            calculatedProfitFactor = (sumWins / sumLosses).toFixed(2)
          } else if (sumWins > 0) {
            calculatedProfitFactor = '∞'
          }

          const bestR = tradesWithRR.length > 0 ? Math.max(...tradesWithRR.map(t => Number(t.finalRR))) : null
          const worstR = tradesWithRR.length > 0 ? Math.min(...tradesWithRR.map(t => Number(t.finalRR))) : null
          const avgWin = winRList.length > 0 ? (sumWins / winRList.length) : null
          const avgLoss = lossRList.length > 0 ? (lossRList.reduce((acc, r) => acc + r, 0) / lossRList.length) : null

          // Sichere Werte-Zuweisung mit Null-Checks
          const displayWinRate = (!isFiltered && stats && stats.winRate !== undefined) ? stats.winRate : calculatedWinRate
          const displayTotalR = (!isFiltered && stats && stats.totalR !== undefined) ? stats.totalR : totalR
          const displayProfitFactor = (!isFiltered && stats && stats.profitFactor !== undefined) ? stats.profitFactor : calculatedProfitFactor
          const displayBestR = (!isFiltered && stats && stats.bestTradeR !== undefined) ? stats.bestTradeR : bestR
          const displayWorstR = (!isFiltered && stats && stats.worstTradeR !== undefined) ? stats.worstTradeR : worstR
          const displayAvgWin = (!isFiltered && stats && stats.avgWinR !== undefined) ? stats.avgWinR : avgWin
          const displayAvgLoss = (!isFiltered && stats && stats.avgLossR !== undefined) ? stats.avgLossR : avgLoss

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* 1. Haupt-KPI Übersicht */}
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

              {/* 2. Detaillierte Stats */}
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

              {/* 3. CHART CONTAINER */}
              <div style={{ padding: '1.5rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, color: theme.heading }}>📈 Konto-Wachstum (Equity Curve in R)</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setChartXAxisMode('tradeCount')} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}># Trade-Anzahl</button>
                    <button onClick={() => setChartXAxisMode('time')} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>📅 Zeit</button>
                  </div>
                </div>

                {(!chartData || chartData.length < 2) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: theme.subText }}>
                    Keine ausreichenden Daten mit geschlossenen Trades (finalRR) für die Equity Curve vorhanden.
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                        <XAxis dataKey={chartXAxisMode === 'tradeCount' ? 'tradeNum' : 'date'} stroke={theme.subText} />
                        <YAxis stroke={theme.subText} unit=" R" />
                        <RechartsTooltip contentStyle={{ backgroundColor: theme.chartTooltipBg, color: theme.text, borderRadius: '8px' }} formatter={(value) => [`${value} R`, 'Kumuliert']} />
                        <Line
                          type="monotone"
                          dataKey="cumulativeR"
                          stroke={(chartData[chartData.length - 1]?.cumulativeR || 0) >= 0 ? '#28a745' : '#dc3545'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

export default App