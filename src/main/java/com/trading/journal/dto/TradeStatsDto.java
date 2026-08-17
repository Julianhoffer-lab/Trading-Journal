package com.trading.journal.dto;

public class TradeStatsDto {

    private long totalTrades;
    private long winningTrades;
    private long losingTrades;
    private double winratePercent;
    private double totalR;
    private double averageRR;

    public TradeStatsDto(long totalTrades, long winningTrades, long losingTrades,
            double winratePercent, double totalR, double averageRR) {
        this.totalTrades = totalTrades;
        this.winningTrades = winningTrades;
        this.losingTrades = losingTrades;
        this.winratePercent = winratePercent;
        this.totalR = totalR;
        this.averageRR = averageRR;
    }

    // Getter
    public long getTotalTrades() {
        return totalTrades;
    }

    public long getWinningTrades() {
        return winningTrades;
    }

    public long getLosingTrades() {
        return losingTrades;
    }

    public double getWinratePercent() {
        return winratePercent;
    }

    public double getTotalR() {
        return totalR;
    }

    public double getAverageRR() {
        return averageRR;
    }
}
