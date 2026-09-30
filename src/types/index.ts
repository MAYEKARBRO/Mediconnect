export type UserRole = 'doctor' | 'patient' | 'admin';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    full_name?: string;
    avatar_url?: string;
}

export interface Doctor {
    id: string;
    user_id: string;
    specialization: string;
    license_number: string;
    availability: string;
    hospitals: string[];
}

export interface Patient {
    id: string;
    user_id: string;
    dob: string;
    blood_group: string;
    height: string;
    weight: string;
    abha_number: string;
}

export interface Appointment {
    id: string;
    doctor_id: string;
    patient_id: string;
    date: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    type: 'visit' | 'video';
}
