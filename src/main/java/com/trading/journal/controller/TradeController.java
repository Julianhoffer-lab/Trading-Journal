package com.trading.journal.controller;

import com.trading.journal.dto.TradeStatsDto;
import com.trading.journal.model.Trade;
import com.trading.journal.service.TradeService;
import com.trading.journal.repository.TradeRepository;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trades")
@CrossOrigin(origins = "*")
public class TradeController {

    private final TradeService tradeService;
    private final TradeRepository tradeRepository;

    public TradeController(TradeService tradeService, TradeRepository tradeRepository) {
        this.tradeService = tradeService;
        this.tradeRepository = tradeRepository;
    }

    @PostMapping
    public ResponseEntity<Trade> createTrade(@Valid @RequestBody Trade trade) {
        Trade savedTrade = tradeService.saveTrade(trade);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTrade);
    }

    @GetMapping
    public List<Trade> getAllTrades() {
        return tradeService.getAllTrades(); // bzw. tradeRepository.findAll();
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Trade> closeTrade(@PathVariable Long id, @RequestParam BigDecimal exitPrice) {
        return ResponseEntity.ok(tradeService.closeTrade(id, exitPrice));
    }

    @GetMapping("/stats")
    public ResponseEntity<TradeStatsDto> getStats() {
        return ResponseEntity.ok(tradeService.calculateStats());
    }

    // Trade löschen
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrade(@PathVariable Long id) {
        tradeService.deleteTrade(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trade> updateTrade(@PathVariable Long id, @RequestBody Trade tradeDetails) {
        return tradeRepository.findById(id)
                .map(trade -> {
                    if (tradeDetails.getCurrencyPair() != null)
                        trade.setCurrencyPair(tradeDetails.getCurrencyPair());
                    if (tradeDetails.getDirection() != null)
                        trade.setDirection(tradeDetails.getDirection());
                    if (tradeDetails.getRiskAmount() != null)
                        trade.setRiskAmount(tradeDetails.getRiskAmount());
                    if (tradeDetails.getFinalRR() != null)
                        trade.setFinalRR(tradeDetails.getFinalRR());
                    if (tradeDetails.getEntryPrice() != null)
                        trade.setEntryPrice(tradeDetails.getEntryPrice());
                    if (tradeDetails.getStopLoss() != null)
                        trade.setStopLoss(tradeDetails.getStopLoss());
                    if (tradeDetails.getExitPrice() != null)
                        trade.setExitPrice(tradeDetails.getExitPrice());
                    if (tradeDetails.getNotes() != null)
                        trade.setNotes(tradeDetails.getNotes());

                    // Screenshots-Liste aktualisieren:
                    if (tradeDetails.getScreenshots() != null) {
                        trade.getScreenshots().clear();
                        trade.getScreenshots().addAll(tradeDetails.getScreenshots());
                    }

                    Trade updatedTrade = tradeRepository.save(trade);
                    return ResponseEntity.ok(updatedTrade);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
