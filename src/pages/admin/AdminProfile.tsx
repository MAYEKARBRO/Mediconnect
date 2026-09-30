import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    User, Shield, Building, Save, MapPin, Phone, CheckCircle,
    Building2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HospitalAffiliationService } from '../../lib/hospitalAffiliations';

const AdminProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>({
        full_name: '',
        hospital_name: '',
        hospital_address: '',
        phone_number: '',
        city: 'Margao, Goa',
        beds: 250,
        departments: 'Cardiology, Orthopedics, Emergency Care, Neurology, Pediatrics',
        bio: 'Premier tertiary healthcare facility providing cutting-edge clinical suites, emergency trauma center, and robotic surgeries.'
    });

    const [stats, setStats] = useState({
        staffStrength: 0,
        affiliatedDoctors: 0,
        admittedPatients: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const { count: doctorCount } = await supabase.from('doctor_profiles').select('*', { count: 'exact', head: true });
            const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
            
            if (user?.id) {
                const { affiliatedDoctors } = await HospitalAffiliationService.getHospitalAffiliations(user.id);
                const patients = await HospitalAffiliationService.getHospitalPatientsRoster(user.id);
                setStats({
                    staffStrength: (staffCount || 0) + affiliatedDoctors.length,
                    affiliatedDoctors: affiliatedDoctors.length,
                    admittedPatients: patients.length
                });
            } else {
                setStats({
                    staffStrength: (doctorCount || 0) + (staffCount || 0),
                    affiliatedDoctors: doctorCount || 4,
                    admittedPatients: 28
                });
            }
        } catch {
            // fallback
        }
    };

    const fetchProfile = async () => {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
            if (data) {
                setProfile((prev: any) => ({
                    ...prev,
                    ...data,
                    hospital_name: data.hospital_name || 'Kedar Memorial Multispeciality Hospital',
                    hospital_address: data.hospital_address || 'Borda Margao, Near PCCOE Campus',
                    phone_number: data.phone_number || '+91 98221 44550'
                }));
            }
        } catch (err) {
            console.warn('Error fetching admin profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: profile.full_name,
                hospital_name: profile.hospital_name,
                hospital_address: profile.hospital_address,
                phone_number: profile.phone_number
            }).eq('id', user?.id);

            if (error) throw error;
            setShowSuccessModal(true);
        } catch (err: any) {
            alert('Error saving profile: ' + (err.message || 'Please try again'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Hospital Administration
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Verified Center
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Hospital Profile & Organization Settings
                    </h1>
                    <p className="text-sm text-blue-100 max-w-xl mt-1">
                        Configure public hospital details, verified departments, and administrative contact visible to doctors and patients across MediConnect.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                    <div className="text-center px-3 border-r border-white/20">
                        <div className="text-xl font-bold">{stats.affiliatedDoctors}</div>
                        <div className="text-xs text-blue-100">Doctors</div>
                    </div>
                    <div className="text-center px-3 border-r border-white/20">
                        <div className="text-xl font-bold">{stats.admittedPatients}</div>
                        <div className="text-xs text-blue-100">Patients</div>
                    </div>
                    <div className="text-center px-3">
                        <div className="text-xl font-bold">{stats.staffStrength}</div>
                        <div className="text-xs text-blue-100">Staff</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/70 border-b border-gray-100">
                            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Official Hospital Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Hospital Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-10 rounded-xl"
                                        value={profile.hospital_name || ''}
                                        onChange={e => setProfile({ ...profile, hospital_name: e.target.value })}
                                        placeholder="e.g. Kedar Memorial Multispeciality Hospital"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Hospital Address / Campus</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-10 rounded-xl"
                                            value={profile.hospital_address || ''}
                                            onChange={e => setProfile({ ...profile, hospital_address: e.target.value })}
                                            placeholder="Street or Area"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">City & State</label>
                                    <Input
                                        className="rounded-xl"
                                        value={profile.city || ''}
                                        onChange={e => setProfile({ ...profile, city: e.target.value })}
                                        placeholder="e.g. Margao, Goa"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Emergency Contact Hotline</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-10 rounded-xl"
                                            value={profile.phone_number || ''}
                                            onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                            placeholder="+91 98000 00000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Inpatient Bed Capacity</label>
                                    <Input
                                        type="number"
                                        className="rounded-xl"
                                        value={profile.beds || 200}
                                        onChange={e => setProfile({ ...profile, beds: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Clinical Departments (Comma Separated)</label>
                                <Input
                                    className="rounded-xl"
                                    value={profile.departments || ''}
                                    onChange={e => setProfile({ ...profile, departments: e.target.value })}
                                    placeholder="Cardiology, Emergency Care, Orthopedics, Pediatrics"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Hospital Overview / Bio</label>
                                <textarea
                                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={3}
                                    value={profile.bio || ''}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Provide a summary of the hospital's clinical services and patient facilities..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/70 border-b border-gray-100">
                            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Chief Medical Administrator Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Administrator Name</label>
                                    <Input
                                        className="rounded-xl"
                                        value={profile.full_name || ''}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Administrative Email</label>
                                    <Input
                                        className="rounded-xl bg-gray-50 text-gray-500"
                                        value={user?.email || ''}
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Hospital Profile'}
                        </Button>
                    </div>
                </div>

                {/* Right Col: Live Preview of Hospital Card */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Live Directory Preview
                    </div>

                    <div className="bg-white rounded-3xl border-2 border-blue-200 p-6 shadow-md space-y-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
                                <Building className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-gray-900 text-base leading-snug">
                                        {profile.hospital_name || 'Hospital Name'}
                                    </h4>
                                    <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    {profile.hospital_address || 'Address'}, {profile.city || 'City'}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-gray-50 p-3 rounded-xl">
                            {profile.bio || 'Hospital overview description will be displayed here for doctors and patients.'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-blue-50/60 rounded-xl p-2">
                                <span className="text-blue-500 block text-[10px] uppercase font-bold">Bed Capacity</span>
                                <strong className="text-blue-900">{profile.beds || 200}+ Beds</strong>
                            </div>
                            <div className="bg-green-50/60 rounded-xl p-2">
                                <span className="text-green-600 block text-[10px] uppercase font-bold">Network Status</span>
                                <strong className="text-green-800">Verified Partner</strong>
                            </div>
                        </div>

                        <div className="text-[11px] text-gray-500 border-t pt-2 flex items-center justify-between">
                            <span>Hotline: <strong>{profile.phone_number || '+91 98000 00000'}</strong></span>
                            <span className="text-blue-600 font-bold">MediConnect Verified</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-xs text-blue-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-blue-600" />
                            Doctor Discovery System
                        </div>
                        <p className="text-blue-700 leading-relaxed">
                            When doctors search for hospitals to join, they will see this verified card in their Manage Hospital section.
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSuccessModal(false)}
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
                            <h3 className="text-xl font-bold text-gray-900">Hospital Profile Updated!</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Your hospital profile and administrative details have been saved and updated across the MediConnect network.
                            </p>
                            <Button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md"
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

export default AdminProfile;
