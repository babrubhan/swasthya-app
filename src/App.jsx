import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { sendOtp, verifyOtp, getOrCreatePatient, savePatientProfile, bookAppointment, placeMedicineOrder, saveSession, loadSession, clearSession } from "./api"; // eslint-disable-line no-unused-vars

// ============================================================
// SWASTHYA — Patient Health Record & Clinic Booking App (V1)
// Design: Warm Indian-palette, clean utilitarian, trust-first
// ============================================================

const COLORS = {
  saffron: "#E8650A",
  saffronLight: "#FF8534",
  saffronPale: "#FFF3EB",
  teal: "#0A8B7A",
  tealLight: "#12B09C",
  tealPale: "#E6F7F5",
  navy: "#1A2340",
  navyMid: "#2E3D5E",
  cream: "#FDFAF6",
  warmGray: "#F5F0EA",
  text: "#1A2340",
  textMid: "#4A5578",
  textLight: "#8A94B2",
  white: "#FFFFFF",
  red: "#E53935",
  redPale: "#FFF0F0",
  green: "#2E7D52",
  greenPale: "#EAF7EE",
  gold: "#C49A1A",
  goldPale: "#FFF8E1",
  border: "#E8E2D8",
  shadow: "rgba(26,35,64,0.08)",
};

// ============================================================
// DATA
// ============================================================
const INITIAL_PATIENT = {
  name: "Ramesh Kumar",
  age: 42,
  phone: "9876543210",
  abhaId: "12-3456-7890-1234",
  bloodGroup: "B+",
  city: "Jabalpur",
  family: [
    { id: 1, name: "Ramesh Kumar", relation: "Self", age: 42, avatar: "R" },
    { id: 2, name: "Sunita Kumar", relation: "Wife", age: 38, avatar: "S" },
    { id: 3, name: "Arjun Kumar", relation: "Son", age: 14, avatar: "A" },
  ],
};

const RECORDS = [
  {
    id: 1,
    patientId: 1,
    title: "Complete Blood Count",
    type: "Lab Report",
    date: "2026-03-15",
    doctor: "Dr. M. Sharma",
    hospital: "City Diagnostic Centre",
    status: "normal",
    values: [
      { name: "Hemoglobin", value: "13.8", unit: "g/dL", normal: "13.5–17.5", flag: "normal" },
      { name: "WBC Count", value: "7200", unit: "/μL", normal: "4500–11000", flag: "normal" },
      { name: "Platelet Count", value: "210000", unit: "/μL", normal: "150000–400000", flag: "normal" },
      { name: "RBC Count", value: "4.9", unit: "M/μL", normal: "4.5–5.9", flag: "normal" },
    ],
    summary: "All values within normal range.",
  },
  {
    id: 2,
    patientId: 1,
    title: "Blood Sugar (Fasting)",
    type: "Lab Report",
    date: "2026-03-10",
    doctor: "Dr. P. Agarwal",
    hospital: "Shree Health Lab",
    status: "warning",
    values: [
      { name: "Fasting Glucose", value: "118", unit: "mg/dL", normal: "70–99", flag: "high" },
      { name: "HbA1c", value: "6.1", unit: "%", normal: "< 5.7", flag: "high" },
    ],
    summary: "Fasting glucose slightly elevated. Pre-diabetic range. Follow-up advised.",
  },
  {
    id: 3,
    patientId: 1,
    title: "X-Ray Chest PA View",
    type: "Imaging",
    date: "2026-02-20",
    doctor: "Dr. R. Mishra",
    hospital: "Narmada Hospital",
    status: "normal",
    values: [],
    summary: "No active lesions detected. Normal cardiac silhouette.",
  },
  {
    id: 4,
    patientId: 2,
    title: "Thyroid Profile (T3, T4, TSH)",
    type: "Lab Report",
    date: "2026-03-18",
    doctor: "Dr. A. Singh",
    hospital: "City Diagnostic Centre",
    status: "warning",
    values: [
      { name: "TSH", value: "6.2", unit: "mIU/L", normal: "0.4–4.0", flag: "high" },
      { name: "T3", value: "1.1", unit: "ng/mL", normal: "0.8–2.0", flag: "normal" },
      { name: "T4", value: "7.8", unit: "μg/dL", normal: "5.0–12.0", flag: "normal" },
    ],
    summary: "TSH elevated — subclinical hypothyroidism. Endocrinologist consult advised.",
  },
];

const APPOINTMENTS = [
  {
    id: 1,
    doctor: "Dr. P. Agarwal",
    specialty: "General Physician",
    hospital: "Shree Health Lab",
    date: "2026-03-28",
    time: "10:30 AM",
    type: "Follow-up",
    status: "upcoming",
    patientId: 1,
  },
  {
    id: 2,
    doctor: "Dr. A. Singh",
    specialty: "Endocrinologist",
    hospital: "Narmada Hospital",
    date: "2026-03-30",
    time: "4:00 PM",
    type: "Consultation",
    status: "upcoming",
    patientId: 2,
  },
  {
    id: 3,
    doctor: "Dr. M. Sharma",
    specialty: "Pathologist",
    hospital: "City Diagnostic Centre",
    date: "2026-03-10",
    time: "9:00 AM",
    type: "Lab Visit",
    status: "completed",
    patientId: 1,
  },
];

