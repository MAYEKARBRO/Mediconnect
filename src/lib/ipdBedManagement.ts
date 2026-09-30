export interface InpatientBed {
    id: string;
    bed_number: string;
    ward: 'ICU' | 'General Medical' | 'Surgical Post-Op' | 'Maternity' | 'Emergency Bay';
    floor: string;
    status: 'occupied' | 'available' | 'cleaning' | 'maintenance';
    patient_id?: string;
    patient_name?: string;
    patient_age?: number;
    patient_gender?: string;
    patient_phone?: string;
    admitting_doctor_id?: string;
    admitting_doctor_name?: string;
    admitted_at?: string;
    diagnosis?: string;
    severity?: 'stable' | 'moderate' | 'critical' | 'observation';
    vitals?: {
        bp: string;
        pulse: number;
        spo2: number;
        temp: string;
    };
    dietary_plan?: {
        diet_type: string;
        instructions: string;
        meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
    };
    nursing_care_plan?: {
        nurse_in_charge: string;
        care_goals: string[];
        shift_notes: string;
    };
    doctor_rounds?: Array<{
        id: string;
        doctor_name: string;
        timestamp: string;
        clinical_notes: string;
        treatment_orders: string;
    }>;
    handover_notes?: Array<{
        id: string;
        shift: 'Morning' | 'Evening' | 'Night';
        nurse_name: string;
        timestamp: string;
        summary: string;
    }>;
    discharge_summary?: {
        discharge_date?: string;
        final_diagnosis?: string;
        hospital_course?: string;
        condition_at_discharge?: 'Recovered' | 'Improved' | 'Referred';
        medication_reconciliation?: Array<{
            medicine_name: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions: string;
        }>;
        follow_up_instructions?: string;
    };
}

const STORAGE_KEY = 'mediconnect_ipd_beds_v3';

