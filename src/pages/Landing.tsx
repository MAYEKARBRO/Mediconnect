import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Activity, ArrowRight, ShieldCheck, Stethoscope, User } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <Activity className="h-8 w-8 text-blue-600" />
                        <span className="ml-2 text-xl font-bold text-gray-900">MediConnect</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link to="/login">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                                <span className="block">Healthcare ecosystem for</span>
                                <span className="block text-blue-600">everyone.</span>
                            </h1>
                            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                                Seamlessly connecting doctors, patients, and hospital administration in one unified platform.
                            </p>
                            <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
                                <Link to="/login">
                                    <Button size="lg" className="w-full sm:w-auto flex items-center">
                                        Enter Portal <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="bg-gray-50 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                                    <Stethoscope className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">For Doctors</h3>
                                <p className="text-gray-600">
                                    Manage patient records, schedule appointments, and track disease trends efficiently.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <User className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">For Patients</h3>
                                <p className="text-gray-600">
                                    Access digital prescriptions, book appointments, and consult via AI chatbot.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">For Administration</h3>
                                <p className="text-gray-600">
                                    Oversee hospital operations, manage staff, and monitor inventory and analytics.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;
