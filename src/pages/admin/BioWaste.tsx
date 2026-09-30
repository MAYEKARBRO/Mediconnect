import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    Trash2, Plus, Search, Truck, Clock,
    FileText, CheckCircle, Scale, BookOpen, Download,
    X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BioWasteEntry {
    id: string;
    barcode: string;
    category: 'yellow' | 'red' | 'white' | 'blue';
    weight_kg: number;
    department: string;
    logged_by: string;
    description: string;
    logged_at: string;
    status: 'in_store' | 'dispatched';
    manifest_id?: string;
    dispatched_at?: string;
}

export interface PickupManifest {
    id: string;
    manifest_number: string;
    vendor_name: string;
    vehicle_number: string;
    driver_name: string;
    total_bags: number;
    total_weight_kg: number;
    pickup_time: string;
    status: 'completed' | 'in_transit';
}

const STORAGE_KEY = 'mediconnect_biowaste_entries_v2';
const MANIFESTS_KEY = 'mediconnect_biowaste_manifests_v2';

const INITIAL_ENTRIES: BioWasteEntry[] = [
    {
        id: 'bw-1',
        barcode: 'BMW-2026-YEL-8812',
        category: 'yellow',
        weight_kg: 14.5,
        department: 'Operation Theater 2',
        logged_by: 'Sister Ananya Rao (Nurse In-Charge)',
        description: 'Post-op anatomical dressings, soiled gauze, surgical drapes',
        logged_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        status: 'in_store'
    },
    {
        id: 'bw-2',
        barcode: 'BMW-2026-RED-4421',
        category: 'red',
        weight_kg: 9.8,
        department: 'Intensive Care Unit (ICU)',
        logged_by: 'Technician Nilesh Naik',
        description: 'Empty dialyzer cartridges, catheters, saline bottles, infusion tubing',
        logged_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        status: 'in_store'
    },
    {
        id: 'bw-3',
        barcode: 'BMW-2026-WHT-1190',
        category: 'white',
        weight_kg: 3.2,
        department: 'Emergency OPD',
        logged_by: 'Dr. Om Mayekar',
        description: 'Scalpel blades, disposable needles, contaminated suture cutters (Puncture Proof)',
        logged_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'in_store'
    },
    {
        id: 'bw-4',
        barcode: 'BMW-2026-BLU-9904',
        category: 'blue',
        weight_kg: 6.4,
        department: 'Pathology & Blood Bank',
        logged_by: 'Lab Officer Sunita Gawas',
        description: 'Broken ampoules, expired reagent vials, microscope glass slides',
        logged_at: new Date(Date.now() - 3600000 * 16).toISOString(),
        status: 'in_store'
    },
    {
        id: 'bw-5',
        barcode: 'BMW-2026-YEL-8700',
        category: 'yellow',
        weight_kg: 18.2,
        department: 'Maternity & Labor Room',
        logged_by: 'Nurse Mary Dias',
        description: 'Human tissues, placenta soiled cotton, biological fluid containers',
        logged_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'dispatched',
        manifest_id: 'MNF-GOA-2026-081',
        dispatched_at: new Date(Date.now() - 86400000 + 7200000).toISOString()
    }
];

const INITIAL_MANIFESTS: PickupManifest[] = [
    {
        id: 'mnf-1',
        manifest_number: 'MNF-GOA-2026-081',
        vendor_name: 'Goa State Bio-Clean Disposal Systems Pvt Ltd',
        vehicle_number: 'GA-07-BW-4912',
        driver_name: 'Ramesh Sawant (Authorized CPCB Operator)',
        total_bags: 6,
        total_weight_kg: 48.6,
        pickup_time: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
    }
];

