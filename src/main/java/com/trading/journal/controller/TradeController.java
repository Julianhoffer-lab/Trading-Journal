package com.trading.journal.controller;

import com.trading.journal.dto.TradeStatsDto;
import com.trading.journal.model.Trade;
import com.trading.journal.service.TradeService;

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

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
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

        // .getContent() wandelt das Page<Trade> in die benötigte List<Trade> um
        List<Trade> filteredTrades = tradeService
                .getFilteredTrades(currencyPair, direction, start, end, Pageable.unpaged()).getContent();

        TradeStatsDto stats = tradeService.calculateStats(filteredTrades);

        return ResponseEntity.ok(stats);
    }
}