const CLINICS = [
  { id:1, name:"General Hospital Mahendragarh", type:"Government Hospital", city:"Mahendragarh", address:"Hospital Rd, Mahendragarh", rating:4.1, reviews:412, distance:"0.9 km", homeService:false, slots:["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM"], services:["OPD Consultation","Emergency","X-Ray","Blood Tests","Maternity"], openTime:"8 AM – 8 PM", verified:true },
  { id:2, name:"Shiva Diagnostic Centre", type:"Diagnostic Lab", city:"Mahendragarh", address:"Narnaul Rd, Mahendragarh", rating:4.5, reviews:187, distance:"1.3 km", homeService:true, slots:["8:00 AM","9:00 AM","10:00 AM","11:00 AM","4:00 PM","5:00 PM"], services:["Blood Tests","Urine Tests","ECG","X-Ray","Home Collection"], openTime:"7:30 AM – 7 PM", verified:true },
  { id:3, name:"Dr. Rajesh Yadav Clinic", type:"General Physician", city:"Mahendragarh", address:"Subhash Chowk, Mahendragarh", rating:4.7, reviews:256, distance:"0.6 km", homeService:true, slots:["9:30 AM","11:00 AM","5:00 PM","6:00 PM","7:00 PM"], services:["OPD Consultation","Vaccinations","Child Health","Home Visit"], openTime:"9 AM – 8 PM", verified:true },
  { id:4, name:"Civil Hospital Rewari", type:"Government Hospital", city:"Rewari", address:"Civil Hospital Rd, Rewari", rating:4.0, reviews:523, distance:"1.1 km", homeService:false, slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM"], services:["OPD","Emergency","Maternity","X-Ray","Blood Tests","Eye Care"], openTime:"8 AM – 8 PM", verified:true },
  { id:5, name:"Garg Pathology Lab", type:"Pathology Lab", city:"Rewari", address:"Model Town, Rewari", rating:4.4, reviews:143, distance:"0.8 km", homeService:true, slots:["7:30 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM"], services:["Blood Tests","Urine Tests","Thyroid Profile","Lipid Profile","Home Collection"], openTime:"7 AM – 2 PM", verified:true },
  { id:6, name:"Dr. Sunita Sharma Clinic", type:"General Physician", city:"Rewari", address:"Gandhi Nagar, Rewari", rating:4.6, reviews:198, distance:"1.5 km", homeService:false, slots:["10:00 AM","11:30 AM","4:00 PM","5:30 PM","6:30 PM"], services:["OPD Consultation","Women Health","Diabetes Care","BP Management"], openTime:"10 AM – 8 PM", verified:true },
  { id:7, name:"CHC Narnaul", type:"Government Hospital", city:"Narnaul", address:"Hospital Rd, Narnaul", rating:3.9, reviews:289, distance:"0.7 km", homeService:false, slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM"], services:["OPD","Emergency","X-Ray","Blood Tests","Maternity","Dental"], openTime:"8 AM – 6 PM", verified:true },
  { id:8, name:"Arogya Diagnostic Centre", type:"Diagnostic Lab", city:"Narnaul", address:"Rewari Rd, Narnaul", rating:4.3, reviews:112, distance:"1.2 km", homeService:true, slots:["8:00 AM","9:00 AM","10:00 AM","11:00 AM","3:00 PM"], services:["Blood Tests","Urine Tests","X-Ray","Ultrasound","Home Collection"], openTime:"8 AM – 6 PM", verified:false },
  { id:9, name:"Dr. Manoj Saini Clinic", type:"General Physician", city:"Narnaul", address:"Subzi Mandi Rd, Narnaul", rating:4.8, reviews:178, distance:"0.4 km", homeService:true, slots:["9:00 AM","10:30 AM","5:00 PM","6:00 PM","7:00 PM"], services:["OPD Consultation","Child Health","Vaccinations","Home Visit"], openTime:"9 AM – 8 PM", verified:true },
];

const MEDICINES = [
  { id:1, name:"Paracetamol 500mg", brand:"Crocin", category:"Pain Relief", price:22, unit:"Strip of 15", inStock:true },
  { id:2, name:"Amoxicillin 500mg", brand:"Novamox", category:"Antibiotic", price:85, unit:"Strip of 10", inStock:true },
  { id:3, name:"Metformin 500mg", brand:"Glycomet", category:"Diabetes", price:38, unit:"Strip of 20", inStock:true },
  { id:4, name:"Atorvastatin 10mg", brand:"Atorva", category:"Cholesterol", price:65, unit:"Strip of 15", inStock:true },
  { id:5, name:"Omeprazole 20mg", brand:"Omez", category:"Acidity", price:42, unit:"Strip of 10", inStock:true },
  { id:6, name:"Cetirizine 10mg", brand:"Zyrtec", category:"Allergy", price:28, unit:"Strip of 10", inStock:false },
  { id:7, name:"Azithromycin 500mg", brand:"Azithral", category:"Antibiotic", price:110, unit:"Strip of 3", inStock:true },
  { id:8, name:"Vitamin D3 1000IU", brand:"D3 Must", category:"Supplements", price:180, unit:"Bottle of 60", inStock:true },
];

const HOME_SERVICES = [
  { id: 1, icon: "🩸", title: "Lab Sample Collection", desc: "Technician visits home", price: "₹50", eta: "Same day" },
  { id: 2, icon: "💉", title: "Injection / IV Drip", desc: "Registered nurse visit", price: "₹150", eta: "2–4 hrs" },
  { id: 3, icon: "🩺", title: "Doctor Home Visit", desc: "General physician", price: "₹300", eta: "3–6 hrs" },
  { id: 4, icon: "🦽", title: "Physiotherapy", desc: "Certified therapist", price: "₹400", eta: "Next day" },
  { id: 5, icon: "🩹", title: "Wound Dressing", desc: "Trained nurse", price: "₹200", eta: "2–4 hrs" },
  { id: 6, icon: "❤️", title: "ECG at Home", desc: "Technician + report", price: "₹350", eta: "Same day" },
];

// ============================================================
// UTILS
// ============================================================
const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const daysUntil = (d) => {
  const today = new Date();
  const target = new Date(d);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Completed";
  return `In ${diff} days`;
};

// ============================================================
// STYLES (inline for single-file)
// ============================================================
const S = {
  app: {
    fontFamily: "'Mukta', 'Noto Sans Devanagari', sans-serif",
    background: COLORS.cream,
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 60px rgba(0,0,0,0.15)",
  },
  screen: {
    minHeight: "100vh",
    paddingBottom: 90,
    background: COLORS.cream,
  },
  // Top bar
  topBar: {
    background: COLORS.navy,
    padding: "52px 20px 18px",
    position: "relative",
  },
  topBarRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  appTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: COLORS.saffronLight,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  greeting: { fontSize: 20, fontWeight: 700, color: COLORS.white, lineHeight: 1.2 },
  greetingSub: { fontSize: 13, color: "#8A9EC5", marginTop: 2 },
  notifBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    background: "rgba(255,255,255,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", border: "none", fontSize: 18, position: "relative",
  },
  notifDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    background: COLORS.saffron,
    border: "2px solid " + COLORS.navy,
  },
  // ABHA strip
  abhaStrip: {
    margin: "14px 20px 0",
    background: "linear-gradient(135deg, #0A3D62 0%, #1A2340 100%)",
    borderRadius: 12,
    padding: "10px 14px",
    display: "flex", alignItems: "center", gap: 10,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  abhaIcon: { fontSize: 22 },
  abhaLabel: { fontSize: 10, color: "#8A9EC5", letterSpacing: 1, textTransform: "uppercase" },
  abhaId: { fontSize: 13, color: COLORS.white, fontWeight: 600, letterSpacing: 1 },
  abhaVerified: {
    marginLeft: "auto",
    background: COLORS.teal,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 20,
    letterSpacing: 0.5,
  },
  // Section
  sectionHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 20px 10px",
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: COLORS.text },
  sectionLink: { fontSize: 13, color: COLORS.saffron, fontWeight: 600, cursor: "pointer" },
  // Family strip
  familyScroll: {
    display: "flex", gap: 12, padding: "0 20px 4px",
    overflowX: "auto",
  },
  familyCard: (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    cursor: "pointer", minWidth: 64,
  }),
  familyAvatar: (active) => ({
    width: 52, height: 52, borderRadius: 26,
    background: active
      ? `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`
      : COLORS.navyMid,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, color: COLORS.white,
    border: active ? `3px solid ${COLORS.saffron}` : "3px solid transparent",
    boxShadow: active ? `0 4px 16px rgba(232,101,10,0.35)` : "none",
    transition: "all 0.2s",
  }),
  familyName: (active) => ({
    fontSize: 11, fontWeight: active ? 700 : 500,
    color: active ? COLORS.saffron : COLORS.textMid,
    textAlign: "center", maxWidth: 60, lineHeight: 1.2,
  }),
  // Quick action grid
  quickGrid: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
    gap: 12, padding: "0 20px",
  },
  quickItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    cursor: "pointer",
  },
  quickIcon: (color) => ({
    width: 56, height: 56, borderRadius: 16,
    background: color,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24,
    boxShadow: `0 4px 12px ${COLORS.shadow}`,
  }),
  quickLabel: {
    fontSize: 11, fontWeight: 600, color: COLORS.textMid,
    textAlign: "center", lineHeight: 1.3,
  },
  // Upcoming appointment card
  apptCard: {
    margin: "0 20px",
    background: COLORS.white,
    borderRadius: 16,
    padding: 16,
    boxShadow: `0 4px 20px ${COLORS.shadow}`,
    border: `1px solid ${COLORS.border}`,
  },
  apptCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  apptDoc: { fontSize: 16, fontWeight: 700, color: COLORS.text },
  apptSpec: { fontSize: 12, color: COLORS.textMid, marginTop: 1 },
  apptBadge: (status) => ({
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    background: status === "upcoming" ? COLORS.tealPale : COLORS.warmGray,
    color: status === "upcoming" ? COLORS.teal : COLORS.textLight,
  }),
  apptRow: { display: "flex", gap: 16, marginBottom: 12 },
  apptInfo: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.textMid },
  apptActions: { display: "flex", gap: 10 },
  btnOutline: {
    flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
    background: "transparent", fontSize: 13, fontWeight: 600, color: COLORS.textMid,
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
    background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
    fontSize: 13, fontWeight: 700, color: COLORS.white,
    cursor: "pointer", boxShadow: `0 4px 12px rgba(232,101,10,0.3)`,
  },
  // Record card
  recordCard: (status) => ({
    margin: "0 20px 12px",
    background: COLORS.white,
    borderRadius: 14,
    padding: 14,
    border: `1px solid ${status === "warning" ? "#FFD8B0" : COLORS.border}`,
    boxShadow: `0 2px 12px ${COLORS.shadow}`,
    cursor: "pointer",
    transition: "transform 0.15s",
  }),
  recordHeader: { display: "flex", alignItems: "center", gap: 12 },
  recordIconBox: (status) => ({
    width: 44, height: 44, borderRadius: 12,
    background: status === "warning" ? COLORS.goldPale : COLORS.tealPale,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
  }),
  recordTitle: { fontSize: 15, fontWeight: 700, color: COLORS.text },
  recordMeta: { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  recordBadge: (status) => ({
    marginLeft: "auto",
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
    background: status === "warning" ? COLORS.goldPale : COLORS.greenPale,
    color: status === "warning" ? COLORS.gold : COLORS.green,
    flexShrink: 0,
  }),
  // Nav bar
  navBar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: 430, background: COLORS.white,
    borderTop: `1px solid ${COLORS.border}`,
    display: "flex", padding: "8px 0 20px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    zIndex: 100,
  },
  navItem: (active) => ({
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    cursor: "pointer", padding: "4px 0",
  }),
  navIcon: (active) => ({
    fontSize: 22, lineHeight: 1,
    filter: active ? "none" : "grayscale(100%) opacity(0.4)",
  }),
  navLabel: (active) => ({
    fontSize: 10, fontWeight: active ? 700 : 500,
    color: active ? COLORS.saffron : COLORS.textLight,
    letterSpacing: 0.3,
  }),
  navDot: {
    width: 5, height: 5, borderRadius: 3,
    background: COLORS.saffron, margin: "-1px auto 0",
  },
  // Page header (back)
  pageHeader: {
    background: COLORS.navy,
    padding: "52px 20px 20px",
    display: "flex", alignItems: "center", gap: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    background: "rgba(255,255,255,0.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", border: "none", fontSize: 18, color: COLORS.white,
    flexShrink: 0,
  },
  pageTitle: { fontSize: 18, fontWeight: 700, color: COLORS.white },
  pageSubtitle: { fontSize: 13, color: "#8A9EC5", marginTop: 1 },
  // Clinic card
  clinicCard: {
    margin: "0 20px 12px",
    background: COLORS.white,
    borderRadius: 16, padding: 16,
    border: `1px solid ${COLORS.border}`,
    boxShadow: `0 2px 12px ${COLORS.shadow}`,
    cursor: "pointer",
  },
  clinicHeader: { display: "flex", gap: 12, alignItems: "flex-start" },
  clinicIconBox: {
    width: 50, height: 50, borderRadius: 14,
    background: COLORS.tealPale,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 26, flexShrink: 0,
  },
  clinicName: { fontSize: 15, fontWeight: 700, color: COLORS.text },
  clinicType: { fontSize: 12, color: COLORS.teal, fontWeight: 600, marginTop: 1 },
  clinicAddr: { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  clinicMeta: {
    display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap",
  },
  chip: (color) => ({
    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
    background: color || COLORS.warmGray, color: COLORS.textMid,
  }),
  // Home service card
  serviceCard: {
    background: COLORS.white,
    borderRadius: 14, padding: "14px 16px",
    border: `1px solid ${COLORS.border}`,
    display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
    boxShadow: `0 2px 8px ${COLORS.shadow}`,
    margin: "0 20px 12px",
  },
  serviceIconBox: {
    width: 52, height: 52, borderRadius: 14,
    background: COLORS.saffronPale,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 26, flexShrink: 0,
  },
  serviceTitle: { fontSize: 15, fontWeight: 700, color: COLORS.text },
  serviceDesc: { fontSize: 12, color: COLORS.textMid, marginTop: 1 },
  serviceMeta: { marginLeft: "auto", textAlign: "right", flexShrink: 0 },
  servicePrice: { fontSize: 16, fontWeight: 800, color: COLORS.saffron },
  serviceEta: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  // Record detail
  detailSection: { margin: "16px 20px 0" },
  detailCard: {
    background: COLORS.white, borderRadius: 14,
    padding: 16, border: `1px solid ${COLORS.border}`,
    boxShadow: `0 2px 12px ${COLORS.shadow}`,
  },
  valueRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: `1px solid ${COLORS.warmGray}`,
  },
  valueName: { fontSize: 14, color: COLORS.textMid },
  valueNum: (flag) => ({
    fontSize: 15, fontWeight: 700,
    color: flag === "high" ? COLORS.red : flag === "low" ? "#1565C0" : COLORS.green,
  }),
  valueNormal: { fontSize: 11, color: COLORS.textLight, marginTop: 1, textAlign: "right" },
  summaryBox: {
    background: COLORS.tealPale, borderRadius: 10, padding: 12,
    border: `1px solid rgba(10,139,122,0.2)`, marginTop: 12,
  },
  summaryText: { fontSize: 13, color: COLORS.teal, lineHeight: 1.5 },
  // Download button
  downloadBtn: {
    margin: "16px 20px",
    background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyMid})`,
    color: COLORS.white, border: "none", borderRadius: 14,
    padding: "14px 0", width: "calc(100% - 40px)",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: `0 4px 16px rgba(26,35,64,0.3)`,
  },
  shareBtn: {
    margin: "0 20px 20px",
    background: COLORS.tealPale,
    color: COLORS.teal, border: `1.5px solid ${COLORS.teal}`, borderRadius: 14,
    padding: "12px 0", width: "calc(100% - 40px)",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  // Profile
  profileHeader: {
    background: COLORS.navy, padding: "52px 20px 28px",
    display: "flex", alignItems: "center", gap: 16,
  },
  profileAvatar: {
    width: 68, height: 68, borderRadius: 34,
    background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, fontWeight: 700, color: COLORS.white,
    border: "3px solid rgba(255,255,255,0.2)",
  },
  profileName: { fontSize: 20, fontWeight: 800, color: COLORS.white },
  profileMeta: { fontSize: 13, color: "#8A9EC5", marginTop: 2 },
  profileStatRow: {
    display: "flex", gap: 12, margin: "16px 20px",
  },
  profileStat: {
    flex: 1, background: COLORS.white, borderRadius: 14, padding: 14,
    textAlign: "center", border: `1px solid ${COLORS.border}`,
    boxShadow: `0 2px 8px ${COLORS.shadow}`,
  },
  profileStatNum: { fontSize: 22, fontWeight: 800, color: COLORS.saffron },
  profileStatLabel: { fontSize: 11, color: COLORS.textMid, marginTop: 3 },
  settingRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 20px", borderBottom: `1px solid ${COLORS.warmGray}`,
    cursor: "pointer",
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, flexShrink: 0,
  },
  settingLabel: { fontSize: 15, fontWeight: 600, color: COLORS.text },
  settingDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  // Modal / Bottom sheet
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  sheet: {
    background: COLORS.white, width: "100%", maxWidth: 430, margin: "0 auto",
    borderRadius: "24px 24px 0 0", padding: "20px 20px 40px",
    maxHeight: "85vh", overflowY: "auto",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    background: COLORS.border, margin: "0 auto 16px",
  },
  sheetTitle: { fontSize: 18, fontWeight: 800, color: COLORS.text, marginBottom: 16 },
  input: {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: `1.5px solid ${COLORS.border}`, fontSize: 14,
    background: COLORS.warmGray, color: COLORS.text,
    outline: "none", boxSizing: "border-box", marginBottom: 12,
    fontFamily: "inherit",
  },
  inputLabel: { fontSize: 13, fontWeight: 600, color: COLORS.textMid, marginBottom: 5, display: "block" },
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 },
  slotBtn: (active) => ({
    padding: "10px 0", borderRadius: 10, textAlign: "center",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    border: active ? `2px solid ${COLORS.saffron}` : `1.5px solid ${COLORS.border}`,
    background: active ? COLORS.saffronPale : COLORS.white,
    color: active ? COLORS.saffron : COLORS.textMid,
  }),
  confirmBtn: {
    width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
    background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
    color: COLORS.white, fontSize: 16, fontWeight: 800, cursor: "pointer",
    boxShadow: `0 6px 20px rgba(232,101,10,0.4)`,
    marginTop: 8,
  },
  toast: {
    position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
    background: COLORS.navy, color: COLORS.white,
    padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 300, whiteSpace: "nowrap",
  },
  // Warning banner
  warningBanner: {
    margin: "12px 20px 0",
    background: COLORS.goldPale,
    border: `1px solid #FFD57C`,
    borderRadius: 12, padding: "10px 14px",
    display: "flex", gap: 10, alignItems: "center",
  },
  warningText: { fontSize: 13, color: "#8A6000", fontWeight: 500, lineHeight: 1.4 },
  // Search bar
  searchBar: {
    margin: "14px 20px",
    display: "flex", alignItems: "center", gap: 10,
    background: COLORS.white, borderRadius: 12, padding: "11px 14px",
    border: `1.5px solid ${COLORS.border}`,
    boxShadow: `0 2px 8px ${COLORS.shadow}`,
  },
  searchInput: {
    flex: 1, border: "none", outline: "none",
    fontSize: 14, color: COLORS.text, background: "transparent",
    fontFamily: "inherit",
  },
  filterRow: {
    display: "flex", gap: 8, padding: "0 20px 14px", overflowX: "auto",
  },
  filterChip: (active) => ({
    padding: "6px 14px", borderRadius: 20, flexShrink: 0,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: active ? COLORS.navy : COLORS.white,
    color: active ? COLORS.white : COLORS.textMid,
    border: `1.5px solid ${active ? COLORS.navy : COLORS.border}`,
  }),
};

