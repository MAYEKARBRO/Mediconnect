import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Users, Activity, Box, Stethoscope, Clock, ShieldCheck,
    Building2, ArrowRight, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    HospitalAffiliationService,
    type AffiliationRecord,
    type HospitalPatientView
} from '../../lib/hospitalAffiliations';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<AffiliationRecord[]>([]);
    const [affiliatedDoctors, setAffiliatedDoctors] = useState<AffiliationRecord[]>([]);
    const [patients, setPatients] = useState<HospitalPatientView[]>([]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const { pendingRequests: pending, affiliatedDoctors: approved } =
                await HospitalAffiliationService.getHospitalAffiliations(user.id);
            setPendingRequests(pending);
            setAffiliatedDoctors(approved);

            const pts = await HospitalAffiliationService.getHospitalPatientsRoster(user.id);
            setPatients(pts);
        };
        load();
    }, [user]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Hospital Executive Overview
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Telemetry
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Hospital Administration & Clinical Hub
                    </h1>
                    <p className="text-sm text-blue-100 max-w-xl mt-1">
                        Welcome to your unified administration control center. Monitor doctor affiliations, patient admissions, staff rosters, and clinical updates in real time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => navigate('/admin/staff')}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md text-sm"
                    >
                        <Users className="w-4 h-4 mr-2" /> Manage Medical Staff
                    </Button>
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate('/admin/staff')}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Affiliated Doctors
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <Stethoscope className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-gray-900">{affiliatedDoctors.length}</div>
                            <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Practicing at Hospital
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card
                        className={`rounded-3xl shadow-sm transition-all cursor-pointer ${
                            pendingRequests.length > 0
                                ? 'border-2 border-amber-300 bg-amber-50/20'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => navigate('/admin/staff')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Doctor Applications
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-amber-600">{pendingRequests.length}</div>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                {pendingRequests.length > 0 ? 'Requires administrative review' : 'No pending applications'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate('/admin/staff')}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Synced Patients Roster
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <Activity className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-gray-900">{patients.length}</div>
                            <p className="text-xs text-purple-600 font-semibold mt-1">
                                Inpatient & Outpatient Roster
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate('/admin/inventory')}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Pharmacy & Supplies
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                <Box className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-gray-900">Normal</div>
                            <p className="text-xs text-gray-500 font-medium mt-1">Critical stock maintained</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Actions & Synced Clinical Roster Preview */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Pending Doctor Requests Action Card */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="rounded-3xl border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                    Incoming Doctor Join Applications
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-0.5">Physicians applying to practice at your healthcare facility</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/admin/staff')}
                                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                View All ({pendingRequests.length})
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {pendingRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingRequests.slice(0, 3).map(req => (
                                        <div
                                            key={req.id}
                                            className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                                                    {req.doctor_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{req.doctor_name}</h4>
                                                    <p className="text-xs text-blue-600 font-semibold">{req.doctor_specialization} • {req.doctor_experience} Yrs Exp</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">License: {req.doctor_license}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => navigate('/admin/staff')}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                                            >
                                                Review Application
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2 opacity-80" />
                                    <p className="text-sm font-semibold text-gray-700">All Doctor Requests Reviewed</p>
                                    <p className="text-xs text-gray-400 mt-0.5">New doctor applications will appear here in real time.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shared Hospital Patients Roster Preview */}
                    <Card className="rounded-3xl border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                    Recent Hospital Patient Encounters
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-0.5">Clinical data shared by your affiliated doctors</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/admin/staff')}
                                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                Full Patient Roster
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {patients.slice(0, 3).map(p => (
                                    <div key={p.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{p.patient_name}</div>
                                            <div className="text-xs text-blue-600 font-medium">Attending: {p.doctor_name} ({p.doctor_specialization})</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{p.diagnosis}</div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                            p.status === 'admitted'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {p.status === 'admitted' ? 'Admitted' : 'Outpatient'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Hospital Profile Quick Card & Shortucts */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Hospital Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase">Facility Name</span>
                                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                    Kedar Memorial Multispeciality Hospital
                                </h4>
                                <p className="text-xs text-gray-500">Borda Margao, Goa • 250 Inpatient Beds</p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white border border-blue-100 text-xs text-blue-900 space-y-1 shadow-2xs">
                                <div className="font-bold flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    Doctor-Hospital Social Collaboration
                                </div>
                                <p className="text-blue-700 leading-relaxed text-[11px]">
                                    Doctors registered on MediConnect can search for your hospital profile and submit joining credentials.
                                </p>
                            </div>

                            <Button
                                onClick={() => navigate('/admin/profile')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs"
                            >
                                Edit Hospital Profile Card <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-gray-200 shadow-sm p-6 space-y-3">
                        <h4 className="font-bold text-gray-900 text-sm">Administrative Shortlinks</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/admin/staff')}
                                className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs font-semibold flex items-center justify-between"
                            >
                                <span>Medical Staff Directory & Roster</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => navigate('/admin/inventory')}
                                className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs font-semibold flex items-center justify-between"
                            >
                                <span>Pharmacy & Medical Supply Control</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => navigate('/admin/biowaste')}
                                className="w-full text-left p-3 rounded-xl bg-amber-50/50 hover:bg-amber-100 hover:text-amber-900 transition-colors text-xs font-semibold flex items-center justify-between text-amber-900 border border-amber-200"
                            >
                                <span>Biomedical Waste & Barcode Tracking</span>
                                <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                            <button
                                onClick={() => navigate('/admin/events')}
                                className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs font-semibold flex items-center justify-between"
                            >
                                <span>Public Community Health Campaigns</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
