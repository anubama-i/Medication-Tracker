import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const validityBadge = (endDate, renewalDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);

    if (today > end) return { label: "Expired", bg: "#4c1d1d", color: "#f87171" };
    if (today >= renewal) return { label: "Due for Renewal", bg: "#422006", color: "#fb923c" };
    return { label: "Valid", bg: "#064e3b", color: "#34d399" };
};

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotif, setShowNotif] = useState(false);

    const [schedules, setSchedules] = useState([]);
    const [adherence, setAdherence] = useState({ adherencePercent: 100, takenDoses: 0, missedDoses: 0, totalDoses: 0 });
    const [upcomingDoses, setUpcomingDoses] = useState([]);

    const [newSchedule, setNewSchedule] = useState({
        prescriptionId: "",
        frequencyType: "DAILY",
        times: "08:00,20:00",
        startDate: "",
        endDate: "",
        adherenceThreshold: 80
    });

    const [loading, setLoading] = useState(true);
    const patientId = localStorage.getItem("userId");

    useEffect(() => {
        api.get(`/api/prescriptions/patient/${patientId}`)
            .then(r => { setPrescriptions(r.data); setLoading(false); })
            .catch(() => setLoading(false));

        api.get(`/api/notifications/${patientId}`)
            .then(r => setNotifications(r.data))
            .catch(() => { });

        api.get(`/api/notifications/${patientId}/unread-count`)
            .then(r => setUnreadCount(r.data.count ?? 0))
            .catch(() => { });

        api.get(`/api/medication-schedule/patient/${patientId}`)
            .then(r => setSchedules(r.data))
            .catch(() => { });

        api.get(`/api/medication-schedule/patient/${patientId}/adherence`)
            .then(r => setAdherence(r.data))
            .catch(() => { });

        api.get(`/api/medication-schedule/patient/${patientId}/upcoming-doses`)
            .then(r => setUpcomingDoses(r.data))
            .catch(() => { });
    }, [patientId]);

    const markAllRead = async () => {
        await api.put(`/api/notifications/${patientId}/read`);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleScheduleChange = (field, value) => {
        setNewSchedule(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateSchedule = async () => {
        if (!newSchedule.prescriptionId) {
            alert("Please select a prescription first.");
            return;
        }
        const selectedRx = prescriptions.find(p => p.id === Number(newSchedule.prescriptionId));
        const payload = {
            patientId: Number(patientId),
            prescriptionId: Number(newSchedule.prescriptionId),
            frequencyType: newSchedule.frequencyType,
            times: newSchedule.times.split(",").map(t => t.trim()).filter(Boolean),
            startDate: newSchedule.startDate || selectedRx?.startDate,
            endDate: newSchedule.endDate || selectedRx?.endDate,
            adherenceThreshold: Number(newSchedule.adherenceThreshold)
        };
        try {
            await api.post("/api/medication-schedule", payload);
            const sRes = await api.get(`/api/medication-schedule/patient/${patientId}`);
            setSchedules(sRes.data);
            const aRes = await api.get(`/api/medication-schedule/patient/${patientId}/adherence`);
            setAdherence(aRes.data);
            alert("Medication schedule created.");
        } catch (e) {
            alert("Failed to create schedule.");
        }
    };

    const handleMarkTaken = async (doseId) => {
        try {
            await api.post(`/api/medication-schedule/doses/${doseId}/taken`);
            const aRes = await api.get(`/api/medication-schedule/patient/${patientId}/adherence`);
            setAdherence(aRes.data);
            const uRes = await api.get(`/api/medication-schedule/patient/${patientId}/upcoming-doses`);
            setUpcomingDoses(uRes.data);
        } catch (e) {
            alert("Could not mark dose as taken.");
        }
    };

    const handleSnooze = async (doseId) => {
        try {
            await api.post(`/api/medication-schedule/doses/${doseId}/snooze?minutes=15`);
            const uRes = await api.get(`/api/medication-schedule/patient/${patientId}/upcoming-doses`);
            setUpcomingDoses(uRes.data);
        } catch (e) {
            alert("Could not snooze dose.");
        }
    };

    const handleDownload = (id) => {
        window.open(`http://localhost:8080/api/prescriptions/${id}/pdf`, "_blank");
    };

    return (
        <div style={s.page}>
            {/* Sidebar */}
            <div style={s.sidebar}>
                <div style={s.logo}>💊 MedTracker</div>
                <div style={s.navSection}>Patient Portal</div>
                <button style={s.activeNav}>💊 My Prescriptions</button>
                <button style={s.nav} onClick={() => { localStorage.clear(); navigate("/"); }}>🚪 Logout</button>
            </div>

            {/* Main */}
            <div style={s.main}>
                {/* Top bar */}
                <div style={s.topBar}>
                    <h1 style={s.title}>Patient Dashboard</h1>
                    <div style={s.topActions}>
                        <div style={s.bellWrapper} onClick={() => setShowNotif(!showNotif)}>
                            🔔
                            {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
                        </div>
                    </div>
                </div>

                {/* Notification dropdown */}
                {showNotif && (
                    <div style={s.notifPanel}>
                        <div style={s.notifHeader}>
                            <span style={{ fontWeight: 700, color: "#38bdf8" }}>🔔 Notifications</span>
                            <button style={s.markBtn} onClick={markAllRead}>Mark all read</button>
                        </div>
                        {notifications.length === 0 ? (
                            <div style={s.notifEmpty}>No notifications</div>
                        ) : notifications.map(n => (
                            <div key={n.id} style={{ ...s.notifItem, opacity: n.read ? 0.5 : 1 }}>
                                <div style={s.notifMsg}>{n.message}</div>
                                <div style={s.notifTime}>{n.createdAt}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats row */}
                <div style={s.statsRow}>
                    <div style={s.stat}>
                        <span style={s.statNum}>{prescriptions.length}</span>
                        <span style={s.statLabel}>Total Prescriptions</span>
                    </div>
                    <div style={s.stat}>
                        <span style={{ ...s.statNum, color: "#34d399" }}>{prescriptions.filter(p => new Date(p.endDate) >= new Date()).length}</span>
                        <span style={s.statLabel}>Active</span>
                    </div>
                    <div style={s.stat}>
                        <span style={{ ...s.statNum, color: "#f87171" }}>{prescriptions.filter(p => new Date(p.endDate) < new Date()).length}</span>
                        <span style={s.statLabel}>Expired</span>
                    </div>
                    <div style={s.stat}>
                        <span style={{ ...s.statNum, color: "#38bdf8" }}>
                            {adherence.adherencePercent?.toFixed ? adherence.adherencePercent.toFixed(1) : adherence.adherencePercent}%
                        </span>
                        <span style={s.statLabel}>Adherence</span>
                    </div>
                </div>

                {/* Upcoming doses */}
                <div style={s.tableCard}>
                    <h3 style={s.cardTitle}>⏰ Upcoming Doses (next 6 hours)</h3>
                    {upcomingDoses.length === 0 ? (
                        <div style={s.empty}>No upcoming doses.</div>
                    ) : (
                        <table style={s.table}>
                            <thead style={s.tableHead}>
                                <tr>
                                    <th style={s.tableTh}>Medication</th>
                                    <th style={s.tableTh}>Dosage</th>
                                    <th style={s.tableTh}>Scheduled Time</th>
                                    <th style={s.tableTh}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingDoses.map(d => (
                                    <tr key={d.doseId}>
                                        <td style={s.tableTd}>{d.medicationName}</td>
                                        <td style={s.tableTd}>{d.dosage}</td>
                                        <td style={s.tableTd}>{new Date(d.scheduledTime).toLocaleString()}</td>
                                        <td style={s.tableTd}>
                                            <button style={s.viewBtn} onClick={() => handleMarkTaken(d.doseId)}>Mark as Taken</button>
                                            <button style={s.snoozeBtn} onClick={() => handleSnooze(d.doseId)}>Snooze 15 min</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Schedule creation */}
                <div style={s.tableCard}>
                    <h3 style={s.cardTitle}>📅 Create Medication Schedule</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <label style={s.formLabel}>
                                Prescription
                                <select
                                    style={s.input}
                                    value={newSchedule.prescriptionId}
                                    onChange={e => handleScheduleChange("prescriptionId", e.target.value)}
                                >
                                    <option value="">Select prescription</option>
                                    {prescriptions.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.medicationName} ({p.dosage})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label style={s.formLabel}>
                                Frequency
                                <select
                                    style={s.input}
                                    value={newSchedule.frequencyType}
                                    onChange={e => handleScheduleChange("frequencyType", e.target.value)}
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="ALTERNATE_DAY">Alternate Day</option>
                                    <option value="CUSTOM">Custom (still uses chosen dates)</option>
                                </select>
                            </label>
                            <label style={s.formLabel}>
                                Times (HH:mm, comma separated)
                                <input
                                    style={s.input}
                                    value={newSchedule.times}
                                    onChange={e => handleScheduleChange("times", e.target.value)}
                                />
                            </label>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <label style={s.formLabel}>
                                Start Date
                                <input
                                    type="date"
                                    style={s.input}
                                    value={newSchedule.startDate}
                                    onChange={e => handleScheduleChange("startDate", e.target.value)}
                                />
                            </label>
                            <label style={s.formLabel}>
                                End Date
                                <input
                                    type="date"
                                    style={s.input}
                                    value={newSchedule.endDate}
                                    onChange={e => handleScheduleChange("endDate", e.target.value)}
                                />
                            </label>
                            <label style={s.formLabel}>
                                Adherence Threshold (%)
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    style={s.input}
                                    value={newSchedule.adherenceThreshold}
                                    onChange={e => handleScheduleChange("adherenceThreshold", e.target.value)}
                                />
                            </label>
                            <button style={s.createBtn} onClick={handleCreateSchedule}>Create Schedule</button>
                        </div>
                    </div>
                </div>

                {/* Prescriptions */}
                <div style={s.tableCard}>
                    <h3 style={s.cardTitle}>💊 Approved Prescriptions</h3>

                    {loading ? (
                        <div style={s.empty}>Loading prescriptions…</div>
                    ) : prescriptions.length === 0 ? (
                        <div style={s.empty}>No approved prescriptions found.</div>
                    ) : (
                        <table style={s.table}>
                            <thead style={s.tableHead}>
                                <tr>
                                    <th style={s.tableTh}>Medication</th>
                                    <th style={s.tableTh}>Dosage</th>
                                    <th style={s.tableTh}>Instructions</th>
                                    <th style={s.tableTh}>Start Date</th>
                                    <th style={s.tableTh}>End Date</th>
                                    <th style={s.tableTh}>Renewal Date</th>
                                    <th style={s.tableTh}>Doctor</th>
                                    <th style={s.tableTh}>PDF View</th>
                                    <th style={s.tableTh}>PDF Download</th>
                                    <th style={s.tableTh}>Status</th>
                                </tr>
                            </thead>
                            <tbody>

                                {prescriptions.map((p) => {
                                    const vb = validityBadge(p.endDate, p.renewalDate);
                                    return (
                                        <tr key={p.id}>
                                            <td style={s.tableTd}>
                                                <b>{p.medicationName}</b>

                                            </td>
                                            <td style={s.tableTd}>{p.dosage}</td>
                                            <td style={s.tableTd}>{p.instructions}</td>
                                            <td style={s.tableTd}>{p.startDate}</td>
                                            <td style={s.tableTd}>{p.endDate}</td>
                                            <td style={s.tableTd}>{p.renewalDate}</td>
                                            <td style={s.tableTd}>Dr. {p.doctor?.name || p.doctor_id}</td>
                                            <td style={s.tableTd}>
                                                <button
                                                    style={s.viewBtn}
                                                    onClick={async () => {
                                                        try {
                                                            const token = localStorage.getItem("token");
                                                            const response = await fetch(
                                                                `http://localhost:8080/api/prescriptions/${p.id}/pdf`,
                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                            );

                                                            if (!response.ok) throw new Error("Unauthorized");

                                                            const blob = await response.blob();
                                                            const url = URL.createObjectURL(blob);
                                                            window.open(url, "_blank");
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("You are not authorized to view this PDF.");
                                                        }
                                                    }}
                                                >
                                                    👁 View
                                                </button>
                                            </td>
                                            <td style={s.tableTd}>
                                                <button
                                                    style={s.downloadBtn}
                                                    onClick={() => handleDownload(p.id)}
                                                >
                                                    ⬇ Download
                                                </button>
                                            </td>
                                            <td style={{ ...s.tableTd, color: vb.color }}>{vb.label}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

const s = {
    page: { display: "flex", minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "'Inter', sans-serif" },
    sidebar: { width: "220px", background: "#111827", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px", borderRight: "1px solid #1e293b" },
    logo: { fontSize: "18px", fontWeight: "bold", color: "#38bdf8", marginBottom: "20px" },
    navSection: { fontSize: "11px", color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", marginTop: "8px" },
    activeNav: { background: "linear-gradient(135deg,#1e40af,#1d4ed8)", border: "none", color: "white", padding: "10px 14px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontWeight: "600" },
    nav: { background: "none", border: "none", color: "#94a3b8", padding: "10px 14px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "14px" },
    main: { flex: 1, padding: "32px", position: "relative" },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
    title: { fontSize: "26px", fontWeight: "700", margin: 0 },
    topActions: { display: "flex", alignItems: "center", gap: "12px" },
    bellWrapper: { position: "relative", cursor: "pointer", fontSize: "24px", padding: "4px" },
    badge: { position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "10px" },
    notifPanel: { position: "absolute", top: "80px", right: "32px", width: "340px", background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", zIndex: 999, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden" },
    notifHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #1e293b" },
    markBtn: { background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "12px" },
    notifEmpty: { padding: "20px", color: "#64748b", textAlign: "center" },
    notifItem: { padding: "12px 16px", borderBottom: "1px solid #1e293b" },
    notifMsg: { color: "#e2e8f0", fontSize: "13px" },
    notifTime: { color: "#475569", fontSize: "11px", marginTop: "4px" },
    statsRow: { display: "flex", gap: "16px", marginBottom: "28px" },
    stat: { background: "#111827", padding: "20px 24px", borderRadius: "12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px", border: "1px solid #1e293b" },
    statNum: { fontSize: "32px", fontWeight: "800", color: "white" },
    statLabel: { fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
    card: { background: "#111827", borderRadius: "12px", padding: "24px", border: "1px solid #1e293b" },
    cardTitle: { color: "#38bdf8", marginBottom: "20px", marginTop: 0 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
    rxCard: { background: "#0f172a", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "12px" },
    rxTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    rxMed: { fontSize: "17px", fontWeight: "700", color: "white" },
    rxDosage: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
    validBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" },
    rxDetails: { display: "flex", flexDirection: "column", gap: "6px" },
    rxRow: { color: "#94a3b8", fontSize: "13px" },
    notesBtn: { background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "12px", padding: "0" },
    notesBox: { background: "#1e293b", padding: "10px", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", marginTop: "6px" },
    pdfBtn: { background: "linear-gradient(135deg,#1e40af,#1d4ed8)", border: "none", color: "white", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", marginTop: "4px" },
    empty: { color: "#64748b", textAlign: "center", padding: "40px" },
    tableCard: { background: "#111827", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b", marginTop: "20px" },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px"
    },

    viewBtn: {
        background: "#22c55e",
        border: "none",
        padding: "6px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600"
    },

    downloadBtn: {
        background: "#2563eb",
        border: "none",
        padding: "6px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
        color: "white"
    }, tableHead: {
        background: "#020617",
    },

    tableTh: {
        padding: "10px",
        borderBottom: "1px solid #1e293b",
        textAlign: "left",
        color: "#38bdf8"
    },

    tableTd: {
        padding: "10px",
        borderBottom: "1px solid #1e293b",
        color: "#e2e8f0"
    },
    snoozeBtn: {
        background: "#f97316",
        border: "none",
        padding: "6px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
        color: "white",
        marginLeft: "8px"
    },
    formLabel: {
        display: "flex",
        flexDirection: "column",
        fontSize: "12px",
        color: "#94a3b8",
        gap: "4px"
    },
    input: {
        background: "#020617",
        borderRadius: "8px",
        border: "1px solid #1e293b",
        padding: "8px 10px",
        color: "#e2e8f0",
        fontSize: "13px"
    },
    createBtn: {
        background: "linear-gradient(135deg,#22c55e,#16a34a)",
        border: "none",
        borderRadius: "8px",
        padding: "10px",
        cursor: "pointer",
        color: "white",
        fontWeight: "700",
        marginTop: "8px"
    }
};
