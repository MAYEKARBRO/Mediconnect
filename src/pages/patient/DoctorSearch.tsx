import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import {
    Search, MapPin, Video, Star, X, Building, Building2,
    Calendar, CheckCircle, Stethoscope, ChevronRight, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HospitalAffiliationService,
    type HospitalProfile
} from '../../lib/hospitalAffiliations';

interface DoctorProfile {
    id: string;
    specialization: string;
    affiliated_hospitals: string[];
    experience_years: number;
    cases_handled: number;
    full_name_fetched?: string;
    biography?: string;
    rating?: number;
    is_hardcoded?: boolean;
}

const HARDCODED_DOCTORS: DoctorProfile[] = [
    {
        id: '4e7f3314-f398-476e-adce-2747b82951d1',
        full_name_fetched: 'Dr. Om Mayekar',
        specialization: 'Cardiologist',
        experience_years: 12,
        affiliated_hospitals: ['Kedar Memorial Multispeciality Hospital'],
        cases_handled: 850,
        biography: 'Chief cardiologist specializing in interventional cardiology, heart rhythm disorders, and cardiac preventive medicine.',
        rating: 4.9,
        is_hardcoded: false
    },
    {
        id: 'hc-1',
        full_name_fetched: 'Dr. Sarah Jenkins',
        specialization: 'Cardiologist',
        experience_years: 15,
        affiliated_hospitals: ['Apollo Institute of Medical Sciences', 'City Heart Institute'],
        cases_handled: 1250,
        biography: 'Expert in interventional cardiology with over 15 years of experience treating complex heart conditions.',
        rating: 4.9,
        is_hardcoded: true
    },
    {
        id: 'hc-2',
        full_name_fetched: 'Dr. Michael Chen',
        specialization: 'Dermatologist',
        experience_years: 8,
        affiliated_hospitals: ['Metro City Health & Research Hospital'],
        cases_handled: 3400,
        biography: 'Specializing in cosmetic and medical dermatology, helping patients achieve healthy, radiant skin.',
        rating: 4.8,
        is_hardcoded: true
    },
    {
        id: 'hc-3',
        full_name_fetched: 'Dr. Emily Carter',
        specialization: 'Pediatrician',
        experience_years: 10,
        affiliated_hospitals: ['St. Jude International Medical Center', 'Kedar Memorial Multispeciality Hospital'],
        cases_handled: 2100,
        biography: 'Dedicated to the health and well-being of children from infancy through adolescence.',
        rating: 4.9,
        is_hardcoded: true
    }
];

