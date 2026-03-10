package com.medtracker.repository;

import com.medtracker.entity.DoseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoseLogRepository extends JpaRepository<DoseLog, Long> {

    List<DoseLog> findByScheduleId(Long scheduleId);

    List<DoseLog> findBySchedulePatientId(Long patientId);
}

