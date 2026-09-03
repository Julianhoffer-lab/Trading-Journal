public class Trade {
    private Long id;
    private String currencyPair;
    private BigDecimal entryPrice;
    private BigDecimal stopLoss;
    private BigDecimal exitPrice;
    private Direction direction;
    private LocalDateTime entryTime;
    private String notes;
    private BigDecimal outcome;
    private BigDecimal initialRR;
    private String imageUrl;
    private BigDecimal finalRR;

    public Trade(Long id, String currencyPair, BigDecimal entryPrice, BigDecimal stopLoss, BigDecimal exitPrice,
            Direction direction, LocalDateTime entryTime, String notes, BigDecimal outcome, BigDecimal initialRR,
            String imageUrl) {
        this.id = id;
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

}
