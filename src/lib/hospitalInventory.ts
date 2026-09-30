export interface InventoryBatch {
    batch_number: string;
    mfg_date: string;
    expiry_date: string;
    quantity: number;
    udi_code?: string;
    status: 'active' | 'quarantined' | 'expired';
}

export interface InventoryItem {
    id: string;
    item_code: string;
    item_name: string;
    category: 'medical' | 'non-medical';
    sub_category:
    | 'Pharmaceuticals'
    | 'Surgical Consumables'
    | 'Biomedical Equipment'
    | 'Diagnostic Reagents'
    | 'Implants & Ortho'
    | 'Housekeeping & Disinfectants'
    | 'Linen & Bedding'
    | 'Facility & Engineering'
    | 'IT & Admin';
    unit: string;
    quantity: number;
    min_threshold: number;
    reorder_qty: number;
    unit_price: number;
    location: string;
    batches: InventoryBatch[];
}

export interface Vendor {
    id: string;
    name: string;
    code: string;
    email: string;
    phone: string;
    gstin: string;
    category: string;
    rating: number; // 1-5
    payment_terms: string;
    status: 'active' | 'under_review' | 'blacklisted';
}

export interface PurchaseOrderItem {
    item_id: string;
    item_name: string;
    qty: number;
    unit_price: number;
    total: number;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    vendor_id: string;
    vendor_name: string;
    created_at: string;
    expected_delivery: string;
    status: 'Draft' | 'Approved' | 'Sent' | 'Partially Received' | 'Fulfilled' | 'Cancelled';
    items: PurchaseOrderItem[];
    total_amount: number;
    notes: string;
}

export interface GrnReceivedItem {
    item_name: string;
    batch_number: string;
    expiry_date: string;
    qty_received: number;
    qc_status: 'Passed' | 'Quarantined';
}

export interface GoodsReceivedNote {
    id: string;
    grn_number: string;
    po_number: string;
    vendor_name: string;
    invoice_number: string;
    received_date: string;
    inspected_by: string;
    items_received: GrnReceivedItem[];
    total_accepted_qty: number;
    remarks: string;
}

export interface ConsumedItemDetail {
    item_name: string;
    batch_number: string;
    qty_used: number;
    unit_price: number;
    total_cost: number;
}

export interface ProcedureConsumption {
    id: string;
    procedure_name: string;
    department: string;
    patient_name: string;
    patient_uhid: string;
    operating_surgeon: string;
    consumed_at: string;
    items: ConsumedItemDetail[];
    total_cost: number;
}

export interface ImplantRecord {
    id: string;
    device_name: string;
    udi_di: string;
    udi_pi: string;
    full_udi_barcode: string;
    implant_type: 'Cardiac Stent' | 'Orthopedic Prosthesis' | 'Intraocular Lens' | 'Spinal Implant' | 'Pacemaker' | 'Mesh / Vascular';
    manufacturer: string;
    lot_number: string;
    serial_number: string;
    expiry_date: string;
    recipient_patient?: string;
    recipient_uhid?: string;
    operating_surgeon?: string;
    surgery_date?: string;
    status: 'In Stock' | 'Implanted' | 'Explanted / Recalled';
}

const STORAGE_KEYS = {
    ITEMS: 'mediconnect_inventory_items_v2',
    VENDORS: 'mediconnect_inventory_vendors_v2',
    POS: 'mediconnect_inventory_pos_v2',
    GRNS: 'mediconnect_inventory_grns_v2',
    CONSUMPTIONS: 'mediconnect_inventory_consumptions_v2',
    IMPLANTS: 'mediconnect_inventory_implants_v2',
};

