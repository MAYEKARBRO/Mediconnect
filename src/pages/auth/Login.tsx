import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';
import {
    Activity, Stethoscope, User, ShieldCheck, Building2, CheckCircle,
    Video, FileText, ArrowRight, Lock, Mail, HeartPulse,
    Shield, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const navigate = useNavigate();
    const { signIn, signUp, user } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('doctor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            navigate(`/${user.role}`);
        }
    }, [user, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, role, fullName);
                if (!user) {
                    setError('Registration initiated! Check your email if email confirmation is enabled.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    // Quick fill helper for easy testing
    const setDemoCredentials = (targetRole: UserRole, demoEmail: string) => {
        setRole(targetRole);
        setEmail(demoEmail);
        setPassword('password123');
        setError('');
    };

    const roleInfo = {
        patient: {
            title: 'Patient Portal',
            badge: 'Personal Health Records',
            desc: 'Find doctors, book hospital OPD or video visits, access prescriptions, and chat with AI.'
        },
        doctor: {
            title: 'Doctor Console',
            badge: 'Clinical Network & OPD',
            desc: 'Search accredited hospitals, request affiliation, manage patients, and track disease trends.'
        },
        admin: {
            title: 'Hospital Administration',
            badge: 'Medical Staff & Facilities',
            desc: 'Review doctor joining applications, manage medical staff, monitor patient admissions, and inventory.'
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/40 flex items-stretch">
            {/* LEFT COLUMN: APPLICATION INFORMATION & SHOWCASE (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-12 flex-col justify-between">
                {/* Background decorative glows */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

                {/* Top Brand Header */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                            <Activity className="w-7 h-7 text-white stroke-[2.5]" />
                        </div>
                        <div>
                            <span className="text-2xl font-black tracking-tight text-white block leading-none">
                                Medi<span className="text-blue-200">Connect</span>
                            </span>
                            <span className="text-xs text-blue-200 font-semibold tracking-wider uppercase">
                                Unified Healthcare & Hospital Network
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Hero & Value Proposition */}
                <div className="relative z-10 space-y-8 my-auto py-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-xs px-3.5 py-1.5 rounded-full font-bold">
                            <HeartPulse className="w-4 h-4 text-pink-300 animate-pulse" />
                            Next-Generation Clinical Collaboration
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
                            Connecting Doctors, Hospitals, and Patients on One Intelligent Platform.
                        </h1>
                        <p className="text-base text-blue-100/90 leading-relaxed font-normal">
                            MediConnect bridges modern healthcare. Doctors discover accredited hospitals and share clinical rosters; hospitals credential specialists and streamline inpatient admissions; patients book appointments with verified practitioners.
                        </p>
                    </div>

                    {/* Interactive Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-200">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-sm text-white">Hospital Networking</h2>
                            <p className="text-xs text-blue-100/80 leading-relaxed">
                                Search hospital profiles, submit affiliation credentials, and sync patient records.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2"
                        >
                            <div className="w-10 h-10 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-200">
                                <Video className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-sm text-white">Telehealth & OPD</h2>
                            <p className="text-xs text-blue-100/80 leading-relaxed">
                                Seamless video consultations, digital prescription sharing, and in-person OPD bookings.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-sm text-white">Unified Patient Data</h2>
                            <p className="text-xs text-blue-100/80 leading-relaxed">
                                Live diagnosis tracking, integrated prescription records, and disease trends.
                            </p>
                        </motion.div>
                    </div>

                    {/* Live Metric Stats */}
                    <div className="flex items-center gap-8 pt-4 border-t border-white/15">
                        <div>
                            <div className="text-2xl font-black text-white">250+</div>
                            <div className="text-xs text-blue-200 font-medium">Partner Hospitals</div>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                            <div className="text-2xl font-black text-white">1,200+</div>
                            <div className="text-xs text-blue-200 font-medium">Verified Specialists</div>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                            <div className="text-2xl font-black text-white">100%</div>
                            <div className="text-xs text-blue-200 font-medium">Encrypted & Secure</div>
                        </div>
                    </div>
                </div>

                {/* Footer Security Badges */}
                <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 border-t border-white/15 pt-4">
                    <span className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-green-300" /> End-to-End HIPAA & Digital Health Compliance
                    </span>
                    <span>© {new Date().getFullYear()} MediConnect Inc.</span>
                </div>
            </div>

            {/* RIGHT COLUMN: PROFESSIONAL LOGIN & SIGNUP PORTAL */}
            <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-6 sm:p-10 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    {/* Mobile Brand Header */}
                    <div className="lg:hidden text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Activity className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">MediConnect</h2>
                        <p className="text-xs text-gray-500">Connected Healthcare Network</p>
                    </div>

                    {/* Portal Header */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                {roleInfo[role].badge}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">
                            {isLogin
                                ? 'Sign in to access your clinical dashboard and medical network.'
                                : 'Register as a doctor, hospital administrator, or patient.'}
                        </p>
                    </div>

                    {/* Role Selection Tabs */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Select Account Portal
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setRole('doctor')}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                    role === 'doctor'
                                        ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Stethoscope className={`h-5 w-5 mb-1 ${role === 'doctor' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold block">Doctor</span>
                                <span className="text-[10px] text-gray-400">Practitioner</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                    role === 'admin'
                                        ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Building2 className={`h-5 w-5 mb-1 ${role === 'admin' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold block">Hospital</span>
                                <span className="text-[10px] text-gray-400">Admin</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('patient')}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                    role === 'patient'
                                        ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <User className={`h-5 w-5 mb-1 ${role === 'patient' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold block">Patient</span>
                                <span className="text-[10px] text-gray-400">Personal</span>
                            </button>
                        </div>
                    </div>

                    {/* Role Description Card */}
                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg mt-0.5 flex-shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <p className="leading-relaxed text-[11px]">
                            {roleInfo[role].desc}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Full Legal Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder={role === 'doctor' ? 'Dr. Sarah Connor' : role === 'admin' ? 'Hospital Medical Superintendent' : 'John Doe'}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required={!isLogin}
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Registered Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="doctor@hospital.org"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700 uppercase block">Password</label>
                                {isLogin && (
                                    <span className="text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer font-semibold">
                                        Forgot Password?
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 pr-10 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-semibold">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md text-sm transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Verifying Credentials...
                                </span>
                            ) : isLogin ? (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In to {roleInfo[role].title} <ArrowRight className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Complete {roleInfo[role].title} Registration <CheckCircle className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Demo One-Click Fill Helper */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Instant Demo Test Accounts</span>
                            <span className="text-blue-600 font-semibold">1-Click Fill</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setDemoCredentials('doctor', 'ommayekar32@gmail.com')}
                                className="p-2 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                            >
                                <span className="font-bold text-gray-900 block text-[11px]">Doctor</span>
                                <span className="text-[10px] text-gray-500 truncate block">Dr. Mayekar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDemoCredentials('admin', 'ommayekarpccefy2024@gmail.com')}
                                className="p-2 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                            >
                                <span className="font-bold text-gray-900 block text-[11px]">Hospital Admin</span>
                                <span className="text-[10px] text-gray-500 truncate block">Kedar Hospital</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDemoCredentials('patient', 'ommayekarbro@gmail.com')}
                                className="p-2 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                            >
                                <span className="font-bold text-gray-900 block text-[11px]">Patient</span>
                                <span className="text-[10px] text-gray-500 truncate block">Patient D'Souza</span>
                            </button>
                        </div>
                    </div>

                    {/* Toggle Login / Signup */}
                    <div className="text-center text-xs">
                        <span className="text-gray-500">
                            {isLogin ? "Don't have an account on MediConnect? " : "Already have an account? "}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="font-bold text-blue-600 hover:text-blue-700 ml-1 underline underline-offset-2"
                        >
                            {isLogin ? 'Create an account' : 'Sign in here'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