// Curated default bed master layout
const INITIAL_BEDS: InpatientBed[] = [
    {
        id: 'bed-icu-01',
        bed_number: 'ICU-01',
        ward: 'ICU',
        floor: '2nd Floor, Wing A',
        status: 'occupied',
        patient_id: 'pat-101',
        patient_name: 'Joshua Clement',
        patient_age: 48,
        patient_gender: 'Male',
        patient_phone: '+91 98574 54557',
        admitting_doctor_name: 'Dr. Om Mayekar',
        admitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        diagnosis: 'Acute Coronary Syndrome, Post-Angioplasty Inpatient Monitoring',
        severity: 'critical',
        vitals: { bp: '130/85', pulse: 78, spo2: 97, temp: '98.6°F' },
        dietary_plan: {
            diet_type: 'Low Sodium & Diabetic Liquid',
            instructions: 'Fluid restriction 1.2L per day. No sugar, low salt.',
            meals: { breakfast: true, lunch: true, dinner: false }
        },
        nursing_care_plan: {
            nurse_in_charge: 'Sr. Ananya Rao',
            care_goals: ['Continuous cardiac ECG telemetry', 'Check BP every 2 hours', 'Maintain IV Heparin drip', 'Prevent bed sores with 2-hourly turning'],
            shift_notes: 'Patient stable, chest discomfort resolved post-infusion.'
        },
        doctor_rounds: [
            {
                id: 'rnd-1',
                doctor_name: 'Dr. Om Mayekar',
                timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
                clinical_notes: 'Troponin-T levels declining. Rhythm normal sinus, no ST elevation noted on repeat ECG.',
                treatment_orders: 'Step down IV Nitroglycerin, start oral beta-blocker Metoprolol 25mg BD.'
            }
        ],
        handover_notes: [
            {
                id: 'hnd-1',
                shift: 'Morning',
                nurse_name: 'Staff Nurse Rekha',
                timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
                summary: 'All morning doses administered. Arterial line patent. SpO2 maintained at 97% on room air.'
            }
        ],
        discharge_summary: {
            medication_reconciliation: [
                { medicine_name: 'Tab. Aspirin', dosage: '75mg', frequency: 'Once Daily (OD)', duration: 'Life Long', instructions: 'After lunch' },
                { medicine_name: 'Tab. Clopidogrel', dosage: '75mg', frequency: 'Once Daily (OD)', duration: '1 Year', instructions: 'After breakfast' },
                { medicine_name: 'Tab. Atorvastatin', dosage: '40mg', frequency: 'Once Daily (HS)', duration: 'Long Term', instructions: 'At night' },
                { medicine_name: 'Tab. Metoprolol', dosage: '25mg', frequency: 'Twice Daily (BD)', duration: '30 Days', instructions: 'Before food' }
            ],
            follow_up_instructions: 'Review in Cardiology OPD next Tuesday with repeat 2D Echo.'
        }
    },
    {
        id: 'bed-icu-02',
        bed_number: 'ICU-02',
        ward: 'ICU',
        floor: '2nd Floor, Wing A',
        status: 'occupied',
        patient_id: 'pat-102',
        patient_name: 'Rohan Naik',
        patient_age: 54,
        patient_gender: 'Male',
        patient_phone: '+91 98224 88120',
        admitting_doctor_name: 'Dr. Om Mayekar',
        admitted_at: new Date(Date.now() - 86400000).toISOString(),
        diagnosis: 'Severe Hypertensive Emergency with Tachycardia',
        severity: 'moderate',
        vitals: { bp: '150/95', pulse: 92, spo2: 98, temp: '99.1°F' },
        dietary_plan: {
            diet_type: 'Strict Renal & Low Sodium Soft',
            instructions: 'Salt restricted to < 2g/day. Steamed vegetables and oats.',
            meals: { breakfast: true, lunch: true, dinner: false }
        },
        nursing_care_plan: {
            nurse_in_charge: 'Nurse Joyce',
            care_goals: ['Hourly BP mapping', 'Monitor urine output strictly', 'Administer IV Labetalol as per sliding scale'],
            shift_notes: 'BP coming down progressively from 185/110 to 150/95.'
        },
        doctor_rounds: [
            {
                id: 'rnd-2',
                doctor_name: 'Dr. Om Mayekar',
                timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
                clinical_notes: 'Neurological reflexes intact, no papilledema. Headache significantly reduced.',
                treatment_orders: 'Continue IV infusion, start oral Telmisartan 40mg.'
            }
        ]
    },
    {
        id: 'bed-icu-03',
        bed_number: 'ICU-03',
        ward: 'ICU',
        floor: '2nd Floor, Wing A',
        status: 'available'
    },
    {
        id: 'bed-gen-101',
        bed_number: 'GEN-101',
        ward: 'General Medical',
        floor: '1st Floor, Main Block',
        status: 'occupied',
        patient_id: 'pat-103',
        patient_name: 'Aisha Shaikh',
        patient_age: 32,
        patient_gender: 'Female',
        patient_phone: '+91 97645 11928',
        admitting_doctor_name: 'Dr. Emily Carter',
        admitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        diagnosis: 'Acute Bronchial Asthma with secondary respiratory infection',
        severity: 'stable',
        vitals: { bp: '120/80', pulse: 82, spo2: 99, temp: '98.4°F' },
        dietary_plan: {
            diet_type: 'High Protein Warm Diet',
            instructions: 'Warm soups, avoid cold beverages and dairy at night.',
            meals: { breakfast: true, lunch: true, dinner: true }
        },
        nursing_care_plan: {
            nurse_in_charge: 'Staff Nurse Priya',
            care_goals: ['Salbutamol nebulization every 6 hours', 'Encourage deep breathing spirometer', 'Chest physiotherapy'],
            shift_notes: 'Wheezing significantly subsided. Able to ambulate comfortably.'
        },
        doctor_rounds: [
            {
                id: 'rnd-3',
                doctor_name: 'Dr. Emily Carter',
                timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
                clinical_notes: 'Chest clear on auscultation bilaterally. Ready for planned discharge tomorrow.',
                treatment_orders: 'Switch to budesonide dry powder inhaler, discharge planning initiated.'
            }
        ]
    },
    {
        id: 'bed-gen-102',
        bed_number: 'GEN-102',
        ward: 'General Medical',
        floor: '1st Floor, Main Block',
        status: 'available'
    },
    {
        id: 'bed-gen-103',
        bed_number: 'GEN-103',
        ward: 'General Medical',
        floor: '1st Floor, Main Block',
        status: 'cleaning'
    },
    {
        id: 'bed-gen-104',
        bed_number: 'GEN-104',
        ward: 'General Medical',
        floor: '1st Floor, Main Block',
        status: 'available'
    },
    {
        id: 'bed-surg-201',
        bed_number: 'SURG-201',
        ward: 'Surgical Post-Op',
        floor: '3rd Floor, West Wing',
        status: 'occupied',
        patient_id: 'pat-104',
        patient_name: 'Vikram Salgaonkar',
        patient_age: 41,
        patient_gender: 'Male',
        patient_phone: '+91 98221 66778',
        admitting_doctor_name: 'Dr. Sarah Jenkins',
        admitted_at: new Date(Date.now() - 86400000).toISOString(),
        diagnosis: 'Laparoscopic Cholecystectomy Day 1 Post-Op',
        severity: 'stable',
        vitals: { bp: '124/82', pulse: 76, spo2: 98, temp: '98.6°F' },
        dietary_plan: {
            diet_type: 'Semi-Solid Low Fat',
            instructions: 'Gradual introduction of soft khichdi and clear broth.',
            meals: { breakfast: true, lunch: true, dinner: false }
        },
        nursing_care_plan: {
            nurse_in_charge: 'Nurse Sunita',
            care_goals: ['Surgical port dressing check', 'Drain monitoring', 'Encourage early mobilization'],
            shift_notes: 'Passing flatus, abdomen soft, incision site clean and dry.'
        }
    },
    {
        id: 'bed-surg-202',
        bed_number: 'SURG-202',
        ward: 'Surgical Post-Op',
        floor: '3rd Floor, West Wing',
        status: 'available'
    },
    {
        id: 'bed-mat-301',
        bed_number: 'MAT-301',
        ward: 'Maternity',
        floor: '4th Floor, Mother & Child Block',
        status: 'occupied',
        patient_id: 'pat-105',
        patient_name: 'Neha Vernekar',
        patient_age: 29,
        patient_gender: 'Female',
        patient_phone: '+91 97633 44551',
        admitting_doctor_name: 'Dr. Emily Carter',
        admitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        diagnosis: 'Full Term Normal Delivery (FTND) Day 2 Post-Partum',
        severity: 'stable',
        vitals: { bp: '118/76', pulse: 74, spo2: 99, temp: '98.2°F' },
        dietary_plan: {
            diet_type: 'Lactation High Nutrition Diet',
            instructions: 'High calcium and iron rich meals with green leafy vegetables and dry fruits.',
            meals: { breakfast: true, lunch: true, dinner: true }
        }
    },
    {
        id: 'bed-mat-302',
        bed_number: 'MAT-302',
        ward: 'Maternity',
        floor: '4th Floor, Mother & Child Block',
        status: 'available'
    },
    {
        id: 'bed-er-01',
        bed_number: 'ER-01',
        ward: 'Emergency Bay',
        floor: 'Ground Floor, Trauma Center',
        status: 'available'
    },
    {
        id: 'bed-er-02',
        bed_number: 'ER-02',
        ward: 'Emergency Bay',
        floor: 'Ground Floor, Trauma Center',
        status: 'available'
    }
];

