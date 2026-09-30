import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
    Box, Search, Plus, AlertTriangle, CheckCircle2,
    Clock, Building2, Truck, FileCheck, Layers, QrCode,
    ShoppingCart, Download, RefreshCw, Stethoscope,
    Sparkles, Building, Barcode,
    AlertOctagon, HeartHandshake, ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    HospitalInventoryService,
    type InventoryItem,
    type Vendor,
    type PurchaseOrder,
    type GoodsReceivedNote,
    type ProcedureConsumption,
    type ImplantRecord
} from '../../lib/hospitalInventory';

export const Inventory = () => {
    // Active Tab
    const [activeTab, setActiveTab] = useState<'materials' | 'fefo' | 'vendors' | 'procurement' | 'consumption' | 'implants'>('materials');

    // Data State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
    const [consumptions, setConsumptions] = useState<ProcedureConsumption[]>([]);
    const [implants, setImplants] = useState<ImplantRecord[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters for Materials Master
    const [materialSearch, setMaterialSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'medical' | 'non-medical'>('all');
    const [subCatFilter, setSubCatFilter] = useState<string>('all');
    const [stockHealthFilter, setStockHealthFilter] = useState<'all' | 'critical' | 'adequate'>('all');

    // Modals
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
    const [isProcessGrnOpen, setIsProcessGrnOpen] = useState(false);
    const [isRecordConsumptionOpen, setIsRecordConsumptionOpen] = useState(false);
    const [isRegisterImplantOpen, setIsRegisterImplantOpen] = useState(false);
    const [isLinkImplantOpen, setIsLinkImplantOpen] = useState(false);
    const [selectedImplantForLink, setSelectedImplantForLink] = useState<ImplantRecord | null>(null);

    // Add Item Form
    const [itemForm, setItemForm] = useState({
        item_code: '',
        item_name: '',
        category: 'medical' as 'medical' | 'non-medical',
        sub_category: 'Pharmaceuticals' as InventoryItem['sub_category'],
        unit: 'vials',
        quantity: 50,
        min_threshold: 20,
        reorder_qty: 100,
        unit_price: 350,
        location: 'Central Pharmacy'
    });

    // PO Form
    const [poForm, setPoForm] = useState({
        vendor_id: '',
        expected_delivery: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
        notes: 'Priority hospital supply replenishment.',
        selectedItem: '',
        itemQty: 100
    });

    // GRN Form
    const [grnForm, setGrnForm] = useState({
        po_number: '',
        vendor_name: '',
        invoice_number: '',
        inspected_by: 'Pharmacist Quality Lead',
        item_name: '',
        batch_number: '',
        expiry_date: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
        qty_received: 50,
        qc_status: 'Passed' as 'Passed' | 'Quarantined',
        remarks: 'Physical packaging intact, cold-chain verified.'
    });

    // Procedure Consumption Form
    const [consumptionForm, setConsumptionForm] = useState({
        procedure_name: 'Laparoscopic Cholecystectomy',
        department: 'Operation Theater 1',
        patient_name: '',
        patient_uhid: '',
        operating_surgeon: 'Dr. Vivek Sharma',
        item_id: '',
        qty_used: 1
    });

    // Implant Register Form (UDI)
    const [implantForm, setImplantForm] = useState({
        device_name: '',
        implant_type: 'Cardiac Stent' as ImplantRecord['implant_type'],
        manufacturer: 'Medtronic',
        lot_number: '',
        serial_number: '',
        expiry_date: new Date(Date.now() + 86400000 * 730).toISOString().slice(0, 10),
        udi_di: '(01)08717648219482',
        udi_pi: ''
    });

    // Link Implant to Patient Form
    const [linkImplantForm, setLinkImplantForm] = useState({
        patientName: '',
        patientUhid: '',
        doctorName: 'Dr. Om Mayekar'
    });

    // Load Data
    useEffect(() => {
        setItems(HospitalInventoryService.getItems());
        setVendors(HospitalInventoryService.getVendors());
        setPos(HospitalInventoryService.getPOs());
        setGrns(HospitalInventoryService.getGRNs());
        setConsumptions(HospitalInventoryService.getConsumptions());
        setImplants(HospitalInventoryService.getImplants());
    }, [refreshTrigger]);

    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Calculate High-Level Metrics
    const totalSKUs = items.length;
    const medicalSKUs = items.filter(i => i.category === 'medical').length;
    const nonMedicalSKUs = items.filter(i => i.category === 'non-medical').length;
    const totalValuation = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const lowStockItems = items.filter(i => i.quantity <= i.min_threshold);

    // FEFO Metrics
    const now = new Date();
    const allBatches = items.flatMap(item =>
        item.batches.map(b => {
            const exp = new Date(b.expiry_date);
            const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
            return {
                ...b,
                parent_item_name: item.item_name,
                parent_item_id: item.id,
                location: item.location,
                unit: item.unit,
                unit_price: item.unit_price,
                diffDays
            };
        })
    );

    const expiredBatches = allBatches.filter(b => b.diffDays <= 0 && b.status !== 'quarantined');
    const criticalBatches = allBatches.filter(b => b.diffDays > 0 && b.diffDays <= 30 && b.status !== 'quarantined');
    const warningBatches = allBatches.filter(b => b.diffDays > 30 && b.diffDays <= 90 && b.status !== 'quarantined');

    // Filter Materials
    const filteredItems = items.filter(item => {
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesSubCat = subCatFilter === 'all' || item.sub_category === subCatFilter;
        const matchesHealth =
            stockHealthFilter === 'all' ||
            (stockHealthFilter === 'critical' && item.quantity <= item.min_threshold) ||
            (stockHealthFilter === 'adequate' && item.quantity > item.min_threshold);

        const q = materialSearch.toLowerCase().trim();
        const matchesSearch = !q ||
            item.item_name.toLowerCase().includes(q) ||
            item.item_code.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.sub_category.toLowerCase().includes(q);

        return matchesCategory && matchesSubCat && matchesHealth && matchesSearch;
    });

    // Actions
    const handleAddItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        HospitalInventoryService.addItem({
            ...itemForm,
            item_code: itemForm.item_code || `SKU-${Date.now().toString().slice(-6)}`,
            batches: [
                {
                    batch_number: `BTH-${Date.now().toString().slice(-4)}`,
                    mfg_date: new Date().toISOString().slice(0, 10),
                    expiry_date: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
                    quantity: itemForm.quantity,
                    status: 'active'
                }
            ]
        });
        setIsAddItemOpen(false);
        refreshData();
    };

    const handleCreatePoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vendor = vendors.find(v => v.id === poForm.vendor_id);
        const item = items.find(i => i.id === poForm.selectedItem);
        if (!vendor || !item) return;

        HospitalInventoryService.createPO({
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            expected_delivery: poForm.expected_delivery,
            status: 'Approved',
            items: [
                {
                    item_id: item.id,
                    item_name: item.item_name,
                    qty: Number(poForm.itemQty) || 50,
                    unit_price: item.unit_price,
                    total: (Number(poForm.itemQty) || 50) * item.unit_price
                }
            ],
            total_amount: (Number(poForm.itemQty) || 50) * item.unit_price,
            notes: poForm.notes
        });

        setIsCreatePoOpen(false);
        refreshData();
    };

    const handleProcessGrnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!grnForm.po_number || !grnForm.item_name) return;

        HospitalInventoryService.processGRN({
            po_number: grnForm.po_number,
            vendor_name: grnForm.vendor_name || 'Authorized Healthcare Distributor',
            invoice_number: grnForm.invoice_number || `INV-${Date.now().toString().slice(-5)}`,
            inspected_by: grnForm.inspected_by,
            items_received: [
                {
                    item_name: grnForm.item_name,
                    batch_number: grnForm.batch_number || `BTH-${Math.floor(1000 + Math.random() * 9000)}`,
                    expiry_date: grnForm.expiry_date,
                    qty_received: Number(grnForm.qty_received) || 50,
                    qc_status: grnForm.qc_status
                }
            ],
            total_accepted_qty: grnForm.qc_status === 'Passed' ? Number(grnForm.qty_received) || 50 : 0,
            remarks: grnForm.remarks
        });

        setIsProcessGrnOpen(false);
        refreshData();
    };

    const handleRecordConsumptionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const item = items.find(i => i.id === consumptionForm.item_id);
        if (!item || !consumptionForm.patient_name) return;

        const batch = item.batches[0];
        const qty = Number(consumptionForm.qty_used) || 1;
        const total = qty * item.unit_price;

        HospitalInventoryService.recordConsumption({
            procedure_name: consumptionForm.procedure_name,
            department: consumptionForm.department,
            patient_name: consumptionForm.patient_name,
            patient_uhid: consumptionForm.patient_uhid || `UHID-${Date.now().toString().slice(-6)}`,
            operating_surgeon: consumptionForm.operating_surgeon,
            items: [
                {
                    item_name: item.item_name,
                    batch_number: batch ? batch.batch_number : 'DIRECT-DISP',
                    qty_used: qty,
                    unit_price: item.unit_price,
                    total_cost: total
                }
            ],
            total_cost: total
        });

        setIsRecordConsumptionOpen(false);
        refreshData();
    };

    const handleRegisterImplantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const udiPI = implantForm.udi_pi || `(17)${implantForm.expiry_date.replace(/-/g, '').slice(2)}(10)${implantForm.lot_number}(21)${implantForm.serial_number}`;
        HospitalInventoryService.registerImplant({
            device_name: implantForm.device_name,
            implant_type: implantForm.implant_type,
            manufacturer: implantForm.manufacturer,
            lot_number: implantForm.lot_number,
            serial_number: implantForm.serial_number,
            expiry_date: implantForm.expiry_date,
            udi_di: implantForm.udi_di,
            udi_pi: udiPI,
            full_udi_barcode: `${implantForm.udi_di}${udiPI}`,
            status: 'In Stock'
        });

        setIsRegisterImplantOpen(false);
        refreshData();
    };

    const handleLinkImplantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImplantForLink) return;

        HospitalInventoryService.linkImplantToPatient(selectedImplantForLink.id, {
            patientName: linkImplantForm.patientName,
            patientUhid: linkImplantForm.patientUhid || `UHID-${Date.now().toString().slice(-6)}`,
            doctorName: linkImplantForm.doctorName
        });

        setIsLinkImplantOpen(false);
        setSelectedImplantForLink(null);
        refreshData();
    };

    const handleQuarantine = (itemId: string, batchNumber: string) => {
        if (confirm(`Quarantine batch ${batchNumber}? It will be removed from active dispensing stock.`)) {
            HospitalInventoryService.quarantineBatch(itemId, batchNumber);
            refreshData();
        }
    };

    // Download PDF Purchase Order
    const handleDownloadPO = (po: PurchaseOrder) => {
        const doc = new jsPDF();
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 32, 'F');

        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('MEDICONNECT HOSPITAL - PURCHASE ORDER', 14, 18);
        doc.setFontSize(9);
        doc.text('CENTRAL MATERIALS MANAGEMENT & E-PROCUREMENT DIVISION', 14, 25);

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
        doc.text(`PO Number: ${po.po_number}`, 14, 42);
        doc.text(`Vendor: ${po.vendor_name}`, 14, 48);
        doc.text(`Date Issued: ${new Date(po.created_at).toLocaleDateString()}`, 130, 42);
        doc.text(`Expected Delivery: ${new Date(po.expected_delivery).toLocaleDateString()}`, 130, 48);
        doc.text(`Status: ${po.status.toUpperCase()}`, 130, 54);

        const tableData = po.items.map(i => [
            i.item_name,
            String(i.qty),
            `Rs. ${i.unit_price.toLocaleString()}`,
            `Rs. ${i.total.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 60,
            head: [['Item Description', 'Order Qty', 'Unit Price', 'Total Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 64, 175] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text(`Total Order Value: Rs. ${po.total_amount.toLocaleString()}`, 14, finalY);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Notes: ${po.notes}`, 14, finalY + 8);

        doc.text('_____________________________', 140, finalY + 30);
        doc.text('Authorized Material Director', 140, finalY + 36);

        doc.save(`${po.po_number}.pdf`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" /> Materials & Supply Chain Control
                        </span>
                        <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> UDI & FEFO Compliant
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Box className="h-8 w-8 text-blue-200" />
                        Hospital Inventory & Supply Chain
                    </h1>
                    <p className="text-blue-100/90 text-sm max-w-2xl mt-1">
                        Medical & non-medical catalog, vendor e-procurement, purchase orders & GRN processing,
                        procedure-level consumption costing, FEFO expiry management, and UDI implant tracking.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        onClick={() => setIsAddItemOpen(true)}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add SKU Item
                    </Button>
                    <Button
                        onClick={() => setIsCreatePoOpen(true)}
                        className="bg-blue-600/40 border border-blue-400/40 text-white hover:bg-blue-600/60 font-medium flex items-center gap-2"
                    >
                        <ShoppingCart className="h-4 w-4" /> Create PO
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

            {/* Supply Chain KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Active SKU Catalog</span>
                        <Layers className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{totalSKUs}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="text-blue-600 font-semibold">{medicalSKUs} Med</span> •
                        <span className="text-slate-600 font-semibold">{nonMedicalSKUs} Non-Med</span>
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Total Stock Valuation</span>
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                        ₹{(totalValuation / 100000).toFixed(1)}L
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Real-time inventory asset</div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>Low Buffer Alerts</span>
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-rose-600">{lowStockItems.length}</div>
                    <div className="text-xs text-rose-600 font-medium mt-1">Requires Reordering</div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>FEFO Expiry Warnings</span>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                        {expiredBatches.length + criticalBatches.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {expiredBatches.length > 0 ? (
                            <span className="text-rose-600 font-bold">{expiredBatches.length} Expired</span>
                        ) : (
                            <span className="text-amber-700">{criticalBatches.length} Critical &lt; 30d</span>
                        )}
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200/80 shadow-sm rounded-xl col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                        <span>UDI Implant Registry</span>
                        <Barcode className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">{implants.length}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {implants.filter(i => i.status === 'Implanted').length} Patient Implanted
                    </div>
                </Card>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                    { id: 'materials', label: 'Materials Master', icon: Box, count: items.length },
                    { id: 'fefo', label: 'FEFO Expiry Management', icon: Clock, count: expiredBatches.length + criticalBatches.length + warningBatches.length, badgeColor: 'bg-amber-100 text-amber-800' },
                    { id: 'procurement', label: 'Purchase Orders & GRN', icon: Truck, count: pos.length + grns.length },
                    { id: 'vendors', label: 'Vendor Directory', icon: Building, count: vendors.length },
                    { id: 'consumption', label: 'Procedure Consumption', icon: Stethoscope, count: consumptions.length },
                    { id: 'implants', label: 'Implant UDI Compliance', icon: Barcode, count: implants.length }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${isActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive
                                ? 'bg-blue-500 text-white'
                                : tab.badgeColor || 'bg-slate-100 text-slate-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ======================================================== */}
            {/* TAB 1: MATERIALS MASTER (MEDICAL & NON-MEDICAL) */}
            {/* ======================================================== */}
            {activeTab === 'materials' && (
                <div className="space-y-4">
                    {/* Filter & Subcategory Strip */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            {/* Search */}
                            <div className="relative flex-1 w-full">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search by SKU code, item name, location, or sub-category..."
                                    value={materialSearch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaterialSearch(e.target.value)}
                                    className="pl-9 text-xs sm:text-sm h-9 bg-slate-50 border-slate-200"
                                />
                            </div>

                            {/* Category & Stock Health Filters */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                                {[
                                    { id: 'all', label: 'All Catalog' },
                                    { id: 'medical', label: 'Medical Only' },
                                    { id: 'non-medical', label: 'Non-Medical Only' }
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategoryFilter(cat.id as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${categoryFilter === cat.id
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                                <span className="h-4 w-px bg-slate-200 mx-1 shrink-0" />
                                {[
                                    { id: 'all', label: 'All Levels' },
                                    { id: 'critical', label: 'Low Buffer' },
                                    { id: 'adequate', label: 'Adequate' }
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => setStockHealthFilter(st.id as any)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${stockHealthFilter === st.id
                                            ? st.id === 'critical' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subcategory Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-t pt-2.5 scrollbar-none">
                            <span className="text-slate-400 font-medium shrink-0">Sub-categories:</span>
                            {[
                                'all',
                                'Pharmaceuticals',
                                'Surgical Consumables',
                                'Implants & Ortho',
                                'Diagnostic Reagents',
                                'Housekeeping & Disinfectants',
                                'Linen & Bedding',
                                'Facility & Engineering',
                                'IT & Admin'
                            ].map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSubCatFilter(sub)}
                                    className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${subCatFilter === sub
                                        ? 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    {sub === 'all' ? 'All Sub-Categories' : sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Materials Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">Item Code & Name</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Storage Location</th>
                                        <th className="px-4 py-3">Stock Level</th>
                                        <th className="px-4 py-3">Unit Price</th>
                                        <th className="px-4 py-3">Asset Value</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map(item => {
                                        const isLow = item.quantity <= item.min_threshold;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.item_code}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${item.category === 'medical'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {item.sub_category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <Building2 className="h-3 w-3 text-slate-400" />
                                                        <span>{item.location}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                                                            {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                                        </div>
                                                        {isLow && (
                                                            <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                                                <AlertTriangle className="h-2.5 w-2.5" /> Reorder
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">Min Buffer: {item.min_threshold} {item.unit}</div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-700">
                                                    ₹{item.unit_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-emerald-700">
                                                    ₹{(item.quantity * item.unit_price).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setPoForm(prev => ({ ...prev, selectedItem: item.id }));
                                                            setIsCreatePoOpen(true);
                                                        }}
                                                        className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 h-7"
                                                    >
                                                        <ShoppingCart className="h-3 w-3 mr-1" /> Order PO
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: FEFO EXPIRY MANAGEMENT (FIRST EXPIRE, FIRST OUT) */}
            {/* ======================================================== */}
            {activeTab === 'fefo' && (
                <div className="space-y-4">
                    {/* FEFO Banner */}
                    <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-200 uppercase tracking-wider mb-1">
                                <Clock className="h-4 w-4" /> First Expiry, First Out (FEFO) Protocol
                            </div>
                            <h2 className="text-xl font-bold">Dynamic Batch Expiry & Quarantine Dispatch</h2>
                            <p className="text-amber-100 text-xs mt-1 max-w-xl">
                                System prioritizes shortest shelf-life batches for dispensing and flags critical batches under 30 days for vendor return or quarantine.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                                <div className="text-xl font-bold text-white">{expiredBatches.length}</div>
                                <div className="text-[10px] text-rose-200 font-semibold uppercase">Expired (Quarantine)</div>
                            </div>
                            <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                                <div className="text-xl font-bold text-white">{criticalBatches.length}</div>
                                <div className="text-[10px] text-amber-200 font-semibold uppercase">&lt; 30 Days Critical</div>
                            </div>
                        </div>
                    </div>

                    {/* Batch FEFO Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-3.5 bg-slate-50 border-b font-bold text-xs text-slate-800 flex items-center justify-between">
                            <span>All Registered Inventory Batches (Sorted by Nearest Expiry Date)</span>
                            <span className="text-slate-500 font-normal text-[11px]">Auto-prioritized for picking</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">Item Name</th>
                                        <th className="px-4 py-3">Batch Number</th>
                                        <th className="px-4 py-3">Storage Location</th>
                                        <th className="px-4 py-3">Quantity</th>
                                        <th className="px-4 py-3">Expiry Date</th>
                                        <th className="px-4 py-3">FEFO Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allBatches
                                        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                                        .map((batch, idx) => {
                                            const isExpired = batch.diffDays <= 0;
                                            const isCritical = batch.diffDays > 0 && batch.diffDays <= 30;
                                            const isWarning = batch.diffDays > 30 && batch.diffDays <= 90;

                                            return (
                                                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${batch.status === 'quarantined' ? 'bg-slate-50 opacity-60' : ''}`}>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{batch.parent_item_name}</td>
                                                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">{batch.batch_number}</td>
                                                    <td className="px-4 py-3 text-slate-600">{batch.location}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">
                                                        {batch.quantity} <span className="text-xs font-normal text-slate-500">{batch.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                                        {new Date(batch.expiry_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {batch.status === 'quarantined' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                                                                <AlertOctagon className="h-3 w-3" /> Quarantined
                                                            </span>
                                                        ) : isExpired ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 animate-pulse">
                                                                <AlertTriangle className="h-3 w-3" /> Expired ({Math.abs(batch.diffDays)}d ago)
                                                            </span>
                                                        ) : isCritical ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                                                <Clock className="h-3 w-3" /> Critical ({batch.diffDays}d left)
                                                            </span>
                                                        ) : isWarning ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">
                                                                <Clock className="h-3 w-3" /> Warning ({batch.diffDays}d left)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800">
                                                                <CheckCircle2 className="h-3 w-3" /> Safe ({batch.diffDays}d left)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {batch.status !== 'quarantined' && (isExpired || isCritical) && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleQuarantine(batch.parent_item_id, batch.batch_number)}
                                                                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 h-7"
                                                            >
                                                                Quarantine Batch
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: VENDOR DIRECTORY & E-PROCUREMENT */}
            {/* ======================================================== */}
            {activeTab === 'vendors' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {vendors.map(v => (
                            <Card key={v.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-slate-400 font-bold">{v.code}</span>
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            ★ {v.rating}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mt-1">{v.name}</h3>
                                    <p className="text-xs text-blue-700 font-medium mt-0.5">{v.category}</p>
                                    <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                                        <div>GSTIN: <span className="font-mono text-slate-700">{v.gstin}</span></div>
                                        <div>Terms: <span className="font-medium text-slate-700">{v.payment_terms}</span></div>
                                        <div>Ph: <span className="text-slate-700">{v.phone}</span></div>
                                        <div>Email: <span className="text-slate-700">{v.email}</span></div>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setPoForm(prev => ({ ...prev, vendor_id: v.id }));
                                        setIsCreatePoOpen(true);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                                >
                                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Raise Purchase Order
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: PURCHASE ORDERS & GRN PROCESSING */}
            {/* ======================================================== */}
            {activeTab === 'procurement' && (
                <div className="space-y-6">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Purchase Orders (PO) & Goods Received Notes (GRN)</h3>
                            <p className="text-xs text-slate-500">Track PO lifecycle, supplier confirmations, and physical receipt inspection.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsCreatePoOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" /> New Purchase Order
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsProcessGrnOpen(true)}
                                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold"
                            >
                                <FileCheck className="h-3.5 w-3.5 mr-1" /> Process GRN Intake
                            </Button>
                        </div>
                    </div>

                    {/* Purchase Orders List */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b font-bold text-xs text-slate-800 flex items-center justify-between">
                            <span>Active Purchase Orders</span>
                            <span className="text-[11px] text-slate-500">{pos.length} Orders</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">PO Number</th>
                                        <th className="px-4 py-3">Vendor</th>
                                        <th className="px-4 py-3">Order Date</th>
                                        <th className="px-4 py-3">Expected By</th>
                                        <th className="px-4 py-3">Total Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pos.map(po => (
                                        <tr key={po.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono font-bold text-blue-700">{po.po_number}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{po.vendor_name}</td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(po.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(po.expected_delivery).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">₹{po.total_amount.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${po.status === 'Fulfilled'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : po.status === 'Approved'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadPO(po)}
                                                    className="text-xs text-slate-700 h-7 px-2"
                                                >
                                                    <Download className="h-3 w-3 mr-1" /> PDF PO
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Goods Received Notes (GRN) Log */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b font-bold text-xs text-slate-800 flex items-center justify-between">
                            <span>Goods Received Notes (GRN) Inspection Log</span>
                            <span className="text-[11px] text-slate-500">{grns.length} Received Consignments</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">GRN No.</th>
                                        <th className="px-4 py-3">Linked PO</th>
                                        <th className="px-4 py-3">Vendor & Invoice</th>
                                        <th className="px-4 py-3">Received Date</th>
                                        <th className="px-4 py-3">Accepted Qty</th>
                                        <th className="px-4 py-3">Inspected By</th>
                                        <th className="px-4 py-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {grns.map(grn => (
                                        <tr key={grn.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono font-bold text-emerald-700">{grn.grn_number}</td>
                                            <td className="px-4 py-3 font-mono text-slate-700">{grn.po_number}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-800">{grn.vendor_name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono">Inv: {grn.invoice_number}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(grn.received_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{grn.total_accepted_qty} Units</td>
                                            <td className="px-4 py-3 text-slate-700">{grn.inspected_by}</td>
                                            <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">{grn.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: CONSUMPTION TRACKING PER PROCEDURE */}
            {/* ======================================================== */}
            {activeTab === 'consumption' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Procedure-Level Consumable Costing & Utilization</h3>
                            <p className="text-xs text-slate-500">Track exact materials, implants, and drugs utilized per surgical case.</p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setIsRecordConsumptionOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Log Procedure Consumption
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {consumptions.map(c => (
                            <Card key={c.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                                <div className="flex items-start justify-between border-b pb-2">
                                    <div>
                                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                            {c.department}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-sm mt-1">{c.procedure_name}</h3>
                                        <p className="text-xs text-slate-600 font-medium mt-0.5">Surgeon: {c.operating_surgeon}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block">{new Date(c.consumed_at).toLocaleDateString()}</span>
                                        <span className="text-base font-bold text-emerald-700">₹{c.total_cost.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-xs text-slate-500">
                                        Patient: <strong className="text-slate-800">{c.patient_name}</strong> ({c.patient_uhid})
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Materials Consumed</div>
                                        {c.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-700">
                                                    {item.qty_used}x {item.item_name} <span className="text-slate-400 font-mono text-[10px]">({item.batch_number})</span>
                                                </span>
                                                <span className="font-semibold text-slate-800">₹{item.total_cost.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: IMPLANT TRACKING (UDI COMPLIANCE) */}
            {/* ======================================================== */}
            {activeTab === 'implants' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-1">
                                <Barcode className="h-4 w-4" /> FDA & CDSCO UDI Compliance
                            </div>
                            <h2 className="text-xl font-bold">Unique Device Identification (UDI) Implant Bank</h2>
                            <p className="text-indigo-100 text-xs mt-1 max-w-xl">
                                Permanent clinical traceability for high-risk implantable devices (cardiac stents, orthopedics, intraocular lenses, pacemakers) linked to patient UHID.
                            </p>
                        </div>

                        <Button
                            onClick={() => setIsRegisterImplantOpen(true)}
                            className="bg-white text-indigo-800 hover:bg-indigo-50 font-semibold shadow-md text-xs"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Register UDI Device
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {implants.map(imp => {
                            const isImplanted = imp.status === 'Implanted';
                            return (
                                <Card key={imp.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                                {imp.implant_type}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isImplanted
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {imp.status}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-2">{imp.device_name}</h3>
                                        <div className="text-xs text-slate-500 font-medium mt-0.5">Mfr: {imp.manufacturer}</div>

                                        {/* UDI Barcode Box */}
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono text-[10px] mt-2.5 space-y-1">
                                            <div className="text-slate-400 text-[9px] font-sans font-bold uppercase flex items-center gap-1">
                                                <QrCode className="h-2.5 w-2.5 text-indigo-600" /> UDI Format (DI + PI)
                                            </div>
                                            <div className="text-slate-800 break-all">{imp.full_udi_barcode}</div>
                                            <div className="flex justify-between text-slate-500 pt-1 border-t text-[9px]">
                                                <span>Lot: {imp.lot_number}</span>
                                                <span>SN: {imp.serial_number}</span>
                                                <span>Exp: {new Date(imp.expiry_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Patient Recipient Info */}
                                        {isImplanted && (
                                            <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-100 text-[11px] text-blue-900 mt-2">
                                                <div>Recipient: <strong>{imp.recipient_patient}</strong> ({imp.recipient_uhid})</div>
                                                <div>Surgeon: {imp.operating_surgeon}</div>
                                                <div>Date: {imp.surgery_date ? new Date(imp.surgery_date).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                        )}
                                    </div>

                                    {!isImplanted && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedImplantForLink(imp);
                                                setIsLinkImplantOpen(true);
                                            }}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 mt-2"
                                        >
                                            <HeartHandshake className="h-3.5 w-3.5 mr-1.5" /> Link to Surgery Patient
                                        </Button>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 1: ADD NEW SKU ITEM */}
            {/* ======================================================== */}
            <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title="Add New Inventory SKU">
                <form onSubmit={handleAddItemSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">SKU Code</label>
                            <Input
                                value={itemForm.item_code}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, item_code: e.target.value }))}
                                placeholder="e.g. MED-SURG-045"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Category</label>
                            <select
                                value={itemForm.category}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm(prev => ({ ...prev, category: e.target.value as any }))}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            >
                                <option value="medical">Medical</option>
                                <option value="non-medical">Non-Medical</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Item Name</label>
                        <Input
                            value={itemForm.item_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, item_name: e.target.value }))}
                            placeholder="e.g. Inj. Cefoperazone + Sulbactam 1.5g"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Sub-Category</label>
                            <select
                                value={itemForm.sub_category}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm(prev => ({ ...prev, sub_category: e.target.value as any }))}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            >
                                <option value="Pharmaceuticals">Pharmaceuticals</option>
                                <option value="Surgical Consumables">Surgical Consumables</option>
                                <option value="Implants & Ortho">Implants & Ortho</option>
                                <option value="Diagnostic Reagents">Diagnostic Reagents</option>
                                <option value="Housekeeping & Disinfectants">Housekeeping & Disinfectants</option>
                                <option value="Linen & Bedding">Linen & Bedding</option>
                                <option value="Facility & Engineering">Facility & Engineering</option>
                                <option value="IT & Admin">IT & Admin</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Unit of Measurement</label>
                            <Input
                                value={itemForm.unit}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="vials, boxes, units"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Initial Stock</label>
                            <Input
                                type="number"
                                value={itemForm.quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Min Buffer</label>
                            <Input
                                type="number"
                                value={itemForm.min_threshold}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, min_threshold: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Unit Cost (₹)</label>
                            <Input
                                type="number"
                                value={itemForm.unit_price}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Storage Location</label>
                        <Input
                            value={itemForm.location}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. Central Pharmacy Cold Storage"
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Item</Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* MODAL 2: CREATE PURCHASE ORDER */}
            {/* ======================================================== */}
            <Modal isOpen={isCreatePoOpen} onClose={() => setIsCreatePoOpen(false)} title="Create Purchase Order (PO)">
                <form onSubmit={handleCreatePoSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Select Vendor</label>
                        <select
                            value={poForm.vendor_id}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPoForm(prev => ({ ...prev, vendor_id: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            required
                        >
                            <option value="">Select Vendor...</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Item to Order</label>
                        <select
                            value={poForm.selectedItem}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPoForm(prev => ({ ...prev, selectedItem: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            required
                        >
                            <option value="">Select Item...</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>{i.item_name} (Curr: {i.quantity} {i.unit}) - ₹{i.unit_price}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Order Quantity</label>
                            <Input
                                type="number"
                                value={poForm.itemQty}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPoForm(prev => ({ ...prev, itemQty: Number(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Expected Delivery</label>
                            <Input
                                type="date"
                                value={poForm.expected_delivery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPoForm(prev => ({ ...prev, expected_delivery: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Procurement Notes</label>
                        <textarea
                            value={poForm.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPoForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            className="w-full rounded-md border border-slate-300 p-2 text-xs"
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsCreatePoOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Approve & Issue PO</Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* MODAL 3: PROCESS GRN (GOODS RECEIVED NOTE) */}
            {/* ======================================================== */}
            <Modal isOpen={isProcessGrnOpen} onClose={() => setIsProcessGrnOpen(false)} title="Process Goods Received Note (GRN)">
                <form onSubmit={handleProcessGrnSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Associated PO Number</label>
                            <select
                                value={grnForm.po_number}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const po = pos.find(p => p.po_number === e.target.value);
                                    setGrnForm(prev => ({
                                        ...prev,
                                        po_number: e.target.value,
                                        vendor_name: po?.vendor_name || prev.vendor_name,
                                        item_name: po?.items[0]?.item_name || prev.item_name
                                    }));
                                }}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                                required
                            >
                                <option value="">Select PO...</option>
                                {pos.map(p => (
                                    <option key={p.id} value={p.po_number}>{p.po_number} — {p.vendor_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Invoice / Challan No.</label>
                            <Input
                                value={grnForm.invoice_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                                placeholder="INV-2026-988"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Item Received</label>
                        <Input
                            value={grnForm.item_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, item_name: e.target.value }))}
                            placeholder="Item name matching stock catalog"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Batch Number</label>
                            <Input
                                value={grnForm.batch_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, batch_number: e.target.value }))}
                                placeholder="BTH-7701"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Expiry Date (FEFO)</label>
                            <Input
                                type="date"
                                value={grnForm.expiry_date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Qty Received</label>
                            <Input
                                type="number"
                                value={grnForm.qty_received}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, qty_received: Number(e.target.value) }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">QC Inspection Result</label>
                            <select
                                value={grnForm.qc_status}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGrnForm(prev => ({ ...prev, qc_status: e.target.value as any }))}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            >
                                <option value="Passed">Passed (Accept into Inventory)</option>
                                <option value="Quarantined">Quarantined (Packaging/Temp Failure)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Inspected By</label>
                            <Input
                                value={grnForm.inspected_by}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrnForm(prev => ({ ...prev, inspected_by: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsProcessGrnOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Accept & Add to Stock</Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* MODAL 4: RECORD PROCEDURE CONSUMPTION */}
            {/* ======================================================== */}
            <Modal isOpen={isRecordConsumptionOpen} onClose={() => setIsRecordConsumptionOpen(false)} title="Log Surgical / Clinical Consumption">
                <form onSubmit={handleRecordConsumptionSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Procedure Name</label>
                            <Input
                                value={consumptionForm.procedure_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumptionForm(prev => ({ ...prev, procedure_name: e.target.value }))}
                                placeholder="e.g. Laparoscopic Appendectomy"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Operating Surgeon</label>
                            <Input
                                value={consumptionForm.operating_surgeon}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumptionForm(prev => ({ ...prev, operating_surgeon: e.target.value }))}
                                placeholder="Dr. Surgeon Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Patient Full Name</label>
                            <Input
                                value={consumptionForm.patient_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumptionForm(prev => ({ ...prev, patient_name: e.target.value }))}
                                placeholder="Patient Name"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Patient UHID</label>
                            <Input
                                value={consumptionForm.patient_uhid}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumptionForm(prev => ({ ...prev, patient_uhid: e.target.value }))}
                                placeholder="UHID-2026-XXXX"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Select Item Consumed</label>
                            <select
                                value={consumptionForm.item_id}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConsumptionForm(prev => ({ ...prev, item_id: e.target.value }))}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                                required
                            >
                                <option value="">Select Item...</option>
                                {items.filter(i => i.quantity > 0).map(i => (
                                    <option key={i.id} value={i.id}>{i.item_name} (Avail: {i.quantity}) - ₹{i.unit_price}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Quantity Used</label>
                            <Input
                                type="number"
                                value={consumptionForm.qty_used}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumptionForm(prev => ({ ...prev, qty_used: Number(e.target.value) }))}
                                min={1}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsRecordConsumptionOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Record & Deduct Stock</Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* MODAL 5: REGISTER UDI IMPLANT */}
            {/* ======================================================== */}
            <Modal isOpen={isRegisterImplantOpen} onClose={() => setIsRegisterImplantOpen(false)} title="Register High-Risk Implant (UDI)">
                <form onSubmit={handleRegisterImplantSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Device Description</label>
                        <Input
                            value={implantForm.device_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, device_name: e.target.value }))}
                            placeholder="e.g. Onyx Frontier Coronary Stent 2.75x15mm"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Implant Category</label>
                            <select
                                value={implantForm.implant_type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImplantForm(prev => ({ ...prev, implant_type: e.target.value as any }))}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                            >
                                <option value="Cardiac Stent">Cardiac Stent</option>
                                <option value="Orthopedic Prosthesis">Orthopedic Prosthesis</option>
                                <option value="Intraocular Lens">Intraocular Lens</option>
                                <option value="Spinal Implant">Spinal Implant</option>
                                <option value="Pacemaker">Pacemaker</option>
                                <option value="Mesh / Vascular">Mesh / Vascular</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Manufacturer</label>
                            <Input
                                value={implantForm.manufacturer}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                                placeholder="Medtronic, J&J, Abbott"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Lot Number</label>
                            <Input
                                value={implantForm.lot_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, lot_number: e.target.value }))}
                                placeholder="LOT-9921"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Serial Number</label>
                            <Input
                                value={implantForm.serial_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, serial_number: e.target.value }))}
                                placeholder="SN-40291"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Expiry Date</label>
                            <Input
                                type="date"
                                value={implantForm.expiry_date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Device Identifier (UDI-DI GS1 Code)</label>
                        <Input
                            value={implantForm.udi_di}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImplantForm(prev => ({ ...prev, udi_di: e.target.value }))}
                            placeholder="(01)08717648219482"
                            required
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsRegisterImplantOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Register to Implant Vault</Button>
                    </div>
                </form>
            </Modal>

            {/* ======================================================== */}
            {/* MODAL 6: LINK IMPLANT TO PATIENT SURGERY */}
            {/* ======================================================== */}
            <Modal isOpen={isLinkImplantOpen} onClose={() => setIsLinkImplantOpen(false)} title={`Implant Traceability — ${selectedImplantForLink?.device_name || ''}`}>
                <form onSubmit={handleLinkImplantSubmit} className="space-y-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                        <div><strong>UDI Code:</strong> {selectedImplantForLink?.full_udi_barcode}</div>
                        <div><strong>Lot / Serial:</strong> {selectedImplantForLink?.lot_number} / {selectedImplantForLink?.serial_number}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Recipient Patient Name</label>
                        <Input
                            value={linkImplantForm.patientName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkImplantForm(prev => ({ ...prev, patientName: e.target.value }))}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Patient UHID</label>
                        <Input
                            value={linkImplantForm.patientUhid}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkImplantForm(prev => ({ ...prev, patientUhid: e.target.value }))}
                            placeholder="UHID-2026-4412"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Operating Surgeon</label>
                        <Input
                            value={linkImplantForm.doctorName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkImplantForm(prev => ({ ...prev, doctorName: e.target.value }))}
                            placeholder="Dr. Om Mayekar"
                            required
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsLinkImplantOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Confirm Implant Placement</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
