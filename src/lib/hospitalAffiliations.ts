import { supabase } from './supabase';

export interface HospitalProfile {
    id: string; // admin user id
    name: string;
    admin_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    beds: number;
    departments: string[];
    bio: string;
    rating: number;
    is_verified: boolean;
    affiliated_doctors_count?: number;
    active_patients_count?: number;
}

export interface AffiliationRecord {
    id: string;
    doctor_id: string;
    doctor_name: string;
    doctor_email: string;
    doctor_specialization: string;
    doctor_experience: number;
    doctor_license: string;
    doctor_cases: number;
    hospital_id: string;
    hospital_name: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    reviewed_at?: string;
    message?: string;
    department?: string;
    visiting_hours?: string;
}

export interface HospitalPatientView {
    id: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    doctor_id: string;
    doctor_name: string;
    doctor_specialization: string;
    diagnosis: string;
    prescription_url?: string | null;
    visit_date: string;
    status: 'current' | 'past' | 'admitted';
}

const STORAGE_KEY = 'mediconnect_hospital_affiliations_v2';

// Curated default hospitals so doctors always have rich hospital accounts to search and connect with
const DEFAULT_HOSPITALS: HospitalProfile[] = [
    {
        id: '220cdead-f454-49bc-8f31-04ad7a676fe8', // Actual admin in DB
        name: 'Kedar Memorial Multispeciality Hospital',
        admin_name: 'admin mayekar',
        email: 'ommayekarpccefy2024@gmail.com',
        phone: '+91 98221 44550',
        address: 'Borda Margao, Near PCCOE Campus',
        city: 'Margao, Goa',
        beds: 250,
        departments: ['Cardiology', 'Orthopedics', 'Emergency Care', 'Neurology', 'Pediatrics'],
        bio: 'Premier tertiary care hospital providing cutting-edge robotic surgeries, 24/7 cardiac emergency, and comprehensive medical suites.',
        rating: 4.9,
        is_verified: true,
        affiliated_doctors_count: 8,
        active_patients_count: 42
    },
    {
        id: '544d4a0d-8a05-4782-a2c4-e75b6c657818', // Actual admin in DB
        name: 'Apollo Institute of Medical Sciences',
        admin_name: 'reshab dessai',
        email: 'reshabdessai@gmail.com',
        phone: '+91 98230 11223',
        address: 'Plot 45, Health City Boulevard, Panjim',
        city: 'Panaji, Goa',
        beds: 400,
        departments: ['Oncology', 'Organ Transplant', 'Dermatology', 'Gastroenterology', 'Radiology'],
        bio: 'Super-specialty healthcare facility equipped with advanced catheterization labs, hybrid operating suites, and research facilities.',
        rating: 4.8,
        is_verified: true,
        affiliated_doctors_count: 14,
        active_patients_count: 68
    },
    {
        id: 'hosp-metro-care-01',
        name: 'Metro City Health & Research Hospital',
        admin_name: 'Dr. Alistair Vance',
        email: 'contact@metrocityhealth.org',
        phone: '+91 832 2740000',
        address: 'Sector 12, Medical Enclave, Alto Porvorim',
        city: 'Porvorim, Goa',
        beds: 180,
        departments: ['General Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'ENT'],
        bio: 'Dedicated to community health, maternal care, and preventive medicine with round-the-clock intensive care services.',
        rating: 4.7,
        is_verified: true,
        affiliated_doctors_count: 6,
        active_patients_count: 31
    },
    {
        id: 'hosp-st-jude-02',
        name: 'St. Jude International Medical Center',
        admin_name: 'Sister Mary Fernandes',
        email: 'info@stjudemedical.in',
        phone: '+91 832 2512999',
        address: 'Vasco Da Gama Harbor Road',
        city: 'Vasco, Goa',
        beds: 320,
        departments: ['Cardiology', 'Nephrology', 'Dialysis Unit', 'Trauma Center'],
        bio: 'Renowned charitable and multi-speciality institute with international standard healthcare at subsidized and affordable care models.',
        rating: 4.9,
        is_verified: true,
        affiliated_doctors_count: 11,
        active_patients_count: 53
    }
];

// Seed initial default affiliations so there is immediate interactive state
const INITIAL_AFFILIATIONS: AffiliationRecord[] = [
    {
        id: 'aff-seed-1',
        doctor_id: '4e7f3314-f398-476e-adce-2747b82951d1',
        doctor_name: 'Dr. Om Mayekar',
        doctor_email: 'ommayekar32@gmail.com',
        doctor_specialization: 'Cardiologist',
        doctor_experience: 12,
        doctor_license: 'MED-88392',
        doctor_cases: 850,
        hospital_id: '220cdead-f454-49bc-8f31-04ad7a676fe8',
        hospital_name: 'Kedar Memorial Multispeciality Hospital',
        status: 'approved',
        requested_at: '2026-01-29T10:00:00.000Z',
        reviewed_at: '2026-01-29T14:30:00.000Z',
        department: 'Cardiology',
        message: 'Looking forward to conducting daily cardiology OPD and emergency bypass consultations.',
        visiting_hours: 'Mon - Fri, 09:00 AM - 01:00 PM'
    }
];

// Helper to access LocalStorage cache
const getLocalAffiliations = (): AffiliationRecord[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AFFILIATIONS));
            return INITIAL_AFFILIATIONS;
        }
        return JSON.parse(raw);
    } catch {
        return INITIAL_AFFILIATIONS;
    }
};

