import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import {
    FileText, MessageSquare, Search, PartyPopper, User, Pill,
    Building2, ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

const PatientDashboard = () => {
    const navigate = useNavigate();

    const quickServices = [
        { icon: Search, label: 'Find a Doctor', desc: 'Book verified specialists', path: '/patient/search', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300' },
        { icon: Building2, label: 'Hospital Centers', desc: 'Browse accredited hospitals', path: '/patient/search', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100 hover:border-indigo-300' },
        { icon: FileText, label: 'Medical Visits', desc: 'Digital Rx & diagnoses', path: '/patient/visits', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100 hover:border-teal-300' },
        { icon: MessageSquare, label: 'AI Health Assistant', desc: 'Instant symptom analysis', path: '/patient/chatbot', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100 hover:border-purple-300' },
        { icon: Pill, label: 'Pharmacy & Meds', desc: 'Order prescribed medicines', path: '/patient/pharmacy', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100 hover:border-emerald-300' },
        { icon: User, label: 'My Health Profile', desc: 'ABHA & vitals history', path: '/patient/profile', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200 hover:border-gray-400' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Top Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Patient Health Hub
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> 24/7 Telehealth Active
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Your Personal Health & Wellness Portal
                    </h1>
                    <p className="text-sm text-blue-100 max-w-xl">
                        Schedule consultations with verified doctors practicing at leading hospitals, access digital prescriptions, and connect with clinical specialists.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => navigate('/patient/search')}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md text-sm flex items-center gap-2"
                    >
                        <Search className="w-4 h-4 text-blue-600" /> Search Doctors & Hospitals
                    </Button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickServices.map((item) => (
                    <motion.div
                        key={item.label}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card
                            className={`cursor-pointer h-full rounded-2xl border transition-all shadow-2xs hover:shadow-md ${item.border}`}
                            onClick={() => navigate(item.path)}
                        >
                            <CardContent className="flex flex-col items-center justify-center p-5 text-center space-y-2.5">
                                <div className={`p-3 rounded-2xl ${item.bg}`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <div>
                                    <span className="font-bold text-xs text-gray-900 block">{item.label}</span>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">{item.desc}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Featured Section: Accredited Hospital Network Highlight */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-md">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            MediConnect Accredited Hospital Network
                        </h3>
                        <p className="text-xs text-gray-600 max-w-xl mt-1 leading-relaxed">
                            Discover doctors affiliated with trusted regional medical centers including <strong>Kedar Memorial Multispeciality Hospital</strong> and <strong>Apollo Institute of Medical Sciences</strong>. Book in-person OPD appointments or instant video consults.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => navigate('/patient/search')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md flex-shrink-0"
                >
                    Browse Hospital Centers <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
            </div>

            {/* Bottom 3 Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-3xl border-gray-200 shadow-sm p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Recent Consultations</h4>
                    </div>
                    <p className="text-xs text-gray-500">Access your digital prescription records, doctor notes, and diagnostic tests.</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/patient/visits')}
                        className="w-full text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                    >
                        View My Medical Visits
                    </Button>
                </Card>

                <Card className="rounded-3xl border-gray-200 shadow-sm p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">AI Medical Assistant</h4>
                    </div>
                    <p className="text-xs text-gray-500">Check symptoms, ask drug interaction questions, and get health guidance powered by AI.</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/patient/chatbot')}
                        className="w-full text-xs text-purple-600 border-purple-200 hover:bg-purple-50 font-bold"
                    >
                        Launch Health Chat
                    </Button>
                </Card>

                <Card className="rounded-3xl border-gray-200 shadow-sm p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                            <PartyPopper className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Community Health Events</h4>
                    </div>
                    <p className="text-xs text-gray-500">Register for free blood donation camps, cardiac checkup drives, and health webinars.</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/patient/events')}
                        className="w-full text-xs text-pink-700 border-pink-200 hover:bg-pink-50 font-bold"
                    >
                        Explore Events
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default PatientDashboard;
