package com.trading.journal.repository;

import com.trading.journal.model.Trade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    // Gibt automatisch ein Page-Objekt inklusive Metadaten (totalElements,
    // totalPages) zurück
    Page<Trade> findAll(Pageable pageable);
}