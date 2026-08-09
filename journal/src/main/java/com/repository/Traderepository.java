package com.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.trading.journal.model.Trade;
import org.springframework.stereotype.Repository;

@Repository
public interface Traderepository extends JpaRepository<Trade, Long> {

}
