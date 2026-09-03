// src/components/AccountBalanceChart.jsx
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AccountBalanceChart({ allTrades = [], theme = {} }) {
    const [initialBalance, setInitialBalance] = useState(() => {
        return parseFloat(localStorage.getItem('initial_account_balance')) || 10000;
    });

    // State für den X-Achsen-Modus ('tradeCount' oder 'time')
    const [chartXAxisMode, setChartXAxisMode] = useState('tradeCount');

    const handleBalanceChange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setInitialBalance(val);
        localStorage.setItem('initial_account_balance', val);
    };

    const balanceData = useMemo(() => {
        if (!allTrades || allTrades.length === 0) {
            return [];
        }

        // Chronologisch sortieren nach Datum
        const sorted = [...allTrades].sort(
            (a, b) => new Date(a.tradeDateTime || a.entryTime) - new Date(b.tradeDateTime || b.entryTime)
        );

        let currentBalance = initialBalance;
        const points = [];

        // Startpunkt für die Zeit-Achse setzen (falls Zeitmodus gewählt)
        const firstTradeDate = sorted[0]?.tradeDateTime || sorted[0]?.entryTime;
        const startTime = firstTradeDate ? new Date(firstTradeDate).getTime() - 86400000 : Date.now();

        points.push({
            tradeNum: 0,
            timestamp: startTime,
            dateStr: 'Start',
            balance: initialBalance,
            pnl: 0
        });

        sorted.forEach((trade, idx) => {
            // PnL berechnen: outcome ($) priorisieren, sonst finalRR * riskAmount
            const risk = parseFloat(trade.riskAmount || 0);
            const rr = parseFloat(trade.finalRR || 0);

            const pnl = trade.outcome != null
                ? parseFloat(trade.outcome)
                : (rr * risk);

            currentBalance += pnl;

            const dateObj = (trade.tradeDateTime || trade.entryTime)
                ? new Date(trade.tradeDateTime || trade.entryTime)
                : new Date();

            points.push({
                tradeNum: idx + 1,
                timestamp: dateObj.getTime(),
                dateStr: dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
                balance: Math.round(currentBalance * 100) / 100,
                pnl: Math.round(pnl * 100) / 100
            });
        });

        return points;
    }, [allTrades, initialBalance]);

    const finalBalance = balanceData[balanceData.length - 1]?.balance || initialBalance;
    const isPositive = finalBalance >= initialBalance;

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: theme.cardBg || '#1e1e1e',
            borderRadius: '8px',
            border: `1px solid ${theme.border || '#333'}`,
            marginTop: '1.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, color: theme.heading || '#fff' }}>💰 Absoluter Kontoverlauf ($ / CHF)</h3>
                    <p style={{ color: theme.subText || '#888', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                        ℹ️ <i>Hinweis: Dieser Chart zeigt stets die chronologische Gesamtentwicklung des Kontos und wird von Filtern nicht beeinflusst.</i>
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Umschalter für X-Achsen Modus */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setChartXAxisMode('tradeCount')}
                            style={{
                                padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                                backgroundColor: chartXAxisMode === 'tradeCount' ? '#007bff' : (theme.cardBg || '#2a2a2a'),
                                color: chartXAxisMode === 'tradeCount' ? 'white' : (theme.text || '#fff'),
                                border: `1px solid ${theme.border || '#444'}`, borderRadius: '4px'
                            }}
                        >
                            # Trade-Anzahl
                        </button>
                        <button
                            onClick={() => setChartXAxisMode('time')}
                            style={{
                                padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                                backgroundColor: chartXAxisMode === 'time' ? '#007bff' : (theme.cardBg || '#2a2a2a'),
                                color: chartXAxisMode === 'time' ? 'white' : (theme.text || '#fff'),
                                border: `1px solid ${theme.border || '#444'}`, borderRadius: '4px'
                            }}
                        >
                            📅 Zeit
                        </button>
                    </div>

                    {/* Eingabe Startkapital */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ color: theme.subText || '#ccc', fontSize: '0.8rem' }}>Startkapital:</label>
                        <input
                            type="number"
                            value={initialBalance}
                            onChange={handleBalanceChange}
                            style={{
                                backgroundColor: theme.cardBg || '#2a2a2a',
                                border: `1px solid ${theme.border || '#444'}`,
                                color: theme.text || '#fff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                width: '100px',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                </div>
            </div>

            {(!allTrades || allTrades.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: theme.subText }}>
                    Keine Trades für die Berechnung des absoluten Kontoverlaufs vorhanden.
                </div>
            ) : (
                <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height={350} minWidth={100} minHeight={300}>
                        <LineChart data={balanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid || '#333'} />

                            {chartXAxisMode === 'tradeCount' ? (
                                <XAxis dataKey="tradeNum" stroke={theme.subText || '#888'} />
                            ) : (
                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    stroke={theme.subText || '#888'}
                                    tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                                />
                            )}

                            <YAxis
                                stroke={theme.subText || '#888'}
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.chartTooltipBg || '#2b2b2b',
                                    color: theme.text || '#fff',
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.border || '#444'}`
                                }}
                                labelFormatter={(label) => chartXAxisMode === 'time'
                                    ? new Date(label).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    : (label === 0 ? 'Start' : `Trade #${label}`)
                                }
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Kontostand']}
                            />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke={isPositive ? '#28a745' : '#dc3545'}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}