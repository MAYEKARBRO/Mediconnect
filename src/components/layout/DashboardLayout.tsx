import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Activity,
    Calendar,
    MessageSquare,
    Users,
    LogOut,
    LayoutDashboard,
    FileText,
    Search,
    Box,
    User,
    Pill,
    PartyPopper,
    Stethoscope,
    BookOpen,
    Building2,
    Trash2,
    BedDouble
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    to: string;
    badge?: string;
}

const Sidebar = ({ role }: { role: string }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getNavItems = (): SidebarItem[] => {
        switch (role) {
            case 'doctor':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/doctor' },
                    { icon: Building2, label: 'Hospital Network', to: '/doctor/profile' },
                    { icon: Users, label: 'Patients List', to: '/doctor/patients' },
                    { icon: Calendar, label: 'Schedule', to: '/doctor/schedule' },
                    { icon: PartyPopper, label: 'Events', to: '/doctor/events' },
                    { icon: Activity, label: 'Disease Trends', to: '/doctor/trends' },
                    { icon: MessageSquare, label: 'Messages', to: '/doctor/messages' },
                    { icon: User, label: 'Profile & Credentials', to: '/doctor/profile' },
                ];
            case 'patient':
                return [
                    { icon: LayoutDashboard, label: t('sidebar.dashboard'), to: '/patient' },
                    { icon: Search, label: 'Find Doctors & Hospitals', to: '/patient/search' },
                    { icon: FileText, label: t('sidebar.visits'), to: '/patient/visits' },
                    { icon: MessageSquare, label: t('sidebar.chatbot'), to: '/patient/chatbot' },
                    { icon: MessageSquare, label: t('sidebar.messages'), to: '/patient/messages' },
                    { icon: PartyPopper, label: t('sidebar.events'), to: '/patient/events' },
                    { icon: Pill, label: t('sidebar.pharmacy'), to: '/patient/pharmacy' },
                    { icon: User, label: t('sidebar.profile'), to: '/patient/profile' },
                ];
            case 'admin':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
                    { icon: BedDouble, label: 'IPD & Bed Management', to: '/admin/ipd' },
                    { icon: Stethoscope, label: 'Medical Staff & Doctors', to: '/admin/staff' },
                    { icon: Activity, label: 'Hospital Patient Roster', to: '/admin/staff' },
                    { icon: Building2, label: 'Hospital Profile', to: '/admin/profile' },
                    { icon: Box, label: 'Inventory', to: '/admin/inventory' },
                    { icon: Trash2, label: 'Biomedical Waste', to: '/admin/biowaste' },
                    { icon: PartyPopper, label: 'Events', to: '/admin/events' },
                    { icon: BookOpen, label: 'Rulebook', to: '/admin/rulebook' },
                    { icon: MessageSquare, label: 'Chats', to: '/admin/chats' },
                    { icon: Activity, label: 'Analytics', to: '/admin/analytics' },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm select-none">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-gray-100 px-6 gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Activity className="h-6 w-6" />
                </div>
                <div>
                    <span className="text-lg font-extrabold tracking-tight text-gray-900 block leading-none">
                        Medi<span className="text-blue-600">Connect</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                        Healthcare Network
                    </span>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {getNavItems().map((item) => (
                    <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        end={toRoot(item.to)}
                        className={({ isActive }) =>
                            `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <div className="flex items-center">
                            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {item.label}
                        </div>
                        {item.badge && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Footer Card */}
            <div className="border-t border-gray-100 p-3 space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="text-xs font-bold text-gray-900 truncate">
                            {user?.full_name || 'User Name'}
                        </div>
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
                            {role === 'admin' ? 'Hospital Admin' : role}
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('sidebar.logout')}
                </Button>
            </div>
        </div>
    );
};

// Helper to determine exact match for root routes
const toRoot = (path: string) => path.split('/').length === 2;

const DashboardLayout: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50/50">
            <Sidebar role={user.role} />
            <main className="flex-1 overflow-y-auto">
                <div className="px-6 sm:px-8 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