// Initial Seed Data
const INITIAL_ITEMS: InventoryItem[] = [
    {
        id: 'inv-med-01',
        item_code: 'MED-PHAR-001',
        item_name: 'Inj. Meropenem 1g IV',
        category: 'medical',
        sub_category: 'Pharmaceuticals',
        unit: 'vials',
        quantity: 240,
        min_threshold: 80,
        reorder_qty: 300,
        unit_price: 680,
        location: 'Central Pharmacy - Refrig A',
        batches: [
            { batch_number: 'MER-2401', mfg_date: '2025-01-10', expiry_date: '2026-10-15', quantity: 90, status: 'active' },
            { batch_number: 'MER-2402', mfg_date: '2025-04-12', expiry_date: '2027-04-30', quantity: 150, status: 'active' }
        ]
    },
    {
        id: 'inv-med-02',
        item_code: 'MED-PHAR-002',
        item_name: 'Inj. Heparin Sodium 25,000 IU',
        category: 'medical',
        sub_category: 'Pharmaceuticals',
        unit: 'vials',
        quantity: 65,
        min_threshold: 40,
        reorder_qty: 150,
        unit_price: 340,
        location: 'Cath Lab Satellite Drug Cabinet',
        batches: [
            { batch_number: 'HEP-881', mfg_date: '2025-02-01', expiry_date: '2026-11-01', quantity: 25, status: 'active' },
            { batch_number: 'HEP-902', mfg_date: '2025-06-15', expiry_date: '2027-06-15', quantity: 40, status: 'active' }
        ]
    },
    {
        id: 'inv-med-03',
        item_code: 'MED-SURG-011',
        item_name: 'Ethicon Vicryl 3-0 Polyglactin Suture',
        category: 'medical',
        sub_category: 'Surgical Consumables',
        unit: 'boxes (36s)',
        quantity: 42,
        min_threshold: 20,
        reorder_qty: 50,
        unit_price: 1850,
        location: 'Main OT Sterile Supply Depot',
        batches: [
            { batch_number: 'VIC-9931', mfg_date: '2025-03-01', expiry_date: '2028-02-28', quantity: 42, status: 'active' }
        ]
    },
    {
        id: 'inv-med-04',
        item_code: 'MED-SURG-012',
        item_name: 'Disposable Trocar 10mm Optical Laparoscopic',
        category: 'medical',
        sub_category: 'Surgical Consumables',
        unit: 'pcs',
        quantity: 18,
        min_threshold: 25,
        reorder_qty: 40,
        unit_price: 2400,
        location: 'Laparoscopy Equipment Bay',
        batches: [
            { batch_number: 'TRC-1092', mfg_date: '2025-01-20', expiry_date: '2027-01-19', quantity: 18, status: 'active' }
        ]
    },
    {
        id: 'inv-med-05',
        item_code: 'MED-IMP-001',
        item_name: 'Resolute Onyx Drug-Eluting Stent 3.0x18mm',
        category: 'medical',
        sub_category: 'Implants & Ortho',
        unit: 'units',
        quantity: 12,
        min_threshold: 6,
        reorder_qty: 15,
        unit_price: 28500,
        location: 'Cath Lab Clean Room Stent Vault',
        batches: [
            { batch_number: 'SN-DES-4412', mfg_date: '2025-05-10', expiry_date: '2027-05-09', quantity: 12, udi_code: '(01)08717648219482(17)270509(10)LOT7891(21)SN449102', status: 'active' }
        ]
    },
    {
        id: 'inv-med-06',
        item_code: 'MED-IMP-002',
        item_name: 'Tri-Lock Bipolar Femoral Stem Orthopedic (Size 3)',
        category: 'medical',
        sub_category: 'Implants & Ortho',
        unit: 'units',
        quantity: 5,
        min_threshold: 4,
        reorder_qty: 8,
        unit_price: 45000,
        location: 'Orthopedic Implant Bank - OT 3',
        batches: [
            { batch_number: 'DEP-ORT-220', mfg_date: '2025-02-14', expiry_date: '2029-02-13', quantity: 5, udi_code: '(01)08412345678901(17)290213(10)LOT4928(21)SN88921', status: 'active' }
        ]
    },
    {
        id: 'inv-med-07',
        item_code: 'MED-DIAG-005',
        item_name: 'Troponin-I High-Sensitivity Rapid Test Kits',
        category: 'medical',
        sub_category: 'Diagnostic Reagents',
        unit: 'kits (50s)',
        quantity: 14,
        min_threshold: 10,
        reorder_qty: 25,
        unit_price: 4200,
        location: 'Emergency Pathology Sub-lab',
        batches: [
            { batch_number: 'TROP-3301', mfg_date: '2025-08-01', expiry_date: '2026-10-25', quantity: 4, status: 'active' }, // Critical FEFO
            { batch_number: 'TROP-3302', mfg_date: '2025-11-15', expiry_date: '2027-03-31', quantity: 10, status: 'active' }
        ]
    },
    // Non-Medical Inventory
    {
        id: 'inv-nmed-01',
        item_code: 'NMED-HSK-001',
        item_name: 'Virex II 256 Hospital Grade Disinfectant 5L',
        category: 'non-medical',
        sub_category: 'Housekeeping & Disinfectants',
        unit: 'cans (5L)',
        quantity: 48,
        min_threshold: 20,
        reorder_qty: 60,
        unit_price: 1450,
        location: 'Housekeeping Central Store - Basement',
        batches: [
            { batch_number: 'VRX-801', mfg_date: '2025-04-01', expiry_date: '2027-03-31', quantity: 48, status: 'active' }
        ]
    },
    {
        id: 'inv-nmed-02',
        item_code: 'NMED-LIN-002',
        item_name: 'Antimicrobial Inpatient Bed Sheets (Blue)',
        category: 'non-medical',
        sub_category: 'Linen & Bedding',
        unit: 'sets',
        quantity: 320,
        min_threshold: 150,
        reorder_qty: 200,
        unit_price: 420,
        location: 'Linen Master Closet - 1st Floor',
        batches: [
            { batch_number: 'LIN-2025-08', mfg_date: '2025-08-15', expiry_date: '2030-08-15', quantity: 320, status: 'active' }
        ]
    },
    {
        id: 'inv-nmed-03',
        item_code: 'NMED-ENG-008',
        item_name: 'Medical Grade Oxygen Flowmeter Regulator Brass',
        category: 'non-medical',
        sub_category: 'Facility & Engineering',
        unit: 'units',
        quantity: 26,
        min_threshold: 15,
        reorder_qty: 30,
        unit_price: 1850,
        location: 'Biomedical Engineering Workshop',
        batches: [
            { batch_number: 'O2-REG-104', mfg_date: '2025-01-05', expiry_date: '2035-01-01', quantity: 26, status: 'active' }
        ]
    },
    {
        id: 'inv-nmed-04',
        item_code: 'NMED-IT-004',
        item_name: 'Thermal Barcode Wristband Rolls for IPD',
        category: 'non-medical',
        sub_category: 'IT & Admin',
        unit: 'rolls (500s)',
        quantity: 35,
        min_threshold: 15,
        reorder_qty: 50,
        unit_price: 650,
        location: 'Hospital IT Store - Ground Floor',
        batches: [
            { batch_number: 'WBD-5591', mfg_date: '2025-06-01', expiry_date: '2028-06-01', quantity: 35, status: 'active' }
        ]
    }
];

