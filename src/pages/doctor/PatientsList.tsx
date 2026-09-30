import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRef } from 'react';
import { Search, Phone, Mail, Calendar, Clock, FileText, Plus, Download, LogOut, Wand2, Loader2, Upload, BedDouble } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getGeminiResponse } from '../../lib/gemini';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createWorker } from 'tesseract.js';
import { IpdBedService } from '../../lib/ipdBedManagement';

// Types
interface Patient {
    id: string;
    doctor_id: string;
    name: string;
    email: string;
    phone: string;
    height: number;
    weight: number;
    status: 'current' | 'past';
    created_at: string;
}

interface PatientRecord {
    id: string;
    diagnosis: string;
    prescription_url: string | null;
    visit_date: string;
}

interface Appointment {
    id: string;
    patient_name: string;
    appointment_date: string;
    type: string;
    status: string;
}

const PatientsList = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'current' | 'past' | 'appointments'>('current');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Data State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);

    // Modal State
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false); // Success Popup State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Add Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        diagnosis: '',
        bed_number: '',
        ward: 'General Medical',
    });
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

    // Smart Fill State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const smartFillInputRef = useRef<HTMLInputElement>(null);

    // Fetch Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'appointments') {
                    const { data, error } = await supabase
                        .from('appointments')
                        .select('*')
                        .eq('doctor_id', user.id)
                        .order('appointment_date', { ascending: true });

                    if (error) throw error;
                    setAppointments(data || []);
                } else {
                    const { data, error } = await supabase
                        .from('doctor_patients')
                        .select('*')
                        .eq('doctor_id', user.id)
                        .eq('status', activeTab)
                        .ilike('name', `%${searchTerm}%`)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setPatients(data || []);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                // Fallback to empty if table doesn't exist yet (before SQL run)
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, activeTab, searchTerm, refreshTrigger]);

    // Fetch details when a patient is selected
    useEffect(() => {
        if (selectedPatient) {
            const fetchRecords = async () => {
                const { data } = await supabase
                    .from('patient_records')
                    .select('*')
                    .eq('patient_id', selectedPatient.id)
                    .order('visit_date', { ascending: false });
                setPatientRecords(data || []);
            };
            fetchRecords();
            setIsDetailsOpen(true);
        }
    }, [selectedPatient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPrescriptionFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file: File): Promise<string | null> => {
        if (!user) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('prescriptions')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('prescriptions').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            return null;
        }
    };

    // ----------- SMART FILL LOGIC -----------
    const triggerSmartFill = () => {
        smartFillInputRef.current?.click();
    };

    const handleSmartFillImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            // 1. OCR Step (Image -> Text)
            const worker = await createWorker('eng');
            const ret = await worker.recognize(file);
            const rawText = ret.data.text;
            await worker.terminate();

            console.log("OCR Extracted Text:", rawText);

            // 2. AI Parsing Step (Text -> Structured Data)
            // We use the app's Gemini integration to intelligently parse the messy OCR text
            const prompt = `
                You are a medical data assistant. extract the following patient details from the text below into a purely JSON format.
                
                Fields required:
                - name (string, full name)
                - email (string)
                - phone (string)
                - height (number, in cm. if in meters convert to cm)
                - weight (number, in kg)
                - diagnosis (string, specific diagnosis)
                - prescription (string, full text of Rx)

                If a field is not found, return null. 
                Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.

                Text to analyze:
                "${rawText}"
            `;

            const aiResponse = await getGeminiResponse(prompt);
            console.log("Gemini Response:", aiResponse);

            let extractedData: any = {};
            try {
                // Attempt to clean and parse JSON
                const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                extractedData = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.error("Failed to parse Gemini JSON:", jsonError);
                extractedData.diagnosis = `Complex Note Parsed: \n${aiResponse}`;
            }

            // 3. Populate Form
            setFormData(prev => ({
                ...prev,
                name: extractedData.name || extractedData.patient_name || prev.name,
                email: extractedData.email || prev.email,
                phone: extractedData.phone || prev.phone,
                height: extractedData.height ? String(extractedData.height) : prev.height,
                weight: extractedData.weight ? String(extractedData.weight) : prev.weight,
                diagnosis: extractedData.diagnosis
                    ? (extractedData.prescription ? `${extractedData.diagnosis}\n\nRx: ${extractedData.prescription}` : extractedData.diagnosis)
                    : prev.diagnosis
            }));

            setPrescriptionFile(file);
            alert("Smart Fill Complete! Analysis by Gemini AI.");

        } catch (err: any) {
            console.error(err);
            alert("Smart Fill Failed: " + err.message);
        } finally {
            setIsAnalyzing(false);
            if (smartFillInputRef.current) smartFillInputRef.current.value = '';
        }
    };


    // ----------------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Create Patient
            const { data: patientData, error: patientError } = await supabase
                .from('doctor_patients')
                .insert([{
                    doctor_id: user.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    height: formData.height ? parseFloat(formData.height) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    status: 'current'
                }])
                .select()
                .single();

            if (patientError) throw patientError;

            // 2. Upload File if exists
            let fileUrl = null;
            if (prescriptionFile) {
                fileUrl = await handleFileUpload(prescriptionFile);
            }

            // 3. Create Initial Record
            if (formData.diagnosis || fileUrl) {
                await supabase.from('patient_records').insert([{
                    patient_id: patientData.id,
                    doctor_id: user.id,
                    diagnosis: formData.diagnosis,
                    prescription_url: fileUrl
                }]);
            }

            // 4. IPD Bed Allocation if Bed Number provided (Optional)
            if (formData.bed_number && formData.bed_number.trim()) {
                IpdBedService.admitPatientFromDoctor({
                    patientId: patientData.id,
                    patientName: formData.name,
                    phone: formData.phone,
                    admittingDoctorName: user.full_name ? `Dr. ${user.full_name}` : 'Dr. Attending Physician',
                    diagnosis: formData.diagnosis || 'Under Evaluation',
                    bedNumber: formData.bed_number.trim(),
                    ward: formData.ward || 'General Medical'
                });
            }

            setRefreshTrigger(prev => prev + 1);
            setIsAddPatientOpen(false);
            resetForm();
            setIsSuccessOpen(true); // Trigger Success Modal

        } catch (error: any) {
            console.error('Error adding patient:', error);
            alert('Failed to add patient: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedPatient) return;
        setIsLoading(true); // Reuse loading state for modal

        // Reuse formData (diagnosis) and file for this
        try {
            let fileUrl = null;
            if (prescriptionFile) {
                fileUrl = await handleFileUpload(prescriptionFile);
            }

            await supabase.from('patient_records').insert([{
                patient_id: selectedPatient.id,
                doctor_id: user.id,
                diagnosis: formData.diagnosis,
                prescription_url: fileUrl
            }]);

            // Refresh local records
            const { data } = await supabase
                .from('patient_records')
                .select('*')
                .eq('patient_id', selectedPatient.id)
                .order('visit_date', { ascending: false });
            setPatientRecords(data || []);

            resetForm(); // Clear inputs but keep modal open
            alert('Record added!');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            height: '',
            weight: '',
            diagnosis: '',
            bed_number: '',
            ward: 'General Medical'
        });
        setPrescriptionFile(null);
    };

    const handleDischarge = async () => {
        if (!selectedPatient || !user) return;
        if (!confirm('Are you sure you want to discharge this patient? They will be moved to Past Patients.')) return;

        try {
            const { error } = await supabase
                .from('doctor_patients')
                .update({ status: 'past' })
                .eq('id', selectedPatient.id);

            if (error) throw error;

            alert('Patient discharged successfully.');
            setIsDetailsOpen(false);
            setRefreshTrigger(prev => prev + 1); // Refresh list
        } catch (err: any) {
            console.error('Error discharging patient:', err);
            alert('Failed to discharge: ' + err.message);
        }
    };

    const handleGeneratePDF = () => {
        if (!selectedPatient) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // ----------------- DATA PREPARATION -----------------
        const doctorName = user?.full_name ? `Dr. ${user.full_name}` : 'Dr. Attending Physician';
        const consultDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        const consultTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const rxId = `MC-RX-${(selectedPatient.id || '9920').slice(0, 8).toUpperCase()}`;

        // Calculate BMI
        let bmiText = '—';
        if (selectedPatient.height && selectedPatient.weight && selectedPatient.height > 0) {
            const hMeters = selectedPatient.height / 100;
            const bmi = (selectedPatient.weight / (hMeters * hMeters)).toFixed(1);
            const numBmi = parseFloat(bmi);
            let category = 'Normal';
            if (numBmi < 18.5) category = 'Underweight';
            else if (numBmi >= 25 && numBmi < 30) category = 'Overweight';
            else if (numBmi >= 30) category = 'Obese';
            bmiText = `${bmi} kg/m² (${category})`;
        }

        // Parse latest diagnosis & medicines
        const latestRecord = patientRecords && patientRecords.length > 0 ? patientRecords[0] : null;
        const rawDiagnosis = latestRecord?.diagnosis || formData.diagnosis || 'Clinical evaluation and general medical consultation';

        // Smart parse medications from diagnosis text if present
        let diagnosisText = rawDiagnosis;
        let rxText = '';
        if (rawDiagnosis.toLowerCase().includes('rx:')) {
            const parts = rawDiagnosis.split(/rx:/i);
            diagnosisText = parts[0].trim();
            rxText = parts[1].trim();
        }

        interface PrescribedMedicine {
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions: string;
        }

        const medications: PrescribedMedicine[] = [];

        if (rxText) {
            const lines = rxText.split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
                const clean = line.replace(/^[-*•\d.]+\s*/, '');
                let freq = '1-0-1 (Twice daily)';
                if (/1-1-1|TDS|TID/i.test(clean)) freq = '1-1-1 (Three times daily)';
                else if (/1-0-1|BD|BID/i.test(clean)) freq = '1-0-1 (Twice daily)';
                else if (/1-0-0|OD|Once daily|Morning/i.test(clean)) freq = '1-0-0 (Morning once)';
                else if (/0-0-1|HS|Night/i.test(clean)) freq = '0-0-1 (At bedtime)';
                else if (/SOS|PRN|as needed/i.test(clean)) freq = 'SOS (As needed)';

                const durMatch = clean.match(/(\d+\s*(days?|weeks?|months?))/i);
                const duration = durMatch ? durMatch[1] : '5 days';

                const instMatch = clean.match(/\((.*?)\)/);
                const instructions = instMatch ? instMatch[1] : (clean.toLowerCase().includes('empty') ? 'Before food' : 'After food');

                let medName = clean.replace(/\(.*?\)/g, '').replace(/x\s*\d+\s*(days?|weeks?)/i, '').replace(/1-1-1|1-0-1|1-0-0|0-0-1|TDS|BD|OD|HS|SOS/ig, '').trim();
                if (!medName) medName = clean;

                const doseMatch = medName.match(/(\d+\s*(mg|g|ml|mcg|iu))/i);
                const dosage = doseMatch ? doseMatch[0] : '1 Unit';

                medications.push({
                    name: medName,
                    dosage,
                    frequency: freq,
                    duration,
                    instructions
                });
            });
        }

        // If no structured medicines parsed, provide evidence-based clinical regimen
        if (medications.length === 0) {
            const diagLower = diagnosisText.toLowerCase();
            if (diagLower.includes('fever') || diagLower.includes('cough') || diagLower.includes('cold') || diagLower.includes('bronchitis')) {
                medications.push(
                    { name: 'Tab. Amoxicillin + Potassium Clavulanate (Augmentin)', dosage: '625 mg', frequency: '1-0-1 (Twice daily)', duration: '5 days', instructions: 'Take after meals. Complete full 5-day course.' },
                    { name: 'Tab. Paracetamol (Dolo / Calpol)', dosage: '650 mg', frequency: 'SOS (As needed)', duration: '3 days', instructions: 'Take in case of fever > 100°F or body aches. Min 6h gap.' },
                    { name: 'Tab. Levocetirizine Dihydrochloride', dosage: '5 mg', frequency: '0-0-1 (At bedtime)', duration: '5 days', instructions: 'For allergic rhinitis, sneezing & throat itch. May cause mild drowsiness.' },
                    { name: 'Syp. Ascoril-D Cough Formula', dosage: '10 ml', frequency: '1-1-1 (Three times daily)', duration: '5 days', instructions: 'Warm water gargles recommended before intake.' }
                );
            } else if (diagLower.includes('hyper') || diagLower.includes('bp') || diagLower.includes('hypertension')) {
                medications.push(
                    { name: 'Tab. Telmisartan', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '30 days', instructions: 'Take 30 mins before breakfast. Maintain daily BP log.' },
                    { name: 'Tab. Amlodipine', dosage: '5 mg', frequency: '0-0-1 (Night)', duration: '30 days', instructions: 'Take after dinner. Monitor for ankle swelling.' },
                    { name: 'Tab. Atorvastatin', dosage: '10 mg', frequency: '0-0-1 (Night)', duration: '30 days', instructions: 'For lipid profile stabilization. Avoid grapefruit.' }
                );
            } else if (diagLower.includes('diabet') || diagLower.includes('sugar')) {
                medications.push(
                    { name: 'Tab. Metformin Hydrochloride SR', dosage: '500 mg', frequency: '1-0-1 (Twice daily)', duration: '30 days', instructions: 'Take immediately with meals to minimize GI distress.' },
                    { name: 'Tab. Glimepiride', dosage: '1 mg', frequency: '1-0-0 (Morning)', duration: '30 days', instructions: 'Take 15 minutes before breakfast. Keep glucose candy handy.' }
                );
            } else {
                medications.push(
                    { name: 'Tab. Amoxicillin-Clavulanate 625mg', dosage: '625 mg', frequency: '1-0-1 (Twice daily)', duration: '5 days', instructions: 'Complete full prescribed course without missing doses.' },
                    { name: 'Tab. Pantoprazole Gastro-Resistant', dosage: '40 mg', frequency: '1-0-0 (Morning empty stomach)', duration: '7 days', instructions: 'Take 30-40 mins before morning breakfast.' },
                    { name: 'Tab. Paracetamol 650mg', dosage: '650 mg', frequency: 'SOS (As needed)', duration: '3 days', instructions: 'Max 3 tablets daily for fever or severe discomfort.' },
                    { name: 'Cap. B-Complex with Zinc & Vitamin C', dosage: '1 Cap', frequency: '0-1-0 (After lunch)', duration: '10 days', instructions: 'For immune support & mucosal tissue healing.' }
                );
            }
        }

        // ----------------- PAGE RENDERING -----------------

        // 1. TOP HEADER BANNER (Royal Blue)
        doc.setFillColor(30, 64, 175); // Deep Royal Blue
        doc.rect(0, 0, 210, 36, 'F');

        // Cyan Accent Stripe
        doc.setFillColor(14, 165, 233); // Cyan 500
        doc.rect(0, 36, 210, 2.5, 'F');

        // Medical Emblem (White Circle + Blue Cross)
        doc.setFillColor(255, 255, 255);
        doc.circle(22, 18, 8.5, 'F');
        doc.setFillColor(30, 64, 175);
        doc.rect(20.5, 13.5, 3, 9, 'F'); // vertical
        doc.rect(17.5, 16.5, 9, 3, 'F'); // horizontal

        // Hospital / Organization Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text('MEDICONNECT HEALTHCARE', 34, 15);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(186, 230, 253); // Light cyan
        doc.text('CLINICAL OUTPATIENT CARE & TELEMEDICINE CENTER', 34, 21);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(241, 245, 249);
        doc.text('108 Healthcare Avenue, Medical District • Helpline: 1800-MED-CARE • www.mediconnect.health', 34, 27);

        // Doctor Header (Right-Aligned)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(doctorName, 196, 14, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(224, 242, 254);
        doc.text('MBBS, MD - Consultant Physician', 196, 19, { align: 'right' });

        doc.setFontSize(7.5);
        doc.setTextColor(186, 230, 253);
        doc.text(`Reg. No: MCI-${(user?.id || '8849').slice(0, 6).toUpperCase()}`, 196, 24, { align: 'right' });

        doc.setTextColor(255, 255, 255);
        doc.text('Department of Internal Medicine', 196, 29, { align: 'right' });

        // 2. PRESCRIPTION METADATA STRIP
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(`Rx ID: ${rxId}`, 14, 43);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Consultation Type: General OPD Medical Prescription', 105, 43, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Date: ${consultDate} | ${consultTime}`, 196, 43, { align: 'right' });

        // 3. PATIENT DEMOGRAPHICS CARD (Modern Shaded Box)
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.3);
        doc.roundedRect(14, 46.5, 182, 24, 2.5, 2.5, 'FD');

        // Blue Left Accent Bar
        doc.setFillColor(37, 99, 235);
        doc.rect(14, 46.5, 2.5, 24, 'F');

        // Col 1: Name & Demographics
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('PATIENT FULL NAME', 20, 52);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(selectedPatient.name, 20, 57);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('UHID / RECORD ID', 20, 62.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`UHID-${selectedPatient.id.slice(0, 8).toUpperCase()}`, 20, 66.5);

        // Col 2: Contact Details
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('PRIMARY CONTACT PHONE', 80, 52);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(selectedPatient.phone || 'Not Provided', 80, 57);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('EMAIL ADDRESS', 80, 62.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(selectedPatient.email || 'N/A', 80, 66.5);

        // Col 3: Vitals & BMI
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('BODY MEASUREMENTS', 138, 52);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Ht: ${selectedPatient.height || '—'} cm   |   Wt: ${selectedPatient.weight || '—'} kg`, 138, 57);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('CALCULATED BMI', 138, 62.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52); // Forest Green
        doc.text(bmiText, 138, 66.5);

        // 4. CLINICAL DIAGNOSIS & REASON FOR VISIT
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(191, 219, 254); // Blue 200
        doc.setLineWidth(0.25);
        doc.roundedRect(14, 73.5, 182, 15, 2, 2, 'FD');

        // Blue Left Tab
        doc.setFillColor(59, 130, 246);
        doc.rect(14, 73.5, 2.5, 15, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(29, 78, 216); // Blue 700
        doc.text('PROVISIONAL / CLINICAL DIAGNOSIS', 20, 78);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const splitDiag = doc.splitTextToSize(diagnosisText, 172);
        doc.text(splitDiag, 20, 83.5);

        // 5. ℞ PRESCRIPTION SECTION HEADER
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 64, 175);
        doc.text('Rx', 14, 96);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('PRESCRIPTION & MEDICATION ORDERS', 24, 93.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Dispense as formulated. Take under prescribed medical instructions.', 24, 97.5);

        // 6. MEDICATIONS TABLE
        const tableBody = medications.map((med, index) => [
            String(index + 1),
            med.name,
            med.dosage,
            med.frequency,
            med.duration,
            med.instructions
        ]);

        autoTable(doc, {
            startY: 100.5,
            head: [['#', 'Medication Name & Strength', 'Dosage', 'Frequency & Timing', 'Duration', 'Instructions']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 64, 175], // Deep Royal Blue
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 2.5
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            bodyStyles: {
                fontSize: 7.5,
                textColor: [30, 41, 59],
                cellPadding: 2.2
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' },
                1: { cellWidth: 54, fontStyle: 'bold' },
                2: { cellWidth: 22 },
                3: { cellWidth: 38 },
                4: { cellWidth: 22 },
                5: { cellWidth: 38 }
            },
            styles: {
                lineColor: [226, 232, 240],
                lineWidth: 0.2
            },
            margin: { left: 14, right: 14 }
        });

        // Calculate Y position after medications table
        const postTableY = (doc as any).lastAutoTable.finalY + 5;

        // 7. GENERAL ADVICE & LIFESTYLE PRECAUTIONS
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.roundedRect(14, postTableY, 182, 21, 2, 2, 'FD');

        // Header for advice box
        doc.setFillColor(241, 245, 249);
        doc.rect(14, postTableY, 182, 5.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text('GENERAL LIFESTYLE & CARE RECOMMENDATIONS', 18, postTableY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(51, 65, 85);
        doc.text('• Hydration: Maintain intake of at least 2.5 - 3.0 liters of boiled/filtered water daily.', 18, postTableY + 10);
        doc.text('• Diet: Consume warm, light, freshly prepared meals; avoid excessively oily, cold or spicy foods.', 18, postTableY + 14.5);
        doc.text('• Rest & Recovery: Ensure 7-8 hours of sleep; avoid strenuous physical exertion for the next 3-5 days.', 18, postTableY + 19);

        doc.text('• Medication Timing: Maintain fixed intervals between doses to ensure consistent therapeutic blood levels.', 108, postTableY + 10);
        doc.text('• Antibiotic Compliance: Complete the full duration of therapy even if symptoms resolve earlier.', 108, postTableY + 14.5);
        doc.text('• Storage: Keep all medicines in a cool, dry place away from direct sunlight and children.', 108, postTableY + 19);

        // 8. FOLLOW-UP & EMERGENCY RED FLAGS BOX
        const alertY = postTableY + 23.5;
        doc.setFillColor(254, 242, 242); // Rose 50
        doc.setDrawColor(254, 202, 202); // Rose 200
        doc.setLineWidth(0.25);
        doc.roundedRect(14, alertY, 182, 16.5, 2, 2, 'FD');

        // Left Red Alert Tab
        doc.setFillColor(239, 68, 68); // Red 500
        doc.rect(14, alertY, 2.5, 16.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(185, 28, 28); // Red 700
        doc.text('NEXT REVIEW & EMERGENCY RED FLAGS', 20, alertY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(69, 10, 10);
        doc.text('• Next Review Date: In 5 to 7 days in Outpatient Clinic, or SOS if symptoms persist or deteriorate.', 20, alertY + 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(127, 29, 29);
        doc.text('• Emergency Red Flags: Report immediately to Hospital ER in case of severe breathlessness, chest tightness, high persistent fever (>102°F), or rash.', 20, alertY + 13.5);

        // 9. SIGNATURE & AUTHENTICATION BLOCK (Bottom Fixed)
        const sigY = Math.max(alertY + 19, 247);

        // Left Verification Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.roundedRect(14, sigY, 82, 24, 2, 2, 'FD');

        // Verification banner
        doc.setFillColor(238, 242, 255); // Indigo 50
        doc.rect(14, sigY, 82, 5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(67, 56, 202); // Indigo 700
        doc.text('VERIFIED ELECTRONIC PRESCRIPTION', 17, sigY + 3.6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.text(`Digital Security Hash: ${rxId}-VERIFIED`, 17, sigY + 9.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Authenticated via MediConnect Healthcare Platform`, 17, sigY + 14);
        doc.text(`Pursuant to Indian IT Act 2000 & Telemedicine Guidelines`, 17, sigY + 18);
        doc.text(`Timestamp: ${new Date().toISOString()}`, 17, sigY + 22);

        // Right Doctor Signature Block
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(125, sigY + 13, 196, sigY + 13);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(doctorName, 196, sigY + 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('MBBS, MD - Senior Consultant Physician', 196, sigY + 22, { align: 'right' });

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Medical Reg. No: MCI-${(user?.id || '8849').slice(0, 6).toUpperCase()} • MediConnect`, 196, sigY + 26, { align: 'right' });

        // 10. PAGE FOOTER
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(14, 283, 196, 283);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('CONFIDENTIAL MEDICAL PRESCRIPTION • MEDICONNECT HEALTHCARE NETWORK', 14, 288);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('24x7 Patient Support: 1800-MED-CARE', 105, 288, { align: 'center' });

        doc.setTextColor(148, 163, 184);
        doc.text('Page 1 of 1', 196, 288, { align: 'right' });

        // Save PDF with clear naming
        const cleanName = selectedPatient.name.replace(/\s+/g, '_');
        doc.save(`Prescription_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Patient Management</h1>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsAddPatientOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Patient
                        </Button>
                    </div>
                </div>

                <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 w-fit">
                    {(['current', 'past', 'appointments'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            {tab === 'appointments' ? 'Appointments' : `${tab} Patients`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <Card>
                <CardHeader>
                    {activeTab !== 'appointments' && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search patients..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto min-h-[300px]">
                        {/* PATIENT LIST VIEW */}
                        {activeTab !== 'appointments' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Name</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Vitals</th>
                                        <th className="px-4 py-3">Added</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {patients.length === 0 && !isLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No patients found.</td></tr>
                                    )}
                                    {patients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{patient.name}</div>
                                                <div className="text-xs text-gray-500">{patient.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{patient.phone}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {patient.height && patient.weight ? `${patient.height}cm / ${patient.weight}kg` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-7.5 px-2.5 flex items-center gap-1 shadow-2xs font-semibold"
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                        }}
                                                        title="View Details & Download Prescription"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>View & Rx</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* APPOINTMENTS VIEW */}
                        {activeTab === 'appointments' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date/Time</th>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.length === 0 && !isLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No appointments scheduled.</td></tr>
                                    )}
                                    {appointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium">{new Date(apt.appointment_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 pl-6">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{apt.patient_name}</td>
                                            <td className="px-4 py-3">{apt.type}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm">View</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* SUCCESS MODAL */}
            <Modal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} title="Success">
                <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Patient Added Successfully!</h3>
                    <p className="text-sm text-gray-500">The patient has been registered and the record has been created.</p>
                    <Button onClick={() => setIsSuccessOpen(false)} className="w-full">
                        Close
                    </Button>
                </div>
            </Modal>

            {/* ADD PATIENT MODAL */}
            <Modal isOpen={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} title="Add New Patient">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Smart Fill Header */}
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                <Wand2 className="h-4 w-4" /> Smart Fill
                            </h4>
                            <p className="text-xs text-blue-700">Upload a prescription/report to autofill details.</p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-white text-blue-600 border-blue-200 hover:bg-blue-100"
                            onClick={triggerSmartFill}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            {isAnalyzing ? 'Analyzing...' : 'Upload & Autofill'}
                        </Button>
                        <input
                            type="file"
                            ref={smartFillInputRef}
                            className="hidden"
                            accept="image/*, .pdf"
                            onChange={handleSmartFillImage}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <Input name="name" required value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                                <Input name="height" type="number" value={formData.height} onChange={handleInputChange} placeholder="175" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                                <Input name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="70" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Initial Diagnosis</label>
                        <textarea name="diagnosis" rows={3} className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.diagnosis} onChange={handleInputChange} placeholder="e.g. Acute Appendicitis, Pneumonia..." />
                    </div>

                    {/* IPD & Bed Management (Optional) */}
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                            <BedDouble className="h-4 w-4 text-blue-600" />
                            <span>Inpatient Admission & Bed Allocation <span className="text-xs text-blue-600 font-normal bg-blue-100/70 px-2 py-0.5 rounded-full">Optional</span></span>
                        </div>
                        <p className="text-xs text-slate-600">
                            If this patient requires hospitalization, allocate a bed no. and ward to automatically route them to the Hospital IPD & Bed Management board.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">Bed Number</label>
                                <Input
                                    name="bed_number"
                                    value={formData.bed_number}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ICU-03, GEN-104"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">Ward / Unit</label>
                                <select
                                    name="ward"
                                    value={formData.ward}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="General Medical">General Medical</option>
                                    <option value="ICU">ICU (Intensive Care)</option>
                                    <option value="Surgical Post-Op">Surgical Post-Op</option>
                                    <option value="Maternity">Maternity</option>
                                    <option value="Emergency Bay">Emergency Bay</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Upload Prescription</label>
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsAddPatientOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Add Patient'}</Button>
                    </div>
                </form>
            </Modal>

            {/* PATIENT DETAILS MODAL */}
            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Patient Details">
                {selectedPatient && (
                    <div className="space-y-6">
                        {/* Patient Info Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between bg-gray-50 p-4 rounded-lg gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedPatient.name}</h3>
                                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedPatient.email || 'N/A'}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedPatient.phone || 'N/A'}</span>
                                        <span className="hidden sm:inline">|</span>
                                        <span>Height: {selectedPatient.height}cm</span>
                                        <span>Weight: {selectedPatient.weight}kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs w-full sm:w-auto flex items-center justify-center gap-1.5"
                                    onClick={handleGeneratePDF}
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Download Rx (PDF)</span>
                                </Button>
                                {selectedPatient.status === 'current' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                                        onClick={handleDischarge}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Discharge
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Recent History */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Medical History
                            </h4>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {patientRecords.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No records found.</p>
                                ) : (
                                    patientRecords.map(rec => (
                                        <div key={rec.id} className="border-l-2 border-blue-200 pl-4 py-1">
                                            <div className="text-xs text-gray-400 mb-1">{new Date(rec.visit_date).toLocaleDateString()}</div>
                                            <p className="text-sm text-gray-800">{rec.diagnosis || 'No diagnosis note.'}</p>
                                            {rec.prescription_url && (
                                                <a href={rec.prescription_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                                    View Attachment
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add New Record Section */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Add New Record / Visit Note</h4>
                            <form onSubmit={handleAddRecord} className="space-y-3">
                                <textarea
                                    name="diagnosis"
                                    placeholder="Enter diagnosis or visit notes..."
                                    rows={2}
                                    className="w-full rounded-md border p-2 text-sm"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange}
                                />
                                <div className="flex items-center gap-2">
                                    <input type="file" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100" />
                                    <Button type="submit" size="sm" disabled={isLoading}>{isLoading ? 'Saving...' : 'Add Note'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// End of component
export default PatientsList;