// ============================================================
// MICRO COMPONENTS
// ============================================================

function Toast({ message }) {
  return <div style={S.toast}>✓ {message}</div>;
}

function NavBar({ tab, setTab }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "records", icon: "📋", label: "Records" },
    { id: "book", icon: "🏥", label: "Book" },
    { id: "medicine", icon: "💊", label: "Medicine" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div style={S.navBar}>
      {items.map((item) => (
        <div key={item.id} style={S.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
          <span style={S.navIcon(tab === item.id)}>{item.icon}</span>
          <span style={S.navLabel(tab === item.id)}>{item.label}</span>
          {tab === item.id && <div style={S.navDot} />}
        </div>
      ))}
    </div>
  );
}

function RecordIcon(type) {
  if (type === "Lab Report") return "🔬";
  if (type === "Imaging") return "🩻";
  if (type === "Prescription") return "💊";
  return "📄";
}

// ============================================================
// BOOKING BOTTOM SHEET
// ============================================================
function BookingSheet({ clinic, onClose, onConfirm }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [service, setService] = useState(clinic.services[0]);
  const [note, setNote] = useState("");

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.sheetTitle}>Book Appointment</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.teal, marginBottom: 4 }}>{clinic.name}</div>
        <div style={{ fontSize: 13, color: COLORS.textMid, marginBottom: 16 }}>{clinic.address}</div>

        <label style={S.inputLabel}>Select Service</label>
        <select
          style={{ ...S.input, marginBottom: 16 }}
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          {clinic.services.map((s) => <option key={s}>{s}</option>)}
        </select>

        <label style={S.inputLabel}>Select Time Slot — Today (26 Mar)</label>
        <div style={S.slotGrid}>
          {clinic.slots.map((slot) => (
            <div
              key={slot}
              style={S.slotBtn(selectedSlot === slot)}
              onClick={() => setSelectedSlot(slot)}
            >
              {slot}
            </div>
          ))}
        </div>

        <label style={S.inputLabel}>Note for Doctor (optional)</label>
        <textarea
          style={{ ...S.input, height: 72, resize: "none" }}
          placeholder="Describe your symptoms or reason for visit..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          style={{
            ...S.confirmBtn,
            opacity: selectedSlot ? 1 : 0.5,
          }}
          onClick={() => selectedSlot && onConfirm({ clinic, slot: selectedSlot, service })}
        >
          Confirm Appointment — {selectedSlot || "Select a slot"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HOME SCREEN — Simplified for tier 3 users
// 4 big action tiles only. No clutter.
// ============================================================
function HomeScreen({ patient, setTab }) {
  const actions = [
    {
      icon: "📋",
      label: "My Reports",
      sublabel: "View & download",
      tab: "records",
      bg: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealLight})`,
      shadow: "rgba(10,139,122,0.35)",
    },
    {
      icon: "🏥",
      label: "Book Appointment",
      sublabel: "Clinics & labs nearby",
      tab: "book",
      bg: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
      shadow: "rgba(232,101,10,0.35)",
    },
    {
      icon: "🚗",
      label: "Home Visit",
      sublabel: "Doctor comes to you",
      tab: "services",
      bg: `linear-gradient(135deg, #2E5FA3, #4A7FD4)`,
      shadow: "rgba(46,95,163,0.35)",
    },
    {
      icon: "💊",
      label: "Order Medicine",
      sublabel: "Deliver at home",
      tab: "medicine",
      bg: `linear-gradient(135deg, #2E7D52, #43A570)`,
      shadow: "rgba(46,125,82,0.35)",
    },
  ];

  return (
    <div style={{ ...S.screen, background: COLORS.cream }}>

      {/* Header — name + city only, clean */}
      <div style={{
        background: COLORS.navy,
        padding: "52px 24px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 3, color: COLORS.saffronLight, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
              Swasthya
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, lineHeight: 1.2 }}>
              Hello, {patient.name.split(" ")[0]} 👋
            </div>
            <div style={{ fontSize: 13, color: "#8A9EC5", marginTop: 4 }}>
              📍 {patient.city || "Haryana"}
            </div>
          </div>
          <button style={S.notifBtn}>
            🔔
            <span style={S.notifDot} />
          </button>
        </div>

        {/* ABHA — compact, single line */}
        <div style={{
          marginTop: 18,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <div>
              <div style={{ fontSize: 10, color: "#8A9EC5", letterSpacing: 1, textTransform: "uppercase" }}>ABHA Health ID</div>
              <div style={{ fontSize: 13, color: COLORS.white, fontWeight: 600, letterSpacing: 0.5 }}>{patient.abhaId}</div>
            </div>
          </div>
          <span style={{
            background: COLORS.teal, color: COLORS.white,
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          }}>✓ Verified</span>
        </div>
      </div>

      {/* 2×2 Big Action Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        padding: "24px 20px",
      }}>
        {actions.map((action) => (
          <div
            key={action.tab + action.label}
            onClick={() => setTab(action.tab)}
            style={{
              background: action.bg,
              borderRadius: 20,
              padding: "22px 16px 20px",
              cursor: "pointer",
              boxShadow: `0 8px 24px ${action.shadow}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
              minHeight: 130,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circle */}
            <div style={{
              position: "absolute", top: -18, right: -18,
              width: 80, height: 80, borderRadius: 40,
              background: "rgba(255,255,255,0.1)",
            }} />
            <div style={{ fontSize: 36, lineHeight: 1 }}>{action.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.white, lineHeight: 1.2 }}>
                {action.label}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
                {action.sublabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Helpline — simple, reassuring */}
      <div style={{
        margin: "0 20px",
        background: COLORS.white,
        borderRadius: 16,
        padding: "16px 18px",
        display: "flex", alignItems: "center", gap: 14,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `0 2px 10px ${COLORS.shadow}`,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: COLORS.greenPale,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, flexShrink: 0,
        }}>📞</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
            Need help? We're here.
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMid, marginTop: 1 }}>
            Call us free: <strong style={{ color: COLORS.saffron }}>1800-XXX-XXXX</strong>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>8 AM – 10 PM, every day</div>
        </div>
      </div>

    </div>
  );
}