const INITIAL_VENDORS: Vendor[] = [
    {
        id: 'vnd-01',
        name: 'Apollo Medical Supplies & Pharma Corp',
        code: 'VND-APO-101',
        email: 'orders@apollomedsupply.com',
        phone: '+91 22 2847 9901',
        gstin: '27AAAAA0000A1Z5',
        category: 'Pharmaceuticals & Injectables',
        rating: 4.8,
        payment_terms: 'Net 30 Days',
        status: 'active'
    },
    {
        id: 'vnd-02',
        name: 'Medtronic Vascular & Implant Devices',
        code: 'VND-MDT-204',
        email: 'hospital.support@medtronic.com',
        phone: '+91 11 4120 7700',
        gstin: '27BBBBB1111B2Z3',
        category: 'Cardiac & Neuro Implants',
        rating: 4.9,
        payment_terms: 'Net 45 Days',
        status: 'active'
    },
    {
        id: 'vnd-03',
        name: 'Johnson & Johnson MedTech Surgical',
        code: 'VND-JNJ-308',
        email: 'supplychain@jnjmedtech.com',
        phone: '+91 22 6664 3000',
        gstin: '27CCCCC2222C3Z1',
        category: 'Sutures, Mesh & Orthopedics',
        rating: 4.7,
        payment_terms: 'Net 30 Days',
        status: 'active'
    },
    {
        id: 'vnd-04',
        name: 'Diversey Hygiene & Facility Solutions',
        code: 'VND-DIV-402',
        email: 'institutional@diversey.com',
        phone: '+91 22 3980 4000',
        gstin: '27DDDDD3333D4Z9',
        category: 'Housekeeping & Disinfectants',
        rating: 4.5,
        payment_terms: 'Net 15 Days',
        status: 'active'
    }
];