export const IpdBedService = {
    getBeds(): InpatientBed[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BEDS));
                return INITIAL_BEDS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_BEDS;
        }
    },

    saveBeds(beds: InpatientBed[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(beds));
        } catch (e) {
            console.error('Failed to save IPD beds', e);
        }
    },

    /**
     * Called when a doctor adds a patient with an optional bed number
     */
    admitPatientFromDoctor(params: {
        patientId: string;
        patientName: string;
        phone?: string;
        admittingDoctorName: string;
        diagnosis?: string;
        bedNumber?: string;
        ward?: string;
    }): InpatientBed | null {
        if (!params.bedNumber) return null;

        const beds = this.getBeds();
        const bedClean = params.bedNumber.trim().toUpperCase();

        // 1. Look for existing bed matching number
        let targetIndex = beds.findIndex(b => b.bed_number.toUpperCase() === bedClean);

        if (targetIndex >= 0) {
            beds[targetIndex] = {
                ...beds[targetIndex],
                status: 'occupied',
                patient_id: params.patientId,
                patient_name: params.patientName,
                patient_phone: params.phone || '+91 98000 00000',
                admitting_doctor_name: params.admittingDoctorName,
                diagnosis: params.diagnosis || 'Inpatient Admission',
                admitted_at: new Date().toISOString(),
                severity: 'stable',
                vitals: { bp: '120/80', pulse: 76, spo2: 98, temp: '98.6°F' },
                dietary_plan: {
                    diet_type: 'General Inpatient Regular',
                    instructions: 'Standard balanced hospital meals.',
                    meals: { breakfast: true, lunch: false, dinner: false }
                },
                nursing_care_plan: {
                    nurse_in_charge: 'Floor Nurse In-Charge',
                    care_goals: ['Vitals check every 4 hours', 'Medication administration', 'Routine observation'],
                    shift_notes: 'Admitted from OPD by ' + params.admittingDoctorName
                },
                doctor_rounds: [
                    {
                        id: `rnd-${Date.now()}`,
                        doctor_name: params.admittingDoctorName,
                        timestamp: new Date().toISOString(),
                        clinical_notes: 'Patient admitted to bed ' + bedClean + '. Baseline vitals stable.',
                        treatment_orders: 'Commence routine supportive therapy.'
                    }
                ]
            };
        } else {
            // Create a new bed record if the doctor typed a new bed number
            const newBed: InpatientBed = {
                id: `bed-custom-${Date.now()}`,
                bed_number: bedClean,
                ward: (params.ward as any) || 'General Medical',
                floor: 'Inpatient Floor',
                status: 'occupied',
                patient_id: params.patientId,
                patient_name: params.patientName,
                patient_phone: params.phone || '+91 98000 00000',
                admitting_doctor_name: params.admittingDoctorName,
                diagnosis: params.diagnosis || 'Inpatient Admission',
                admitted_at: new Date().toISOString(),
                severity: 'stable',
                vitals: { bp: '120/80', pulse: 76, spo2: 98, temp: '98.6°F' },
                dietary_plan: {
                    diet_type: 'General Inpatient Regular',
                    instructions: 'Standard balanced hospital meals.',
                    meals: { breakfast: true, lunch: false, dinner: false }
                },
                nursing_care_plan: {
                    nurse_in_charge: 'Ward Nurse',
                    care_goals: ['Vitals check every 4 hours', 'Medication administration'],
                    shift_notes: 'Newly admitted by ' + params.admittingDoctorName
                }
            };
            beds.unshift(newBed);
            targetIndex = 0;
        }

        this.saveBeds(beds);
        return beds[targetIndex];
    },

    /**
     * Transfer patient from one bed to another
     */
    transferBed(fromBedId: string, toBedId: string, reason: string): boolean {
        const beds = this.getBeds();
        const fromBed = beds.find(b => b.id === fromBedId);
        const toBed = beds.find(b => b.id === toBedId);

        if (!fromBed || !toBed || toBed.status === 'occupied') return false;

        // Copy patient details to toBed
        toBed.status = 'occupied';
        toBed.patient_id = fromBed.patient_id;
        toBed.patient_name = fromBed.patient_name;
        toBed.patient_age = fromBed.patient_age;
        toBed.patient_gender = fromBed.patient_gender;
        toBed.patient_phone = fromBed.patient_phone;
        toBed.admitting_doctor_name = fromBed.admitting_doctor_name;
        toBed.admitted_at = fromBed.admitted_at;
        toBed.diagnosis = fromBed.diagnosis;
        toBed.severity = fromBed.severity;
        toBed.vitals = fromBed.vitals;
        toBed.dietary_plan = fromBed.dietary_plan;
        toBed.nursing_care_plan = fromBed.nursing_care_plan;
        toBed.doctor_rounds = fromBed.doctor_rounds || [];
        toBed.doctor_rounds.push({
            id: `rnd-trf-${Date.now()}`,
            doctor_name: fromBed.admitting_doctor_name || 'Attending Physician',
            timestamp: new Date().toISOString(),
            clinical_notes: `Patient transferred from ${fromBed.bed_number} (${fromBed.ward}) to ${toBed.bed_number} (${toBed.ward}). Reason: ${reason}`,
            treatment_orders: 'Continue existing protocol in new ward.'
        });

        // Clear fromBed and mark as cleaning
        fromBed.status = 'cleaning';
        delete fromBed.patient_id;
        delete fromBed.patient_name;
        delete fromBed.patient_age;
        delete fromBed.patient_gender;
        delete fromBed.patient_phone;
        delete fromBed.diagnosis;
        delete fromBed.vitals;
        delete fromBed.dietary_plan;
        delete fromBed.nursing_care_plan;

        this.saveBeds(beds);
        return true;
    },

    /**
     * Discharge patient from bed
     */
    dischargePatient(bedId: string, summary: {
        condition: 'Recovered' | 'Improved' | 'Referred';
        hospitalCourse: string;
        medications: Array<{ medicine_name: string; dosage: string; frequency: string; duration: string; instructions: string }>;
        followUp: string;
    }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        bed.discharge_summary = {
            discharge_date: new Date().toISOString(),
            final_diagnosis: bed.diagnosis,
            hospital_course: summary.hospitalCourse,
            condition_at_discharge: summary.condition,
            medication_reconciliation: summary.medications,
            follow_up_instructions: summary.followUp
        };

        // Mark bed as cleaning and clear patient
        bed.status = 'cleaning';
        delete bed.patient_id;
        delete bed.patient_name;
        delete bed.patient_age;
        delete bed.patient_gender;
        delete bed.patient_phone;
        delete bed.diagnosis;
        delete bed.vitals;
        delete bed.dietary_plan;

        this.saveBeds(beds);
        return true;
    },

    /**
     * Mark bed as clean & available
     */
    setBedStatus(bedId: string, status: 'available' | 'cleaning' | 'maintenance'): void {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (bed) {
            bed.status = status;
            this.saveBeds(beds);
        }
    },

    /**
     * Direct Inpatient Admission from Hospital Dashboard
     */
    admitDirect(params: {
        bedId: string;
        patientName: string;
        age?: number;
        gender?: string;
        phone?: string;
        doctorName: string;
        diagnosis: string;
        severity?: 'stable' | 'moderate' | 'critical' | 'observation';
    }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === params.bedId);
        if (!bed) return false;

        bed.status = 'occupied';
        bed.patient_id = `pat-direct-${Date.now()}`;
        bed.patient_name = params.patientName;
        bed.patient_age = params.age || 40;
        bed.patient_gender = params.gender || 'Other';
        bed.patient_phone = params.phone || '+91 98000 00000';
        bed.admitting_doctor_name = params.doctorName;
        bed.admitted_at = new Date().toISOString();
        bed.diagnosis = params.diagnosis;
        bed.severity = params.severity || 'stable';
        bed.vitals = { bp: '120/80', pulse: 75, spo2: 98, temp: '98.6°F' };
        bed.dietary_plan = {
            diet_type: 'General Inpatient Regular',
            instructions: 'Regular balanced diet with proper hydration.',
            meals: { breakfast: true, lunch: false, dinner: false }
        };
        bed.nursing_care_plan = {
            nurse_in_charge: 'Duty Nurse',
            care_goals: ['Initial baseline evaluation', 'Medication schedule verification'],
            shift_notes: 'Admitted directly to unit.'
        };
        bed.doctor_rounds = [
            {
                id: `rnd-dir-${Date.now()}`,
                doctor_name: params.doctorName,
                timestamp: new Date().toISOString(),
                clinical_notes: 'Initial admission assessment completed.',
                treatment_orders: 'Start primary care regimen and routine monitoring.'
            }
        ];
        bed.handover_notes = [];

        this.saveBeds(beds);
        return true;
    },

    /**
     * Add a Doctor Round Note
     */
    addDoctorRound(bedId: string, round: { doctor_name: string; clinical_notes: string; treatment_orders: string }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        if (!bed.doctor_rounds) bed.doctor_rounds = [];
        bed.doctor_rounds.unshift({
            id: `rnd-${Date.now()}`,
            doctor_name: round.doctor_name,
            timestamp: new Date().toISOString(),
            clinical_notes: round.clinical_notes,
            treatment_orders: round.treatment_orders
        });

        this.saveBeds(beds);
        return true;
    },

    /**
     * Add a Shift Handover Note
     */
    addHandoverNote(bedId: string, note: { shift: 'Morning' | 'Evening' | 'Night'; nurse_name: string; summary: string }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        if (!bed.handover_notes) bed.handover_notes = [];
        bed.handover_notes.unshift({
            id: `hnd-${Date.now()}`,
            shift: note.shift,
            nurse_name: note.nurse_name,
            timestamp: new Date().toISOString(),
            summary: note.summary
        });

        this.saveBeds(beds);
        return true;
    },

    /**
     * Update Dietary Plan
     */
    updateDietary(bedId: string, plan: { diet_type: string; instructions: string; meals: { breakfast: boolean; lunch: boolean; dinner: boolean } }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        bed.dietary_plan = plan;
        this.saveBeds(beds);
        return true;
    },

    /**
     * Update Nursing Care Plan
     */
    updateNursingCarePlan(bedId: string, plan: { nurse_in_charge: string; care_goals: string[]; shift_notes: string }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        bed.nursing_care_plan = plan;
        this.saveBeds(beds);
        return true;
    },

    /**
     * Update Vitals
     */
    updateVitals(bedId: string, vitals: { bp: string; pulse: number; spo2: number; temp: string }): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        bed.vitals = vitals;
        this.saveBeds(beds);
        return true;
    },

    /**
     * Update Clinical Severity
     */
    updateSeverity(bedId: string, severity: 'stable' | 'moderate' | 'critical' | 'observation'): boolean {
        const beds = this.getBeds();
        const bed = beds.find(b => b.id === bedId);
        if (!bed) return false;

        bed.severity = severity;
        this.saveBeds(beds);
        return true;
    }
};
