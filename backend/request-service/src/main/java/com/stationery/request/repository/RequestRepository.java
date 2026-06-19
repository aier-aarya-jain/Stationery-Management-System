package com.stationery.request.repository;

import com.stationery.request.entity.StationeryRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<StationeryRequest, Long> {
    Page<StationeryRequest> findByStudentEmail(String studentEmail, Pageable pageable);
    Page<StationeryRequest> findByStudentEmailAndStatus(String studentEmail, com.stationery.request.entity.RequestStatus status, Pageable pageable);
    Page<StationeryRequest> findByStatus(com.stationery.request.entity.RequestStatus status, Pageable pageable);
}

