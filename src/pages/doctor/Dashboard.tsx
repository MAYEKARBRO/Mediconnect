import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
    Users, Calendar, Activity, ArrowRight, Building,
    Building2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    HospitalAffiliationService,
    type AffiliationRecord
} from '../../lib/hospitalAffiliations';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [affiliations, setAffiliations] = useState<AffiliationRecord[]>([]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const affs = await HospitalAffiliationService.getDoctorAffiliations(user.id);
            setAffiliations(affs);
        };
        load();
    }, [user]);

    const approvedAffiliations = affiliations.filter(a => a.status === 'approved');
    const pendingAffiliations = affiliations.filter(a => a.status === 'pending');

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Physician Clinical Console
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Telehealth & Hospital OPD
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Welcome, {user?.full_name || 'Doctor'}
                    </h1>
                    <p className="text-sm text-blue-100 max-w-xl mt-1">
                        Review your daily schedule, manage your hospital affiliations, monitor disease trends, and synchronize patient medical records.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => navigate('/doctor/profile')}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md text-sm flex items-center gap-2"
                    >
                        <Building2 className="w-4 h-4 text-blue-600" /> Manage Hospitals
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Affiliated Hospitals
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <Building className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-blue-700">{approvedAffiliations.length}</div>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                {pendingAffiliations.length > 0 ? `${pendingAffiliations.length} pending requests` : 'Official practicing venues'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Clinical Patients
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-gray-900">124</div>
                            <p className="text-xs text-green-600 font-semibold mt-1">+12% new patients this month</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Appointments Today
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-green-50 text-green-600">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-gray-900">8</div>
                            <p className="text-xs text-gray-500 font-medium mt-1">2 video consultations scheduled</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Active Regional Trends
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Activity className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">Flu Outbreak</div>
                            <p className="text-xs text-amber-600 font-semibold mt-1">Elevated seasonal cases</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Left 4 Cols: Actions & Hospital Network Widget */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Hospital Network Card */}
                    <Card className="rounded-3xl border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-blue-100 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-blue-950">
                                            Hospital Affiliation & Collaboration Network
                                        </CardTitle>
                                        <p className="text-xs text-blue-700">Connect with accredited hospitals to practice and sync patient records</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/doctor/profile')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                                >
                                    Manage Network <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                            {approvedAffiliations.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Your Active Practicing Centers:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {approvedAffiliations.map(aff => (
                                            <div key={aff.id} className="p-3 bg-white border border-blue-200 rounded-2xl shadow-2xs flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-xs">{aff.hospital_name}</div>
                                                    <div className="text-[11px] text-blue-600">{aff.department || 'Clinical OPD'}</div>
                                                </div>
                                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                    Verified Staff
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-600">
                                    You have not connected to any hospital yet. Search for registered hospitals in your profile to expand your clinical practice.
                                </p>
                            )}

                            {pendingAffiliations.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        {pendingAffiliations.length} hospital joining application(s) awaiting administrative review
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/doctor/profile')}
                                        className="text-xs text-amber-800 border-amber-300 hover:bg-amber-100"
                                    >
                                        View
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule Quick Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="rounded-3xl border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base">Schedule & OPD Hours</h4>
                                <p className="text-xs text-gray-500">Manage patient slots, surgery bookings, and calendar availability.</p>
                            </div>
                            <Button
                                onClick={() => navigate('/doctor/schedule')}
                                variant="outline"
                                className="mt-4 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                            >
                                Open Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Card>

                        <Card className="rounded-3xl border-gray-200 shadow-sm p-6 hover:border-purple-300 transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base">Disease Intelligence</h4>
                                <p className="text-xs text-gray-500">Analyze epidemiological trends, classifications, and patient vitals.</p>
                            </div>
                            <Button
                                onClick={() => navigate('/doctor/trends')}
                                variant="outline"
                                className="mt-4 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 font-bold"
                            >
                                View Trends <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Card>
                    </div>
                </div>

                {/* Right 3 Cols: Recent Patients List */}
                <div className="lg:col-span-3">
                    <Card className="rounded-3xl border-gray-200 shadow-sm h-full flex flex-col justify-between">
                        <div>
                            <CardHeader className="border-b border-gray-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        Recent Consultations
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => navigate('/doctor/patients')}
                                        className="text-xs text-blue-600 hover:bg-blue-50"
                                    >
                                        All Patients
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                {[
                                    { name: 'Joshua Clement', condition: 'Post-Angioplasty Monitoring', time: '10:30 AM' },
                                    { name: 'Rohan Naik', condition: 'Sinus Tachycardia Evaluation', time: '11:45 AM' },
                                    { name: 'Aisha Shaikh', condition: 'Hypertension Follow-up', time: '02:15 PM' },
                                    { name: 'Dr. Jenkins (Consult)', condition: 'Peer Clinical Collaboration', time: '04:00 PM' }
                                ].map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-xs">{p.name}</div>
                                                <div className="text-[11px] text-gray-500">{p.condition}</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-400">{p.time}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </div>

                        <div className="p-6 pt-0">
                            <Button
                                onClick={() => navigate('/doctor/patients')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs"
                            >
                                Open Full Patient Records
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
