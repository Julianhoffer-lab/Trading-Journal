package com.trading.journal.service;

import com.trading.journal.model.Trade;
import com.trading.journal.repository.TradeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;

    // Constructor Injection (Best Practice)
    public TradeService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    public Trade saveTrade(Trade trade) {
        // Hier lassen sich vor dem Speichern Berechnungen durchführen
        return tradeRepository.save(trade);
    }

    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    public Optional<Trade> getTradeById(Long id) {
        return tradeRepository.findById(id);
    }

    public void deleteTrade(Long id) {
        tradeRepository.deleteById(id);
    }

    public Trade closeTrade(Long id, BigDecimal exitPrice) {
        // 1. Trade aus der Datenbank laden
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trade mit ID " + id + " nicht gefunden!"));

        // 2. Exit-Preis setzen und finalRR berechnen lassen
        trade.setExitPrice(exitPrice);
        trade.calculateFinalRR(); // Nutzt deine Logik aus dem Model!

        // 3. Aktualisierten Trade in PostgreSQL speichern
        return tradeRepository.save(trade);
    }
}
