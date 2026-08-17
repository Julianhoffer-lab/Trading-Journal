package com.trading.journal.repository;

import com.trading.journal.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TradeRepository extends JpaRepository<Trade, Long>, JpaSpecificationExecutor<Trade> {
    // Hier brauchst du KEINE findBy... Methoden mehr!
}
