// ============================================================
// SWASTHYA — Backend API
// OTP: generated locally, stored in Supabase, SMS via Fast2SMS
// No Twilio, no DLT registration needed for testing
// ============================================================
import { supabase } from './supabase';

const FAST2SMS_KEY = process.env.REACT_APP_FAST2SMS_KEY;

// ============================================================
// OTP — Generate + Send via Fast2SMS + store in Supabase
// ============================================================
export async function sendOtp(phone) {
  try {
    // 1. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 2. Store in Supabase otp_codes table
    const { error: dbErr } = await supabase
      .from('otp_codes')
      .insert({ phone, code, expires_at: expires });
    if (dbErr) throw dbErr;

    // 3. Send SMS via Fast2SMS (no DLT needed for testing)
    if (FAST2SMS_KEY) {
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: `${code} is your Swasthya OTP. Valid for 10 minutes.`,
          language: 'english',
          flash: 0,
          numbers: phone,
        }),
      });
    }

    return { ok: true };
  } catch (err) {
    console.error('sendOtp error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// OTP — Verify against Supabase otp_codes table
// ============================================================
export async function verifyOtp(phone, code) {
  try {
    const { data: rows, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!rows || rows.length === 0) return { ok: false, error: 'Invalid or expired OTP' };

    // Mark as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', rows[0].id);
    return { ok: true };
  } catch (err) {
    console.error('verifyOtp error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// PATIENT — Get or create by phone
// ============================================================
export async function getOrCreatePatient(phone) {
  try {
    const { data: existing } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) return { ok: true, patient: existing, isNew: false };

    const { data: created, error } = await supabase
      .from('patients')
      .insert({ phone })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, patient: created, isNew: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// PATIENT — Save profile
// ============================================================
export async function savePatientProfile(patientId, profile) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({
        name: profile.name,
        age: parseInt(profile.age),
        gender: profile.gender,
        blood_group: profile.blood || null,
        city: profile.city,
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw error;
    return { ok: true, patient: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// APPOINTMENTS — Book
// ============================================================
export async function bookAppointment(patientId, appt) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        clinic_name: appt.clinicName,
        doctor: appt.doctor || appt.clinicName,
        specialty: appt.service,
        date: appt.date,
        time: appt.slot,
        type: 'Appointment',
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, appointment: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// MEDICINE ORDERS — Place
// ============================================================
export async function placeMedicineOrder(patientId, items, total, address) { // eslint-disable-line no-unused-vars
  try {
    const { data, error } = await supabase
      .from('medicine_orders')
      .insert({ patient_id: patientId, items, total, address, status: 'placed' })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, order: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// SESSION
// ============================================================
export function saveSession(patient) {
  localStorage.setItem('swasthya_patient', JSON.stringify(patient));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem('swasthya_patient');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem('swasthya_patient');
}