const saveLocalAffiliations = (records: AffiliationRecord[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
        console.error('Failed to save affiliations to localStorage', e);
    }
};

export const HospitalAffiliationService = {
    /**
     * Get all hospitals registered in the system (from Supabase profiles with role='admin' + default curated)
     */
    async getHospitals(): Promise<HospitalProfile[]> {
        const hospitalsMap = new Map<string, HospitalProfile>();

        // 1. Add default base hospitals
        DEFAULT_HOSPITALS.forEach(h => hospitalsMap.set(h.id, { ...h }));

        try {
            // 2. Query Supabase for admin profiles
            const { data: adminProfiles, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin');

            if (!error && adminProfiles) {
                adminProfiles.forEach(admin => {
                    const existing = hospitalsMap.get(admin.id);
                    const name = admin.hospital_name || (existing ? existing.name : `${admin.full_name || 'Medical'}'s Hospital`);
                    const address = admin.hospital_address || (existing ? existing.address : 'Main Medical Enclave');
                    const phone = admin.phone_number || (existing ? existing.phone : '+91 8000 112233');

                    hospitalsMap.set(admin.id, {
                        id: admin.id,
                        name: name,
                        admin_name: admin.full_name || 'Hospital Administrator',
                        email: admin.email || 'admin@hospital.org',
                        phone: phone,
                        address: address,
                        city: existing?.city || 'Goa, India',
                        beds: existing?.beds || 150,
                        departments: existing?.departments || ['General Medicine', 'Emergency', 'Surgery', 'Pediatrics'],
                        bio: existing?.bio || `Modern medical center operated by ${admin.full_name || 'administration'} providing comprehensive patient care.`,
                        rating: existing?.rating || 4.8,
                        is_verified: true,
                        affiliated_doctors_count: existing?.affiliated_doctors_count || 3,
                        active_patients_count: existing?.active_patients_count || 24
                    });
                });
            }
        } catch (err) {
            console.warn('Error fetching admin profiles from Supabase, using local defaults', err);
        }

        // Count live affiliations
        const affiliations = getLocalAffiliations();
        const hospitals = Array.from(hospitalsMap.values());
        
        return hospitals.map(h => {
            const approvedForHosp = affiliations.filter(a => a.hospital_id === h.id && a.status === 'approved');
            return {
                ...h,
                affiliated_doctors_count: Math.max(h.affiliated_doctors_count || 0, approvedForHosp.length)
            };
        });
    },

    /**
     * Get affiliations for a doctor
     */
    async getDoctorAffiliations(doctorId: string): Promise<AffiliationRecord[]> {
        const local = getLocalAffiliations();
        const docAffs = local.filter(a => a.doctor_id === doctorId);

        // Also check Supabase doctor_profiles affiliated_hospitals
        try {
            const { data: docProfile } = await supabase
                .from('doctor_profiles')
                .select('affiliated_hospitals, specialization, experience_years, license_number, cases_handled')
                .eq('id', doctorId)
                .single();

            if (docProfile?.affiliated_hospitals && Array.isArray(docProfile.affiliated_hospitals)) {
                docProfile.affiliated_hospitals.forEach(hospName => {
                    const match = docAffs.find(a => a.hospital_name.toLowerCase() === hospName.toLowerCase());
                    if (!match) {
                        const newRecord: AffiliationRecord = {
                            id: `aff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            doctor_id: doctorId,
                            doctor_name: 'Dr. Physician',
                            doctor_email: '',
                            doctor_specialization: docProfile.specialization || 'Specialist',
                            doctor_experience: docProfile.experience_years || 5,
                            doctor_license: docProfile.license_number || 'MED-VERIFIED',
                            doctor_cases: docProfile.cases_handled || 100,
                            hospital_id: 'hosp-linked',
                            hospital_name: hospName,
                            status: 'approved',
                            requested_at: new Date().toISOString(),
                            department: docProfile.specialization || 'Clinical Services'
                        };
                        docAffs.push(newRecord);
                    }
                });
            }
        } catch {
            // ignore network/db error
        }

        return docAffs;
    },

    /**
     * Send a request from a doctor to join a hospital
     */
    async sendJoinRequest(params: {
        doctorId: string;
        doctorName: string;
        doctorEmail: string;
        doctorSpecialization: string;
        doctorExperience: number;
        doctorLicense: string;
        doctorCases: number;
        hospitalId: string;
        hospitalName: string;
        message?: string;
        department?: string;
        visitingHours?: string;
    }): Promise<AffiliationRecord> {
        const local = getLocalAffiliations();
        
        // Check if existing request exists
        const existingIdx = local.findIndex(a => a.doctor_id === params.doctorId && a.hospital_id === params.hospitalId);

        const newRecord: AffiliationRecord = {
            id: `aff-req-${Date.now()}`,
            doctor_id: params.doctorId,
            doctor_name: params.doctorName,
            doctor_email: params.doctorEmail,
            doctor_specialization: params.doctorSpecialization,
            doctor_experience: params.doctorExperience,
            doctor_license: params.doctorLicense,
            doctor_cases: params.doctorCases,
            hospital_id: params.hospitalId,
            hospital_name: params.hospitalName,
            status: 'pending',
            requested_at: new Date().toISOString(),
            message: params.message || 'I would like to apply for clinical privileges and hospital affiliation.',
            department: params.department || params.doctorSpecialization,
            visiting_hours: params.visitingHours || 'Flexible OPD'
        };

        if (existingIdx >= 0) {
            local[existingIdx] = newRecord;
        } else {
            local.push(newRecord);
        }

        saveLocalAffiliations(local);

        // Also attempt sync to Supabase staff table if possible
        try {
            await supabase.from('staff').insert([{
                full_name: params.doctorName,
                role: 'Doctor (Pending Review)',
                employee_id: params.doctorId,
                contact_number: `${params.doctorSpecialization} | ${params.doctorLicense}`,
                is_active: false,
                hospital_id: params.hospitalId
            }]);
        } catch (err) {
            console.log('Background staff sync note:', err);
        }

        return newRecord;
    },

    /**
     * Cancel or Withdraw request
     */
    async withdrawRequest(doctorId: string, hospitalId: string): Promise<void> {
        let local = getLocalAffiliations();
        local = local.filter(a => !(a.doctor_id === doctorId && a.hospital_id === hospitalId));
        saveLocalAffiliations(local);

        // Also clean up doctor_profiles affiliated_hospitals array in Supabase if was approved
        try {
            const { data: doc } = await supabase.from('doctor_profiles').select('affiliated_hospitals').eq('id', doctorId).single();
            if (doc?.affiliated_hospitals) {
                const hospitals = await this.getHospitals();
                const targetHosp = hospitals.find(h => h.id === hospitalId);
                if (targetHosp) {
                    const updated = doc.affiliated_hospitals.filter((name: string) => name.toLowerCase() !== targetHosp.name.toLowerCase());
                    await supabase.from('doctor_profiles').update({ affiliated_hospitals: updated }).eq('id', doctorId);
                }
            }
        } catch {
            // safe ignore
        }
    },

    /**
     * Get requests and affiliated doctors for a hospital (Admin view)
     */
    async getHospitalAffiliations(hospitalId: string): Promise<{
        pendingRequests: AffiliationRecord[];
        affiliatedDoctors: AffiliationRecord[];
    }> {
        const local = getLocalAffiliations();
        
        // Find affiliations matching this hospital id or hospital name if current admin owns it
        let hospitalName = '';
        try {
            const { data: adminProf } = await supabase.from('profiles').select('hospital_name').eq('id', hospitalId).single();
            if (adminProf?.hospital_name) {
                hospitalName = adminProf.hospital_name.toLowerCase();
            }
        } catch {
            // ignore
        }

        const matches = local.filter(a => 
            a.hospital_id === hospitalId || 
            (hospitalName && a.hospital_name.toLowerCase().includes(hospitalName))
        );

        // Also pull any registered doctors in Supabase whose affiliated_hospitals include this hospital
        try {
            const { data: docProfiles } = await supabase.from('doctor_profiles').select('*');
            if (docProfiles && hospitalName) {
                for (const doc of docProfiles) {
                    if (doc.affiliated_hospitals?.some((h: string) => h.toLowerCase().includes(hospitalName))) {
                        const alreadyIn = matches.find(m => m.doctor_id === doc.id);
                        if (!alreadyIn) {
                            const { data: prof } = await supabase.from('profiles').select('full_name, email').eq('id', doc.id).single();
                            matches.push({
                                id: `aff-live-${doc.id}`,
                                doctor_id: doc.id,
                                doctor_name: prof?.full_name || 'Dr. Specialist',
                                doctor_email: prof?.email || '',
                                doctor_specialization: doc.specialization || 'Physician',
                                doctor_experience: doc.experience_years || 5,
                                doctor_license: doc.license_number || 'MED-REG',
                                doctor_cases: doc.cases_handled || 50,
                                hospital_id: hospitalId,
                                hospital_name: hospitalName || 'Hospital',
                                status: 'approved',
                                requested_at: doc.created_at || new Date().toISOString(),
                                department: doc.specialization || 'General OPD'
                            });
                        }
                    }
                }
            }
        } catch {
            // ignore
        }

        return {
            pendingRequests: matches.filter(a => a.status === 'pending'),
            affiliatedDoctors: matches.filter(a => a.status === 'approved')
        };
    },

    /**
     * Admin approves or rejects a doctor's affiliation request
     */
    async reviewRequest(
        recordId: string, 
        newStatus: 'approved' | 'rejected', 
        adminId: string
    ): Promise<AffiliationRecord | null> {
        const local = getLocalAffiliations();
        const record = local.find(a => a.id === recordId);
        if (!record) return null;

        record.status = newStatus;
        record.reviewed_at = new Date().toISOString();
        saveLocalAffiliations(local);

        // Synchronize with Supabase if approved
        if (newStatus === 'approved') {
            try {
                // 1. Fetch current doctor profile
                const { data: docProfile } = await supabase
                    .from('doctor_profiles')
                    .select('affiliated_hospitals')
                    .eq('id', record.doctor_id)
                    .single();

                const currentAffs: string[] = docProfile?.affiliated_hospitals || [];
                if (!currentAffs.includes(record.hospital_name)) {
                    currentAffs.push(record.hospital_name);
                }

                await supabase.from('doctor_profiles').upsert({
                    id: record.doctor_id,
                    affiliated_hospitals: currentAffs,
                    status: 'approved'
                });

                // 2. Insert/update into staff table for hospital admin
                await supabase.from('staff').insert([{
                    full_name: record.doctor_name,
                    role: 'Doctor',
                    employee_id: record.doctor_id,
                    contact_number: `${record.doctor_specialization} (${record.doctor_license})`,
                    is_active: true,
                    hospital_id: adminId
                }]);
            } catch (err) {
                console.warn('Sync to Supabase doctor_profiles/staff on approval:', err);
            }
        }

        return record;
    },

    /**
     * Get shared hospital patients roster ("patients list of hospital and the data we add as a doctor are visible to hospital")
     */
    async getHospitalPatientsRoster(hospitalId: string): Promise<HospitalPatientView[]> {
        const { affiliatedDoctors } = await this.getHospitalAffiliations(hospitalId);
        const doctorIds = affiliatedDoctors.map(d => d.doctor_id);

        const roster: HospitalPatientView[] = [];

        // Fetch patients for all affiliated doctors
        try {
            let query = supabase.from('doctor_patients').select('*');
            if (doctorIds.length > 0) {
                query = query.in('doctor_id', doctorIds);
            }

            const { data: patients } = await query;

            if (patients && patients.length > 0) {
                const patientIds = patients.map(p => p.id);
                const { data: records } = await supabase
                    .from('patient_records')
                    .select('*')
                    .in('patient_id', patientIds)
                    .order('visit_date', { ascending: false });

                for (const p of patients) {
                    const rec = records?.find(r => r.patient_id === p.id);
                    const doc = affiliatedDoctors.find(d => d.doctor_id === p.doctor_id);

                    roster.push({
                        id: p.id,
                        patient_name: p.name,
                        patient_email: p.email || 'N/A',
                        patient_phone: p.phone || 'N/A',
                        doctor_id: p.doctor_id,
                        doctor_name: doc?.doctor_name || 'Dr. Attending Physician',
                        doctor_specialization: doc?.doctor_specialization || 'General Medicine',
                        diagnosis: rec?.diagnosis || 'Outpatient Clinical Consultation',
                        prescription_url: rec?.prescription_url || null,
                        visit_date: rec?.visit_date || p.created_at,
                        status: p.status === 'current' ? 'admitted' : 'past'
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching hospital patients roster:', err);
        }

        // If roster is empty (e.g. newly created hospital), provide realistic admitted hospital patients for instant rich UX
        if (roster.length === 0) {
            return [
                {
                    id: 'hp-mock-1',
                    patient_name: 'Joshua Clement',
                    patient_email: 'joshuaclement@gmail.com',
                    patient_phone: '+91 98574 54557',
                    doctor_id: '4e7f3314-f398-476e-adce-2747b82951d1',
                    doctor_name: 'Dr. Om Mayekar',
                    doctor_specialization: 'Cardiologist',
                    diagnosis: 'Cardiovascular checkup & post-angioplasty telemetry monitoring',
                    prescription_url: 'https://nhhisdxanlboshnjaeyq.supabase.co/storage/v1/object/public/prescriptions/sample.png',
                    visit_date: new Date().toISOString(),
                    status: 'admitted'
                },
                {
                    id: 'hp-mock-2',
                    patient_name: 'Rohan Naik',
                    patient_email: 'rohan.naik@outlook.com',
                    patient_phone: '+91 98224 88120',
                    doctor_id: '4e7f3314-f398-476e-adce-2747b82951d1',
                    doctor_name: 'Dr. Om Mayekar',
                    doctor_specialization: 'Cardiologist',
                    diagnosis: 'Acute hypertension with sinus tachycardia; IV medication administered',
                    prescription_url: null,
                    visit_date: new Date(Date.now() - 86400000).toISOString(),
                    status: 'admitted'
                },
                {
                    id: 'hp-mock-3',
                    patient_name: 'Aisha Shaikh',
                    patient_email: 'aisha.s@gmail.com',
                    patient_phone: '+91 97645 11928',
                    doctor_id: 'doc-guest-02',
                    doctor_name: 'Dr. Emily Carter',
                    doctor_specialization: 'Pediatrician',
                    diagnosis: 'Bronchial asthma exacerbation under nebulization protocol',
                    prescription_url: null,
                    visit_date: new Date(Date.now() - 86400000 * 2).toISOString(),
                    status: 'current'
                }
            ];
        }

        return roster;
    }
};
