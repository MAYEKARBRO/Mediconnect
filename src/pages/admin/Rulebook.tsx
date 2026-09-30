import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BookOpen, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Rulebook = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hospital Administration Rulebook</h1>
            <p className="text-gray-600">Standard Operating Procedures (SOPs) and Policies for MediConnect Hospital Staff.</p>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            General Conduct & Ethics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> All staff must wear ID cards at all times within hospital premises.</li>
                        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> Patient confidentiality (HIPAA compliance) is mandatory.</li>
                        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> Professional attire is required; scrubs for medical staff, formals for admin.</li>
                        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> Zero tolerance policy towards harassment or discrimination.</li>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Emergency Protocols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-2"><Info className="h-4 w-4 text-red-500 mt-0.5" /> Code Blue: Cardiac Arrest - Dial 111 immediately.</li>
                        <li className="flex gap-2"><Info className="h-4 w-4 text-red-500 mt-0.5" /> Code Red: Fire - Evacuate via nearest stairs; do NOT use elevators.</li>
                        <li className="flex gap-2"><Info className="h-4 w-4 text-red-500 mt-0.5" /> Hazardous Material Spill: Isolate area and notify safety officer.</li>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            Admission & Discharge
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-2">1. Verify patient identity via two forms of ID (Name + DOB).</li>
                        <li className="flex gap-2">2. Ensure insurance pre-authorization is obtained before non-emergency admission.</li>
                        <li className="flex gap-2">3. Discharge summaries must be completed by the attending physician within 24 hours.</li>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Inventory & Equipment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-2">All equipment usage must be logged in the inventory system.</li>
                        <li className="flex gap-2">Report malfunctioning devices immediately to maintenance.</li>
                        <li className="flex gap-2">Consumables (gloves, syringes) should be restocked when levels dip below 20%.</li>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Rulebook;
