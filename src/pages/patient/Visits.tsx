import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { QrCode, FileText, Calendar, Download, X, Clock, Activity, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface VisitRecord {
    id: string;
    visit_date: string;
    diagnosis: string;
    prescription_url?: string;
    doctor_id?: string;
    // Extended fields for modal
    admission_time?: string;
    discharge_time?: string;
    height?: string;
    weight?: string;
    notes?: string;
    is_hardcoded?: boolean;
}

const HARDCODED_VISITS: VisitRecord[] = [
    {
        id: 'hc-v1',
        visit_date: new Date().toISOString(),
        diagnosis: 'Seasonal Flu & High Fever',
        admission_time: '10:00 AM',
        discharge_time: '11:30 AM',
        height: "5'10\"",
        weight: '75 kg',
        notes: 'Patient advised to rest and hydrate. Prescribed Paracetamol 500mg.',
        is_hardcoded: true
    },
    {
        id: 'hc-v2',
        visit_date: new Date(Date.now() - 86400000 * 14).toISOString(), // 2 weeks ago
        diagnosis: 'Routine Annual Checkup',
        admission_time: '09:00 AM',
        discharge_time: '10:15 AM',
        height: "5'10\"",
        weight: '74.5 kg',
        notes: 'All vitals normal. BP 120/80.',
        is_hardcoded: true
    }
];

const Visits = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState<string | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchVisits();
    }, [user]);

    const fetchVisits = async () => {
        try {
            if (!user?.email) return;

            let fetchedRecords: VisitRecord[] = [];

            // 1. Find my IDs in doctor_patients tables
            const { data: myPatientProfiles } = await supabase
                .from('doctor_patients')
                .select('id')
                .eq('email', user.email);

            if (myPatientProfiles && myPatientProfiles.length > 0) {
                const myIds = myPatientProfiles.map(p => p.id);

                // 2. Fetch records for these IDs
                const { data: records } = await supabase
                    .from('patient_records')
                    .select('*')
                    .in('patient_id', myIds)
                    .order('visit_date', { ascending: false });

                if (records) {
                    fetchedRecords = records.map(r => ({ ...r, is_hardcoded: false }));
                }
            }

            // Merge Reverse Chronological
            const allVisits = [...HARDCODED_VISITS, ...fetchedRecords].sort((a, b) =>
                new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
            );

            setVisits(allVisits);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Visits & Records</h1>

            <div className="grid gap-6">
                {loading ? (
                    <div>Loading visits...</div>
                ) : visits.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                            No medical records found.
                        </CardContent>
                    </Card>
                ) : (
                    visits.map((visit) => (
                        <Card key={visit.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedVisit(visit)}>
                            <CardHeader className="bg-gray-50/50 pb-3">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium text-gray-900">
                                            {format(parseISO(visit.visit_date), 'PPP')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {format(parseISO(visit.visit_date), 'p')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" onClick={() => setShowQR(showQR === visit.id ? null : visit.id)}>
                                            <QrCode className="h-4 w-4 mr-2" />
                                            {showQR === visit.id ? 'Hide QR' : 'Show QR'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid md:grid-cols-4 gap-4">
                                    {showQR === visit.id && (
                                        <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white border rounded-lg shadow-inner" onClick={e => e.stopPropagation()}>
                                            <div className="h-32 w-32 bg-gray-900 flex items-center justify-center text-white text-xs text-center rounded">
                                                [QR CODE]<br />
                                                {visit.id.substring(0, 8)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 text-center">Share with Doctor/Pharmacy</p>
                                        </div>
                                    )}
                                    <div className={showQR === visit.id ? 'md:col-span-3' : 'md:col-span-4'}>
                                        <h3 className="font-semibold text-gray-900 mb-2">Diagnosis</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-md mb-4 whitespace-pre-wrap">
                                            {visit.diagnosis || 'No diagnosis recorded.'}
                                        </p>

                                        {visit.prescription_url && (
                                            <div className="flex items-center gap-3 mt-4 pt-4 border-t" onClick={e => e.stopPropagation()}>
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Digital Prescription</p>
                                                    <p className="text-xs text-gray-500">Attached Document</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => window.open(visit.prescription_url, '_blank')}>
                                                    <Download className="h-4 w-4 mr-2" /> Download
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Detailed Visit Modal */}
            <AnimatePresence>
                {selectedVisit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedVisit(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Visit Details</h2>
                                    <p className="text-sm text-gray-500">{format(parseISO(selectedVisit.visit_date), 'PPPP')}</p>
                                </div>
                                <button onClick={() => setSelectedVisit(null)} className="p-2 hover:bg-gray-200 rounded-full">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Timing */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold uppercase">Admission</p>
                                            <p className="font-semibold text-gray-900">{selectedVisit.admission_time || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-xs text-green-600 font-bold uppercase">Discharge</p>
                                            <p className="font-semibold text-gray-900">{selectedVisit.discharge_time || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vitals */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                                        <Activity className="h-4 w-4 text-orange-500" /> Recorded Vitals
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500">Height:</span>
                                            <span className="ml-2 font-medium">{selectedVisit.height || 'Not recorded'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Weight:</span>
                                            <span className="ml-2 font-medium">{selectedVisit.weight || 'Not recorded'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Records */}
                                <div>
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                                        <FileCheck className="h-4 w-4 text-teal-600" /> Clinical Notes & Diagnosis
                                    </h3>
                                    <div className="bg-white border rounded-lg p-4 text-gray-700 leading-relaxed shadow-sm">
                                        <p className="font-medium mb-1">{selectedVisit.diagnosis}</p>
                                        <p className="text-sm text-gray-500 mt-2">{selectedVisit.notes || (selectedVisit.is_hardcoded ? '' : 'No additional doctor notes available.')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t rounded-b-xl flex justify-end">
                                <Button onClick={() => setSelectedVisit(null)}>Close Details</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Visits;
