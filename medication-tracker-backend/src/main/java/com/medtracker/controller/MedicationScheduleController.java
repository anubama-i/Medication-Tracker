package com.medtracker.controller;

import com.medtracker.entity.DoseLog;
import com.medtracker.entity.MedicationSchedule;
import com.medtracker.service.MedicationScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medication-schedule")
public class MedicationScheduleController {

    @Autowired
    private MedicationScheduleService scheduleService;

    @PostMapping
    public MedicationSchedule create(@RequestBody Map<String, Object> body) {
        return scheduleService.createSchedule(body);
    }

    @GetMapping("/patient/{patientId}")
    public List<MedicationSchedule> byPatient(@PathVariable Long patientId) {
        return scheduleService.getSchedulesForPatient(patientId);
    }

    @GetMapping("/patient/{patientId}/adherence")
    public Map<String, Object> adherence(@PathVariable Long patientId) {
        return scheduleService.getAdherenceForPatient(patientId);
    }

    @PostMapping("/doses/{doseId}/taken")
    public DoseLog markTaken(@PathVariable Long doseId) {
        return scheduleService.markDoseTaken(doseId);
    }

    @PostMapping("/doses/{doseId}/snooze")
    public DoseLog snooze(@PathVariable Long doseId, @RequestParam(defaultValue = "15") int minutes) {
        return scheduleService.snoozeDose(doseId, minutes);
    }

    @GetMapping("/patient/{patientId}/upcoming-doses")
    public List<Map<String, Object>> upcomingDoses(@PathVariable Long patientId) {
        return scheduleService.getUpcomingDosesForPatient(patientId);
    }
}

