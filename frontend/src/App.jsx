import { useState, useEffect } from 'react'

function App() {
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Selected Trade & State für Detail-Edit
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [images, setImages] = useState({ imageUrl1: '', imageUrl2: '', imageUrl3: '' })
  const [isSaving, setIsSaving] = useState(false)

  // Neu: State für vergrößertes Bild (Lightbox / Preview)
  const [previewImage, setPreviewImage] = useState(null)

  // Filter States
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

  // Beim Öffnen des Modals Daten synchronisieren
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

  // Screenshot per Strg + V einfügen
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

  // Notizen & Screenshots speichern
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

  // Filter-Logik
  const filteredTrades = trades.filter(trade => {
    const matchesPair = trade.currencyPair.toLowerCase().includes(filterPair.toLowerCase())
    const matchesDirection = filterDirection === 'ALL' || trade.direction === filterDirection

    const isWin = trade.finalRR !== null && trade.finalRR > 0
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

  const getDayName = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div style={{ padding: '2rem' }}>Lade Daten vom Backend...</div>

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h1>Trading Journal Dashboard</h1>

      {/* 1. Statistik-Karten */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Total Trades</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{stats.totalTrades ?? 0}</p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Win Rate</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: stats.winRate >= 50 ? '#28a745' : '#dc3545' }}>
              {stats.winRate ? stats.winRate.toFixed(1) : '0.0'}%
            </p>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Total R</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: stats.totalR >= 0 ? '#28a745' : '#dc3545' }}>
              {stats.totalR ? stats.totalR.toFixed(2) : '0.00'} R
            </p>
          </div>
        </div>
      )}

      {/* 2. Formular zum Anlegen (Schnelleingabe) */}
      <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '2rem', backgroundColor: '#f9f9f9' }}>
        <h2>Neuen Trade erfassen (Schnelleingabe)</h2>

        {errorMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '1rem' }}>
            <strong>Fehler:</strong> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Währungspaar:</label>
            <input type="text" name="currencyPair" value={formData.currencyPair} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>

          <div>
            <label>Richtung:</label>
            <select name="direction" value={formData.direction} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>

          <div>
            <label>Entry Preis:</label>
            <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>

          <div>
            <label>Stop Loss:</label>
            <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>

          <div>
            <label>Exit Preis:</label>
            <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>

          <div>
            <label>Datum & Uhrzeit des Trades:</label>
            <input type="datetime-local" name="tradeDateTime" value={formData.tradeDateTime} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>

          <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Trade Speichern
          </button>
        </form>
      </div>

      {/* 3. Filter-Leiste */}
      <div style={{ padding: '1rem', backgroundColor: '#eef2f5', borderRadius: '8px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Währungspaar:</label>
          <input type="text" placeholder="z.B. EUR/USD..." value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Richtung:</label>
          <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="ALL">Alle Richtungen</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Ergebnis:</label>
          <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="ALL">Alle Trades</option>
            <option value="WIN">Gewinner (Win)</option>
            <option value="LOSS">Verlierer (Loss)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Wochentag:</label>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="ALL">Alle Tage</option>
            <option value="1">Montag</option>
            <option value="2">Dienstag</option>
            <option value="3">Mittwoch</option>
            <option value="4">Donnerstag</option>
            <option value="5">Freitag</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Notiz-Suche:</label>
          <input type="text" placeholder="Stichwort..." value={filterNotes} onChange={(e) => setFilterNotes(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
      </div>

      {/* 4. Tabellen-Übersicht */}
      <h2>Alle Trades ({filteredTrades.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Datum / Zeit</th>
            <th style={{ padding: '12px' }}>Währungspaar</th>
            <th style={{ padding: '12px' }}>Richtung</th>
            <th style={{ padding: '12px' }}>Entry</th>
            <th style={{ padding: '12px' }}>Exit</th>
            <th style={{ padding: '12px' }}>Ergebnis (R)</th>
            <th style={{ padding: '12px' }}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrades.map(trade => {
            const isWin = trade.finalRR !== null && trade.finalRR > 0
            return (
              <tr
                key={trade.id}
                onClick={() => openModal(trade)}
                style={{ borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <td style={{ padding: '12px', fontWeight: 'bold' }}>#{trade.id}</td>
                <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>{getDayName(trade.tradeDateTime)}</td>
                <td style={{ padding: '12px' }}>{trade.currencyPair}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: trade.direction === 'LONG' ? '#e3f2fd' : '#fbe9e7', color: trade.direction === 'LONG' ? '#1976d2' : '#d32f2f', fontWeight: 'bold', fontSize: '0.85rem' }}>
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

      {/* 5. Detail-Modal */}
      {selectedTrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
              <h2>Trade Details #{selectedTrade.id} - {selectedTrade.currencyPair}</h2>
              <button onClick={() => setSelectedTrade(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '6px' }}>
              <div><strong>Zeitpunkt:</strong> {getDayName(selectedTrade.tradeDateTime)}</div>
              <div><strong>Richtung:</strong> {selectedTrade.direction}</div>
              <div><strong>Entry Price:</strong> {selectedTrade.entryPrice}</div>
              <div><strong>Stop Loss:</strong> {selectedTrade.stopLoss}</div>
              <div><strong>Exit Price:</strong> {selectedTrade.exitPrice}</div>
              <div><strong>Ergebnis (R):</strong> <span style={{ color: selectedTrade.finalRR > 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>{selectedTrade.finalRR} R</span></div>
            </div>

            {/* Bearbeitbare Notizen */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Notizen / Journal-Eintrag</h3>
              <textarea
                rows="6"
                placeholder="Schreibe hier ausführliche Notizen, Emotionen oder Setups zum Trade..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' }}
              />
            </div>

            {/* Screenshots per Paste (Strg + V) & Klick zum Vergrößern */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Screenshots (In Feld klicken & Strg + V drücken)</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
                Tipp: Klicke auf ein eingefügtes Bild, um es groß anzuzeigen.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['imageUrl1', 'imageUrl2', 'imageUrl3'].map((slot, index) => (
                  <div key={slot} style={{ textAlign: 'center' }}>
                    <div
                      onPaste={(e) => handlePasteImage(e, slot)}
                      tabIndex="0"
                      style={{
                        border: '2px dashed #bbb',
                        borderRadius: '6px',
                        padding: '6px',
                        minHeight: '130px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer'
                      }}
                    >
                      {images[slot] ? (
                        <img
                          src={images[slot]}
                          alt={`Screenshot ${index + 1}`}
                          onClick={() => setPreviewImage(images[slot])}
                          title="Klicken zum Vergrößern"
                          style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#777' }}>Bild {index + 1}<br />Klicken & Strg+V</span>
                      )}
                    </div>
                    {images[slot] && (
                      <button
                        onClick={() => setImages(prev => ({ ...prev, [slot]: '' }))}
                        style={{ marginTop: '4px', fontSize: '0.75rem', color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setSelectedTrade(null)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Abbrechen
              </button>
              <button onClick={handleSaveDetails} disabled={isSaving} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSaving ? 'Speichere...' : 'Änderungen Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Lightbox Overlay (Vergrößerte Bildansicht) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            cursor: 'zoom-out',
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewImage}
              alt="Vergrößerter Screenshot"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 4px 25px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App