const INITIAL_POS: PurchaseOrder[] = [
    {
        id: 'po-01',
        po_number: 'PO-2026-0891',
        vendor_id: 'vnd-01',
        vendor_name: 'Apollo Medical Supplies & Pharma Corp',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        expected_delivery: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'Approved',
        items: [
            { item_id: 'inv-med-01', item_name: 'Inj. Meropenem 1g IV', qty: 200, unit_price: 680, total: 136000 },
            { item_id: 'inv-med-02', item_name: 'Inj. Heparin Sodium 25,000 IU', qty: 100, unit_price: 340, total: 34000 }
        ],
        total_amount: 170000,
        notes: 'Priority emergency stock replenishment for Intensive Care and High Dependency Units.'
    },
    {
        id: 'po-02',
        po_number: 'PO-2026-0892',
        vendor_id: 'vnd-02',
        vendor_name: 'Medtronic Vascular & Implant Devices',
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        expected_delivery: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'Fulfilled',
        items: [
            { item_id: 'inv-med-05', item_name: 'Resolute Onyx Drug-Eluting Stent 3.0x18mm', qty: 8, unit_price: 28500, total: 228000 }
        ],
        total_amount: 228000,
        notes: 'UDI barcode compliance certificate mandatory with shipping consignment.'
    }
];

const INITIAL_GRNS: GoodsReceivedNote[] = [
    {
        id: 'grn-01',
        grn_number: 'GRN-2026-4412',
        po_number: 'PO-2026-0892',
        vendor_name: 'Medtronic Vascular & Implant Devices',
        invoice_number: 'INV-MDT-88912',
        received_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        inspected_by: 'Pharmacist R. Kulkarni (Quality Inspector)',
        items_received: [
            { item_name: 'Resolute Onyx Drug-Eluting Stent 3.0x18mm', batch_number: 'SN-DES-4412', expiry_date: '2027-05-09', qty_received: 8, qc_status: 'Passed' }
        ],
        total_accepted_qty: 8,
        remarks: 'Cold-chain telemetry intact, UDI DI/PI verification passed GS1 scan verification.'
    }
];

const INITIAL_CONSUMPTIONS: ProcedureConsumption[] = [
    {
        id: 'proc-con-01',
        procedure_name: 'Laparoscopic Cholecystectomy',
        department: 'Operation Theater 2',
        patient_name: 'Suresh Patil',
        patient_uhid: 'UHID-2026-4891',
        operating_surgeon: 'Dr. Vivek Sharma (General Surgeon)',
        consumed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        items: [
            { item_name: 'Disposable Trocar 10mm Optical', batch_number: 'TRC-1092', qty_used: 2, unit_price: 2400, total_cost: 4800 },
            { item_name: 'Ethicon Vicryl 3-0 Suture', batch_number: 'VIC-9931', qty_used: 1, unit_price: 1850, total_cost: 1850 },
            { item_name: 'Inj. Meropenem 1g IV', batch_number: 'MER-2401', qty_used: 1, unit_price: 680, total_cost: 680 }
        ],
        total_cost: 7330
    },
    {
        id: 'proc-con-02',
        procedure_name: 'Percutaneous Coronary Intervention (PCI)',
        department: 'Cath Lab Suite',
        patient_name: 'Joshua Clement',
        patient_uhid: 'UHID-2026-1049',
        operating_surgeon: 'Dr. Om Mayekar (Interventional Cardiologist)',
        consumed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        items: [
            { item_name: 'Resolute Onyx Drug-Eluting Stent 3.0x18mm', batch_number: 'SN-DES-4412', qty_used: 1, unit_price: 28500, total_cost: 28500 },
            { item_name: 'Inj. Heparin Sodium 25,000 IU', batch_number: 'HEP-881', qty_used: 2, unit_price: 340, total_cost: 680 }
        ],
        total_cost: 29180
    }
];

