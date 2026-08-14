package com.trading.journal.service;

import com.trading.journal.dto.TradeStatsDto;
import com.trading.journal.model.Trade;
import com.trading.journal.repository.TradeRepository;
import com.trading.journal.dto.TradeStatsDto;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

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

    public List<Trade> getFilteredTrades(String currencyPair, String direction, LocalDateTime start,
            LocalDateTime end) {
        Specification<Trade> spec = (root, query, cb) -> cb.conjunction();

        if (currencyPair != null && !currencyPair.isBlank()) {
            spec = spec
                    .and((root, query, cb) -> cb.equal(cb.lower(root.get("currencyPair")), currencyPair.toLowerCase()));
        }

        if (direction != null && !direction.isBlank()) {
            spec = spec.and((root, query, cb) -> {
                // Falls direction in der Trade-Entity ein Enum ist:
                try {
                    com.trading.journal.model.Direction dirEnum = com.trading.journal.model.Direction
                            .valueOf(direction.toUpperCase());
                    return cb.equal(root.get("direction"), dirEnum);
                } catch (IllegalArgumentException e) {
                    // Falls es ein normaler String in der Entity ist:
                    return cb.equal(cb.upper(root.get("direction")), direction.toUpperCase());
                }
            });
        }

        if (start != null && end != null) {
            spec = spec.and((root, query, cb) -> cb.between(root.get("entryTime"), start, end));
        }

        return tradeRepository.findAll(spec);
    }

    public TradeStatsDto calculateStats(List<Trade> trades) {
        // Nur geschlossene Trades auswerten, die ein finalRR haben
        List<Trade> closedTrades = trades.stream()
                .filter(t -> t.getFinalRR() != null)
                .toList();

        if (closedTrades.isEmpty()) {
            return new TradeStatsDto(0, 0, 0, 0.0, 0.0, 0.0);
        }

        long totalTrades = closedTrades.size();
        long winningTrades = closedTrades.stream().filter(t -> t.getFinalRR().compareTo(BigDecimal.ZERO) > 0).count();
        long losingTrades = closedTrades.stream().filter(t -> t.getFinalRR().compareTo(BigDecimal.ZERO) < 0).count();

        // Summieren mit BigDecimal.add
        BigDecimal totalRBigDecimal = closedTrades.stream()
                .map(Trade::getFinalRR)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double totalR = totalRBigDecimal.doubleValue();

        double winrate = ((double) winningTrades / totalTrades) * 100.0;
        double avgRR = totalR / totalTrades;

        // Runden auf 2 Nachkommastellen
        winrate = Math.round(winrate * 100.0) / 100.0;
        totalR = Math.round(totalR * 100.0) / 100.0;
        avgRR = Math.round(avgRR * 100.0) / 100.0;

        return new TradeStatsDto(totalTrades, winningTrades, losingTrades, winrate, totalR, avgRR);
    }
}
