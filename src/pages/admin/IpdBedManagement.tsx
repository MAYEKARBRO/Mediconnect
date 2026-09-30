import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
    BedDouble, Activity, HeartPulse, User, Stethoscope, Utensils,
    ClipboardList, FileText, ArrowRightLeft, LogOut, Plus, Search,
    CheckCircle2, AlertCircle, Clock, Download, RefreshCw,
    Pill, Check, Thermometer, ShieldAlert, Sparkles, Building2,
    CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IpdBedService } from '../../lib/ipdBedManagement';
import type { InpatientBed } from '../../lib/ipdBedManagement';

export const IpdBedManagement = () => {
    const [beds, setBeds] = useState<InpatientBed[]>([]);
    const [selectedWard, setSelectedWard] = useState<string>('All Wards');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);

    // Modals
    const [selectedBedForChart, setSelectedBedForChart] = useState<InpatientBed | null>(null);
    const [chartActiveTab, setChartActiveTab] = useState<'journey' | 'diet_nursing' | 'rounds' | 'discharge'>('journey');

    // ADT Modals
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [activeBedForAction, setActiveBedForAction] = useState<InpatientBed | null>(null);

    // Admission Form
    const [admitForm, setAdmitForm] = useState({
        bedId: '',
        patientName: '',
        age: 45,
        gender: 'Male',
        phone: '',
        doctorName: 'Dr. Om Mayekar',
        diagnosis: '',
        severity: 'stable' as 'stable' | 'moderate' | 'critical' | 'observation'
    });

    // Transfer Form
    const [transferForm, setTransferForm] = useState({
        toBedId: '',
        reason: 'Clinical condition stable, transferred to General Ward for observation'
    });

    // Discharge Form
    const [dischargeForm, setDischargeForm] = useState({
        condition: 'Recovered' as 'Recovered' | 'Improved' | 'Referred',
        hospitalCourse: 'Patient admitted with acute symptoms. Received standard medical therapy and monitoring. Vitals stabilized and symptom resolution achieved.',
        followUp: 'Review in OPD after 7 days. Report immediately in case of fever, severe chest tightness, or respiratory distress.',
        medications: [
            { medicine_name: 'Tab. Amoxicillin-Clavulanate 625mg', dosage: '625 mg', frequency: '1-0-1 (Twice daily after food)', duration: '5 days', instructions: 'Complete full course' },
            { medicine_name: 'Tab. Pantoprazole 40mg', dosage: '40 mg', frequency: '1-0-0 (Morning empty stomach)', duration: '7 days', instructions: 'Take 30 mins before breakfast' },
            { medicine_name: 'Tab. Paracetamol 650mg', dosage: '650 mg', frequency: 'SOS (As needed for pain/fever)', duration: '3 days', instructions: 'Maximum 3 tablets/day' }
        ]
    });

    // New Round Form
    const [roundForm, setRoundForm] = useState({
        doctor_name: 'Dr. Om Mayekar',
        clinical_notes: '',
        treatment_orders: ''
    });

    // New Handover Form
    const [handoverForm, setHandoverForm] = useState({
        shift: 'Evening' as 'Morning' | 'Evening' | 'Night',
        nurse_name: 'Sr. Ananya Rao',
        summary: ''
    });

    // Inline Vitals Edit
    const [isEditingVitals, setIsEditingVitals] = useState(false);
    const [vitalsInput, setVitalsInput] = useState({ bp: '', pulse: 0, spo2: 0, temp: '' });

    // Load data
    useEffect(() => {
        const data = IpdBedService.getBeds();
        setBeds(data);
    }, [refreshTick]);

    const refreshData = () => {
        setRefreshTick(prev => prev + 1);
        if (selectedBedForChart) {
            const updated = IpdBedService.getBeds().find(b => b.id === selectedBedForChart.id);
            if (updated) setSelectedBedForChart(updated);
        }
    };

    // Filter beds
    const filteredBeds = beds.filter(bed => {
        const matchesWard = selectedWard === 'All Wards' || bed.ward === selectedWard;
        const matchesStatus = selectedStatus === 'all' || bed.status === selectedStatus;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            bed.bed_number.toLowerCase().includes(query) ||
            bed.ward.toLowerCase().includes(query) ||
            (bed.patient_name && bed.patient_name.toLowerCase().includes(query)) ||
            (bed.admitting_doctor_name && bed.admitting_doctor_name.toLowerCase().includes(query)) ||
            (bed.diagnosis && bed.diagnosis.toLowerCase().includes(query));
        return matchesWard && matchesStatus && matchesSearch;
    });

    // Metrics
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const cleaningBeds = beds.filter(b => b.status === 'cleaning' || b.status === 'maintenance').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const criticalPatients = beds.filter(b => b.status === 'occupied' && b.severity === 'critical').length;

    // ADT Actions
    const handleQuickAdmitClick = (preselectedBed?: InpatientBed) => {
        if (preselectedBed) {
            setAdmitForm(prev => ({ ...prev, bedId: preselectedBed.id }));
        } else {
            const firstAvail = beds.find(b => b.status === 'available');
            if (firstAvail) setAdmitForm(prev => ({ ...prev, bedId: firstAvail.id }));
        }
        setIsAdmitModalOpen(true);
    };

    const handleAdmitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!admitForm.bedId || !admitForm.patientName) {
            alert('Please select a bed and enter patient name.');
            return;
        }

        const success = IpdBedService.admitDirect({
            bedId: admitForm.bedId,
            patientName: admitForm.patientName,
            age: Number(admitForm.age) || 40,
            gender: admitForm.gender,
            phone: admitForm.phone,
            doctorName: admitForm.doctorName,
            diagnosis: admitForm.diagnosis || 'Acute Medical Admission',
            severity: admitForm.severity
        });

        if (success) {
            setIsAdmitModalOpen(false);
            setAdmitForm({
                bedId: '',
                patientName: '',
                age: 45,
                gender: 'Male',
                phone: '',
                doctorName: 'Dr. Om Mayekar',
                diagnosis: '',
                severity: 'stable'
            });
            refreshData();
        }
    };

    const handleTransferClick = (bed: InpatientBed) => {
        setActiveBedForAction(bed);
        const avail = beds.filter(b => b.status === 'available' && b.id !== bed.id);
        if (avail.length > 0) {
            setTransferForm(prev => ({ ...prev, toBedId: avail[0].id }));
        }
        setIsTransferModalOpen(true);
    };

    const handleTransferSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBedForAction || !transferForm.toBedId) return;

        const success = IpdBedService.transferBed(activeBedForAction.id, transferForm.toBedId, transferForm.reason);
        if (success) {
            alert(`Patient successfully transferred to new bed.`);
            setIsTransferModalOpen(false);
            setActiveBedForAction(null);
            refreshData();
        } else {
            alert('Failed to transfer bed. Destination bed might be occupied.');
        }
    };

    const handleDischargeClick = (bed: InpatientBed) => {
        setActiveBedForAction(bed);
        setDischargeForm(prev => ({
            ...prev,
            hospitalCourse: `Patient admitted to ${bed.ward} under ${bed.admitting_doctor_name || 'Medical Team'} for ${bed.diagnosis || 'inpatient treatment'}. Vital signs stabilized with positive therapeutic response.`
        }));
        setIsDischargeModalOpen(true);
    };

    const handleDischargeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBedForAction) return;

        const success = IpdBedService.dischargePatient(activeBedForAction.id, {
            condition: dischargeForm.condition,
            hospitalCourse: dischargeForm.hospitalCourse,
            medications: dischargeForm.medications,
            followUp: dischargeForm.followUp
        });

        if (success) {
            alert(`Patient discharged successfully. Bed ${activeBedForAction.bed_number} has been queued for sanitization.`);
            setIsDischargeModalOpen(false);
            if (selectedBedForChart?.id === activeBedForAction.id) {
                setSelectedBedForChart(null);
            }
            setActiveBedForAction(null);
            refreshData();
        }
    };

    const handleMarkBedReady = (bedId: string) => {
        IpdBedService.setBedStatus(bedId, 'available');
        refreshData();
    };

    // Inpatient Chart Actions
    const openChart = (bed: InpatientBed) => {
        setSelectedBedForChart(bed);
        setChartActiveTab('journey');
        if (bed.vitals) {
            setVitalsInput({
                bp: bed.vitals.bp,
                pulse: bed.vitals.pulse,
                spo2: bed.vitals.spo2,
                temp: bed.vitals.temp
            });
        }
    };

    const handleSaveVitals = () => {
        if (!selectedBedForChart) return;
        IpdBedService.updateVitals(selectedBedForChart.id, {
            bp: vitalsInput.bp || '120/80',
            pulse: Number(vitalsInput.pulse) || 75,
            spo2: Number(vitalsInput.spo2) || 98,
            temp: vitalsInput.temp || '98.6°F'
        });
        setIsEditingVitals(false);
        refreshData();
    };

    const handleToggleMeal = (mealKey: 'breakfast' | 'lunch' | 'dinner') => {
        if (!selectedBedForChart?.dietary_plan) return;
        const currentMeals = selectedBedForChart.dietary_plan.meals;
        const updated = {
            ...selectedBedForChart.dietary_plan,
            meals: {
                ...currentMeals,
                [mealKey]: !currentMeals[mealKey]
            }
        };
        IpdBedService.updateDietary(selectedBedForChart.id, updated);
        refreshData();
    };

    const handleAddRound = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBedForChart || !roundForm.clinical_notes) return;

        IpdBedService.addDoctorRound(selectedBedForChart.id, {
            doctor_name: roundForm.doctor_name,
            clinical_notes: roundForm.clinical_notes,
            treatment_orders: roundForm.treatment_orders || 'Continue prescribed protocol.'
        });

        setRoundForm({
            doctor_name: roundForm.doctor_name,
            clinical_notes: '',
            treatment_orders: ''
        });
        refreshData();
    };

    const handleAddHandover = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBedForChart || !handoverForm.summary) return;

        IpdBedService.addHandoverNote(selectedBedForChart.id, {
            shift: handoverForm.shift,
            nurse_name: handoverForm.nurse_name,
            summary: handoverForm.summary
        });

        setHandoverForm({
            shift: 'Evening',
            nurse_name: handoverForm.nurse_name,
            summary: ''
        });
        refreshData();
    };

    // PDF Reports
    const handleDownloadCensus = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(30, 64, 175);
        doc.text('MediConnect Hospital - Inpatient Census & Bed Board', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Beds: ${totalBeds} | Occupancy: ${occupancyRate}%`, 14, 28);

        const tableData = beds.map(b => [
            b.bed_number,
            b.ward,
            b.status.toUpperCase(),
            b.patient_name || 'Vacant',
            b.diagnosis || '-',
            b.admitting_doctor_name || '-',
            b.severity?.toUpperCase() || '-'
        ]);

        autoTable(doc, {
            startY: 34,
            head: [['Bed No', 'Ward', 'Status', 'Patient', 'Diagnosis', 'Admitting Doctor', 'Severity']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
        });

        doc.save(`IPD_Census_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handleDownloadDischargePDF = (bed: InpatientBed) => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text('MEDICONNECT HOSPITAL & RESEARCH CENTER', 14, 18);
        doc.setFontSize(11);
        doc.text('OFFICIAL INPATIENT DISCHARGE SUMMARY & MEDICATION RECONCILIATION', 14, 25);

        // Patient Details Card
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(11);
        doc.text(`Patient Name: ${bed.patient_name || 'N/A'}`, 14, 40);
        doc.text(`Age / Gender: ${bed.patient_age || 40} Yrs / ${bed.patient_gender || 'Male'}`, 14, 46);
        doc.text(`Bed & Ward: ${bed.bed_number} (${bed.ward})`, 14, 52);
        doc.text(`Admitted On: ${bed.admitted_at ? new Date(bed.admitted_at).toLocaleDateString() : 'N/A'}`, 120, 40);
        doc.text(`Discharge Date: ${new Date().toLocaleDateString()}`, 120, 46);
        doc.text(`Consultant: ${bed.admitting_doctor_name || 'Dr. Medical Officer'}`, 120, 52);

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 57, 196, 57);

        // Clinical Course
        doc.setFontSize(13);
        doc.setTextColor(30, 64, 175);
        doc.text('Final Diagnosis & Clinical Hospital Course', 14, 66);

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`Diagnosis: ${bed.diagnosis || 'Acute Condition Under Management'}`, 14, 73);

        const hospitalCourse = bed.discharge_summary?.hospital_course ||
            'Patient received inpatient care, IV therapeutics, continuous telemetry and multidisciplinary supervision. Vitals stabilized satisfactorily.';
        const splitCourse = doc.splitTextToSize(`Hospital Course: ${hospitalCourse}`, 180);
        doc.text(splitCourse, 14, 80);

        // Discharge Condition
        const condY = 80 + splitCourse.length * 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text(`Condition at Discharge: ${bed.discharge_summary?.condition_at_discharge || 'Improved / Stable'}`, 14, condY);

        // Medication Reconciliation Table
        const medData = (bed.discharge_summary?.medication_reconciliation || dischargeForm.medications).map(m => [
            m.medicine_name,
            m.dosage,
            m.frequency,
            m.duration,
            m.instructions
        ]);

        autoTable(doc, {
            startY: condY + 8,
            head: [['Medication Name', 'Dosage', 'Frequency', 'Duration', 'Special Instructions']],
            body: medData,
            theme: 'striped',
            headStyles: { fillColor: [30, 64, 175] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 14;
        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175);
        doc.text('Follow-up Care & Emergency Instructions:', 14, finalY);

        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        const followUp = bed.discharge_summary?.follow_up_instructions || dischargeForm.followUp;
        const splitFollow = doc.splitTextToSize(followUp, 180);
        doc.text(splitFollow, 14, finalY + 6);

        // Signatures
        doc.text('_______________________________', 14, finalY + 30);
        doc.text('Attending Physician Signature', 14, finalY + 35);

        doc.text('_______________________________', 140, finalY + 30);
        doc.text('Hospital Medical Superintendent', 140, finalY + 35);

        doc.save(`Discharge_Summary_${(bed.patient_name || 'Patient').replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" /> Hospital Administration
                        </span>
                        <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Live Inpatient Unit
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <BedDouble className="h-8 w-8 text-blue-200" />
                        IPD & Inpatient Bed Management
                    </h1>
                    <p className="text-blue-100/90 text-sm max-w-2xl mt-1">
                        Visual ward allocation, Admission / Discharge / Transfer (ADT), patient journey tracking,
                        dietary care plans, doctor rounds, and medication reconciliation.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        onClick={() => handleQuickAdmitClick()}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Direct Admit (ADT)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownloadCensus}
                        className="bg-blue-600/30 border-blue-400/40 text-white hover:bg-blue-600/50 flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" /> Census PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={refreshData}
                        className="bg-blue-600/30 border-blue-400/40 text-white hover:bg-blue-600/50 p-2.5"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Total Operational Beds</span>
                        <BedDouble className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{totalBeds}</div>
                    <div className="text-xs text-slate-500 mt-1">5 Wards & Units</div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Occupancy Rate</span>
                        <Activity className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{occupancyRate}%</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${occupancyRate > 85 ? 'bg-rose-500' : 'bg-blue-600'}`}
                            style={{ width: `${occupancyRate}%` }}
                        />
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Occupied Beds</span>
                        <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{occupiedBeds}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        {criticalPatients > 0 ? (
                            <span className="text-rose-600 font-medium flex items-center gap-0.5">
                                <AlertCircle className="h-3 w-3" /> {criticalPatients} Critical
                            </span>
                        ) : (
                            <span className="text-emerald-600">All Patients Stable</span>
                        )}
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Available Beds</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">{availableBeds}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">Ready for Admission</div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Turnover / Cleaning</span>
                        <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{cleaningBeds}</div>
                    <div className="text-xs text-amber-700 mt-1">Sanitization in Progress</div>
                </Card>
            </div>

            {/* Navigation & Filter Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
                {/* Ward Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['All Wards', 'ICU', 'General Medical', 'Surgical Post-Op', 'Maternity', 'Emergency Bay'].map(ward => {
                        const countInWard = ward === 'All Wards' ? beds.length : beds.filter(b => b.ward === ward).length;
                        const occupiedInWard = ward === 'All Wards' ? occupiedBeds : beds.filter(b => b.ward === ward && b.status === 'occupied').length;
                        return (
                            <button
                                key={ward}
                                onClick={() => setSelectedWard(ward)}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${selectedWard === ward
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                <span>{ward}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedWard === ward
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200'
                                    }`}>
                                    {occupiedInWard}/{countInWard}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search patient, bed no, doctor, diagnosis..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs sm:text-sm h-9 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto">
                        {[
                            { id: 'all', label: 'All Beds' },
                            { id: 'occupied', label: 'Occupied' },
                            { id: 'available', label: 'Available' },
                            { id: 'cleaning', label: 'Cleaning' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => setSelectedStatus(st.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedStatus === st.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visual Bed Board Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {filteredBeds.map(bed => {
                        const isOccupied = bed.status === 'occupied';
                        const isCleaning = bed.status === 'cleaning' || bed.status === 'maintenance';
                        const isAvailable = bed.status === 'available';

                        return (
                            <motion.div
                                key={bed.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`relative rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden bg-white ${isOccupied
                                    ? bed.severity === 'critical'
                                        ? 'border-rose-300 ring-1 ring-rose-200/70 hover:shadow-md'
                                        : 'border-blue-200 hover:border-blue-300 hover:shadow-md'
                                    : isCleaning
                                        ? 'border-amber-200 bg-amber-50/20'
                                        : 'border-emerald-200 bg-emerald-50/15 hover:border-emerald-300'
                                    }`}
                            >
                                {/* Top Bed Header */}
                                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${isOccupied
                                            ? bed.severity === 'critical'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-blue-100 text-blue-700'
                                            : isCleaning
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            <BedDouble className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{bed.bed_number}</div>
                                            <div className="text-[11px] text-slate-500">{bed.ward} • {bed.floor}</div>
                                        </div>
                                    </div>

                                    {/* Status Pill */}
                                    <div>
                                        {isOccupied && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${bed.severity === 'critical'
                                                ? 'bg-rose-100 text-rose-700 animate-pulse'
                                                : bed.severity === 'moderate'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${bed.severity === 'critical' ? 'bg-rose-600' : 'bg-blue-600'}`} />
                                                {bed.severity || 'Occupied'}
                                            </span>
                                        )}
                                        {isAvailable && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                Available
                                            </span>
                                        )}
                                        {isCleaning && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700">
                                                <Sparkles className="h-2.5 w-2.5" />
                                                Cleaning
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="p-3.5 space-y-3 flex-1">
                                    {isOccupied ? (
                                        <>
                                            {/* Patient Primary Details */}
                                            <div>
                                                <div className="flex items-start justify-between gap-1">
                                                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{bed.patient_name}</h3>
                                                    <span className="text-xs text-slate-500 font-medium shrink-0">
                                                        {bed.patient_age ? `${bed.patient_age}y` : ''} {bed.patient_gender ? `• ${bed.patient_gender}` : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 font-medium">
                                                    {bed.diagnosis}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-medium mt-1">
                                                    <Stethoscope className="h-3 w-3" />
                                                    <span className="truncate">{bed.admitting_doctor_name || 'Dr. Medical Officer'}</span>
                                                </div>
                                            </div>

                                            {/* Live Vitals Ribbon */}
                                            {bed.vitals && (
                                                <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 font-semibold uppercase">BP</div>
                                                        <div className="text-xs font-bold text-slate-800">{bed.vitals.bp}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 font-semibold uppercase">Pulse</div>
                                                        <div className="text-xs font-bold text-slate-800">{bed.vitals.pulse}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 font-semibold uppercase">SpO2</div>
                                                        <div className="text-xs font-bold text-blue-700">{bed.vitals.spo2}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-500 font-semibold uppercase">Temp</div>
                                                        <div className="text-xs font-bold text-slate-800">{bed.vitals.temp}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stay Duration */}
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    Admitted: {bed.admitted_at ? new Date(bed.admitted_at).toLocaleDateString() : 'Today'}
                                                </span>
                                                {bed.dietary_plan && (
                                                    <span className="flex items-center gap-1 text-slate-600 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                                        <Utensils className="h-2.5 w-2.5 text-amber-600" /> Diet Active
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    ) : isAvailable ? (
                                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-800">Bed Ready for Inpatient</div>
                                            <p className="text-[11px] text-slate-500 max-w-[180px]">
                                                Sanitized and prepared for admission from OPD or Emergency.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Sparkles className="h-5 w-5 animate-pulse" />
                                            </div>
                                            <div className="text-xs font-semibold text-amber-800">Disinfected & Turnover</div>
                                            <p className="text-[11px] text-slate-500 max-w-[180px]">
                                                Housekeeping sanitization in progress.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Quick Actions */}
                                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                    {isOccupied ? (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => openChart(bed)}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8"
                                            >
                                                <FileText className="h-3.5 w-3.5 mr-1" /> Chart
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleTransferClick(bed)}
                                                className="bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs h-8 px-2"
                                                title="Transfer Bed"
                                            >
                                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDischargeClick(bed)}
                                                className="bg-white border-rose-200 hover:bg-rose-50 text-rose-700 text-xs h-8 px-2"
                                                title="Discharge Patient"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    ) : isAvailable ? (
                                        <Button
                                            size="sm"
                                            onClick={() => handleQuickAdmitClick(bed)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-8 flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Admit Patient Here
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleMarkBedReady(bed.id)}
                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium h-8 flex items-center justify-center gap-1.5"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Mark Clean & Ready
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredBeds.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <BedDouble className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="font-semibold text-slate-700 text-lg">No Inpatient Beds Matched Filter</h3>
                    <p className="text-sm text-slate-500 mt-1">Try selecting another ward or clearing your search term.</p>
                </div>
            )}

            {/* ======================================================== */}
            {/* INPATIENT CHART MODAL (COMPREHENSIVE CLINICAL CARE VIEW) */}
            {/* ======================================================== */}
            {selectedBedForChart && (
                <Modal
                    isOpen={!!selectedBedForChart}
                    onClose={() => setSelectedBedForChart(null)}
                    title={`Inpatient Medical Chart - ${selectedBedForChart.patient_name || 'Inpatient'}`}
                    maxWidth="max-w-5xl"
                >
                    <div className="space-y-5">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                        {selectedBedForChart.bed_number} • {selectedBedForChart.ward}
                                    </span>
                                    <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">
                                        {selectedBedForChart.floor}
                                    </span>
                                    <span className="bg-emerald-400/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase">
                                        {selectedBedForChart.severity || 'Stable'}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold mt-1 text-white">{selectedBedForChart.patient_name}</h2>
                                <p className="text-blue-100 text-xs mt-0.5">
                                    {selectedBedForChart.patient_age} yrs • {selectedBedForChart.patient_gender} • Ph: {selectedBedForChart.patient_phone || 'N/A'} • Admitted: {selectedBedForChart.admitted_at ? new Date(selectedBedForChart.admitted_at).toLocaleDateString() : 'Today'}
                                </p>
                                <p className="text-blue-200 text-xs font-medium mt-1 flex items-center gap-1.5">
                                    <Stethoscope className="h-3.5 w-3.5" /> Admitting Physician: {selectedBedForChart.admitting_doctor_name || 'Dr. Medical Officer'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleDownloadDischargePDF(selectedBedForChart)}
                                    className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold shadow-sm"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1" /> Discharge Summary PDF
                                </Button>
                            </div>
                        </div>

                        {/* Chart Tabs */}
                        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
                            <button
                                onClick={() => setChartActiveTab('journey')}
                                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${chartActiveTab === 'journey'
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Activity className="h-4 w-4" /> Patient Journey & Vitals
                            </button>
                            <button
                                onClick={() => setChartActiveTab('diet_nursing')}
                                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${chartActiveTab === 'diet_nursing'
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Utensils className="h-4 w-4" /> Dietary & Nursing Care Plan
                            </button>
                            <button
                                onClick={() => setChartActiveTab('rounds')}
                                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${chartActiveTab === 'rounds'
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <ClipboardList className="h-4 w-4" /> Doctor Rounds & Handover Notes
                            </button>
                            <button
                                onClick={() => setChartActiveTab('discharge')}
                                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${chartActiveTab === 'discharge'
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <FileText className="h-4 w-4" /> Discharge & Med Reconciliation
                            </button>
                        </div>

                        {/* TAB 1: PATIENT JOURNEY & VITALS */}
                        {chartActiveTab === 'journey' && (
                            <div className="space-y-6">
                                {/* 5-Stage Patient Journey Tracker */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <HeartPulse className="h-4 w-4 text-blue-600" />
                                        Inpatient Clinical Journey & Milestone Tracking
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                        {[
                                            { step: '1', title: 'Admitted & Triaged', desc: 'OPD/ER bed assignment complete', active: true, done: true },
                                            { step: '2', title: 'Diagnostic Workup', desc: 'Labs, Imaging & Biomarkers', active: true, done: true },
                                            { step: '3', title: 'Active Inpatient Care', desc: 'Therapy, infusions & rounds', active: true, done: selectedBedForChart.severity !== 'critical' },
                                            { step: '4', title: 'Recovery & Ambulation', desc: 'Oral switch & vitals stable', active: selectedBedForChart.severity === 'stable', done: false },
                                            { step: '5', title: 'Fit for Discharge', desc: 'Medication reconciliation', active: false, done: false }
                                        ].map((stage, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-lg border text-left transition-all ${stage.done
                                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                                    : stage.active
                                                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                                                        : 'bg-white border-slate-200 text-slate-400'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center ${stage.done ? 'bg-emerald-600 text-white' : stage.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        {stage.step}
                                                    </span>
                                                    {stage.done && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                                </div>
                                                <div className="font-semibold text-xs">{stage.title}</div>
                                                <div className="text-[10px] opacity-80 mt-0.5">{stage.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Live Vitals Management */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Thermometer className="h-4 w-4 text-blue-600" /> Current Clinical Vitals
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsEditingVitals(!isEditingVitals)}
                                            className="text-xs h-7"
                                        >
                                            {isEditingVitals ? 'Cancel' : 'Update Vitals'}
                                        </Button>
                                    </div>

                                    {isEditingVitals ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600">BP (mmHg)</label>
                                                <Input
                                                    value={vitalsInput.bp}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalsInput(prev => ({ ...prev, bp: e.target.value }))}
                                                    placeholder="120/80"
                                                    className="h-8 text-xs bg-white mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600">Heart Rate (bpm)</label>
                                                <Input
                                                    type="number"
                                                    value={vitalsInput.pulse}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalsInput(prev => ({ ...prev, pulse: Number(e.target.value) }))}
                                                    placeholder="75"
                                                    className="h-8 text-xs bg-white mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600">SpO2 (%)</label>
                                                <Input
                                                    type="number"
                                                    value={vitalsInput.spo2}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalsInput(prev => ({ ...prev, spo2: Number(e.target.value) }))}
                                                    placeholder="98"
                                                    className="h-8 text-xs bg-white mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600">Temperature</label>
                                                <Input
                                                    value={vitalsInput.temp}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalsInput(prev => ({ ...prev, temp: e.target.value }))}
                                                    placeholder="98.6°F"
                                                    className="h-8 text-xs bg-white mt-1"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 pt-2">
                                                <Button size="sm" onClick={handleSaveVitals} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                                    Save Vitals
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                                                <span className="text-[11px] font-semibold text-blue-800">Blood Pressure</span>
                                                <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedBedForChart.vitals?.bp || '120/80'}</div>
                                                <span className="text-[10px] text-slate-500">mmHg</span>
                                            </div>
                                            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-center">
                                                <span className="text-[11px] font-semibold text-rose-800">Pulse / Heart Rate</span>
                                                <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedBedForChart.vitals?.pulse || 76}</div>
                                                <span className="text-[10px] text-slate-500">beats / min</span>
                                            </div>
                                            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                                                <span className="text-[11px] font-semibold text-emerald-800">Oxygen Saturation</span>
                                                <div className="text-lg font-bold text-emerald-700 mt-0.5">{selectedBedForChart.vitals?.spo2 || 98}%</div>
                                                <span className="text-[10px] text-slate-500">Room Air / Nasal</span>
                                            </div>
                                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                                                <span className="text-[11px] font-semibold text-amber-800">Body Temp</span>
                                                <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedBedForChart.vitals?.temp || '98.6°F'}</div>
                                                <span className="text-[10px] text-slate-500">Normothermic</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Clinical Severity Adjuster */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                            <ShieldAlert className="h-4 w-4 text-indigo-600" />
                                            Inpatient Severity Status:
                                        </div>
                                        <p className="text-[11px] text-slate-500">Adjust clinical tier to automatically prioritize nursing alerts.</p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {(['stable', 'moderate', 'critical', 'observation'] as const).map(sev => (
                                            <button
                                                key={sev}
                                                onClick={() => {
                                                    IpdBedService.updateSeverity(selectedBedForChart.id, sev);
                                                    refreshData();
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${selectedBedForChart.severity === sev
                                                    ? sev === 'critical' ? 'bg-rose-600 text-white' : sev === 'moderate' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {sev}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DIETARY & NURSING CARE PLAN */}
                        {chartActiveTab === 'diet_nursing' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Dietary Management */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Utensils className="h-4 w-4 text-amber-600" /> Dietary Management & Nutrition
                                        </h4>
                                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                            Kitchen Synced
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Prescribed Diet Type</label>
                                            <div className="font-bold text-slate-800 text-sm mt-0.5">
                                                {selectedBedForChart.dietary_plan?.diet_type || 'General Inpatient Regular'}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Special Dietary Instructions</label>
                                            <div className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 mt-0.5">
                                                {selectedBedForChart.dietary_plan?.instructions || 'Standard balanced nutrition with adequate hydration.'}
                                            </div>
                                        </div>

                                        {/* Meal Service Check-off */}
                                        <div className="pt-2">
                                            <label className="text-xs font-semibold text-slate-700 mb-2 block">Today's Meal Service Status</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { key: 'breakfast' as const, label: 'Breakfast' },
                                                    { key: 'lunch' as const, label: 'Lunch' },
                                                    { key: 'dinner' as const, label: 'Dinner' }
                                                ].map(m => {
                                                    const isChecked = selectedBedForChart.dietary_plan?.meals[m.key];
                                                    return (
                                                        <button
                                                            key={m.key}
                                                            onClick={() => handleToggleMeal(m.key)}
                                                            className={`p-2.5 rounded-lg border text-center transition-all ${isChecked
                                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                                }`}
                                                        >
                                                            <div className="text-xs">{m.label}</div>
                                                            <div className="text-[10px] mt-1 flex items-center justify-center gap-1">
                                                                {isChecked ? (
                                                                    <><CheckCircle className="h-3 w-3 text-emerald-600" /> Served</>
                                                                ) : (
                                                                    <>Pending</>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1.5 italic text-center">Click a meal box to toggle served / pending status</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nursing Care Plan */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-blue-600" /> Nursing Care Plan
                                        </h4>
                                        <span className="text-[11px] text-slate-500">
                                            Nurse: <strong className="text-slate-700">{selectedBedForChart.nursing_care_plan?.nurse_in_charge || 'Duty Nurse'}</strong>
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Active Shift Goals</label>
                                            <div className="space-y-1.5 mt-1.5">
                                                {(selectedBedForChart.nursing_care_plan?.care_goals || [
                                                    'Maintain continuous vital signs monitoring',
                                                    'Ensure timely antibiotic administration',
                                                    'Check peripheral IV cannula site for phlebitis'
                                                ]).map((goal, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-700">
                                                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                                        <span>{goal}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Nurse Shift Handover Notes</label>
                                            <div className="text-xs text-slate-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 mt-1">
                                                {selectedBedForChart.nursing_care_plan?.shift_notes || 'Patient comfortable, vitals checked regularly. No complaints of pain.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DOCTOR ROUNDS & HANDOVER NOTES */}
                        {chartActiveTab === 'rounds' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Doctor Rounds Management */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-blue-600" /> Doctor Daily Rounds Log
                                        </h4>
                                    </div>

                                    {/* Add Round Form */}
                                    <form onSubmit={handleAddRound} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                                        <div className="font-semibold text-xs text-slate-700">Record Round Note</div>
                                        <Input
                                            value={roundForm.doctor_name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoundForm(prev => ({ ...prev, doctor_name: e.target.value }))}
                                            placeholder="Doctor Name (e.g. Dr. Om Mayekar)"
                                            className="text-xs h-8 bg-white"
                                            required
                                        />
                                        <textarea
                                            value={roundForm.clinical_notes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoundForm(prev => ({ ...prev, clinical_notes: e.target.value }))}
                                            placeholder="Clinical findings, examination, progress notes..."
                                            className="w-full rounded-md border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            rows={2}
                                            required
                                        />
                                        <textarea
                                            value={roundForm.treatment_orders}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoundForm(prev => ({ ...prev, treatment_orders: e.target.value }))}
                                            placeholder="New treatment orders, medication dosage adjustments..."
                                            className="w-full rounded-md border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            rows={2}
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                                                Add Round Entry
                                            </Button>
                                        </div>
                                    </form>

                                    {/* Rounds History */}
                                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                        {(selectedBedForChart.doctor_rounds || []).map((round, idx) => (
                                            <div key={round.id || idx} className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-800">{round.doctor_name}</span>
                                                    <span className="text-[11px] text-slate-400">{new Date(round.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                                    <strong>Findings:</strong> {round.clinical_notes}
                                                </p>
                                                {round.treatment_orders && (
                                                    <p className="text-xs text-blue-900 bg-blue-50/70 p-2 rounded border border-blue-100">
                                                        <strong>Orders:</strong> {round.treatment_orders}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shift Handover Notes */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-indigo-600" /> Nursing Shift Handovers
                                        </h4>
                                    </div>

                                    {/* Add Handover Form */}
                                    <form onSubmit={handleAddHandover} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                                        <div className="font-semibold text-xs text-slate-700">Log Shift Handover</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={handoverForm.shift}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHandoverForm(prev => ({ ...prev, shift: e.target.value as any }))}
                                                className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs"
                                            >
                                                <option value="Morning">Morning Shift (07:00 - 15:00)</option>
                                                <option value="Evening">Evening Shift (15:00 - 23:00)</option>
                                                <option value="Night">Night Shift (23:00 - 07:00)</option>
                                            </select>
                                            <Input
                                                value={handoverForm.nurse_name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHandoverForm(prev => ({ ...prev, nurse_name: e.target.value }))}
                                                placeholder="Handing Over Nurse"
                                                className="text-xs h-8 bg-white"
                                                required
                                            />
                                        </div>
                                        <textarea
                                            value={handoverForm.summary}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHandoverForm(prev => ({ ...prev, summary: e.target.value }))}
                                            placeholder="Shift events, critical alerts, pending lab tests, handover remarks..."
                                            className="w-full rounded-md border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            rows={3}
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                                                Save Handover Note
                                            </Button>
                                        </div>
                                    </form>

                                    {/* Handover List */}
                                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                        {(selectedBedForChart.handover_notes || []).map((hnd, idx) => (
                                            <div key={hnd.id || idx} className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-slate-800">
                                                        {hnd.nurse_name} ({hnd.shift} Shift)
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">{new Date(hnd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                                    {hnd.summary}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DISCHARGE & MEDICATION RECONCILIATION */}
                        {chartActiveTab === 'discharge' && (
                            <div className="space-y-5">
                                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            <Pill className="h-4 w-4 text-blue-600" />
                                            Discharge Preparation & Medication Reconciliation
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Cross-check in-hospital treatments with take-home prescriptions to prevent adverse drug interactions.
                                        </p>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => handleDischargeClick(selectedBedForChart)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
                                    >
                                        <LogOut className="h-3.5 w-3.5 mr-1" /> Proceed to Patient Discharge
                                    </Button>
                                </div>

                                {/* Reconciled Medications Table */}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800">
                                        Reconciled Take-Home Prescriptions & Medication Orders
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b">
                                                <tr>
                                                    <th className="px-3.5 py-2.5">Medication Name</th>
                                                    <th className="px-3.5 py-2.5">Dosage</th>
                                                    <th className="px-3.5 py-2.5">Frequency</th>
                                                    <th className="px-3.5 py-2.5">Duration</th>
                                                    <th className="px-3.5 py-2.5">Clinical Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {dischargeForm.medications.map((med, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{med.medicine_name}</td>
                                                        <td className="px-3.5 py-2.5 text-slate-700">{med.dosage}</td>
                                                        <td className="px-3.5 py-2.5 text-slate-700">{med.frequency}</td>
                                                        <td className="px-3.5 py-2.5 text-slate-700">{med.duration}</td>
                                                        <td className="px-3.5 py-2.5 text-slate-500">{med.instructions}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                    <div className="font-semibold text-xs text-slate-700">Standard Post-Discharge Follow-Up Protocol</div>
                                    <p className="text-xs text-slate-600">
                                        {dischargeForm.followUp}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* ======================================================== */}
            {/* ADT MODAL 1: DIRECT ADMISSION */}
            {/* ======================================================== */}
            <Modal
                isOpen={isAdmitModalOpen}
                onClose={() => setIsAdmitModalOpen(false)}
                title="Direct Inpatient Admission (ADT)"
            >
                <form onSubmit={handleAdmitSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Select Available Bed</label>
                        <select
                            value={admitForm.bedId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAdmitForm(prev => ({ ...prev, bedId: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a bed...</option>
                            {beds.filter(b => b.status === 'available').map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.bed_number} — {b.ward} ({b.floor})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Patient Full Name</label>
                        <Input
                            value={admitForm.patientName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmitForm(prev => ({ ...prev, patientName: e.target.value }))}
                            placeholder="e.g. Ramesh Kumar"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Age</label>
                            <Input
                                type="number"
                                value={admitForm.age}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmitForm(prev => ({ ...prev, age: Number(e.target.value) }))}
                                placeholder="45"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Gender</label>
                            <select
                                value={admitForm.gender}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAdmitForm(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Contact Phone</label>
                        <Input
                            value={admitForm.phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmitForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Admitting Doctor</label>
                        <Input
                            value={admitForm.doctorName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmitForm(prev => ({ ...prev, doctorName: e.target.value }))}
                            placeholder="Dr. Om Mayekar"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Provisional Diagnosis</label>
                        <textarea
                            value={admitForm.diagnosis}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdmitForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                            rows={2}
                            placeholder="e.g. Acute exacerbation of COPD, Bilateral Pneumonia..."
                            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Clinical Severity</label>
                        <select
                            value={admitForm.severity}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAdmitForm(prev => ({ ...prev, severity: e.target.value as any }))}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        >
                            <option value="stable">Stable (Routine care)</option>
                            <option value="moderate">Moderate (Frequent monitoring)</option>
                            <option value="critical">Critical (ICU / Telemetry)</option>
                            <option value="observation">Observation</option>
                        </select>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsAdmitModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Complete Admission
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* ADT MODAL 2: BED TRANSFER */}
            {/* ======================================================== */}
            <Modal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                title={`Transfer Patient — ${activeBedForAction?.patient_name || ''}`}
            >
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                        <strong>Current Location:</strong> Bed {activeBedForAction?.bed_number} ({activeBedForAction?.ward})
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Target Transfer Bed</label>
                        <select
                            value={transferForm.toBedId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTransferForm(prev => ({ ...prev, toBedId: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select destination bed...</option>
                            {beds
                                .filter(b => b.status === 'available' && b.id !== activeBedForAction?.id)
                                .map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.bed_number} — {b.ward} ({b.floor})
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Clinical Reason for Transfer</label>
                        <textarea
                            value={transferForm.reason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                            rows={3}
                            placeholder="e.g. Condition stabilized, shifted from ICU to General Ward"
                            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsTransferModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Execute Transfer
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* ADT MODAL 3: DISCHARGE & SUMMARY */}
            {/* ======================================================== */}
            <Modal
                isOpen={isDischargeModalOpen}
                onClose={() => setIsDischargeModalOpen(false)}
                title={`Discharge & Summary — ${activeBedForAction?.patient_name || ''}`}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleDischargeSubmit} className="space-y-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
                        <strong>Notice:</strong> Finalizing discharge will liberate Bed <strong>{activeBedForAction?.bed_number}</strong> and mark it for housekeeping disinfection.
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Condition at Discharge</label>
                        <select
                            value={dischargeForm.condition}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDischargeForm(prev => ({ ...prev, condition: e.target.value as any }))}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        >
                            <option value="Recovered">Recovered (Full clinical recovery)</option>
                            <option value="Improved">Improved (Stable for home care)</option>
                            <option value="Referred">Referred to Higher Specialty Center</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Hospital Course Summary</label>
                        <textarea
                            value={dischargeForm.hospitalCourse}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDischargeForm(prev => ({ ...prev, hospitalCourse: e.target.value }))}
                            rows={3}
                            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Follow-Up Care Instructions</label>
                        <textarea
                            value={dischargeForm.followUp}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDischargeForm(prev => ({ ...prev, followUp: e.target.value }))}
                            rows={2}
                            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="pt-3 flex justify-between items-center border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => activeBedForAction && handleDownloadDischargePDF(activeBedForAction)}
                            className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                        >
                            <Download className="h-3.5 w-3.5 mr-1" /> Preview Discharge PDF
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsDischargeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                                Confirm Discharge
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default IpdBedManagement;
