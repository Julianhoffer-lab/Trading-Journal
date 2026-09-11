package com.trading.journal.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.AssertTrue;

@Entity
@Table(name = "trades")
public class Trade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Währungspaar darf nicht leer sein.")
    private String currencyPair;
    @NotNull(message = "Entry-Preis ist erforderlich.")
    @Positive(message = "Entry-Preis muss positiv sein.")
    private BigDecimal entryPrice;
    @NotNull(message = "Stop-Loss ist erforderlich.")
    @Positive(message = "Stop-Loss muss positiv sein.")
    private BigDecimal stopLoss;
    @Positive(message = "Exit-Preis muss positiv sein.")
    private BigDecimal exitPrice;
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Direction (LONG/SHORT) ist erforderlich.")
    private Direction direction;
    @Column(columnDefinition = "TEXT")
    private String notes;
    private BigDecimal outcome;
    @Column(name = "initial_rr")
    private BigDecimal initialRR;
    @Column(name = "final_rr")
    private BigDecimal finalRR;
    @ElementCollection
    @CollectionTable(name = "trade_screenshots", joinColumns = @JoinColumn(name = "trade_id"))
    @Column(name = "image_url")
    private List<String> screenshots = new ArrayList<>();
    private LocalDateTime tradeDateTime;
    @NotNull(message = "Risiko ist erforderlich.")
    @Positive(message = "Risiko muss positiv sein.")
    @Column(name = "risk_amount")
    private BigDecimal riskAmount; // z. B. 100.00 CHF / USD

    public Trade(String currencyPair, BigDecimal entryPrice, BigDecimal stopLoss, BigDecimal exitPrice,
            Direction direction, LocalDateTime entryTime, String notes, BigDecimal outcome, BigDecimal initialRR,
            List<String> screenshots) {
        this.currencyPair = currencyPair;
        this.entryPrice = entryPrice;
        this.stopLoss = stopLoss;
        this.exitPrice = exitPrice;
        this.direction = direction;
        this.entryTime = entryTime;
        this.notes = notes;
        this.outcome = outcome;
        this.initialRR = initialRR;
        this.screenshots = screenshots;
        this.finalRR = BigDecimal.ZERO;
    }

    public Trade() {
    }

    @AssertTrue(message = "Ungültiger Stop Loss: Bei LONG muss der Stop Loss unter dem Entry Price liegen, bei SHORT darüber.")
    public boolean isValidStopLoss() {
        if (entryPrice == null || stopLoss == null || direction == null) {
            return true; // Null-Prüfung erledigen bereits @NotNull Annotations
        }

        if (direction == Direction.LONG) {
            return stopLoss.compareTo(entryPrice) < 0;
        } else if (direction == Direction.SHORT) {
            return stopLoss.compareTo(entryPrice) > 0;
        }

        return true;
    }

    public BigDecimal calculateFinalRR() {
        BigDecimal risk = entryPrice.subtract(stopLoss).abs();

        if (risk.compareTo(BigDecimal.ZERO) == 0) {
            this.finalRR = BigDecimal.ZERO;
            return BigDecimal.ZERO;
        }

        BigDecimal priceChange;
        if (direction == Direction.SHORT) {
            priceChange = this.entryPrice.subtract(this.exitPrice);
        } else {
            priceChange = this.exitPrice.subtract(this.entryPrice);
        }

        // Vorzeichen bleibt erhalten! (+2.5 R bei Gewinn, -1.0 R bei Loss)
        this.finalRR = priceChange.divide(risk, 2, RoundingMode.HALF_UP);

        // Berechne direkt den absoluten Geldbetrag ($ / CHF)
        if (this.riskAmount != null) {
            this.outcome = this.finalRR.multiply(this.riskAmount).setScale(2, RoundingMode.HALF_UP);
        }

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

    public List<String> getScreenshots() {
        return screenshots;
    }

    public void setScreenshots(List<String> screenshots) {
        this.screenshots = screenshots;
    }

    public BigDecimal getFinalRR() {
        return finalRR;
    }

    public void setFinalRR(BigDecimal finalRR) {
        this.finalRR = finalRR;
    }

    public LocalDateTime getTradeDateTime() {
        return tradeDateTime;
    }

    public void setTradeDateTime(LocalDateTime tradeDateTime) {
        this.tradeDateTime = tradeDateTime;
    }

    public BigDecimal getRiskAmount() {
        return riskAmount;
    }

    public void setRiskAmount(BigDecimal riskAmount) {
        this.riskAmount = riskAmount;
    }

}