const BioWasteManagement = () => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'manifests' | 'guidelines'>('inventory');
    const [entries, setEntries] = useState<BioWasteEntry[]>([]);
    const [manifests, setManifests] = useState<PickupManifest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'yellow' | 'red' | 'white' | 'blue'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_store' | 'dispatched'>('all');

    // Modals
    const [showLogModal, setShowLogModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [viewManifest, setViewManifest] = useState<PickupManifest | null>(null);
    const [successNotification, setSuccessNotification] = useState<{ open: boolean; message: string }>({
        open: false,
        message: ''
    });

    // New Log Form State
    const [newLog, setNewLog] = useState({
        department: 'Operation Theater 1',
        category: 'yellow' as 'yellow' | 'red' | 'white' | 'blue',
        weight_kg: '',
        logged_by: 'Staff Nurse In-Charge',
        description: ''
    });

    // New Dispatch Form State
    const [dispatchForm, setDispatchForm] = useState({
        vendor_name: 'Goa State Bio-Clean Disposal Systems Pvt Ltd (CPCB/State PCB Certified)',
        vehicle_number: 'GA-07-BW-9910',
        driver_name: 'Vikram Joshi (Badge #BMW-OP-77)'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            const rawEntries = localStorage.getItem(STORAGE_KEY);
            if (!rawEntries) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
                setEntries(INITIAL_ENTRIES);
            } else {
                setEntries(JSON.parse(rawEntries));
            }

            const rawManifests = localStorage.getItem(MANIFESTS_KEY);
            if (!rawManifests) {
                localStorage.setItem(MANIFESTS_KEY, JSON.stringify(INITIAL_MANIFESTS));
                setManifests(INITIAL_MANIFESTS);
            } else {
                setManifests(JSON.parse(rawManifests));
            }
        } catch {
            setEntries(INITIAL_ENTRIES);
            setManifests(INITIAL_MANIFESTS);
        }
    };

    const saveEntries = (updated: BioWasteEntry[]) => {
        setEntries(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const saveManifests = (updated: PickupManifest[]) => {
        setManifests(updated);
        localStorage.setItem(MANIFESTS_KEY, JSON.stringify(updated));
    };

    // Calculate Summary Weights
    const currentInStore = entries.filter(e => e.status === 'in_store');
    const totalStoredWeight = currentInStore.reduce((acc, curr) => acc + curr.weight_kg, 0);

    const yellowWeight = currentInStore.filter(e => e.category === 'yellow').reduce((a, c) => a + c.weight_kg, 0);
    const redWeight = currentInStore.filter(e => e.category === 'red').reduce((a, c) => a + c.weight_kg, 0);
    const whiteWeight = currentInStore.filter(e => e.category === 'white').reduce((a, c) => a + c.weight_kg, 0);
    const blueWeight = currentInStore.filter(e => e.category === 'blue').reduce((a, c) => a + c.weight_kg, 0);

    const handleCreateLog = (e: React.FormEvent) => {
        e.preventDefault();
        const weightNum = parseFloat(newLog.weight_kg);
        if (isNaN(weightNum) || weightNum <= 0) {
            alert('Please enter a valid weight in kilograms.');
            return;
        }

        const barcodeCategoryCode = newLog.category.toUpperCase().slice(0, 3);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedBarcode = `BMW-2026-${barcodeCategoryCode}-${randomNum}`;

        const newEntry: BioWasteEntry = {
            id: `bw-${Date.now()}`,
            barcode: generatedBarcode,
            category: newLog.category,
            weight_kg: weightNum,
            department: newLog.department,
            logged_by: newLog.logged_by,
            description: newLog.description || `${newLog.category.toUpperCase()} category medical waste from ${newLog.department}`,
            logged_at: new Date().toISOString(),
            status: 'in_store'
        };

        const updated = [newEntry, ...entries];
        saveEntries(updated);
        setShowLogModal(false);
        setNewLog({
            department: 'Operation Theater 1',
            category: 'yellow',
            weight_kg: '',
            logged_by: 'Staff Nurse In-Charge',
            description: ''
        });

        setSuccessNotification({
            open: true,
            message: `Waste Barcode ${generatedBarcode} logged successfully! Placed in Central Cold Storage.`
        });
    };

    const handleDispatchToVendor = (e: React.FormEvent) => {
        e.preventDefault();
        const inStoreBags = entries.filter(e => e.status === 'in_store');
        if (inStoreBags.length === 0) {
            alert('No waste bags currently in storage to dispatch.');
            return;
        }

        const manifestNumber = `MNF-GOA-2026-${Math.floor(100 + Math.random() * 900)}`;
        const totalWeight = inStoreBags.reduce((a, c) => a + c.weight_kg, 0);

        const newManifest: PickupManifest = {
            id: `mnf-${Date.now()}`,
            manifest_number: manifestNumber,
            vendor_name: dispatchForm.vendor_name,
            vehicle_number: dispatchForm.vehicle_number,
            driver_name: dispatchForm.driver_name,
            total_bags: inStoreBags.length,
            total_weight_kg: Math.round(totalWeight * 10) / 10,
            pickup_time: new Date().toISOString(),
            status: 'completed'
        };

        // Mark all in-store bags as dispatched
        const updatedEntries: BioWasteEntry[] = entries.map(item => {
            if (item.status === 'in_store') {
                return {
                    ...item,
                    status: 'dispatched',
                    manifest_id: manifestNumber,
                    dispatched_at: new Date().toISOString()
                };
            }
            return item;
        });

        saveEntries(updatedEntries);
        saveManifests([newManifest, ...manifests]);
        setShowDispatchModal(false);

        setSuccessNotification({
            open: true,
            message: `Pickup Manifest ${manifestNumber} generated! ${inStoreBags.length} bags (${Math.round(totalWeight * 10) / 10} kg) transferred to certified disposal vendor.`
        });
    };

    const filteredEntries = entries.filter(item => {
        const matchesQuery =
            item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.logged_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesQuery && matchesCategory && matchesStatus;
    });

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'yellow':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
                    indicator: 'bg-yellow-500',
                    label: 'Yellow (Incineration / Deep Burial)'
                };
            case 'red':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    badge: 'bg-red-100 text-red-900 border-red-300',
                    indicator: 'bg-red-500',
                    label: 'Red (Autoclave / Shredding)'
                };
            case 'white':
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-300',
                    badge: 'bg-slate-100 text-slate-900 border-slate-300',
                    indicator: 'bg-slate-400',
                    label: 'White (Puncture Proof Sharps)'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    badge: 'bg-blue-100 text-blue-900 border-blue-300',
                    indicator: 'bg-blue-600',
                    label: 'Blue (Glassware Disinfection)'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    badge: 'bg-gray-100 text-gray-800 border-gray-300',
                    indicator: 'bg-gray-500',
                    label: category
                };
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20">
                            Bio-Medical Waste Control
                        </span>
                        <span className="bg-green-500/30 text-green-100 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            CPCB & State PCB Compliant
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Biomedical Waste Management & Barcode Tracking
                    </h1>
                    <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                        Maintain standard color-coded segregation (Yellow, Red, White, Blue), log ward waste generation, enforce the mandatory 48-hour storage limit, and dispatch verified manifests to authorized disposal vendors.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowLogModal(true)}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md text-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 text-blue-600" /> Log Waste Bag
                    </Button>
                    <Button
                        onClick={() => setShowDispatchModal(true)}
                        className="bg-blue-900/60 hover:bg-blue-900 text-white font-bold border border-white/20 text-sm flex items-center gap-2"
                    >
                        <Truck className="w-4 h-4 text-blue-300" /> Vendor Dispatch
                    </Button>
                </div>
            </div>

            {/* 4 Color Category Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Yellow Category */}
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-2 border-yellow-200 bg-gradient-to-b from-yellow-50/50 to-white shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                Yellow Category
                            </span>
                            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                Incineration
                            </span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">{yellowWeight.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg in store</span></div>
                            <p className="text-[11px] text-gray-500 mt-1">Soiled dressing, human tissue, expired meds</p>
                        </div>
                    </Card>
                </motion.div>

                {/* Red Category */}
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-2 border-red-200 bg-gradient-to-b from-red-50/50 to-white shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                Red Category
                            </span>
                            <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                Autoclave / Recycle
                            </span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">{redWeight.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg in store</span></div>
                            <p className="text-[11px] text-gray-500 mt-1">Tubings, catheters, IV bottles, gloves</p>
                        </div>
                    </Card>
                </motion.div>

                {/* White Category */}
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-slate-50/50 to-white shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                White Translucent
                            </span>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                                Sharps Shred
                            </span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">{whiteWeight.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg in store</span></div>
                            <p className="text-[11px] text-gray-500 mt-1">Scalpels, needles, contaminated blades</p>
                        </div>
                    </Card>
                </motion.div>

                {/* Blue Category */}
                <motion.div whileHover={{ y: -3 }}>
                    <Card className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-white shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                Blue Category
                            </span>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Disinfection
                            </span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">{blueWeight.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg in store</span></div>
                            <p className="text-[11px] text-gray-500 mt-1">Glass vials, ampoules, metallic implants</p>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Compliance & Central Storage Alert Strip */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                        <Scale className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm">Central Waste Holding Status: {totalStoredWeight.toFixed(1)} kg Pending Dispatch</h4>
                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Within 48-Hour Legal Window
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Next scheduled daily collection: <strong>Today, 04:30 PM</strong> by <em>Goa State Bio-Clean Disposal Systems (Vehicle GA-07-BW-9910)</em>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('guidelines')}
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-100 font-semibold"
                    >
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Segregation Guide
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'inventory'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Trash2 className="w-4 h-4" />
                    Logged Waste Bags ({entries.length})
                </button>

                <button
                    onClick={() => setActiveTab('manifests')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'manifests'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Pickup Manifests & Handover Receipts ({manifests.length})
                </button>

                <button
                    onClick={() => setActiveTab('guidelines')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'guidelines'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Color-Coded Protocol Guide
                </button>
            </div>

            {/* TAB 1: LOGGED WASTE BAGS INVENTORY */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by barcode tag, ward, staff, description..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {/* Category Filter */}
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value as any)}
                                className="text-xs font-semibold border rounded-xl p-2 bg-gray-50 text-gray-700 focus:outline-none"
                            >
                                <option value="all">All Categories</option>
                                <option value="yellow">Yellow Only</option>
                                <option value="red">Red Only</option>
                                <option value="white">White Sharps</option>
                                <option value="blue">Blue Glass</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="text-xs font-semibold border rounded-xl p-2 bg-gray-50 text-gray-700 focus:outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="in_store">In Central Storage</option>
                                <option value="dispatched">Dispatched to Vendor</option>
                            </select>
                        </div>
                    </div>

                    {/* Waste Log Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Barcode ID / Category</th>
                                        <th className="px-6 py-4">Originating Ward</th>
                                        <th className="px-6 py-4">Weight (kg)</th>
                                        <th className="px-6 py-4">Logged By & Time</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEntries.map(entry => {
                                        const styles = getCategoryStyles(entry.category);
                                        return (
                                            <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-xs text-gray-900 flex items-center gap-2">
                                                        <span className={`w-3 h-3 rounded-full ${styles.indicator}`} />
                                                        {entry.barcode}
                                                    </div>
                                                    <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border mt-1 uppercase ${styles.badge}`}>
                                                        {entry.category} bin
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-xs">{entry.department}</div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-black text-sm text-gray-900">
                                                        {entry.weight_kg.toFixed(1)} kg
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    <div className="font-semibold text-gray-800">{entry.logged_by}</div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(entry.logged_at).toLocaleDateString()}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">
                                                    <p className="line-clamp-2">{entry.description}</p>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    {entry.status === 'in_store' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
                                                            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                                                            In Storage
                                                        </span>
                                                    ) : (
                                                        <div className="text-right">
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                                Dispatched
                                                            </span>
                                                            <span className="block text-[10px] font-mono text-gray-400 mt-0.5">
                                                                {entry.manifest_id}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                No biomedical waste entries found matching your filter criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: PICKUP MANIFESTS & DISPATCH RECEIPTS */}
            {activeTab === 'manifests' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {manifests.map(manifest => (
                            <motion.div
                                key={manifest.id}
                                whileHover={{ y: -3 }}
                                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:border-blue-300 transition-all space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">CPCB Handover Manifest</span>
                                        <h4 className="font-mono font-black text-lg text-gray-900 mt-0.5">{manifest.manifest_number}</h4>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        Disposed
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3.5 rounded-2xl">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Handover</span>
                                        <strong className="text-gray-800 text-sm font-black">{manifest.total_weight_kg} kg ({manifest.total_bags} Bags)</strong>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Vehicle Number</span>
                                        <strong className="text-gray-800 font-mono text-xs">{manifest.vehicle_number}</strong>
                                    </div>
                                    <div className="col-span-2 pt-1 border-t border-gray-200">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Authorized Vendor</span>
                                        <strong className="text-gray-800 text-xs block truncate">{manifest.vendor_name}</strong>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Driver / Waste Custodian</span>
                                        <span className="text-gray-700 text-xs">{manifest.driver_name}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <span>Pickup Time: <strong>{new Date(manifest.pickup_time).toLocaleString()}</strong></span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setViewManifest(manifest)}
                                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                                    >
                                        <Eye className="w-3.5 h-3.5 mr-1" /> View Slip
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: COLOR SEGREGATION PROTOCOL & COMPLIANCE GUIDE */}
            {activeTab === 'guidelines' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Yellow Bin Card */}
                    <div className="bg-yellow-50/70 border-2 border-yellow-300 rounded-3xl p-6 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-yellow-950 flex items-center justify-center font-black text-xl shadow-md">
                                Y
                            </div>
                            <div>
                                <h4 className="font-extrabold text-yellow-950 text-lg">Yellow Container / Bin</h4>
                                <span className="text-xs font-semibold text-yellow-800">Incineration & Plasma Pyrolysis</span>
                            </div>
                        </div>
                        <div className="text-xs text-yellow-900 space-y-1.5 pt-2">
                            <p className="font-bold">What goes inside:</p>
                            <ul className="list-disc list-inside space-y-1 text-yellow-800">
                                <li>Human anatomical waste (tissues, organs, body parts, placenta).</li>
                                <li>Soiled waste (cotton, bandages, gauze with blood, plaster casts).</li>
                                <li>Expired, discarded, or cytotoxic pharmaceutical drugs.</li>
                                <li>Chemical waste used in disinfectants and pathology tests.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Red Bin Card */}
                    <div className="bg-red-50/70 border-2 border-red-300 rounded-3xl p-6 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                                R
                            </div>
                            <div>
                                <h4 className="font-extrabold text-red-950 text-lg">Red Container / Bin</h4>
                                <span className="text-xs font-semibold text-red-800">Autoclaving / Microwaving / Recycling</span>
                            </div>
                        </div>
                        <div className="text-xs text-red-900 space-y-1.5 pt-2">
                            <p className="font-bold">What goes inside:</p>
                            <ul className="list-disc list-inside space-y-1 text-red-800">
                                <li>Contaminated recyclable plastics (tubing, IV bottles, catheters).</li>
                                <li>Disposable syringes (needles must be detached/shredded first).</li>
                                <li>Examination gloves and surgical rubber gloves.</li>
                                <li>Dialysis kits, urine bags, and suction canisters.</li>
                            </ul>
                        </div>
                    </div>

                    {/* White Container Card */}
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xl shadow-md border border-slate-300">
                                W
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-lg">White Translucent (Puncture-Proof)</h4>
                                <span className="text-xs font-semibold text-slate-600">Autoclave & Dry Heat Sterilization / Encapsulation</span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-800 space-y-1.5 pt-2">
                            <p className="font-bold">What goes inside:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-700">
                                <li>Waste sharps including needles, syringes with fixed needles.</li>
                                <li>Needles from needle tip cutter or burner.</li>
                                <li>Scalpels, surgical blades, and suture cutting needles.</li>
                                <li>Any contaminated sharp object capable of causing puncture.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Blue Bin Card */}
                    <div className="bg-blue-50/70 border-2 border-blue-300 rounded-3xl p-6 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                                B
                            </div>
                            <div>
                                <h4 className="font-extrabold text-blue-950 text-lg">Blue Box / Puncture-Proof</h4>
                                <span className="text-xs font-semibold text-blue-800">Disinfection (Sodium Hypochlorite) / Autoclaving</span>
                            </div>
                        </div>
                        <div className="text-xs text-blue-900 space-y-1.5 pt-2">
                            <p className="font-bold">What goes inside:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                <li>Broken or intact discarded glassware (medicine vials, ampoules).</li>
                                <li>Contaminated lab slides and glass petri dishes.</li>
                                <li>Orthopedic metallic body implants and joint prosthetics.</li>
                                <li>Glass bottles containing non-cytotoxic residues.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: LOG NEW WASTE ENTRY */}
            <AnimatePresence>
                {showLogModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowLogModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-100"
                        >
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
                                <button
                                    onClick={() => setShowLogModal(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Trash2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Log Hospital Waste Bag</h3>
                                        <p className="text-xs text-blue-100">Generates official CPCB barcoded tracking identifier</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreateLog} className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Originating Ward / Department</label>
                                    <select
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={newLog.department}
                                        onChange={e => setNewLog({ ...newLog, department: e.target.value })}
                                    >
                                        <option value="Operation Theater 1">Operation Theater 1</option>
                                        <option value="Operation Theater 2">Operation Theater 2</option>
                                        <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                                        <option value="Emergency OPD & Trauma">Emergency OPD & Trauma</option>
                                        <option value="Maternity & Labor Room">Maternity & Labor Room</option>
                                        <option value="Pathology & Diagnostic Lab">Pathology & Diagnostic Lab</option>
                                        <option value="Dialysis Center">Dialysis Center</option>
                                        <option value="Inpatient Ward 3A">Inpatient Ward 3A</option>
                                    </select>
                                </div>

                                {/* Color category selection */}
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Color-Coded Segregation Bin</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'yellow', label: 'Yellow (Incineration)', bg: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
                                            { id: 'red', label: 'Red (Autoclave/Recycle)', bg: 'bg-red-100 border-red-300 text-red-900' },
                                            { id: 'white', label: 'White (Puncture Sharps)', bg: 'bg-slate-100 border-slate-300 text-slate-900' },
                                            { id: 'blue', label: 'Blue (Glass & Implants)', bg: 'bg-blue-100 border-blue-300 text-blue-900' },
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setNewLog({ ...newLog, category: cat.id as any })}
                                                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                                                    newLog.category === cat.id
                                                        ? `${cat.bg} ring-2 ring-blue-600 shadow-sm`
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Weight (kg)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g. 5.4"
                                            value={newLog.weight_kg}
                                            onChange={e => setNewLog({ ...newLog, weight_kg: e.target.value })}
                                            required
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Logged By (Staff ID)</label>
                                        <Input
                                            value={newLog.logged_by}
                                            onChange={e => setNewLog({ ...newLog, logged_by: e.target.value })}
                                            required
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Description of Contained Waste</label>
                                    <Input
                                        placeholder="e.g. Used cotton gauze, surgical drapes, soiled pads"
                                        value={newLog.description}
                                        onChange={e => setNewLog({ ...newLog, description: e.target.value })}
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="pt-3 border-t flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                        Confirm & Print Barcode Tag
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 2: DISPATCH TO AUTHORIZED VENDOR */}
            <AnimatePresence>
                {showDispatchModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDispatchModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-100"
                        >
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
                                <button
                                    onClick={() => setShowDispatchModal(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Truck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Dispatch Handover to Vendor</h3>
                                        <p className="text-xs text-blue-100">Generates official CPCB Common Bio-Medical Waste Facility (CBWTF) slip</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleDispatchToVendor} className="p-6 space-y-4">
                                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                                    <span className="font-bold text-blue-900 block">Pending Handover Load:</span>
                                    <p className="text-blue-800">
                                        <strong>{currentInStore.length} Barcoded Bags</strong> totaling <strong>{totalStoredWeight.toFixed(1)} kg</strong> ready for transfer.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Certified Disposal Agency</label>
                                    <Input
                                        value={dispatchForm.vendor_name}
                                        onChange={e => setDispatchForm({ ...dispatchForm, vendor_name: e.target.value })}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Vehicle Number</label>
                                        <Input
                                            value={dispatchForm.vehicle_number}
                                            onChange={e => setDispatchForm({ ...dispatchForm, vehicle_number: e.target.value })}
                                            required
                                            className="rounded-xl font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Driver / Custodian Name</label>
                                        <Input
                                            value={dispatchForm.driver_name}
                                            onChange={e => setDispatchForm({ ...dispatchForm, driver_name: e.target.value })}
                                            required
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
                                    <Button
                                        type="submit"
                                        disabled={currentInStore.length === 0}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    >
                                        Sign & Dispatch Manifest
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 3: VIEW MANIFEST SLIP */}
            <AnimatePresence>
                {viewManifest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setViewManifest(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4"
                        >
                            <div className="border-b pb-3 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">State Pollution Control Board Manifest</span>
                                    <h3 className="font-mono font-bold text-lg text-gray-900">{viewManifest.manifest_number}</h3>
                                </div>
                                <button onClick={() => setViewManifest(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Handover Weight</span>
                                        <strong className="text-gray-900 text-base">{viewManifest.total_weight_kg} kg</strong>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Barcoded Bags</span>
                                        <strong className="text-gray-900 text-base">{viewManifest.total_bags} Sealed Units</strong>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-gray-400 uppercase text-[10px] font-semibold">Authorized CBWTF Vendor:</span>
                                    <p className="font-bold text-gray-800">{viewManifest.vendor_name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-gray-400 uppercase text-[10px] font-semibold">Vehicle:</span>
                                        <p className="font-mono font-bold text-gray-800">{viewManifest.vehicle_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 uppercase text-[10px] font-semibold">Driver Representative:</span>
                                        <p className="font-bold text-gray-800">{viewManifest.driver_name}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-gray-400 uppercase text-[10px] font-semibold">Handover Timestamp:</span>
                                    <p className="text-gray-800">{new Date(viewManifest.pickup_time).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => alert(`Manifest ${viewManifest.manifest_number} ready for print/download.`)}
                                    className="text-xs text-blue-600 border-blue-200"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Manifest PDF
                                </Button>
                                <Button size="sm" onClick={() => setViewManifest(null)}>Close</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 4: SUCCESS NOTIFICATION */}
            <AnimatePresence>
                {successNotification.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSuccessNotification({ open: false, message: '' })}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-blue-100"
                        >
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg ring-8 ring-green-50 animate-bounce">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {successNotification.message}
                            </p>
                            <Button
                                onClick={() => setSuccessNotification({ open: false, message: '' })}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs"
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

export default BioWasteManagement;
