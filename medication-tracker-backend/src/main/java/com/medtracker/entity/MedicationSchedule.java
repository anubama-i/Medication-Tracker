package com.medtracker.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "medication_schedules")
public class MedicationSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Owning patient of this schedule.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private User patient;

    /**
     * Prescription this schedule is based on.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    /**
     * DAILY, ALTERNATE_DAY, CUSTOM
     */
    @Column(name = "frequency_type", nullable = false)
    private String frequencyType;

    /**
     * Comma‑separated list of times in HH:mm (e.g. "08:00,20:00").
     */
    @Column(name = "times", nullable = false, length = 255)
    private String times;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Adherence threshold in percent (e.g. 80.0). When the
     * patient's adherence for this schedule falls below this
     * value, a doctor alert will be generated.
     */
    @Column(name = "adherence_threshold")
    private Double adherenceThreshold;

    public MedicationSchedule() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getPatient() {
        return patient;
    }

    public void setPatient(User patient) {
        this.patient = patient;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public String getFrequencyType() {
        return frequencyType;
    }

    public void setFrequencyType(String frequencyType) {
        this.frequencyType = frequencyType;
    }

    public String getTimes() {
        return times;
    }

    public void setTimes(String times) {
        this.times = times;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Double getAdherenceThreshold() {
        return adherenceThreshold;
    }

    public void setAdherenceThreshold(Double adherenceThreshold) {
        this.adherenceThreshold = adherenceThreshold;
    }
}

