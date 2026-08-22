package com.trading.journal.dto;

public class TradeStatsDto {
    private long totalTrades;
    private double winRate;
    private double totalR;

    public TradeStatsDto(long totalTrades, double winRate, double totalR) {
        this.totalTrades = totalTrades;
        this.winRate = winRate;
        this.totalR = totalR;
    }

    // Getter und Setter
    public long getTotalTrades() {
        return totalTrades;
    }

    public void setTotalTrades(long totalTrades) {
        this.totalTrades = totalTrades;
    }

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
    }

    public double getTotalR() {
        return totalR;
    }

    public void setTotalR(double totalR) {
        this.totalR = totalR;
    }
}