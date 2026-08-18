package com.trading.journal.service;

import com.trading.journal.model.Direction;
import com.trading.journal.model.Trade;
import com.trading.journal.repository.TradeRepository;
import com.trading.journal.dto.TradeStatsDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;

    public TradeService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    public Trade saveTrade(Trade trade) {
        calculateTradeMetrics(trade);
        return tradeRepository.save(trade);
    }

    public void deleteTrade(Long id) {
        tradeRepository.deleteById(id);
    }

    public Trade closeTrade(Long id, BigDecimal exitPrice) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade mit ID " + id + " nicht gefunden."));
        trade.setExitPrice(exitPrice);
        calculateTradeMetrics(trade);
        return tradeRepository.save(trade);
    }

    public Page<Trade> getFilteredTrades(String currencyPair, String direction, LocalDateTime startDate,
            LocalDateTime endDate, Pageable pageable) {
        return tradeRepository.findAll(pageable);
    }

    public TradeStatsDto calculateStats(List<Trade> trades) {
        long totalTrades = trades.size();
        long winningTrades = trades.stream()
                .filter(t -> t.getOutcome() != null && t.getOutcome().compareTo(BigDecimal.ZERO) > 0)
                .count();
        long losingTrades = trades.stream()
                .filter(t -> t.getOutcome() != null && t.getOutcome().compareTo(BigDecimal.ZERO) < 0)
                .count();

        double winRate = totalTrades > 0 ? ((double) winningTrades / totalTrades) * 100 : 0.0;

        // Summe aller R-Multiples
        double totalR = trades.stream()
                .filter(t -> t.getFinalRR() != null)
                .mapToDouble(t -> t.getFinalRR().doubleValue())
                .sum();

        double averageRR = trades.stream()
                .filter(t -> t.getFinalRR() != null)
                .mapToDouble(t -> t.getFinalRR().doubleValue())
                .average()
                .orElse(0.0);

        return new TradeStatsDto(totalTrades, winningTrades, losingTrades, winRate, totalR, averageRR);
    }

    private void calculateTradeMetrics(Trade trade) {
        if (trade.getEntryPrice() == null || trade.getStopLoss() == null || trade.getDirection() == null) {
            return;
        }

        BigDecimal entry = trade.getEntryPrice();
        BigDecimal stop = trade.getStopLoss();
        BigDecimal exit = trade.getExitPrice();

        BigDecimal riskDistance = trade.getDirection() == Direction.LONG
                ? entry.subtract(stop)
                : stop.subtract(entry);

        if (riskDistance.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (exit != null) {
            BigDecimal rewardDistance = trade.getDirection() == Direction.LONG
                    ? exit.subtract(entry)
                    : entry.subtract(exit);

            BigDecimal initialRR = rewardDistance.divide(riskDistance, 2, RoundingMode.HALF_UP);
            trade.setInitialRR(initialRR);
            trade.setOutcome(rewardDistance);
            trade.setFinalRR(initialRR);
        }
    }
}