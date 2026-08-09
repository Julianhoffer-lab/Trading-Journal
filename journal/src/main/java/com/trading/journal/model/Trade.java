package com.trading.journal.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;

@Entity
@Table(name = "trades")
public class Trade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String currencyPair;
    private BigDecimal entryPrice;
    private BigDecimal stopLoss;
    private BigDecimal exitPrice;
    @Enumerated(EnumType.STRING)
    private Direction direction;
    private LocalDateTime entryTime;
    private String notes;
    private BigDecimal outcome;
    private BigDecimal initialRR;
    private String imageUrl;
    private BigDecimal finalRR;

    public Trade(String currencyPair, BigDecimal entryPrice, BigDecimal stopLoss, BigDecimal exitPrice,
            Direction direction, LocalDateTime entryTime, String notes, BigDecimal outcome, BigDecimal initialRR,
            String imageUrl) {
        this.currencyPair = currencyPair;
        this.entryPrice = entryPrice;
        this.stopLoss = stopLoss;
        this.exitPrice = exitPrice;
        this.direction = direction;
        this.entryTime = entryTime;
        this.notes = notes;
        this.outcome = outcome;
        this.initialRR = initialRR;
        this.imageUrl = imageUrl;
        this.finalRR = BigDecimal.ZERO;
    }

    public Trade() {
    }

    public BigDecimal calculateFinalRR() { // noch überprüfen, ob die Berechnung korrekt ist
        BigDecimal risk = entryPrice.subtract(stopLoss).abs();
        BigDecimal reward;
        if (direction == Direction.SHORT) {
            reward = this.entryPrice.subtract(this.exitPrice).abs();
        } else {
            reward = this.exitPrice.subtract(this.entryPrice).abs();
        }
        if (risk.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO; // Avoid division by zero
        }
        this.finalRR = reward.divide(risk, 2, RoundingMode.HALF_UP);
        return this.finalRR;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCurrencyPair() {
        return currencyPair;
    }

    public void setCurrencyPair(String currencyPair) {
        this.currencyPair = currencyPair;
    }

    public BigDecimal getEntryPrice() {
        return entryPrice;
    }

    public void setEntryPrice(BigDecimal entryPrice) {
        this.entryPrice = entryPrice;
    }

    public BigDecimal getStopLoss() {
        return stopLoss;
    }

    public void setStopLoss(BigDecimal stopLoss) {
        this.stopLoss = stopLoss;
    }

    public BigDecimal getExitPrice() {
        return exitPrice;
    }

    public void setExitPrice(BigDecimal exitPrice) {
        this.exitPrice = exitPrice;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getOutcome() {
        return outcome;
    }

    public void setOutcome(BigDecimal outcome) {
        this.outcome = outcome;
    }

    public BigDecimal getInitialRR() {
        return initialRR;
    }

    public void setInitialRR(BigDecimal initialRR) {
        this.initialRR = initialRR;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public BigDecimal getFinalRR() {
        return finalRR;
    }

    public void setFinalRR(BigDecimal finalRR) {
        this.finalRR = finalRR;
    }

}
