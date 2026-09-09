package com.trading.journal.service;

import com.trading.journal.dto.TradeStatsDto;
import com.trading.journal.model.Direction;
import com.trading.journal.model.Trade;
import com.trading.journal.repository.TradeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;

    public TradeService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    public Page<Trade> getAllTrades(Pageable pageable) {
        return tradeRepository.findAll(pageable);
    }

    public Trade saveTrade(Trade trade) {
        if (!trade.isValidStopLoss()) {
            throw new IllegalArgumentException("Ungültiger Stop Loss für die gewählte Richtung.");
        }

        if (trade.getTradeDateTime() == null) {
            trade.setTradeDateTime(LocalDateTime.now());
        }

        calculateAndSetFinalRR(trade);
        return tradeRepository.save(trade);
    }

    // --- NEU: Trade über PATCH schließen ---
    public Trade closeTrade(Long id, BigDecimal exitPrice) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade nicht gefunden mit ID: " + id));

        trade.setExitPrice(exitPrice);
        calculateAndSetFinalRR(trade);

        return tradeRepository.save(trade);
    }

    public Trade updateTrade(Long id, Trade updatedTrade) {
        Trade existingTrade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade nicht gefunden mit ID: " + id));

        existingTrade.setCurrencyPair(updatedTrade.getCurrencyPair());
        existingTrade.setDirection(updatedTrade.getDirection());
        existingTrade.setEntryPrice(updatedTrade.getEntryPrice());
        existingTrade.setStopLoss(updatedTrade.getStopLoss());
        existingTrade.setExitPrice(updatedTrade.getExitPrice());

        // Aktualisierte Bilder & Notizen
        existingTrade.setScreenshots(updatedTrade.getScreenshots());
        existingTrade.setNotes(updatedTrade.getNotes());

        if (updatedTrade.getTradeDateTime() != null) {
            existingTrade.setTradeDateTime(updatedTrade.getTradeDateTime());
        }

        calculateAndSetFinalRR(existingTrade);

        return tradeRepository.save(existingTrade);
    }

    public void deleteTrade(Long id) {
        tradeRepository.deleteById(id);
    }

    public TradeStatsDto calculateStats() {
        List<Trade> allTrades = tradeRepository.findAll();

        List<Trade> closedTrades = allTrades.stream()
                .filter(t -> t.getFinalRR() != null)
                .toList();

        long totalClosed = closedTrades.size();

        long winningTrades = closedTrades.stream()
                .filter(t -> t.getFinalRR().compareTo(BigDecimal.ZERO) > 0)
                .count();

        double winRate = totalClosed > 0
                ? ((double) winningTrades / totalClosed) * 100.0
                : 0.0;

        BigDecimal totalR = closedTrades.stream()
                .map(Trade::getFinalRR)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new TradeStatsDto((long) allTrades.size(), winRate, totalR.doubleValue());
    }

    // Hilfsmethode zur zentralen Berechnung von FinalRR
    private void calculateAndSetFinalRR(Trade trade) {
        if (trade.getExitPrice() != null && trade.getEntryPrice() != null && trade.getStopLoss() != null) {
            BigDecimal r;
            if (trade.getDirection() == Direction.LONG) {
                r = (trade.getExitPrice().subtract(trade.getEntryPrice()))
                        .divide(trade.getEntryPrice().subtract(trade.getStopLoss()), 2, RoundingMode.HALF_UP);
            } else {
                r = (trade.getEntryPrice().subtract(trade.getExitPrice()))
                        .divide(trade.getStopLoss().subtract(trade.getEntryPrice()), 2, RoundingMode.HALF_UP);
            }
            trade.setFinalRR(r);
        }
    }
}