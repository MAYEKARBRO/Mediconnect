import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Briefcase, MapPin, Award, Clock, Edit2, Save, X, Building, CheckCircle,
    Search, Send, ShieldCheck, Users, Check,
    Phone, Mail, Building2, Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HospitalAffiliationService,
    type HospitalProfile,
    type AffiliationRecord
} from '../../lib/hospitalAffiliations';

interface DoctorProfileData {
    specialization: string;
    experience_years: number;
    affiliated_hospitals: string[];
    license_number: string;
    biography: string;
    cases_handled: number;
}

const Profile = () => {
    const { user } = useAuth();
    const [activeMainTab, setActiveMainTab] = useState<'profile' | 'hospitals'>('hospitals');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<DoctorProfileData | null>(null);
    const [availabilitySummary, setAvailabilitySummary] = useState<string>('Checking...');

    // Hospital Networking State
    const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
    const [myAffiliations, setMyAffiliations] = useState<AffiliationRecord[]>([]);
    const [searchHospQuery, setSearchHospQuery] = useState('');
    const [hospFilter, setHospFilter] = useState<'all' | 'connected' | 'pending'>('all');
    const [selectedHospitalForRequest, setSelectedHospitalForRequest] = useState<HospitalProfile | null>(null);
    const [selectedHospitalView, setSelectedHospitalView] = useState<HospitalProfile | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Request Form State
    const [requestForm, setRequestForm] = useState({
        department: '',
        visitingHours: 'Mon - Fri, 09:00 AM - 01:00 PM',
        message: 'I am writing to express my interest in practicing as a consultant specialist at your esteemed medical center. I look forward to contributing to inpatient rounds and clinical OPD.'
    });

    // Profile Form State
    const [formData, setFormData] = useState<DoctorProfileData>({
        specialization: '',
        experience_years: 0,
        affiliated_hospitals: [],
        license_number: '',
        biography: '',
        cases_handled: 0
    });

    useEffect(() => {
        if (!user) return;
        fetchProfile();
        fetchAvailability();
        loadHospitalData();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (data) {
                setProfile(data);
                setFormData(data);
            }
        } catch (err) {
            console.error("Error fetching doctor profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadHospitalData = async () => {
        try {
            const hospList = await HospitalAffiliationService.getHospitals();
            setHospitals(hospList);

            if (user?.id) {
                const affs = await HospitalAffiliationService.getDoctorAffiliations(user.id);
                setMyAffiliations(affs);
            }
        } catch (err) {
            console.error('Error loading hospitals:', err);
        }
    };

    const fetchAvailability = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            const { data: events } = await supabase
                .from('doctor_calendar_events')
                .select('*')
                .eq('doctor_id', user?.id)
                .gte('start_time', startOfDay)
                .lte('end_time', endOfDay);

            const eventCount = events?.length || 0;
            const freeSlots = Math.max(0, 8 - eventCount);

            if (freeSlots > 4) setAvailabilitySummary('High Availability');
            else if (freeSlots > 0) setAvailabilitySummary('Limited Availability');
            else setAvailabilitySummary('Fully Booked Today');
        } catch {
            setAvailabilitySummary('Available for Appointments');
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);

        const updates = {
            id: user.id,
            ...formData,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('doctor_profiles')
            .upsert(updates);

        if (error) {
            alert('Error saving profile: ' + error.message);
        } else {
            setProfile(formData);
            setIsEditing(false);
            setSuccessMessage('Doctor credentials successfully updated!');
            setIsSuccessModalOpen(true);
        }
        setLoading(false);
    };

    const handleSendJoinRequest = async () => {
        if (!selectedHospitalForRequest || !user) return;

        try {
            await HospitalAffiliationService.sendJoinRequest({
                doctorId: user.id,
                doctorName: user.full_name || 'Dr. Specialist',
                doctorEmail: user.email || '',
                doctorSpecialization: profile?.specialization || formData.specialization || 'Consultant Physician',
                doctorExperience: profile?.experience_years || formData.experience_years || 5,
                doctorLicense: profile?.license_number || formData.license_number || 'MED-APPLIED',
                doctorCases: profile?.cases_handled || formData.cases_handled || 120,
                hospitalId: selectedHospitalForRequest.id,
                hospitalName: selectedHospitalForRequest.name,
                department: requestForm.department || profile?.specialization || 'Clinical Services',
                visitingHours: requestForm.visitingHours,
                message: requestForm.message
            });

            await loadHospitalData();
            const hospName = selectedHospitalForRequest.name;
            setSelectedHospitalForRequest(null);
            setSuccessMessage(`Application sent to ${hospName}! The hospital administration will review your credentialing request.`);
            setIsSuccessModalOpen(true);
        } catch (err: any) {
            alert('Error sending request: ' + err.message);
        }
    };

    const handleWithdrawRequest = async (hospitalId: string, hospitalName: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to withdraw your affiliation with ${hospitalName}?`)) return;

        await HospitalAffiliationService.withdrawRequest(user.id, hospitalId);
        await loadHospitalData();
        setSuccessMessage(`Affiliation with ${hospitalName} has been withdrawn.`);
        setIsSuccessModalOpen(true);
    };

    // Filter hospitals
    const filteredHospitals = hospitals.filter(h => {
        const matchesSearch =
            h.name.toLowerCase().includes(searchHospQuery.toLowerCase()) ||
            h.city.toLowerCase().includes(searchHospQuery.toLowerCase()) ||
            h.departments.some(d => d.toLowerCase().includes(searchHospQuery.toLowerCase())) ||
            h.admin_name.toLowerCase().includes(searchHospQuery.toLowerCase());

        const affiliation = myAffiliations.find(a => a.hospital_id === h.id || a.hospital_name.toLowerCase() === h.name.toLowerCase());

        if (hospFilter === 'connected') {
            return matchesSearch && affiliation?.status === 'approved';
        }
        if (hospFilter === 'pending') {
            return matchesSearch && affiliation?.status === 'pending';
        }
        return matchesSearch;
    });

    const activeAffiliationsCount = myAffiliations.filter(a => a.status === 'approved').length;
    const pendingAffiliationsCount = myAffiliations.filter(a => a.status === 'pending').length;

    if (loading && !profile && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-gray-500 font-medium">Loading Doctor Profile & Hospital Network...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Top Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white shadow-inner">
                                {user?.full_name?.charAt(0).toUpperCase() || 'D'}
                            </div>
                            <span className="absolute -bottom-1 -right-1 bg-green-400 border-2 border-blue-700 w-5 h-5 rounded-full flex items-center justify-center" title="Verified Practitioner">
                                <Check className="w-3 h-3 text-blue-900 stroke-[3]" />
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.full_name || 'Doctor Name'}</h1>
                                <span className="bg-blue-500/30 border border-blue-300/40 text-blue-100 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Licensed MD
                                </span>
                            </div>
                            <p className="text-blue-100 font-medium text-base mt-0.5">
                                {profile?.specialization || 'Specialization Not Set'} • {profile?.experience_years || 0} Years Experience
                            </p>
                            <p className="text-xs text-blue-200 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> OPD Status: <strong className="text-white">{availabilitySummary}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                        <div className="px-4 py-2 text-center border-r border-white/10 last:border-0">
                            <div className="text-xl font-bold">{activeAffiliationsCount}</div>
                            <div className="text-xs text-blue-200">Affiliated Hospitals</div>
                        </div>
                        <div className="px-4 py-2 text-center border-r border-white/10 last:border-0">
                            <div className="text-xl font-bold">{profile?.cases_handled || 0}+</div>
                            <div className="text-xs text-blue-200">Cases Treated</div>
                        </div>
                        <div className="px-4 py-2 text-center">
                            <div className="text-xl font-bold text-amber-300">{pendingAffiliationsCount}</div>
                            <div className="text-xs text-blue-200">Pending Requests</div>
                        </div>
                    </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveMainTab('hospitals')}
                        className={`relative px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                            activeMainTab === 'hospitals'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Manage Hospital Network
                        {pendingAffiliationsCount > 0 && (
                            <span className="bg-amber-400 text-gray-900 text-xs px-1.5 py-0.2 rounded-full font-bold">
                                {pendingAffiliationsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveMainTab('profile')}
                        className={`relative px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                            activeMainTab === 'profile'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                        <Stethoscope className="w-4 h-4" />
                        Doctor Credentials & Bio
                    </button>
                </div>

                {activeMainTab === 'profile' && !isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Edit2 className="h-4 w-4" /> Edit Bio & Details
                    </Button>
                )}
            </div>

            {/* TAB 1: MANAGE HOSPITAL NETWORK */}
            {activeMainTab === 'hospitals' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* Clinical Collaboration Info Alert */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 text-base">Healthcare Provider Network & Hospital Collaboration</h3>
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Live Integration</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Search for verified hospitals registered on MediConnect and send joining requests. Once approved by the hospital administration,
                                    patients booking at that hospital can consult with you, and your clinical records & admitted patient lists sync automatically with the hospital portal.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Active Affiliations Quick Bar */}
                    {activeAffiliationsCount > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    My Official Hospital Affiliations ({activeAffiliationsCount})
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">Visible to patients during appointment search</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myAffiliations.filter(a => a.status === 'approved').map(aff => {
                                    const hospObj = hospitals.find(h => h.id === aff.hospital_id || h.name.toLowerCase() === aff.hospital_name.toLowerCase());
                                    return (
                                        <motion.div
                                            key={aff.id}
                                            whileHover={{ y: -3 }}
                                            className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                                                            <Building className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 leading-tight">{aff.hospital_name}</h4>
                                                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                Verified Staff
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-gray-600 space-y-1.5 pt-2 border-t border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>Department: <strong>{aff.department || 'Clinical OPD'}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                                                        <span className="truncate">Visiting: <strong>{aff.visiting_hours || 'Flexible'}</strong></span>
                                                    </div>
                                                    {hospObj && (
                                                        <div className="flex items-center gap-1.5 text-gray-500">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="truncate">{hospObj.address}, {hospObj.city}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => hospObj && setSelectedHospitalView(hospObj)}
                                                    className="text-xs text-blue-600 hover:bg-blue-50"
                                                >
                                                    View Hospital
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleWithdrawRequest(aff.hospital_id, aff.hospital_name)}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Leave Hospital
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pending Affiliations Alert List */}
                    {pendingAffiliationsCount > 0 && (
                        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-600 animate-spin" />
                                    Requests Pending Review by Hospital Admins ({pendingAffiliationsCount})
                                </h4>
                                <span className="text-xs text-amber-700">Waiting for chief administrator approval</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {myAffiliations.filter(a => a.status === 'pending').map(pending => (
                                    <div key={pending.id} className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{pending.hospital_name}</div>
                                            <div className="text-xs text-gray-500">Applied: {new Date(pending.requested_at).toLocaleDateString()}</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleWithdrawRequest(pending.hospital_id, pending.hospital_name)}
                                            className="text-xs text-gray-500 hover:text-red-600 hover:border-red-200"
                                        >
                                            Cancel Request
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search hospitals by name, city, department, or admin..."
                                value={searchHospQuery}
                                onChange={e => setSearchHospQuery(e.target.value)}
                                className="pl-10 rounded-xl border-gray-200 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <button
                                onClick={() => setHospFilter('all')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    hospFilter === 'all'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All Hospitals ({hospitals.length})
                            </button>
                            <button
                                onClick={() => setHospFilter('connected')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    hospFilter === 'connected'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Connected ({activeAffiliationsCount})
                            </button>
                            <button
                                onClick={() => setHospFilter('pending')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    hospFilter === 'pending'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Pending Requests ({pendingAffiliationsCount})
                            </button>
                        </div>
                    </div>

                    {/* Hospital Directory Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredHospitals.map(hosp => {
                            const affiliation = myAffiliations.find(a =>
                                a.hospital_id === hosp.id ||
                                a.hospital_name.toLowerCase() === hosp.name.toLowerCase()
                            );
                            const isApproved = affiliation?.status === 'approved';
                            const isPending = affiliation?.status === 'pending';

                            return (
                                <motion.div
                                    key={hosp.id}
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    className={`relative bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between ${
                                        isApproved
                                            ? 'border-blue-300 shadow-md ring-1 ring-blue-200'
                                            : isPending
                                            ? 'border-amber-300 shadow-sm bg-gradient-to-b from-amber-50/20 to-white'
                                            : 'border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        {/* Hospital Card Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md flex-shrink-0">
                                                    <Building className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-bold text-gray-900 text-base leading-snug">{hosp.name}</h4>
                                                        {hosp.is_verified && (
                                                            <span title="Verified Hospital Account">
                                                                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50 flex-shrink-0" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        {hosp.address}, {hosp.city}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            {isApproved ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100/80 px-2.5 py-1 rounded-full flex-shrink-0">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Affiliated
                                                </span>
                                            ) : isPending ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
                                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
                                                    Open to Connect
                                                </span>
                                            )}
                                        </div>

                                        {/* Bio / Description */}
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                            {hosp.bio}
                                        </p>

                                        {/* Metadata Tags */}
                                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center text-xs">
                                            <div className="bg-gray-50 rounded-lg p-1.5">
                                                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Beds</span>
                                                <strong className="text-gray-800">{hosp.beds}+</strong>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-1.5">
                                                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Doctors</span>
                                                <strong className="text-blue-600">{hosp.affiliated_doctors_count || 4} On-Staff</strong>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-1.5">
                                                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Admin</span>
                                                <strong className="text-gray-800 truncate block">{hosp.admin_name}</strong>
                                            </div>
                                        </div>

                                        {/* Key Departments */}
                                        <div>
                                            <div className="text-[11px] font-semibold text-gray-500 mb-1.5">Key Departments:</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {hosp.departments.slice(0, 4).map((dept, i) => (
                                                    <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                                                        {dept}
                                                    </span>
                                                ))}
                                                {hosp.departments.length > 4 && (
                                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                                                        +{hosp.departments.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedHospitalView(hosp)}
                                            className="text-xs text-gray-600 hover:text-blue-600"
                                        >
                                            View Hospital Profile
                                        </Button>

                                        {isApproved ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedHospitalView(hosp)}
                                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs font-semibold flex items-center gap-1.5"
                                            >
                                                <Users className="w-3.5 h-3.5" />
                                                Active Affiliation
                                            </Button>
                                        ) : isPending ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleWithdrawRequest(hosp.id, hosp.name)}
                                                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                                            >
                                                Withdraw Request
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => setSelectedHospitalForRequest(hosp)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Request to Join
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {filteredHospitals.length === 0 && (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h4 className="text-gray-800 font-bold">No hospitals found matching "{searchHospQuery}"</h4>
                            <p className="text-sm text-gray-500 mt-1">Try searching for other specialties or clear filters.</p>
                            <Button size="sm" variant="outline" onClick={() => { setSearchHospQuery(''); setHospFilter('all'); }} className="mt-4">
                                Reset Filters
                            </Button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB 2: DOCTOR CREDENTIALS & BIO */}
            {activeMainTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-6 md:grid-cols-3"
                >
                    {/* Left Card: Summary ID */}
                    <Card className="md:col-span-1 border-blue-100 bg-gradient-to-b from-blue-50/50 to-white shadow-sm">
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-md ring-4 ring-white">
                                {user?.full_name?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Doctor Name'}</h2>
                                <p className="text-sm text-blue-600 font-semibold">{profile?.specialization || 'Specialization Not Set'}</p>
                            </div>

                            <div className="pt-4 border-t border-blue-100 w-full space-y-2 text-left">
                                <div className="flex items-center justify-between text-sm text-gray-600 p-2 rounded-lg bg-white/70">
                                    <span className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-blue-500" /> Experience
                                    </span>
                                    <strong>{profile?.experience_years || 0} Years</strong>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600 p-2 rounded-lg bg-white/70">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" /> Cases Handled
                                    </span>
                                    <strong>{profile?.cases_handled || 0}+</strong>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600 p-2 rounded-lg bg-white/70">
                                    <span className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-purple-500" /> Affiliated Hospitals
                                    </span>
                                    <strong className="text-blue-700">{activeAffiliationsCount}</strong>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Card: Professional Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-900">
                                    <Briefcase className="h-5 w-5 text-blue-600" /> Professional Credentials
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Specialization</label>
                                                <Input
                                                    value={formData.specialization}
                                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                                    placeholder="e.g. Cardiologist, Neurologist"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Years of Experience</label>
                                                <Input
                                                    type="number"
                                                    value={formData.experience_years}
                                                    onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">License Number</label>
                                                <Input
                                                    value={formData.license_number}
                                                    onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                                                    placeholder="State Medical Council License ID"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Cases Handled</label>
                                                <Input
                                                    type="number"
                                                    value={formData.cases_handled}
                                                    onChange={e => setFormData({ ...formData, cases_handled: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Professional Biography</label>
                                            <textarea
                                                className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                rows={4}
                                                value={formData.biography}
                                                onChange={e => setFormData({ ...formData, biography: e.target.value })}
                                                placeholder="Tell patients and hospitals about your medical training, clinical focus, and philosophy..."
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-3">
                                            <Button variant="ghost" onClick={() => { setIsEditing(false); setFormData(profile || formData); }}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                                <Save className="h-4 w-4" /> Save Credentials
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Medical License ID</span>
                                                <p className="font-bold text-gray-900 mt-1">{profile?.license_number || 'MED-PENDING-VERIFY'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Patients Treated</span>
                                                <p className="font-bold text-blue-600 mt-1">{profile?.cases_handled || 0}+ Patients</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Professional Biography</span>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {profile?.biography || 'No professional biography added yet. Click "Edit Bio & Details" to tell patients and hospital administrators about your practice.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            )}

            {/* MODAL 1: REQUEST TO JOIN HOSPITAL */}
            <AnimatePresence>
                {selectedHospitalForRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedHospitalForRequest(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
                                <button
                                    onClick={() => setSelectedHospitalForRequest(null)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Building className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Apply for Hospital Affiliation</h3>
                                        <p className="text-xs text-blue-100">{selectedHospitalForRequest.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
                                    <div className="font-semibold flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" /> Doctor Verification Payload
                                    </div>
                                    <p className="text-blue-600">
                                        Applying as <strong>{user?.full_name}</strong> ({profile?.specialization || 'Physician'}) • License: <strong>{profile?.license_number || 'Active'}</strong>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                                            Target Department / Ward
                                        </label>
                                        <Input
                                            value={requestForm.department}
                                            onChange={e => setRequestForm({ ...requestForm, department: e.target.value })}
                                            placeholder={`e.g. ${selectedHospitalForRequest.departments[0] || 'Cardiology'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                                            Proposed Visiting OPD Timings
                                        </label>
                                        <Input
                                            value={requestForm.visitingHours}
                                            onChange={e => setRequestForm({ ...requestForm, visitingHours: e.target.value })}
                                            placeholder="e.g. Mon - Fri, 10:00 AM - 02:00 PM"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                                            Cover Note to Chief Administrator
                                        </label>
                                        <textarea
                                            className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            rows={3}
                                            value={requestForm.message}
                                            onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                                            placeholder="Introduce yourself to the hospital board and medical superintendent..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t">
                                    <Button variant="ghost" onClick={() => setSelectedHospitalForRequest(null)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSendJoinRequest}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md"
                                    >
                                        <Send className="w-4 h-4" /> Send Official Request
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 2: HOSPITAL PROFILE DETAILS VIEW */}
            <AnimatePresence>
                {selectedHospitalView && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedHospitalView(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100"
                        >
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
                                <button
                                    onClick={() => setSelectedHospitalView(null)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedHospitalView.name}</h3>
                                        <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {selectedHospitalView.address}, {selectedHospitalView.city}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">About the Hospital</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
                                        {selectedHospitalView.bio}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <span className="text-xs text-blue-600 font-semibold block">Inpatient Capacity</span>
                                        <strong className="text-gray-900 text-base">{selectedHospitalView.beds} Intensive & General Beds</strong>
                                    </div>
                                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                        <span className="text-xs text-purple-600 font-semibold block">Medical Roster</span>
                                        <strong className="text-gray-900 text-base">{selectedHospitalView.affiliated_doctors_count || 4} Attending Doctors</strong>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Hospital Contact & Administration</h4>
                                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Administrator: <strong>{selectedHospitalView.admin_name}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Emergency Hotline: <strong>{selectedHospitalView.phone}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Email: <strong>{selectedHospitalView.email}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Active Departments</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedHospitalView.departments.map((d, i) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex justify-end">
                                    <Button onClick={() => setSelectedHospitalView(null)}>Close</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 3: CELEBRATION / SUCCESS NOTIFICATION MODAL */}
            <AnimatePresence>
                {isSuccessModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsSuccessModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-blue-100"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg ring-8 ring-green-50 animate-bounce">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {successMessage}
                            </p>
                            <Button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