// ============================================================
// RECORDS SCREEN
// ============================================================
function RecordsScreen({ patientId, patient }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const loadRecords = useCallback(async () => {
    if (!patientId) { setRecords(RECORDS); setLoadingRecords(false); return; }
    setLoadingRecords(true);
    const { data, error } = await supabase
      .from("records")
      .select("*, record_values(*)")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });
    if (!error && data) setRecords(data);
    else setRecords([]);
    setLoadingRecords(false);
  }, [patientId]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const filters = ["All", "Lab Report", "Imaging", "Prescription"];
  const filtered = filter === "All" ? records : records.filter(r => r.type === filter);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (showUpload) {
    return <UploadReportSheet patientId={patientId} onClose={() => setShowUpload(false)} onDone={(msg) => { setShowUpload(false); setToast(msg); setTimeout(() => setToast(null), 2500); loadRecords(); }} />;
  }

  if (selectedRecord) {
    return (
      <div style={S.screen}>
        {toast && <Toast message={toast} />}
        <div style={S.pageHeader}>
          <button style={S.backBtn} onClick={() => setSelectedRecord(null)}>←</button>
          <div>
            <div style={S.pageTitle}>{selectedRecord.title}</div>
            <div style={S.pageSubtitle}>{selectedRecord.hospital} · {formatDate(selectedRecord.date)}</div>
          </div>
        </div>

        {/* Doctor info */}
        <div style={{ ...S.detailSection }}>
          <div style={S.detailCard}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: COLORS.navyMid,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: COLORS.white,
              }}>👨‍⚕️</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{selectedRecord.doctor}</div>
                <div style={{ fontSize: 12, color: COLORS.textMid }}>{selectedRecord.hospital}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={S.recordBadge(selectedRecord.status)}>
                  {selectedRecord.status === "warning" ? "⚠ Review" : "✓ Normal"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        {selectedRecord.values.length > 0 && (
          <div style={S.detailSection}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Test Results</div>
            <div style={S.detailCard}>
              {selectedRecord.values.map((v, i) => (
                <div key={i} style={{
                  ...S.valueRow,
                  borderBottom: i < selectedRecord.values.length - 1 ? `1px solid ${COLORS.warmGray}` : "none",
                }}>
                  <div>
                    <div style={S.valueName}>{v.name}</div>
                    <div style={S.valueNormal}>Normal: {v.normal}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={S.valueNum(v.flag)}>{v.value} {v.unit}</div>
                    <div style={{ fontSize: 10, color: v.flag === "high" ? COLORS.red : v.flag === "low" ? "#1565C0" : COLORS.green, fontWeight: 600, marginTop: 2 }}>
                      {v.flag === "high" ? "↑ HIGH" : v.flag === "low" ? "↓ LOW" : "✓ OK"}
                    </div>
                  </div>
                </div>
              ))}
              <div style={S.summaryBox}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Doctor's Summary</div>
                <div style={S.summaryText}>{selectedRecord.summary}</div>
              </div>
            </div>
          </div>
        )}

        {selectedRecord.values.length === 0 && (
          <div style={{ ...S.detailSection }}>
            <div style={S.detailCard}>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🩻</div>
                <div style={{ fontSize: 14, color: COLORS.textMid }}>Imaging report — view attached scan</div>
                <div style={S.summaryBox}>
                  <div style={S.summaryText}>{selectedRecord.summary}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />

        {/* Disclaimer */}
        <div style={{ margin: "0 20px", padding: "10px 14px", background: COLORS.redPale, borderRadius: 10, border: `1px solid #FFCDD2` }}>
          <div style={{ fontSize: 12, color: COLORS.red, lineHeight: 1.5 }}>
            ⚠️ This report is for reference only. Always consult your doctor for medical advice and diagnosis.
          </div>
        </div>

        <div style={{ height: 16 }} />

        <button style={S.downloadBtn} onClick={() => showToast("Report downloaded as PDF")}>
          ⬇️ Download as PDF
        </button>
        <button style={S.shareBtn} onClick={() => showToast("Share link copied!")}>
          🔗 Share with Doctor
        </button>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      <div style={S.pageHeader}>
        <div style={{ width: 36 }} />
        <div>
          <div style={S.pageTitle}>{(patient?.name || 'My').split(' ')[0]}'s Records</div>
          <div style={S.pageSubtitle}>{records.length} reports stored · All safe</div>
        </div>
      </div>

      {/* Search */}
      <div style={S.searchBar}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input style={S.searchInput} placeholder="Search reports, doctors..." />
      </div>

      {/* Filters */}
      <div style={S.filterRow}>
        {filters.map((f) => (
          <div key={f} style={S.filterChip(filter === f)} onClick={() => setFilter(f)}>{f}</div>
        ))}
      </div>

      {/* Upload Banner */}
      <div
        style={{
          margin: "0 20px 16px",
          background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealLight})`,
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        }}
        onClick={() => setShowUpload(true)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>📸</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>Upload a Report</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 1 }}>Photo, PDF or via WhatsApp</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 20, color: "rgba(255,255,255,0.7)" }}>→</div>
      </div>

      {/* Records */}
      {loadingRecords ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 15 }}>Loading your records...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15 }}>{patientId ? "No reports yet — upload your first one!" : "No records found"}</div>
        </div>
      ) : (
        <div>
          {filtered.map((record) => (
            <div key={record.id} style={S.recordCard(record.status)} onClick={() => setSelectedRecord(record)}>
              <div style={S.recordHeader}>
                <div style={S.recordIconBox(record.status)}>
                  {RecordIcon(record.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.recordTitle}>{record.title}</div>
                  <div style={S.recordMeta}>{record.doctor}</div>
                  <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{formatDate(record.date)} · {record.hospital}</div>
                </div>
                <span style={S.recordBadge(record.status)}>
                  {record.status === "warning" ? "⚠ Review" : "✓ Normal"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BOOK SCREEN
// ============================================================
function BookScreen({ patientId }) {
  const [filter, setFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingClinic, setBookingClinic] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("clinics");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!patientId) { setAppointments(APPOINTMENTS); return; }
    supabase.from("appointments").select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: true })
      .then(({ data }) => { if (data) setAppointments(data); });
  }, [patientId]);

  const filters = ["All", "Diagnostic Lab", "General Physician", "Government Hospital", "Pathology Lab"];
  const cityFilters = ["All", "Mahendragarh", "Rewari", "Narnaul"];
  const filtered = CLINICS.filter(cl =>
    (filter === "All" || cl.type === filter) &&
    (cityFilter === "All" || cl.city === cityFilter) &&
    (cl.name.toLowerCase().includes(search.toLowerCase()) || cl.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirm = ({ clinic, slot, service }) => {
    const newAppt = {
      id: Date.now(),
      doctor: clinic.name,
      specialty: service,
      hospital: clinic.address,
      date: "2026-03-26",
      time: slot,
      type: "Appointment",
      status: "upcoming",
      patientId: 1,
    };
    bookAppointment(patientId, {
      clinicName: clinic.name,
      service,
      date: new Date().toISOString().split("T")[0],
      slot,
    });
    setAppointments([newAppt, ...appointments]);
    setBookingClinic(null);
    setToast("Appointment confirmed!");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      {bookingClinic && (
        <BookingSheet
          clinic={bookingClinic}
          onClose={() => setBookingClinic(null)}
          onConfirm={handleConfirm}
        />
      )}

      <div style={S.pageHeader}>
        <div style={{ width: 36 }} />
        <div>
          <div style={S.pageTitle}>Book Appointment</div>
          <div style={S.pageSubtitle}>Mahendragarh · Rewari · Narnaul</div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 0, margin: "14px 20px", background: COLORS.warmGray, borderRadius: 12, padding: 4 }}>
        {[["clinics", "🏥 Clinics & Labs"], ["appointments", "📅 My Appointments"]].map(([id, label]) => (
          <div key={id}
            style={{
              flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 10, cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: view === id ? COLORS.white : "transparent",
              color: view === id ? COLORS.text : COLORS.textMid,
              boxShadow: view === id ? `0 2px 8px ${COLORS.shadow}` : "none",
              transition: "all 0.2s",
            }}
            onClick={() => setView(id)}
          >
            {label}
          </div>
        ))}
      </div>

      {view === "clinics" ? (
        <>
          <div style={S.searchBar}>
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              style={S.searchInput}
              placeholder="Search clinics, labs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={S.filterRow}>
            {cityFilters.map((f) => (
              <div key={f} style={S.filterChip(cityFilter === f)} onClick={() => setCityFilter(f)}>
                {f === "All" ? "📍 All Cities" : f}
              </div>
            ))}
          </div>
          <div style={S.filterRow}>
            {filters.map((f) => (
              <div key={f} style={S.filterChip(filter === f)} onClick={() => setFilter(f)}>
                {f}
              </div>
            ))}
          </div>

          {filtered.map((clinic) => (
            <div key={clinic.id} style={S.clinicCard}>
              <div style={S.clinicHeader}>
                <div style={S.clinicIconBox}>
                  {clinic.type === "Diagnostic Lab" || clinic.type === "Pathology Lab" ? "🔬" :
                    clinic.type === "General Physician" ? "👨‍⚕️" : "🏥"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={S.clinicName}>{clinic.name}</div>
                    {clinic.verified && <span style={{ fontSize: 14 }}>✅</span>}
                  </div>
                  <div style={S.clinicType}>{clinic.type}</div>
                  <div style={S.clinicAddr}>📍 {clinic.address} · {clinic.distance}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.gold }}>★ {clinic.rating}</div>
                  <div style={{ fontSize: 11, color: COLORS.textLight }}>{clinic.reviews} reviews</div>
                </div>
              </div>
              <div style={S.clinicMeta}>
                <span style={S.chip(COLORS.warmGray)}>🕐 {clinic.openTime}</span>
                {clinic.homeService && <span style={S.chip(COLORS.tealPale + "AA")}>🚗 Home Service</span>}
              </div>
              <div style={{ ...S.clinicMeta, marginTop: 8 }}>
                {clinic.services.slice(0, 3).map(s => (
                  <span key={s} style={S.chip()}>{s}</span>
                ))}
                {clinic.services.length > 3 && (
                  <span style={S.chip()}>+{clinic.services.length - 3} more</span>
                )}
              </div>
              <button
                style={{ ...S.btnPrimary, marginTop: 12, flex: "none", width: "100%", borderRadius: 12 }}
                onClick={() => setBookingClinic(clinic)}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </>
      ) : (
        <div style={{ paddingTop: 4 }}>
          {appointments.map((appt) => (
            <div key={appt.id} style={{ ...S.apptCard, marginBottom: 12 }}>
              <div style={S.apptCardHeader}>
                <div>
                  <div style={S.apptDoc}>{appt.doctor}</div>
                  <div style={S.apptSpec}>{appt.specialty}</div>
                </div>
                <span style={S.apptBadge(appt.status)}>
                  {appt.status === "upcoming" ? daysUntil(appt.date) : "Completed"}
                </span>
              </div>
              <div style={S.apptRow}>
                <div style={S.apptInfo}>📅 <span>{formatDate(appt.date)}</span></div>
                <div style={S.apptInfo}>🕐 <span>{appt.time}</span></div>
              </div>
              <div style={{ ...S.apptInfo, marginBottom: appt.status === "upcoming" ? 12 : 0 }}>
                🏥 {appt.hospital}
              </div>
              {appt.status === "upcoming" && (
                <div style={S.apptActions}>
                  <button style={S.btnOutline}>Cancel</button>
                  <button style={S.btnPrimary}>Directions →</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HOME SERVICES SCREEN
// ============================================================
function ServicesScreen() {
  const [toast, setToast] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [address, setAddress] = useState("");
  const [time, setTime] = useState("");

  const handleBook = () => {
    if (!address || !time) return;
    setBookingService(null);
    setToast(`${bookingService.title} booked! Arrives ${bookingService.eta}`);
    setAddress("");
    setTime("");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      {bookingService && (
        <div style={S.overlay} onClick={() => setBookingService(null)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{ ...S.serviceIconBox, width: 52, height: 52 }}>{bookingService.icon}</div>
              <div>
                <div style={S.sheetTitle}>{bookingService.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textMid, marginTop: -12 }}>{bookingService.desc}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: COLORS.saffronPale, borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.saffron }}>{bookingService.price}</div>
                <div style={{ fontSize: 11, color: COLORS.textMid }}>Starting price</div>
              </div>
              <div style={{ flex: 1, background: COLORS.tealPale, borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.teal }}>{bookingService.eta}</div>
                <div style={{ fontSize: 11, color: COLORS.textMid }}>Arrival time</div>
              </div>
            </div>
            <label style={S.inputLabel}>Your Address</label>
            <input
              style={S.input}
              placeholder="House no., Area, Landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <label style={S.inputLabel}>Preferred Time</label>
            <input
              style={S.input}
              placeholder="e.g. 10:00 AM, 2:30 PM..."
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button
              style={{ ...S.confirmBtn, opacity: address && time ? 1 : 0.5 }}
              onClick={handleBook}
            >
              Confirm Home Visit — {bookingService.price}
            </button>
          </div>
        </div>
      )}

      <div style={S.pageHeader}>
        <div style={{ width: 36 }} />
        <div>
          <div style={S.pageTitle}>Home Services</div>
          <div style={S.pageSubtitle}>Healthcare at your doorstep</div>
        </div>
      </div>

      {/* Active banner */}
      <div style={{
        margin: "14px 20px",
        background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
        borderRadius: 16, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.white, marginBottom: 4 }}>
          🚗 Serving Mahendragarh, Rewari & Narnaul
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
          Trained healthcare professionals at your home. All visits verified & insured.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {["✓ Verified Staff", "✓ Insured", "✓ Background Checked"].map(tag => (
            <span key={tag} style={{
              fontSize: 11, fontWeight: 700,
              background: "rgba(255,255,255,0.2)",
              color: COLORS.white, padding: "3px 8px", borderRadius: 20,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 10px", fontSize: 16, fontWeight: 700, color: COLORS.text }}>
        Available Services
      </div>

      {HOME_SERVICES.map((service) => (
        <div
          key={service.id}
          style={S.serviceCard}
          onClick={() => setBookingService(service)}
        >
          <div style={S.serviceIconBox}>{service.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={S.serviceTitle}>{service.title}</div>
            <div style={S.serviceDesc}>{service.desc}</div>
          </div>
          <div style={S.serviceMeta}>
            <div style={S.servicePrice}>{service.price}</div>
            <div style={S.serviceEta}>{service.eta}</div>
          </div>
        </div>
      ))}

      <div style={{ margin: "4px 20px 20px", padding: "12px 14px", background: COLORS.warmGray, borderRadius: 12 }}>
        <div style={{ fontSize: 13, color: COLORS.textMid, lineHeight: 1.6 }}>
          📞 Need help choosing? Call us: <strong style={{ color: COLORS.saffron }}>1800-XXX-XXXX</strong> (Free, 8 AM–10 PM)
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SCREEN
// ============================================================
function ProfileScreen({ patient, patientId, onLogout }) {
  const [toast, setToast] = useState(null); // eslint-disable-line no-unused-vars
  const [stats, setStats] = useState({ records: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setLoading(false); return; }
    Promise.all([
      supabase.from("records").select("id", { count: "exact" }).eq("patient_id", patientId),
      supabase.from("appointments").select("id", { count: "exact" }).eq("patient_id", patientId).eq("status", "upcoming"),
    ]).then(([rec, appt]) => {
      setStats({ records: rec.count || 0, appointments: appt.count || 0 });
      setLoading(false);
    });
  }, [patientId]);

  const name = patient.name || "Your Profile";
  const initial = name[0].toUpperCase();
  const meta = [
    patient.age ? `Age ${patient.age}` : null,
    patient.blood_group || patient.bloodGroup || null,
    patient.city || null,
  ].filter(Boolean).join(" · ");

  const settings = [
    { icon: "👤", bg: COLORS.saffronPale, label: "Personal Details", desc: meta || "Name, age, blood group" },
    { icon: "🇮🇳", bg: "#EEF2FF", label: "ABHA Health ID", desc: patient.abha_id || patient.abhaId || "Not linked yet" },
    { icon: "📞", bg: COLORS.tealPale, label: "Phone Number", desc: patient.phone ? `+91 ${patient.phone}` : "—" },
    { icon: "🔔", bg: COLORS.warmGray, label: "Notifications", desc: "Reminders, alerts" },
    { icon: "🔒", bg: COLORS.redPale, label: "Privacy & Security", desc: "Data sharing settings" },
    { icon: "💊", bg: COLORS.goldPale, label: "Medications", desc: "Track your medicines" },
    { icon: "🌐", bg: COLORS.warmGray, label: "Language", desc: "English" },
    { icon: "📞", bg: COLORS.tealPale, label: "Help & Support", desc: "1800-XXX-XXXX · Free" },
    { icon: "🚪", bg: COLORS.redPale, label: "Logout", desc: "Sign out of Swasthya", action: onLogout },
  ];

  return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      <div style={S.profileHeader}>
        <div style={S.profileAvatar}>{initial}</div>
        <div>
          <div style={S.profileName}>{name}</div>
          <div style={S.profileMeta}>{meta || "Complete your profile"}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: COLORS.teal, color: COLORS.white }}>✓ Registered</span>
          </div>
        </div>
      </div>

      <div style={S.profileStatRow}>
        <div style={S.profileStat}>
          <div style={S.profileStatNum}>{loading ? "—" : stats.records}</div>
          <div style={S.profileStatLabel}>Reports Stored</div>
        </div>
        <div style={S.profileStat}>
          <div style={S.profileStatNum}>{loading ? "—" : stats.appointments}</div>
          <div style={S.profileStatLabel}>Upcoming Appts</div>
        </div>
        <div style={S.profileStat}>
          <div style={S.profileStatNum}>{patient.city ? "1" : "—"}</div>
          <div style={S.profileStatLabel}>Active City</div>
        </div>
      </div>

      <div style={{ margin: "16px 0 0" }}>
        {settings.map((s) => (
          <div key={s.label} style={S.settingRow} onClick={s.action || undefined}>
            <div style={{ ...S.settingIcon, background: s.bg }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.settingLabel, color: s.action ? COLORS.red : COLORS.text }}>{s.label}</div>
              <div style={S.settingDesc}>{s.desc}</div>
            </div>
            <span style={{ fontSize: 16, color: COLORS.textLight }}>›</span>
          </div>
        ))}
      </div>

      <div style={{ margin: "16px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: COLORS.textLight }}>Swasthya v1.0 · DPDP Compliant</div>
        <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>All data stored on Indian servers 🇮🇳</div>
      </div>
    </div>
  );
}

// ============================================================
// UPLOAD REPORT SHEET
// ============================================================
function UploadReportSheet({ onClose, onDone, patientId }) {
  const [step, setStep] = useState("choose");
  const [reportName, setReportName] = useState("");
  const [doctor, setDoctor] = useState("");
  const [reportType, setReportType] = useState("Lab Report");
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreview(file.name); setStep("details"); }
  };

  return (
    <div style={{ ...S.screen, background: COLORS.cream }}>
      <div style={{ background: COLORS.navy, padding: "56px 24px 28px" }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.1)",
          border: "none", color: COLORS.white, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontFamily: "inherit",
        }}>←</button>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, marginBottom: 4 }}>Upload Report</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Add a new health document</div>
      </div>

      {step === "choose" && (
        <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMid, marginBottom: 4 }}>How do you want to upload?</div>
          {[
            { icon: "📷", label: "Take a Photo", sub: "Use your camera to click the report", id: "camera" },
            { icon: "🖼️", label: "Choose from Gallery", sub: "Select an existing photo", id: "gallery" },
            { icon: "📄", label: "Upload PDF", sub: "Select a PDF document", id: "pdf" },
            { icon: "💬", label: "Send via WhatsApp", sub: "Send report to +91 98765 00000", id: "whatsapp" },
          ].map(opt => (
            <div key={opt.id} onClick={() => {
              if (opt.id === "whatsapp") { onDone("WhatsApp number copied! Send your report there."); }
              else { document.getElementById("file-hidden").click(); }
            }} style={{
              background: COLORS.white, borderRadius: 16, padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              border: `2px solid ${COLORS.border}`, boxShadow: `0 2px 10px ${COLORS.shadow}`,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: COLORS.tealPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>{opt.sub}</div>
              </div>
              <span style={{ fontSize: 18, color: COLORS.textLight }}>›</span>
            </div>
          ))}
          <input id="file-hidden" type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFileChange} />
          <div style={{ padding: "12px 14px", background: COLORS.warmGray, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 13, color: COLORS.textMid, lineHeight: 1.6 }}>
              🔒 Your reports are <strong style={{ color: COLORS.text }}>encrypted and private</strong>. Only you can see them.
            </div>
          </div>
        </div>
      )}

      {step === "details" && (
        <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ background: COLORS.tealPale, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: `1px solid rgba(10,139,122,0.2)` }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.teal }}>File Selected</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 1 }}>{preview}</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 20, color: COLORS.teal }}>✓</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Report Name *</div>
            <input type="text" placeholder="e.g. Blood Test, X-Ray Chest..." value={reportName} onChange={e => setReportName(e.target.value)}
              style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: `2px solid ${reportName ? COLORS.saffron : COLORS.border}`, background: COLORS.white, fontSize: 15, fontWeight: 600, color: COLORS.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Report Type</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Lab Report","Imaging","Prescription","Discharge Summary","Other"].map(t => (
                <div key={t} onClick={() => setReportType(t)} style={{ padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `2px solid ${reportType === t ? COLORS.saffron : COLORS.border}`, background: reportType === t ? "rgba(232,101,10,0.07)" : COLORS.white, color: reportType === t ? COLORS.saffron : COLORS.textMid, transition: "all 0.15s" }}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Doctor / Hospital <span style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 600 }}>Optional</span></div>
            <input type="text" placeholder="e.g. Dr. Sharma, Civil Hospital" value={doctor} onChange={e => setDoctor(e.target.value)}
              style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: `2px solid ${COLORS.border}`, background: COLORS.white, fontSize: 15, fontWeight: 600, color: COLORS.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <button onClick={async () => {
              if (!reportName) return;
              if (patientId && selectedFile) {
                const { uploadReport } = await import("./api");
                const res = await uploadReport(patientId, selectedFile, { title: reportName, type: reportType, doctor });
                if (res.ok) onDone("Report uploaded successfully!");
                else onDone("Saved locally — sync when online");
              } else {
                onDone("Report saved!");
              }
            }}
            style={{ width: "100%", padding: 16, borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`, color: COLORS.white, fontSize: 16, fontWeight: 800, cursor: reportName ? "pointer" : "default", fontFamily: "inherit", opacity: reportName ? 1 : 0.4, boxShadow: reportName ? "0 6px 24px rgba(232,101,10,0.4)" : "none", marginTop: 8 }}>
            Save Report ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MEDICINE ORDER SCREEN
// ============================================================
function MedicineScreen({ patientId }) {
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [step, setStep] = useState("browse");
  const [address, setAddress] = useState("");
  const [toast, setToast] = useState(null);
  const categories = ["All","Pain Relief","Antibiotic","Diabetes","Acidity","Allergy","Supplements","Cholesterol"];
  const filtered = MEDICINES.filter(m => (filter === "All" || m.category === filter) && (m.name.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase())));
  const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const cartItems = Object.entries(cart).map(([id, qty]) => ({ ...MEDICINES.find(m => m.id === parseInt(id)), qty }));
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  if (step === "confirm") return (
    <div style={{ ...S.screen, background: COLORS.navy, alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
      <div style={{ width: 100, height: 100, borderRadius: 50, background: "linear-gradient(135deg, #2E7D52, #43A570)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 24, boxShadow: "0 16px 48px rgba(46,125,82,0.5)" }}>✓</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.white, textAlign: "center", marginBottom: 8 }}>Order Placed!</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.6, maxWidth: 270, marginBottom: 28 }}>Your medicines will be delivered in 2–4 hours.</div>
      <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 18px", marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Delivering to</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{address}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 10, marginBottom: 4 }}>Order total</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.saffronLight }}>₹{cartTotal}</div>
      </div>
      <button onClick={() => { setCart({}); setStep("browse"); setAddress(""); }} style={{ width: "100%", padding: 16, borderRadius: 16, border: "none", background: COLORS.white, color: COLORS.navy, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Back to Medicines</button>
    </div>
  );

  if (step === "cart") return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      <div style={{ background: COLORS.navy, padding: "56px 24px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => setStep("browse")} style={{ width: 38, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.1)", border: "none", color: COLORS.white, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "inherit" }}>←</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>Your Cart</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
        {cartItems.map(item => (
          <div key={item.id} style={{ background: COLORS.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `1px solid ${COLORS.border}`, display: "flex", gap: 12, alignItems: "center", boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{item.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>{item.brand} · {item.unit}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => removeFromCart(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.warmGray, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
              <button onClick={() => addToCart(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: COLORS.saffron, color: COLORS.white, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.saffron, minWidth: 50, textAlign: "right" }}>₹{item.price * item.qty}</div>
          </div>
        ))}
        <div style={{ background: COLORS.warmGray, borderRadius: 14, padding: "14px 16px", marginTop: 8, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 14, color: COLORS.textMid }}>Subtotal</span><span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>₹{cartTotal}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 14, color: COLORS.textMid }}>Delivery</span><span style={{ fontSize: 14, fontWeight: 700, color: COLORS.green }}>Free</span></div>
          <div style={{ height: 1, background: COLORS.border, margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Total</span><span style={{ fontSize: 18, fontWeight: 800, color: COLORS.saffron }}>₹{cartTotal}</span></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 8 }}>Delivery Address *</div>
          <textarea placeholder="House no., Street, Area, Landmark..." value={address} onChange={e => setAddress(e.target.value)}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: `2px solid ${address ? COLORS.saffron : COLORS.border}`, background: COLORS.white, fontSize: 14, fontFamily: "inherit", color: COLORS.text, outline: "none", resize: "none", height: 80, boxSizing: "border-box" }} />
        </div>
        <button onClick={() => { if (address) setStep("confirm"); else showToast("Please enter delivery address"); }}
          style={{ width: "100%", padding: 16, borderRadius: 16, border: "none", marginTop: 12, background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`, color: COLORS.white, fontSize: 16, fontWeight: 800, cursor: address ? "pointer" : "default", fontFamily: "inherit", opacity: address ? 1 : 0.5, boxShadow: address ? "0 6px 24px rgba(232,101,10,0.4)" : "none" }}>
          Place Order · ₹{cartTotal} →
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.screen}>
      {toast && <Toast message={toast} />}
      <div style={{ background: COLORS.navy, padding: "56px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>Order Medicine</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Delivered in 2–4 hrs · Free delivery</div>
          </div>
          {cartCount > 0 && (
            <button onClick={() => setStep("cart")} style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.saffron, border: "none", borderRadius: 20, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 16 }}>🛒</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.white }}>{cartCount}</span>
            </button>
          )}
        </div>
      </div>
      <div style={{ margin: "14px 20px 0", background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyMid})`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => showToast("Upload prescription coming soon!")}>
        <span style={{ fontSize: 24 }}>📋</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>Have a prescription?</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>Upload it and we'll prepare your order</div>
        </div>
        <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>›</span>
      </div>
      <div style={{ ...S.searchBar, margin: "14px 20px 0" }}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input style={S.searchInput} placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ ...S.filterRow, margin: "10px 0 0" }}>
        {categories.map(cat => <div key={cat} style={S.filterChip(filter === cat)} onClick={() => setFilter(cat)}>{cat}</div>)}
      </div>
      <div style={{ padding: "8px 0 20px" }}>
        {filtered.map(med => (
          <div key={med.id} style={{ margin: "0 20px 10px", background: COLORS.white, borderRadius: 14, padding: "14px 16px", border: `1px solid ${COLORS.border}`, boxShadow: `0 2px 8px ${COLORS.shadow}`, display: "flex", alignItems: "center", gap: 12, opacity: med.inStock ? 1 : 0.55 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.greenPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{med.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 1 }}>{med.brand} · {med.unit}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: med.inStock ? COLORS.green : COLORS.red }}>{med.inStock ? "✓ In Stock" : "✗ Out of Stock"}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>₹{med.price}</div>
              {med.inStock ? (
                cart[med.id] ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => removeFromCart(med.id)} style={{ width: 26, height: 26, borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.warmGray, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.saffron }}>{cart[med.id]}</span>
                    <button onClick={() => addToCart(med.id)} style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: COLORS.saffron, color: COLORS.white, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(med.id)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: COLORS.saffron, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add +</button>
                )
              ) : <span style={{ fontSize: 11, color: COLORS.textLight }}>Unavailable</span>}
            </div>
          </div>
        ))}
      </div>
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(430px - 40px)", zIndex: 50 }}>
          <button onClick={() => setStep("cart")} style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`, color: COLORS.white, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 28px rgba(232,101,10,0.5)" }}>
            <span>🛒 {cartCount} item{cartCount !== 1 ? "s" : ""} in cart</span>
            <span>₹{cartTotal} · View →</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ONBOARDING — SPLASH
// ============================================================
function SplashScreen({ onNext }) {
  return (
    <div style={{
      ...S.screen,
      background: COLORS.navy,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      paddingBottom: 0,
    }}>
      {/* Top section */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 40px 0",
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 42, marginBottom: 24,
          boxShadow: "0 12px 40px rgba(232,101,10,0.45)",
        }}>🏥</div>
        <div style={{
          fontFamily: "'Mukta', sans-serif",
          fontSize: 38, fontWeight: 800, color: COLORS.white,
          letterSpacing: -0.5, marginBottom: 8,
        }}>Swasthya</div>
        <div style={{
          fontSize: 15, color: "rgba(255,255,255,0.5)",
          textAlign: "center", lineHeight: 1.6, maxWidth: 240,
        }}>Your health records, always with you</div>
      </div>

      {/* Preview card */}
      <div style={{ width: "100%", padding: "28px 24px 0" }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: 20,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {[
            { icon: "🔬", label: "CBC Report — Dr. Sharma", badge: "✓ Normal", badgeBg: "rgba(10,139,122,0.3)", badgeColor: COLORS.teal2 },
            { icon: "📅", label: "Appointment — 28 Mar", badge: "In 2 days", badgeBg: "rgba(232,101,10,0.25)", badgeColor: COLORS.saffronLight },
            { icon: "💊", label: "Paracetamol 500mg", badge: "Ordered", badgeBg: "rgba(255,255,255,0.1)", badgeColor: "rgba(255,255,255,0.5)" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 9, borderRadius: 4, background: "rgba(255,255,255,0.15)", width: "80%", marginBottom: 5 }} />
                <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.08)", width: "50%" }} />
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                background: row.badgeBg, color: row.badgeColor,
              }}>{row.badge}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ width: "100%", padding: "24px 24px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 6 }}>
          {["✓ ABHA Verified", "✓ DPDP Secure", "✓ Data in India"].map(t => (
            <div key={t} style={{
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", gap: 4,
            }}>{t}</div>
          ))}
        </div>
        <button onClick={onNext} style={{
          width: "100%", padding: 16, borderRadius: 16, border: "none",
          background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
          color: COLORS.white, fontSize: 16, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 6px 24px rgba(232,101,10,0.4)", fontFamily: "inherit",
        }}>Get Started →</button>
        <button onClick={onNext} style={{
          width: "100%", padding: 15, borderRadius: 16,
          border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent",
          color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>Already have an account? Log in</button>
      </div>
    </div>
  );
}

// ============================================================
// ONBOARDING — PHONE NUMBER
// ============================================================
function PhoneScreen({ onNext, onBack }) {
  const [phone, setPhone] = useState("");
  const valid = phone.length === 10;
  const [loading, setLoading] = useState(false);
  const [sendErr, setSendErr] = useState("");

  return (
    <div style={{ ...S.screen, background: COLORS.cream }}>
      {/* Header */}
      <div style={{ background: COLORS.navy, padding: "56px 24px 32px" }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 19,
          background: "rgba(255,255,255,0.1)", border: "none",
          color: COLORS.white, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontFamily: "inherit",
        }}>←</button>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.white, lineHeight: 1.2, marginBottom: 6 }}>
          Enter your<br />mobile number
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          We'll send a 6-digit OTP to verify you.
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "40px 24px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 8 }}>Mobile Number</div>
          <div style={{
            display: "flex", alignItems: "center",
            background: COLORS.white, borderRadius: 16,
            border: `2px solid ${phone.length > 0 ? COLORS.saffron : COLORS.border}`,
            overflow: "hidden",
            boxShadow: phone.length > 0 ? "0 0 0 4px rgba(232,101,10,0.1)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}>
            <div style={{
              padding: "16px 14px 16px 18px",
              background: COLORS.warmGray,
              borderRight: `1px solid ${COLORS.border}`,
              fontSize: 16, fontWeight: 700, color: COLORS.text,
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}>🇮🇳 +91</div>
            <input
              type="tel" maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              style={{
                flex: 1, padding: "16px 18px", border: "none", outline: "none",
                fontSize: 20, fontWeight: 700, color: COLORS.text,
                letterSpacing: 2, background: "transparent",
                fontFamily: "inherit", minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* Privacy note */}
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: COLORS.warmGray, borderRadius: 14, padding: "12px 14px",
          border: `1px solid ${COLORS.border}`,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: 13, color: COLORS.textMid, lineHeight: 1.55 }}>
            Your number is used <strong style={{ color: COLORS.text }}>only for login</strong>. We never share it with anyone.
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {sendErr && <div style={{ fontSize: 13, color: COLORS.red, textAlign: "center", marginBottom: 4 }}>{sendErr}</div>}
          <button
            onClick={async () => {
              if (!valid || loading) return;
              setLoading(true); setSendErr("");
              const res = await sendOtp(phone);
              setLoading(false);
              if (res.ok) onNext(phone);
              else setSendErr("Failed to send OTP. Try again.");
            }}
            style={{
              width: "100%", padding: 16, borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
              color: COLORS.white, fontSize: 16, fontWeight: 800,
              cursor: valid && !loading ? "pointer" : "default", fontFamily: "inherit",
              opacity: valid && !loading ? 1 : 0.4,
              boxShadow: valid ? "0 6px 24px rgba(232,101,10,0.4)" : "none",
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
          >{loading ? "Sending..." : "Send OTP"}</button>
          <div style={{ textAlign: "center", fontSize: 13, color: COLORS.textLight }}>
            New to Swasthya?{" "}
            <span style={{ color: COLORS.saffron, fontWeight: 700 }}>Registration is free</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONBOARDING — OTP
// ============================================================
function OtpScreen({ phone, onNext, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const ref0 = useRef(); const ref1 = useRef(); const ref2 = useRef(); const ref3 = useRef(); const ref4 = useRef(); const ref5 = useRef();
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5];

  useEffect(() => {
    refs[0].current?.focus();
    startTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setCanResend(false);
    setTimer(30);
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError(false);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const [verifying, setVerifying] = useState(false); // eslint-disable-line no-unused-vars
  const verify = async () => {
    const code = otp.join("");
    setVerifying(true);
    const res = await verifyOtp(phone, code);
    setVerifying(false);
    if (res.ok) { onNext(); }
    else {
      setError(true);
      setOtp(["", "", "", ""]);
      setTimeout(() => { setError(false); refs[0].current?.focus(); }, 600);
    }
  };

  const filled = otp.every(d => d !== "");

  return (
    <div style={{ ...S.screen, background: COLORS.cream }}>
      <div style={{ background: COLORS.navy, padding: "56px 24px 32px" }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 19,
          background: "rgba(255,255,255,0.1)", border: "none",
          color: COLORS.white, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontFamily: "inherit",
        }}>←</button>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.white, lineHeight: 1.2, marginBottom: 6 }}>
          Enter OTP
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          Sent to <strong style={{ color: "rgba(255,255,255,0.8)" }}>+91 {phone}</strong>
        </div>
      </div>

      <div style={{ flex: 1, padding: "40px 24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center", fontSize: 14, color: COLORS.textMid }}>
          Enter the 6-digit code.{" "}
          {/* <strong style={{ color: COLORS.text }}>Use 1234 to continue.</strong> */}
        </div>

        {/* OTP boxes */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {otp.map((digit, i) => (
            <input
              key={i} ref={refs[i]}
              type="tel" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 46, height: 58, borderRadius: 14, textAlign: "center",
                fontSize: 28, fontWeight: 800, fontFamily: "inherit",
                border: `2px solid ${error ? COLORS.red : digit ? COLORS.teal : COLORS.border}`,
                background: COLORS.white,
                color: error ? COLORS.red : digit ? COLORS.teal : COLORS.text,
                outline: "none",
                boxShadow: error ? "0 0 0 4px rgba(217,48,37,0.1)"
                  : digit ? "0 0 0 3px rgba(10,139,122,0.1)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                animation: error ? "shake 0.35s ease" : "none",
              }}
            />
          ))}
        </div>

        {/* Auto-read note */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          background: "rgba(10,139,122,0.07)",
          border: "1px solid rgba(10,139,122,0.2)",
          borderRadius: 12, padding: "10px 14px",
        }}>
          <span style={{ fontSize: 18 }}>📱</span>
          <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 600 }}>
            OTP auto-read is enabled on Android
          </div>
        </div>

        {/* Resend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {!canResend ? (
            <div style={{
              fontSize: 12, fontWeight: 600, color: COLORS.textMid,
              background: COLORS.warmGray, padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
            }}>⏱ Resend in {timer}s</div>
          ) : (
            <button onClick={startTimer} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: COLORS.saffron, fontFamily: "inherit",
            }}>Resend OTP</button>
          )}
        </div>

        <div style={{ marginTop: "auto" }}>
          <button
            onClick={verify}
            style={{
              width: "100%", padding: 16, borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
              color: COLORS.white, fontSize: 16, fontWeight: 800,
              cursor: filled ? "pointer" : "default", fontFamily: "inherit",
              opacity: filled ? 1 : 0.4,
              boxShadow: filled ? "0 6px 24px rgba(232,101,10,0.4)" : "none",
              transition: "opacity 0.2s",
            }}
          >Verify & Continue</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONBOARDING — PROFILE SETUP
// ============================================================
function SetupScreen({ onNext, onBack }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [blood, setBlood] = useState("");
  const [city, setCity] = useState("");

  const canProceed = name.trim() && age && gender && city;

  return (
    <div style={{ ...S.screen, background: COLORS.cream }}>
      <div style={{ background: COLORS.navy, padding: "56px 24px 24px" }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 19,
          background: "rgba(255,255,255,0.1)", border: "none",
          color: COLORS.white, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontFamily: "inherit",
        }}>←</button>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.white, marginBottom: 4 }}>Tell us about you</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Takes just 30 seconds</div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 6, padding: "16px 24px 0", background: COLORS.cream }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= 2 ? COLORS.saffron : i === 3 ? "rgba(232,101,10,0.35)" : COLORS.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* Scrollable form */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 24px 32px",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Full Name</div>
          <input
            type="text" placeholder="e.g. Ramesh Kumar"
            value={name} onChange={e => setName(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 14,
              border: `2px solid ${name ? COLORS.saffron : COLORS.border}`,
              background: COLORS.white, fontSize: 15, fontWeight: 600,
              color: COLORS.text, outline: "none", fontFamily: "inherit",
              boxSizing: "border-box",
              boxShadow: name ? "0 0 0 4px rgba(232,101,10,0.08)" : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />
        </div>

        {/* Age + Gender row */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Age</div>
            <input
              type="tel" placeholder="e.g. 42" maxLength={3}
              value={age} onChange={e => setAge(e.target.value.replace(/\D/g,""))}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14,
                border: `2px solid ${age ? COLORS.saffron : COLORS.border}`,
                background: COLORS.white, fontSize: 15, fontWeight: 600,
                color: COLORS.text, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Gender</div>
            <select
              value={gender} onChange={e => setGender(e.target.value)}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14,
                border: `2px solid ${gender ? COLORS.saffron : COLORS.border}`,
                background: COLORS.white, fontSize: 15, fontWeight: 600,
                color: gender ? COLORS.text : COLORS.textLight,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                appearance: "none", transition: "border-color 0.2s",
                cursor: "pointer",
              }}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Blood group */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>
            Blood Group
            <span style={{
              fontSize: 10, fontWeight: 700, color: COLORS.textLight,
              background: COLORS.warmGray, padding: "2px 7px", borderRadius: 8,
              marginLeft: 8, textTransform: "uppercase", letterSpacing: 0.4,
            }}>Optional</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {["A+","A−","B+","B−","O+","O−","AB+","AB−"].map(b => (
              <div
                key={b} onClick={() => setBlood(blood === b ? "" : b)}
                style={{
                  padding: "10px 4px", borderRadius: 12, textAlign: "center",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: `2px solid ${blood === b ? COLORS.saffron : COLORS.border}`,
                  background: blood === b ? "rgba(232,101,10,0.07)" : COLORS.white,
                  color: blood === b ? COLORS.saffron : COLORS.textMid,
                  transition: "all 0.15s",
                }}
              >{b}</div>
            ))}
          </div>
        </div>

        {/* City */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMid, marginBottom: 7 }}>Your City</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Mahendragarh", "Rewari", "Narnaul", "Other"].map(c => (
              <div
                key={c} onClick={() => setCity(c)}
                style={{
                  padding: "9px 18px", borderRadius: 24,
                  border: `2px solid ${city === c ? COLORS.teal : COLORS.border}`,
                  background: city === c ? "rgba(10,139,122,0.07)" : COLORS.white,
                  color: city === c ? COLORS.teal : COLORS.textMid,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{c}</div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ paddingTop: 4 }}>
          <button
            onClick={async () => {
            if (!canProceed) return;
            onNext({ name, age, gender, blood, city });
          }}
            style={{
              width: "100%", padding: 16, borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronLight})`,
              color: COLORS.white, fontSize: 16, fontWeight: 800,
              cursor: canProceed ? "pointer" : "default", fontFamily: "inherit",
              opacity: canProceed ? 1 : 0.4,
              boxShadow: canProceed ? "0 6px 24px rgba(232,101,10,0.4)" : "none",
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
          >Create My Account →</button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: COLORS.textLight, lineHeight: 1.6 }}>
            By continuing you agree to our{" "}
            <span style={{ color: COLORS.saffron, fontWeight: 700 }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONBOARDING — SUCCESS
// ============================================================
function SuccessScreen({ profile, onDone }) {
  return (
    <div style={{
      ...S.screen, background: COLORS.navy,
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
    }}>
      <div style={{
        width: 110, height: 110, borderRadius: 55,
        background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealLight})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 50, marginBottom: 24,
        boxShadow: "0 16px 48px rgba(10,139,122,0.5)",
      }}>✓</div>

      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, textAlign: "center", marginBottom: 10 }}>
        You're all set!
      </div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6, maxWidth: 270, marginBottom: 32 }}>
        Welcome, <strong style={{ color: COLORS.white }}>{profile?.name?.split(" ")[0]}</strong>. Your Swasthya account is ready.
      </div>

      {/* Summary cards */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {[
          { icon: "📋", bg: "rgba(10,139,122,0.15)", label: "Health Records Ready", sub: "Upload your first report anytime" },
          { icon: "🏥", bg: "rgba(232,101,10,0.15)", label: `Clinics in ${profile?.city || "your city"}`, sub: "Book appointments nearby" },
          { icon: "🔒", bg: "rgba(255,255,255,0.07)", label: "Data Fully Secured", sub: "DPDP compliant · Stored in India" },
        ].map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: c.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => onDone()} style={{
        width: "100%", padding: 16, borderRadius: 16, border: "none",
        background: COLORS.white, color: COLORS.navy,
        fontSize: 16, fontWeight: 800, cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
      }}>Go to Home →</button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function SwasthyaApp() {
  const [flow, setFlow] = useState("loading");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    // Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    // Shake animation
    const style = document.createElement("style");
    style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
    document.head.appendChild(style);
    // Restore session — always resolve to splash or app, never stay on loading
    try {
      const saved = loadSession();
      if (saved && saved.id) { setProfile(saved); setFlow("app"); }
      else setFlow("splash");
    } catch (e) {
      setFlow("splash");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called after OTP verified — get/create patient in DB
  const handleOtpSuccess = async () => {
    const res = await getOrCreatePatient(phone);
    if (res.ok) {
      setProfile(res.patient);
      if (!res.isNew && res.patient.name) {
        saveSession(res.patient);
        setFlow("app");
      } else {
        setFlow("setup");
      }
    }
  };

  // Called after setup form — save profile to DB
  const handleSetupDone = async (formData) => {
    if (!profile) return;
    const res = await savePatientProfile(profile.id, formData);
    if (res.ok) {
      saveSession(res.patient);
      setProfile(res.patient);
      setFlow("success");
    }
  };

  const patient = profile || INITIAL_PATIENT;

  if (flow === "loading") return (
    <div style={{ ...S.app, background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏥</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>Swasthya</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Loading...</div>
      </div>
    </div>
  );

  if (flow === "splash")  return <div style={S.app}><SplashScreen onNext={() => setFlow("phone")} /></div>;
  if (flow === "phone")   return <div style={S.app}><PhoneScreen onNext={p => { setPhone(p); setFlow("otp"); }} onBack={() => setFlow("splash")} /></div>;
  if (flow === "otp")     return <div style={S.app}><OtpScreen phone={phone} onNext={handleOtpSuccess} onBack={() => setFlow("phone")} /></div>;
  if (flow === "setup")   return <div style={S.app}><SetupScreen onNext={handleSetupDone} onBack={() => setFlow("otp")} /></div>;
  if (flow === "success") return <div style={S.app}><SuccessScreen profile={profile} onDone={() => setFlow("app")} /></div>;

  const renderScreen = () => {
    switch (tab) {
      case "home":     return <HomeScreen patient={patient} setTab={setTab} />;
      case "records":  return <RecordsScreen patientId={profile?.id} patient={patient} />;
      case "book":     return <BookScreen patientId={profile?.id} />;
      case "services": return <ServicesScreen />;
      case "medicine": return <MedicineScreen patientId={profile?.id} />;
      case "profile":  return <ProfileScreen patient={patient} patientId={profile?.id} onLogout={() => { clearSession(); setProfile(null); setFlow("splash"); }} />;
      default:         return <HomeScreen patient={patient} setTab={setTab} />;
    }
  };

  return (
    <div style={S.app}>
      {renderScreen()}
      <NavBar tab={tab} setTab={setTab} />
    </div>
  );
}
