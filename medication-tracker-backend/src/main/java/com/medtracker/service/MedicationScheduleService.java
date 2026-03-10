package com.medtracker.service;

import com.medtracker.entity.*;
import com.medtracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MedicationScheduleService {

    @Autowired
    private MedicationScheduleRepository scheduleRepo;

    @Autowired
    private DoseLogRepository doseLogRepo;

    @Autowired
    private PrescriptionRepository prescriptionRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private NotificationRepository notificationRepo;

    public MedicationSchedule createSchedule(Map<String, Object> data) {
        Long patientId = Long.valueOf(data.get("patientId").toString());
        Long prescriptionId = Long.valueOf(data.get("prescriptionId").toString());

        User patient = userRepo.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Prescription prescription = prescriptionRepo.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        MedicationSchedule schedule = new MedicationSchedule();
        schedule.setPatient(patient);
        schedule.setPrescription(prescription);

        String frequencyType = String.valueOf(data.getOrDefault("frequencyType", "DAILY")).toUpperCase(Locale.ROOT);
        schedule.setFrequencyType(frequencyType);

        @SuppressWarnings("unchecked")
        List<String> timesList = (List<String>) data.get("times");
        if (timesList == null || timesList.isEmpty()) {
            throw new IllegalArgumentException("At least one time must be provided");
        }
        schedule.setTimes(String.join(",", timesList));

        LocalDate startDate = LocalDate.parse(data.get("startDate").toString());
        LocalDate endDate = LocalDate.parse(data.get("endDate").toString());
        schedule.setStartDate(startDate);
        schedule.setEndDate(endDate);

        if (data.containsKey("adherenceThreshold")) {
            schedule.setAdherenceThreshold(Double.valueOf(data.get("adherenceThreshold").toString()));
        }

        schedule = scheduleRepo.save(schedule);

        generateDoseLogs(schedule, timesList);

        return schedule;
    }

    private void generateDoseLogs(MedicationSchedule schedule, List<String> timesList) {
        List<DoseLog> logs = new ArrayList<>();

        LocalDate date = schedule.getStartDate();
        LocalDate end = schedule.getEndDate();

        int dayStep = 1;
        if ("ALTERNATE_DAY".equalsIgnoreCase(schedule.getFrequencyType())) {
            dayStep = 2;
        }

        while (!date.isAfter(end)) {
            for (String timeStr : timesList) {
                LocalTime time = LocalTime.parse(timeStr);
                LocalDateTime scheduled = LocalDateTime.of(date, time);

                DoseLog log = new DoseLog();
                log.setSchedule(schedule);
                log.setScheduledTime(scheduled);
                log.setStatus("SCHEDULED");
                logs.add(log);
            }
            date = date.plusDays(dayStep);
        }

        doseLogRepo.saveAll(logs);
    }

    public List<MedicationSchedule> getSchedulesForPatient(Long patientId) {
        return scheduleRepo.findByPatientId(patientId);
    }

    public Map<String, Object> getAdherenceForPatient(Long patientId) {
        List<DoseLog> allLogs = doseLogRepo.findBySchedulePatientId(patientId);

        long taken = allLogs.stream()
                .filter(l -> "TAKEN".equalsIgnoreCase(l.getStatus()))
                .count();
        long missed = allLogs.stream()
                .filter(l -> "MISSED".equalsIgnoreCase(l.getStatus()))
                .count();

        long totalConsidered = taken + missed;
        double adherence = totalConsidered == 0 ? 100.0 : (taken * 100.0 / totalConsidered);

        Map<String, Object> result = new HashMap<>();
        result.put("takenDoses", taken);
        result.put("missedDoses", missed);
        result.put("totalDoses", totalConsidered);
        result.put("adherencePercent", adherence);

        return result;
    }

    public DoseLog markDoseTaken(Long doseId) {
        DoseLog dose = doseLogRepo.findById(doseId)
                .orElseThrow(() -> new RuntimeException("Dose not found"));
        dose.setStatus("TAKEN");
        dose.setTakenTime(LocalDateTime.now());
        dose.setSnoozedUntil(null);
        DoseLog saved = doseLogRepo.save(dose);

        checkAdherenceAndAlertDoctor(saved.getSchedule());
        return saved;
    }

    public DoseLog snoozeDose(Long doseId, int minutes) {
        DoseLog dose = doseLogRepo.findById(doseId)
                .orElseThrow(() -> new RuntimeException("Dose not found"));
        dose.setStatus("SNOOZED");
        dose.setSnoozedUntil(LocalDateTime.now().plusMinutes(minutes));
        return doseLogRepo.save(dose);
    }

    private void checkAdherenceAndAlertDoctor(MedicationSchedule schedule) {
        if (schedule.getAdherenceThreshold() == null) {
            return;
        }

        List<DoseLog> logsForSchedule = doseLogRepo.findByScheduleId(schedule.getId());

        long taken = logsForSchedule.stream()
                .filter(l -> "TAKEN".equalsIgnoreCase(l.getStatus()))
                .count();
        long missed = logsForSchedule.stream()
                .filter(l -> "MISSED".equalsIgnoreCase(l.getStatus()))
                .count();

        long total = taken + missed;
        if (total == 0) {
            return;
        }

        double adherence = taken * 100.0 / total;
        if (adherence < schedule.getAdherenceThreshold()) {
            Prescription p = schedule.getPrescription();
            User doctor = p.getDoctor();
            if (doctor != null) {
                String msg = "⚠️ Patient " + schedule.getPatient().getName()
                        + " adherence for \"" + p.getMedicationName()
                        + "\" fell below threshold (" + String.format("%.1f", adherence) + "%).";
                notificationRepo.save(new Notification(doctor.getId(), msg));
            }
        }
    }

    public List<Map<String, Object>> getUpcomingDosesForPatient(Long patientId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusHours(6);

        List<DoseLog> allLogs = doseLogRepo.findBySchedulePatientId(patientId);

        return allLogs.stream()
                .filter(l -> {
                    if ("TAKEN".equalsIgnoreCase(l.getStatus())) return false;
                    LocalDateTime effectiveTime = l.getSnoozedUntil() != null ? l.getSnoozedUntil() : l.getScheduledTime();
                    return !effectiveTime.isBefore(now) && !effectiveTime.isAfter(soon);
                })
                .sorted(Comparator.comparing(DoseLog::getScheduledTime))
                .map(l -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("doseId", l.getId());
                    map.put("scheduledTime", l.getScheduledTime());
                    map.put("status", l.getStatus());
                    map.put("medicationName", l.getSchedule().getPrescription().getMedicationName());
                    map.put("dosage", l.getSchedule().getPrescription().getDosage());
                    return map;
                })
                .collect(Collectors.toList());
    }
}