const INITIAL_IMPLANTS: ImplantRecord[] = [
    {
        id: 'imp-01',
        device_name: 'Resolute Onyx Zotarolimus-Eluting Coronary Stent 3.0x18mm',
        udi_di: '(01)08717648219482',
        udi_pi: '(17)270509(10)LOT7891(21)SN449102',
        full_udi_barcode: '(01)08717648219482(17)270509(10)LOT7891(21)SN449102',
        implant_type: 'Cardiac Stent',
        manufacturer: 'Medtronic Ireland Ltd.',
        lot_number: 'LOT7891',
        serial_number: 'SN449102',
        expiry_date: '2027-05-09',
        recipient_patient: 'Joshua Clement',
        recipient_uhid: 'UHID-2026-1049',
        operating_surgeon: 'Dr. Om Mayekar',
        surgery_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'Implanted'
    },
    {
        id: 'imp-02',
        device_name: 'Tri-Lock Bipolar Femoral Stem Orthopedic (Size 3)',
        udi_di: '(01)08412345678901',
        udi_pi: '(17)290213(10)LOT4928(21)SN88921',
        full_udi_barcode: '(01)08412345678901(17)290213(10)LOT4928(21)SN88921',
        implant_type: 'Orthopedic Prosthesis',
        manufacturer: 'DePuy Synthes / Johnson & Johnson',
        lot_number: 'LOT4928',
        serial_number: 'SN88921',
        expiry_date: '2029-02-13',
        status: 'In Stock'
    },
    {
        id: 'imp-03',
        device_name: 'AcrySof IQ Monofocal Intraocular Lens +21.5D',
        udi_di: '(01)00842795000194',
        udi_pi: '(17)280930(10)IOL9901(21)SN12093',
        full_udi_barcode: '(01)00842795000194(17)280930(10)IOL9901(21)SN12093',
        implant_type: 'Intraocular Lens',
        manufacturer: 'Alcon Laboratories',
        lot_number: 'IOL9901',
        serial_number: 'SN12093',
        expiry_date: '2028-09-30',
        status: 'In Stock'
    }
];

