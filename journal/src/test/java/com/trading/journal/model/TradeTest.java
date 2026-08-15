package com.trading.journal.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

class TradeTest {

    @Test
    @DisplayName("Sollte das Final RR für einen erfolgreichen LONG-Trade korrekt berechnen")
    void shouldCalculateFinalRRForLongTrade() {
        // Arrange
        Trade trade = new Trade();
        trade.setDirection(Direction.LONG);
        trade.setEntryPrice(new BigDecimal("100.00"));
        trade.setStopLoss(new BigDecimal("90.00")); // Risiko: 10
        trade.setExitPrice(new BigDecimal("130.00")); // Gewinnen: 30

        // Act
        BigDecimal finalRR = trade.calculateFinalRR();

        // Assert: 30 / 10 = 3.00 (CRV von 3)
        assertEquals(new BigDecimal("3.00"), finalRR);
    }

    @Test
    @DisplayName("Sollte das Final RR für einen erfolgreichen SHORT-Trade korrekt berechnen")
    void shouldCalculateFinalRRForShortTrade() {
        // Arrange
        Trade trade = new Trade();
        trade.setDirection(Direction.SHORT);
        trade.setEntryPrice(new BigDecimal("100.00"));
        trade.setStopLoss(new BigDecimal("110.00")); // Risiko: 10
        trade.setExitPrice(new BigDecimal("70.00")); // Gewinnen: 30

        // Act
        BigDecimal finalRR = trade.calculateFinalRR();

        // Assert: 30 / 10 = 3.00
        assertEquals(new BigDecimal("3.00"), finalRR);
    }
}