package com.trading.journal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.trading.journal.model.Trade;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

}