export const HospitalInventoryService = {
    // ----------------- ITEMS -----------------
    getItems(): InventoryItem[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
                return INITIAL_ITEMS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_ITEMS;
        }
    },

    saveItems(items: InventoryItem[]) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    },

    addItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
        const items = this.getItems();
        const newItem: InventoryItem = {
            ...item,
            id: `inv-${Date.now()}`
        };
        items.unshift(newItem);
        this.saveItems(items);
        return newItem;
    },

    updateStock(itemId: string, newQty: number): boolean {
        const items = this.getItems();
        const item = items.find(i => i.id === itemId);
        if (item) {
            item.quantity = newQty;
            this.saveItems(items);
            return true;
        }
        return false;
    },

    quarantineBatch(itemId: string, batchNumber: string): boolean {
        const items = this.getItems();
        const item = items.find(i => i.id === itemId);
        if (item) {
            const b = item.batches.find(batch => batch.batch_number === batchNumber);
            if (b) {
                b.status = 'quarantined';
                item.quantity = Math.max(0, item.quantity - b.quantity);
                this.saveItems(items);
                return true;
            }
        }
        return false;
    },

    // ----------------- VENDORS -----------------
    getVendors(): Vendor[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
                return INITIAL_VENDORS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_VENDORS;
        }
    },

    saveVendors(vendors: Vendor[]) {
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    },

    addVendor(vendor: Omit<Vendor, 'id'>): Vendor {
        const vendors = this.getVendors();
        const newVendor: Vendor = {
            ...vendor,
            id: `vnd-${Date.now()}`
        };
        vendors.unshift(newVendor);
        this.saveVendors(vendors);
        return newVendor;
    },

    // ----------------- PURCHASE ORDERS -----------------
    getPOs(): PurchaseOrder[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.POS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(INITIAL_POS));
                return INITIAL_POS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_POS;
        }
    },

    savePOs(pos: PurchaseOrder[]) {
        localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(pos));
    },

    createPO(po: Omit<PurchaseOrder, 'id' | 'po_number' | 'created_at'>): PurchaseOrder {
        const pos = this.getPOs();
        const newPO: PurchaseOrder = {
            ...po,
            id: `po-${Date.now()}`,
            po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            created_at: new Date().toISOString()
        };
        pos.unshift(newPO);
        this.savePOs(pos);
        return newPO;
    },

    updatePOStatus(poId: string, status: PurchaseOrder['status']): boolean {
        const pos = this.getPOs();
        const po = pos.find(p => p.id === poId);
        if (po) {
            po.status = status;
            this.savePOs(pos);
            return true;
        }
        return false;
    },

    // ----------------- GRN (GOODS RECEIVED NOTE) -----------------
    getGRNs(): GoodsReceivedNote[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.GRNS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.GRNS, JSON.stringify(INITIAL_GRNS));
                return INITIAL_GRNS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_GRNS;
        }
    },

    saveGRNs(grns: GoodsReceivedNote[]) {
        localStorage.setItem(STORAGE_KEYS.GRNS, JSON.stringify(grns));
    },

    processGRN(grn: Omit<GoodsReceivedNote, 'id' | 'grn_number' | 'received_date'>): GoodsReceivedNote {
        const grns = this.getGRNs();
        const newGRN: GoodsReceivedNote = {
            ...grn,
            id: `grn-${Date.now()}`,
            grn_number: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            received_date: new Date().toISOString()
        };
        grns.unshift(newGRN);
        this.saveGRNs(grns);

        // Auto-increment inventory items stock and append batches
        const items = this.getItems();
        newGRN.items_received.forEach(received => {
            if (received.qc_status === 'Passed') {
                const item = items.find(i => i.item_name.toLowerCase().includes(received.item_name.toLowerCase()) || received.item_name.toLowerCase().includes(i.item_name.toLowerCase()));
                if (item) {
                    item.quantity += received.qty_received;
                    item.batches.push({
                        batch_number: received.batch_number,
                        mfg_date: new Date().toISOString().slice(0, 10),
                        expiry_date: received.expiry_date,
                        quantity: received.qty_received,
                        status: 'active'
                    });
                }
            }
        });
        this.saveItems(items);

        // Mark associated PO as Fulfilled
        const pos = this.getPOs();
        const po = pos.find(p => p.po_number === grn.po_number);
        if (po) {
            po.status = 'Fulfilled';
            this.savePOs(pos);
        }

        return newGRN;
    },

    // ----------------- PROCEDURE CONSUMPTION -----------------
    getConsumptions(): ProcedureConsumption[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CONSUMPTIONS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.CONSUMPTIONS, JSON.stringify(INITIAL_CONSUMPTIONS));
                return INITIAL_CONSUMPTIONS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_CONSUMPTIONS;
        }
    },

    saveConsumptions(consumptions: ProcedureConsumption[]) {
        localStorage.setItem(STORAGE_KEYS.CONSUMPTIONS, JSON.stringify(consumptions));
    },

    recordConsumption(record: Omit<ProcedureConsumption, 'id' | 'consumed_at'>): ProcedureConsumption {
        const consumptions = this.getConsumptions();
        const newRecord: ProcedureConsumption = {
            ...record,
            id: `proc-con-${Date.now()}`,
            consumed_at: new Date().toISOString()
        };
        consumptions.unshift(newRecord);
        this.saveConsumptions(consumptions);

        // Deduct from inventory stock (FEFO priority)
        const items = this.getItems();
        newRecord.items.forEach(consumed => {
            const item = items.find(i => i.item_name.toLowerCase() === consumed.item_name.toLowerCase());
            if (item) {
                item.quantity = Math.max(0, item.quantity - consumed.qty_used);
                // Also deduct from specific batch if found
                const batch = item.batches.find(b => b.batch_number === consumed.batch_number);
                if (batch) {
                    batch.quantity = Math.max(0, batch.quantity - consumed.qty_used);
                }
            }
        });
        this.saveItems(items);

        return newRecord;
    },

    // ----------------- IMPLANTS (UDI COMPLIANCE) -----------------
    getImplants(): ImplantRecord[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.IMPLANTS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.IMPLANTS, JSON.stringify(INITIAL_IMPLANTS));
                return INITIAL_IMPLANTS;
            }
            return JSON.parse(raw);
        } catch {
            return INITIAL_IMPLANTS;
        }
    },

    saveImplants(implants: ImplantRecord[]) {
        localStorage.setItem(STORAGE_KEYS.IMPLANTS, JSON.stringify(implants));
    },

    registerImplant(implant: Omit<ImplantRecord, 'id'>): ImplantRecord {
        const implants = this.getImplants();
        const newImplant: ImplantRecord = {
            ...implant,
            id: `imp-${Date.now()}`
        };
        implants.unshift(newImplant);
        this.saveImplants(implants);
        return newImplant;
    },

    linkImplantToPatient(implantId: string, details: { patientName: string; patientUhid: string; doctorName: string }): boolean {
        const implants = this.getImplants();
        const imp = implants.find(i => i.id === implantId);
        if (imp) {
            imp.recipient_patient = details.patientName;
            imp.recipient_uhid = details.patientUhid;
            imp.operating_surgeon = details.doctorName;
            imp.surgery_date = new Date().toISOString();
            imp.status = 'Implanted';
            this.saveImplants(implants);
            return true;
        }
        return false;
    }
};
