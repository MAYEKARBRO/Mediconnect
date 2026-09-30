import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Users, UserPlus, Trash2, Stethoscope, CheckCircle, Search, Clock, FileText, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HospitalAffiliationService,
    type AffiliationRecord,
    type HospitalPatientView
} from '../../lib/hospitalAffiliations';

interface StaffMember {
    id: string;
    full_name: string;
    role: string;
    employee_id: string;
    contact_number: string;
    is_active: boolean;
}

const STAFF_ROLES = [
    'Nurse', 'Technician', 'Cleaner', 'Ambulance Driver', 'Receptionist', 'Watchman'
];

const StaffManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'doctors' | 'patients' | 'other'>('requests');
    const [selectedStaffRole, setSelectedStaffRole] = useState('Nurse');
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [pendingRequests, setPendingRequests] = useState<AffiliationRecord[]>([]);
    const [affiliatedDoctors, setAffiliatedDoctors] = useState<AffiliationRecord[]>([]);
    const [hospitalPatients, setHospitalPatients] = useState<HospitalPatientView[]>([]);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [celebrationModal, setCelebrationModal] = useState<{ open: boolean; title: string; desc: string }>({
        open: false,
        title: '',
        desc: ''
    });

    // Form State
    const [newStaff, setNewStaff] = useState({
        full_name: '',
        role: 'Nurse',
        employee_id: '',
        contact_number: ''
    });

    useEffect(() => {
        loadData();
    }, [user, activeTab]);

    const loadData = async () => {
        if (!user) return;

        // Fetch hospital affiliations
        const { pendingRequests: pending, affiliatedDoctors: approved } =
            await HospitalAffiliationService.getHospitalAffiliations(user.id);

        setPendingRequests(pending);
        setAffiliatedDoctors(approved);

        // Fetch hospital patients roster
        const patients = await HospitalAffiliationService.getHospitalPatientsRoster(user.id);
        setHospitalPatients(patients);

        // Fetch other internal staff
        fetchStaff(selectedStaffRole);
    };

    const fetchStaff = async (roleFilter?: string) => {
        let query = supabase.from('staff').select('*').eq('is_active', true);
        if (roleFilter && roleFilter !== 'all') {
            query = query.eq('role', roleFilter);
        }
        const { data } = await query;
        if (data) setStaffList(data);
    };

    const handleApproveDoctor = async (record: AffiliationRecord) => {
        if (!user) return;
        await HospitalAffiliationService.reviewRequest(record.id, 'approved', user.id);
        await loadData();
        setCelebrationModal({
            open: true,
            title: `${record.doctor_name} Admitted!`,
            desc: `${record.doctor_name} (${record.doctor_specialization}) is now officially affiliated with your hospital. Their clinical patient roster is now synced with your hospital administration.`
        });
    };

    const handleRejectDoctor = async (record: AffiliationRecord) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to decline ${record.doctor_name}'s affiliation request?`)) return;
        await HospitalAffiliationService.reviewRequest(record.id, 'rejected', user.id);
        await loadData();
    };

    const handleAddStaff = async () => {
        if (!newStaff.full_name || !newStaff.employee_id) return;

        const { error } = await supabase.from('staff').insert([{
            ...newStaff,
            is_active: true,
            hospital_id: user?.id
        }]);

        if (error) {
            alert('Error adding staff: ' + error.message);
        } else {
            setShowAddModal(false);
            const addedRole = newStaff.role;
            setNewStaff({ full_name: '', role: 'Nurse', employee_id: '', contact_number: '' });
            setSelectedStaffRole(addedRole);
            fetchStaff(addedRole);
        }
    };

    const handleRemoveStaff = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        await supabase.from('staff').update({ is_active: false }).eq('id', id);
        fetchStaff(selectedStaffRole);
    };

    // Filter patients
    const filteredPatients = hospitalPatients.filter(p =>
        p.patient_name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.doctor_name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(patientSearchQuery.toLowerCase())
    );

    // Filter doctors
    const filteredDoctors = affiliatedDoctors.filter(d =>
        d.doctor_name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
        d.doctor_specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
        d.department?.toLowerCase().includes(doctorSearchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Hospital Administration Hub
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Doctor Network
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Medical Staff & Doctor Affiliations
                    </h1>
                    <p className="text-sm text-blue-100 max-w-2xl">
                        Manage incoming doctor requests to join your hospital, oversee credentialed physicians, and view clinical patient rosters synced from affiliated doctors.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'other' && (
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md text-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-2" /> Add Hospital Staff
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'requests'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    Doctor Joining Requests
                    {pendingRequests.length > 0 && (
                        <span className="bg-amber-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-extrabold shadow-sm animate-pulse">
                            {pendingRequests.length} New
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('doctors')}
                    className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'doctors'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Stethoscope className="w-4 h-4" />
                    Affiliated Doctors ({affiliatedDoctors.length})
                </button>

                <button
                    onClick={() => setActiveTab('patients')}
                    className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'patients'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    Hospital Patients List ({hospitalPatients.length})
                </button>

                <button
                    onClick={() => setActiveTab('other')}
                    className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'other'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Support & Nursing Staff ({staffList.length})
                </button>
            </div>

            {/* TAB 1: DOCTOR JOINING REQUESTS */}
            {activeTab === 'requests' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    Pending Doctor Applications ({pendingRequests.length})
                                </h3>
                                <p className="text-xs text-gray-500">Review doctors seeking affiliation with your facility</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {pendingRequests.map(doc => (
                                    <motion.div
                                        key={doc.id}
                                        whileHover={{ y: -3 }}
                                        className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                                                    {doc.doctor_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg">{doc.doctor_name}</h4>
                                                    <p className="text-sm text-blue-600 font-semibold">{doc.doctor_specialization}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Applied: {new Date(doc.requested_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                                                Review Pending
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                            <div>
                                                <span className="text-gray-400 block font-semibold uppercase text-[10px]">Medical License</span>
                                                <strong className="text-gray-800">{doc.doctor_license}</strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-semibold uppercase text-[10px]">Experience</span>
                                                <strong className="text-gray-800">{doc.doctor_experience} Years</strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-semibold uppercase text-[10px]">Target Ward</span>
                                                <strong className="text-blue-600">{doc.department || doc.doctor_specialization}</strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-semibold uppercase text-[10px]">OPD Hours</span>
                                                <strong className="text-gray-800">{doc.visiting_hours || 'Flexible'}</strong>
                                            </div>
                                        </div>

                                        {doc.message && (
                                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-gray-700">
                                                <span className="font-semibold text-blue-900 block mb-0.5">Doctor's Cover Note:</span>
                                                "{doc.message}"
                                            </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRejectDoctor(doc)}
                                                className="text-xs text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                                            >
                                                Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApproveDoctor(doc)}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve & Admit to Hospital
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All Doctor Requests Reviewed</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                There are no pending joining requests from doctors right now. When doctors send affiliation requests from their profile section, they will appear here for review.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB 2: AFFILIATED DOCTORS */}
            {activeTab === 'doctors' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search affiliated doctors by name or specialty..."
                                value={doctorSearchQuery}
                                onChange={e => setDoctorSearchQuery(e.target.value)}
                                className="pl-10 rounded-xl"
                            />
                        </div>
                        <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-center">
                            Total Affiliated: {affiliatedDoctors.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredDoctors.map(doc => {
                            const docPatientsCount = hospitalPatients.filter(p => p.doctor_id === doc.doctor_id).length;
                            return (
                                <motion.div
                                    key={doc.id}
                                    whileHover={{ y: -3 }}
                                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                                                    {doc.doctor_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 leading-snug">{doc.doctor_name}</h4>
                                                    <p className="text-xs text-blue-600 font-bold">{doc.doctor_specialization}</p>
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active Practicing Staff
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">License ID:</span>
                                                <strong className="text-gray-800">{doc.doctor_license}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Department:</span>
                                                <strong className="text-gray-800">{doc.department || doc.doctor_specialization}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Hospital Patients:</span>
                                                <strong className="text-blue-600">{docPatientsCount} Patients Under Care</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setPatientSearchQuery(doc.doctor_name);
                                                setActiveTab('patients');
                                            }}
                                            className="w-full text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <Activity className="w-3.5 h-3.5" /> View Doctor's Hospital Patients
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* TAB 3: HOSPITAL PATIENTS LIST ("the data we add as a doctor are visible to hospital") */}
            {activeTab === 'patients' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Feature explanation card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Hospital Integrated Patient Roster</h3>
                                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                    This roster displays clinical data and admitted patients managed by your affiliated doctors. When doctors diagnose or prescribe treatment, records are visible to the hospital administration for streamlined patient care.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by patient name, doctor, diagnosis..."
                                value={patientSearchQuery}
                                onChange={e => setPatientSearchQuery(e.target.value)}
                                className="pl-10 rounded-xl"
                            />
                        </div>
                        {patientSearchQuery && (
                            <Button size="sm" variant="ghost" onClick={() => setPatientSearchQuery('')} className="text-xs text-gray-500">
                                Clear Search
                            </Button>
                        )}
                    </div>

                    {/* Patients Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Patient Name</th>
                                        <th className="px-6 py-4">Attending Doctor</th>
                                        <th className="px-6 py-4">Clinical Diagnosis</th>
                                        <th className="px-6 py-4">Visit Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Prescription</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPatients.map(p => (
                                        <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{p.patient_name}</div>
                                                <div className="text-xs text-gray-400">{p.patient_phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-blue-600">{p.doctor_name}</div>
                                                <div className="text-xs text-gray-500">{p.doctor_specialization}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-800 text-xs font-medium line-clamp-2 max-w-xs">
                                                    {p.diagnosis}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(p.visit_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    p.status === 'admitted'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {p.status === 'admitted' ? 'Admitted / Active' : 'Consult Completed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {p.prescription_url ? (
                                                    <a
                                                        href={p.prescription_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Rx Document
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Clinical Note</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPatients.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                No hospital patient records found matching your query.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TAB 4: SUPPORT & NURSING STAFF */}
            {activeTab === 'other' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex flex-wrap gap-2 pb-2">
                        {STAFF_ROLES.map(role => (
                            <Button
                                key={role}
                                size="sm"
                                variant={selectedStaffRole === role ? 'primary' : 'outline'}
                                onClick={() => {
                                    setSelectedStaffRole(role);
                                    fetchStaff(role);
                                }}
                                className={selectedStaffRole === role ? 'bg-blue-600' : ''}
                            >
                                {role}s
                            </Button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Employee ID</th>
                                    <th className="px-6 py-4">Full Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staffList.map(staff => (
                                    <tr key={staff.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-gray-600 text-xs font-bold">{staff.employee_id}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{staff.full_name}</td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{staff.contact_number}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRemoveStaff(staff.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {staffList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                            No {selectedStaffRole.toLowerCase()}s recorded yet. Click "Add Hospital Staff" above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* MODAL: ADD INTERNAL STAFF */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-blue-100"
                        >
                            <h2 className="text-xl font-bold text-gray-900">Add New Hospital Staff</h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Full Name</label>
                                    <Input value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} placeholder="Staff member name" />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Role</label>
                                    <select
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                    >
                                        {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Employee ID</label>
                                    <Input value={newStaff.employee_id} onChange={e => setNewStaff({ ...newStaff, employee_id: e.target.value })} placeholder="e.g. EMP-9921" />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Contact Number</label>
                                    <Input value={newStaff.contact_number} onChange={e => setNewStaff({ ...newStaff, contact_number: e.target.value })} placeholder="+91 98000 00000" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Add Staff Member</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CELEBRATION MODAL */}
            <AnimatePresence>
                {celebrationModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setCelebrationModal({ open: false, title: '', desc: '' })}
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
                            <h3 className="text-xl font-bold text-gray-900">{celebrationModal.title}</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {celebrationModal.desc}
                            </p>
                            <Button
                                onClick={() => setCelebrationModal({ open: false, title: '', desc: '' })}
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

export default StaffManagement;