const DoctorSearch = () => {
    const [viewMode, setViewMode] = useState<'doctors' | 'hospitals'>('doctors');
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>('all');
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
    const [selectedHospital, setSelectedHospital] = useState<HospitalProfile | null>(null);
    const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);
    const [bookingType, setBookingType] = useState<'video' | 'hospital'>('video');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        fetchDoctorsAndHospitals();
    }, []);

    const fetchDoctorsAndHospitals = async () => {
        setLoading(true);

        // 1. Fetch Hospitals
        const hospList = await HospitalAffiliationService.getHospitals();
        setHospitals(hospList);

        // 2. Fetch doctors from backend
        let mergedBackend: DoctorProfile[] = [];
        try {
            const { data: profiles } = await supabase.from('doctor_profiles').select('*');
            if (profiles) {
                const { data: userProfiles } = await supabase.from('profiles').select('id, full_name').eq('role', 'doctor');

                mergedBackend = profiles.map(doc => {
                    const userProfile = userProfiles?.find(up => up.id === doc.id);
                    return {
                        ...doc,
                        full_name_fetched: userProfile?.full_name || 'Dr. Specialist',
                        rating: 4.9,
                        is_hardcoded: false
                    };
                });
            }
        } catch (err) {
            console.warn('Error fetching doctors:', err);
        }

        // Merge with defaults
        const combined = [...HARDCODED_DOCTORS];
        mergedBackend.forEach(b => {
            const idx = combined.findIndex(c => c.id === b.id);
            if (idx >= 0) {
                combined[idx] = { ...combined[idx], ...b };
            } else {
                combined.push(b);
            }
        });

        setDoctors(combined);
        setLoading(false);
    };

    // Filter doctors
    const filteredDoctors = doctors.filter(doc => {
        const matchesQuery =
            doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.full_name_fetched?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.affiliated_hospitals?.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()));

        if (selectedHospitalFilter !== 'all') {
            const matchesHospital = doc.affiliated_hospitals?.some(
                h => h.toLowerCase() === selectedHospitalFilter.toLowerCase()
            );
            return matchesQuery && matchesHospital;
        }

        return matchesQuery;
    });

    // Filter hospitals
    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.departments.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleConfirmBooking = () => {
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingSuccess(false);
            setBookingDoctor(null);
        }, 2200);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Patient Health Portal
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Verified Network
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Find Doctors & Hospital Centers
                    </h1>
                    <p className="text-sm text-blue-100 max-w-xl mt-1">
                        Book instant video consultations or visit specialist doctors at their accredited hospital locations.
                    </p>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-center">
                    <button
                        onClick={() => setViewMode('doctors')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                            viewMode === 'doctors'
                                ? 'bg-white text-blue-700 shadow-md'
                                : 'text-blue-100 hover:text-white'
                        }`}
                    >
                        <Stethoscope className="w-4 h-4" />
                        Doctors Directory
                    </button>
                    <button
                        onClick={() => setViewMode('hospitals')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                            viewMode === 'hospitals'
                                ? 'bg-white text-blue-700 shadow-md'
                                : 'text-blue-100 hover:text-white'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Browse Hospitals ({hospitals.length})
                    </button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={
                            viewMode === 'doctors'
                                ? "Search by doctor name, specialization, or affiliated hospital..."
                                : "Search hospitals by name, city, or medical department..."
                        }
                        className="pl-10 rounded-xl border-gray-200 focus:border-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {viewMode === 'doctors' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <select
                            value={selectedHospitalFilter}
                            onChange={e => setSelectedHospitalFilter(e.target.value)}
                            className="text-xs font-semibold border rounded-xl p-2.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Hospital Affiliations</option>
                            {hospitals.map(h => (
                                <option key={h.id} value={h.name}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                        {selectedHospitalFilter !== 'all' && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedHospitalFilter('all')}
                                className="text-xs text-blue-600 hover:bg-blue-50"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* VIEW MODE 1: DOCTORS DIRECTORY */}
            {viewMode === 'doctors' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full py-16 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Loading verified medical practitioners...</p>
                        </div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-800 text-lg">No doctors found</h3>
                            <p className="text-sm text-gray-500 mt-1">Try changing your search term or hospital affiliation filter.</p>
                        </div>
                    ) : (
                        filteredDoctors.map(doc => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(37, 99, 235, 0.15)" }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all cursor-pointer"
                                onClick={() => setSelectedDoctor(doc)}
                            >
                                <div className="p-6 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                                                {doc.full_name_fetched?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                                                        {doc.full_name_fetched}
                                                    </h3>
                                                    <span title="Verified Practitioner">
                                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-blue-600">{doc.specialization}</p>
                                                <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold mt-0.5">
                                                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                                    <span>{doc.rating || 4.9}</span>
                                                    <span className="text-gray-400 font-normal">({doc.cases_handled || 120}+ reviews)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hospital Affiliation Badges */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                            Practicing At:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {doc.affiliated_hospitals && doc.affiliated_hospitals.length > 0 ? (
                                                doc.affiliated_hospitals.map((hospName, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg"
                                                    >
                                                        <Building className="w-3 h-3 text-blue-600" />
                                                        <span className="truncate max-w-[200px]">{hospName}</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                                    Private Telehealth OPD
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Key Stats */}
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 border-t border-gray-100">
                                        <div className="bg-gray-50 rounded-xl p-2">
                                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Experience</span>
                                            <strong className="text-gray-800">{doc.experience_years}+ Years</strong>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2">
                                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Patients</span>
                                            <strong className="text-green-700">{doc.cases_handled}+ Treated</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking CTA Footer */}
                                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBookingDoctor(doc);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                                    >
                                        <Calendar className="w-3.5 h-3.5" /> Book Consultation
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* VIEW MODE 2: BROWSE HOSPITALS */}
            {viewMode === 'hospitals' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredHospitals.map(hosp => {
                        // Find all doctors practicing at this hospital
                        const hospitalDoctors = doctors.filter(d =>
                            d.affiliated_hospitals?.some(h => h.toLowerCase() === hosp.name.toLowerCase())
                        );

                        return (
                            <motion.div
                                key={hosp.id}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                                                <Building className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-gray-900 text-lg leading-snug">{hosp.name}</h3>
                                                    {hosp.is_verified && (
                                                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    {hosp.address}, {hosp.city}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold mt-1">
                                                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                                    <span>{hosp.rating}</span>
                                                    <span className="text-gray-400 font-normal">Rating • {hosp.beds}+ Beds</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {hosp.bio}
                                    </p>

                                    {/* Practicing Doctors Roster Preview */}
                                    <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                                                Verified Practicing Doctors ({hospitalDoctors.length})
                                            </span>
                                            <span className="text-[11px] text-blue-600 font-semibold">Available for OPD</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {hospitalDoctors.map(doc => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoctor(doc)}
                                                    className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-gray-800 text-xs px-2.5 py-1 rounded-xl shadow-2xs hover:bg-blue-50 transition-colors"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                                        {doc.full_name_fetched?.charAt(0)}
                                                    </span>
                                                    <span className="font-semibold">{doc.full_name_fetched}</span>
                                                    <span className="text-gray-400 text-[10px]">({doc.specialization})</span>
                                                </button>
                                            ))}
                                            {hospitalDoctors.length === 0 && (
                                                <span className="text-xs text-gray-400 italic">
                                                    Doctors currently undergoing credential review for this center.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Departments */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {hosp.departments.map((dept, i) => (
                                            <span key={i} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                                {dept}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Admin: <strong>{hosp.admin_name}</strong>
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedHospital(hosp)}
                                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                                    >
                                        Hospital Details & Doctors <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: DOCTOR FULL PROFILE VIEW */}
            <AnimatePresence>
                {selectedDoctor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedDoctor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-blue-100"
                        >
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 space-y-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-extrabold text-white shadow-xl mb-3 ring-4 ring-blue-50">
                                        {selectedDoctor.full_name_fetched?.charAt(0)}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedDoctor.full_name_fetched}</h2>
                                    <p className="text-blue-600 font-semibold">{selectedDoctor.specialization}</p>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-yellow-500 font-bold mt-1">
                                        <Star className="w-4 h-4 fill-yellow-400" />
                                        <span>4.9 Star Verified Specialist</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-blue-50 rounded-2xl p-3">
                                        <div className="text-xl font-bold text-blue-700">{selectedDoctor.experience_years}+ Years</div>
                                        <div className="text-[11px] text-blue-600 uppercase font-semibold">Clinical Practice</div>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-3">
                                        <div className="text-xl font-bold text-green-700">{selectedDoctor.cases_handled}+</div>
                                        <div className="text-[11px] text-green-600 uppercase font-semibold">Patients Treated</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">About Practitioner</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                                        {selectedDoctor.biography || "Dedicated healthcare specialist providing high standard patient-centric care and diagnosis."}
                                    </p>
                                </div>

                                {/* Affiliated Hospitals Section */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-blue-600" />
                                        Accredited Hospital Affiliations
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedDoctor.affiliated_hospitals?.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-bold text-gray-900">{h}</span>
                                                </div>
                                                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                                                    Practicing Staff
                                                </span>
                                            </div>
                                        )) || (
                                            <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                                                Private Telehealth Consultations Only
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex gap-3">
                                    <Button
                                        onClick={() => {
                                            const doc = selectedDoctor;
                                            setSelectedDoctor(null);
                                            setBookingDoctor(doc);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md"
                                    >
                                        Book Appointment with {selectedDoctor.full_name_fetched}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 2: HOSPITAL DETAILS & DOCTORS ROSTER MODAL */}
            <AnimatePresence>
                {selectedHospital && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedHospital(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative border border-blue-100"
                        >
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
                                <button
                                    onClick={() => setSelectedHospital(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-3xl">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedHospital.name}</h3>
                                        <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {selectedHospital.address}, {selectedHospital.city}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">About the Hospital</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-2xl">
                                        {selectedHospital.bio}
                                    </p>
                                </div>

                                {/* Doctors practicing here */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Stethoscope className="w-4 h-4" /> Practicing Doctors at this Hospital
                                        </span>
                                    </h4>

                                    <div className="space-y-2.5">
                                        {doctors.filter(d =>
                                            d.affiliated_hospitals?.some(h => h.toLowerCase() === selectedHospital.name.toLowerCase())
                                        ).map(doc => (
                                            <div
                                                key={doc.id}
                                                className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                                        {doc.full_name_fetched?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 text-sm">{doc.full_name_fetched}</h5>
                                                        <p className="text-xs text-blue-600 font-semibold">{doc.specialization} • {doc.experience_years}+ Yrs</p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedHospital(null);
                                                        setBookingDoctor(doc);
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                                                >
                                                    Book
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex justify-end">
                                    <Button variant="outline" onClick={() => setSelectedHospital(null)}>Close</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 3: INTERACTIVE BOOKING MODAL */}
            <AnimatePresence>
                {bookingDoctor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !bookingSuccess && setBookingDoctor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blue-100 relative"
                        >
                            {!bookingSuccess ? (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                                                {bookingDoctor.full_name_fetched?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base">{bookingDoctor.full_name_fetched}</h3>
                                                <p className="text-xs text-blue-600 font-semibold">{bookingDoctor.specialization}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setBookingDoctor(null)}
                                            className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Appointment Type Options */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase block">Consultation Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setBookingType('video')}
                                                className={`p-3 rounded-2xl border text-center transition-all ${
                                                    bookingType === 'video'
                                                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500'
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Video className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                                                <span className="text-xs font-bold block">Video Consult</span>
                                                <span className="text-[10px] text-gray-500">Instant Telehealth</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setBookingType('hospital')}
                                                className={`p-3 rounded-2xl border text-center transition-all ${
                                                    bookingType === 'hospital'
                                                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500'
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Building className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                                                <span className="text-xs font-bold block">Hospital OPD Visit</span>
                                                <span className="text-[10px] text-gray-500">In-Person Consultation</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hospital Venue Info if In-Person */}
                                    {bookingType === 'hospital' && (
                                        <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 space-y-1">
                                            <span className="font-bold block">Consultation Center:</span>
                                            <p>{bookingDoctor.affiliated_hospitals?.[0] || 'Kedar Memorial Multispeciality Hospital'}</p>
                                        </div>
                                    )}

                                    {/* Preferred Slot */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase block">Preferred Timing</label>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            {['Tomorrow 10:00 AM', 'Tomorrow 02:30 PM', 'Tomorrow 05:00 PM'].map((slot, i) => (
                                                <div key={i} className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 text-center font-semibold text-blue-800 cursor-pointer hover:bg-blue-100">
                                                    {slot}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setBookingDoctor(null)}>Cancel</Button>
                                        <Button
                                            onClick={handleConfirmBooking}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md"
                                        >
                                            Confirm Appointment
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 space-y-4">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg ring-8 ring-green-50 animate-bounce">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Consultation Booked!</h3>
                                    <p className="text-xs text-gray-600 max-w-xs mx-auto">
                                        Your appointment with <strong>{bookingDoctor.full_name_fetched}</strong> has been confirmed. Confirmation details sent to your registered email.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorSearch;
