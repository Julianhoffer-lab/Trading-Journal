/**
 * Validiert die Eingaben für einen Trade (Long vs. Short Regeln).
 */
export const validateTradeInput = ({ type, entryPrice, stopLoss, exitPrice }) => {
    const errors = {};

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const exit = parseFloat(exitPrice);

    // 1. Entry-Prüfung
    if (isNaN(entry) || entry <= 0) {
        errors.entryPrice = "Bitte einen gültigen Entry-Preis eingeben.";
    }

    // 2. Stop Loss Regel für Long vs. Short
    if (!isNaN(entry) && !isNaN(sl)) {
        if (sl <= 0) {
            errors.stopLoss = "Stop Loss muss größer als 0 sein.";
        } else if (type === 'LONG' && sl >= entry) {
            errors.stopLoss = "Bei LONG muss der Stop Loss UNTER dem Entry liegen.";
        } else if (type === 'SHORT' && sl <= entry) {
            errors.stopLoss = "Bei SHORT muss der Stop Loss ÜBER dem Entry liegen.";
        }
    } else if (isNaN(sl)) {
        errors.stopLoss = "Bitte einen gültigen Stop Loss eingeben.";
    }

    // 3. Exit-Preis Prüfung (optional)
    if (exitPrice !== '' && exitPrice !== null && exitPrice !== undefined) {
        if (isNaN(exit) || exit <= 0) {
            errors.exitPrice = "Exit-Preis muss eine gültige Zahl > 0 sein.";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};