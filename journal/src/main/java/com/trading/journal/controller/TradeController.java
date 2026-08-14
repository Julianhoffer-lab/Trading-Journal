package com.trading.journal.controller;

import com.trading.journal.dto.TradeStatsDto;
import com.trading.journal.model.Trade;
import com.trading.journal.service.TradeService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/trades")
public class TradeController {

    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping
    public ResponseEntity<Trade> createTrade(@RequestBody Trade trade) {
        return ResponseEntity.ok(tradeService.saveTrade(trade));
    }

    @GetMapping
    public ResponseEntity<List<Trade>> getAllTrades(
            @RequestParam(required = false) String currencyPair,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return ResponseEntity.ok(tradeService.getFilteredTrades(currencyPair, direction, start, end));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrade(@PathVariable Long id) {
        tradeService.deleteTrade(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Trade> closeTrade(@PathVariable Long id, @RequestParam BigDecimal exitPrice) {
        return ResponseEntity.ok(tradeService.closeTrade(id, exitPrice));
    }

    @GetMapping("/stats")
    public ResponseEntity<TradeStatsDto> getStats(
            @RequestParam(required = false) String currencyPair,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<Trade> filteredTrades = tradeService.getFilteredTrades(currencyPair, direction, start, end);
        TradeStatsDto stats = tradeService.calculateStats(filteredTrades);

        return ResponseEntity.ok(stats);
    }
}
