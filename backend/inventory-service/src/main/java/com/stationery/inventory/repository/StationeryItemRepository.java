package com.stationery.inventory.repository;

import com.stationery.inventory.entity.StationeryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StationeryItemRepository extends JpaRepository<StationeryItem, Long> {
    @Query("SELECT s FROM StationeryItem s WHERE s.availableQuantity <= s.minimumQuantity")
    Page<StationeryItem> findLowStockItems(Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
    java.util.Optional<StationeryItem> findByNameIgnoreCase(String name);
}

