// ============================================================
// SWASTHYA — Backend API
// All database operations in one place
// ============================================================
import { supabase } from './supabase';

const MSG91_KEY = process.env.REACT_APP_MSG91_KEY;

// ============================================================
// OTP — Send via MSG91
// ============================================================
export async function sendOtp(phone) {
  try {
    const res = await fetch(
      `https://control.msg91.com/api/v5/otp?template_id=swasthya_otp&mobile=91${phone}&authkey=${MSG91_KEY}&otp_length=4`,
      { method: 'GET' }
    );
    const data = await res.json();
    // Also store in Supabase as backup (for retry/verify)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    await supabase.from('otp_codes').insert({ phone, code, expires_at: expires });
    return { ok: true, data };
  } catch (err) {
    console.error('sendOtp error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// OTP — Verify via MSG91
// ============================================================
export async function verifyOtp(phone, code) {
  try {
    const res = await fetch(
      `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${code}&authkey=${MSG91_KEY}`,
      { method: 'GET' }
    );
    const data = await res.json();
    if (data.type === 'success') return { ok: true };

    // Fallback: check our own otp_codes table
    const { data: rows } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (rows && rows.length > 0) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', rows[0].id);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid or expired OTP' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// PATIENT — Get or create by phone
// ============================================================
export async function getOrCreatePatient(phone) {
  try {
    // Check if patient exists
    const { data: existing } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) return { ok: true, patient: existing, isNew: false };

    // Create new patient (phone only — profile filled in setup)
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
// PATIENT — Save profile after setup screen
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
// RECORDS — Get all for a patient
// ============================================================
export async function getRecords(patientId) {
  try {
    const { data, error } = await supabase
      .from('records')
      .select(`*, record_values(*)`)
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return { ok: true, records: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// RECORDS — Upload a report file + save metadata
// ============================================================
export async function uploadReport(patientId, file, meta) {
  try {
    // 1. Upload file to Supabase Storage
    const ext = file.name.split('.').pop();
    const path = `${patientId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    // 2. Get signed URL (valid 1 year)
    const { data: urlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(path, 365 * 24 * 60 * 60);

    // 3. Save record metadata
    const { data: record, error: recordError } = await supabase
      .from('records')
      .insert({
        patient_id: patientId,
        title: meta.title,
        type: meta.type,
        doctor: meta.doctor || null,
        hospital: meta.hospital || null,
        file_url: urlData?.signedUrl || null,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (recordError) throw recordError;
    return { ok: true, record };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// APPOINTMENTS — Get all for a patient
// ============================================================
export async function getAppointments(patientId) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: true });

    if (error) throw error;
    return { ok: true, appointments: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// APPOINTMENTS — Book a new appointment
// ============================================================
export async function bookAppointment(patientId, appt) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        clinic_id: appt.clinicId || null,
        clinic_name: appt.clinicName,
        doctor: appt.doctor || appt.clinicName,
        specialty: appt.service,
        date: appt.date,
        time: appt.slot,
        type: 'Appointment',
        status: 'upcoming',
        note: appt.note || null,
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
// CLINICS — Get all (optionally filter by city)
// ============================================================
export async function getClinics(city = null) {
  try {
    let query = supabase.from('clinics').select('*').order('rating', { ascending: false });
    if (city && city !== 'All') query = query.eq('city', city);
    const { data, error } = await query;
    if (error) throw error;
    return { ok: true, clinics: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// MEDICINE ORDERS — Place an order
// ============================================================
export async function placeMedicineOrder(patientId, items, total, address) {
  try {
    const { data, error } = await supabase
      .from('medicine_orders')
      .insert({
        patient_id: patientId,
        items: items,
        total: total,
        address: address,
        status: 'placed',
      })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, order: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// LOCAL STORAGE — persist session across page reloads
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
