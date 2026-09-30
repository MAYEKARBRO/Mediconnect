import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

// Chart Colors Palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Classification Logic
const CLASSIFICATIONS = {
    'Infectious': ['flu', 'covid', 'malaria', 'tb', 'tuberculosis', 'virus', 'infection', 'bacteri', 'cold', 'fever', 'hiv'],
    'NCDs': ['heart', 'cancer', 'diabetes', 'stroke', 'copd', 'pressure', 'hypertension', 'asthma'],
    'Deficiency': ['anemia', 'scurvy', 'rickets', 'vitamin', 'iron', 'deficien'],
    'Genetic': ['cystic', 'down', 'huntington', 'genetic', 'inherited'],
    'Degenerative': ['alzheimer', 'parkinson', 'osteoporosis', 'arthritis', 'aging'],
    'Autoimmune': ['lupus', 'rheumatoid', 'type 1'],
};

const DiseaseTrends = () => {
    const { user } = useAuth();
    const [classificationData, setClassificationData] = useState<{ name: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const processData = async () => {
            setLoading(true);
            // Fetch all patient records
            const { data: records, error } = await supabase
                .from('patient_records')
                .select('diagnosis')
                .eq('doctor_id', user.id);

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            // Categorize Data
            const stats: Record<string, number> = {};
            const keywords = Object.keys(CLASSIFICATIONS);

            records?.forEach(record => {
                const diagnosis = (record.diagnosis || '').toLowerCase();
                let matched = false;

                // Check against each category
                for (const cat of keywords) {
                    const terms = CLASSIFICATIONS[cat as keyof typeof CLASSIFICATIONS];
                    if (terms.some(term => diagnosis.includes(term))) {
                        stats[cat] = (stats[cat] || 0) + 1;
                        matched = true;
                        break; // Assign to first matching category
                    }
                }

                if (!matched && diagnosis.length > 2) {
                    stats['Other'] = (stats['Other'] || 0) + 1;
                }
            });

            // Format for Recharts
            const chartData = Object.entries(stats).map(([name, value]) => ({ name, value }));
            setClassificationData(chartData);
            setLoading(false);
        };

        processData();
    }, [user]);

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Health Intelligence & Disease Analytics</h2>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2"
            >
                {/* DISEASE CLASSIFICATION PIE CHART */}
                <motion.div variants={item} className="col-span-2 md:col-span-1">
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle>Disease Classification Distribution</CardTitle>
                            <p className="text-sm text-gray-500">Breakdown by major disease categories (Infectious, NCDs, etc.)</p>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[300px]">
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Analyzing Data...</div>
                            ) : classificationData.length === 0 ? (
                                <div className="text-gray-400 text-center">
                                    <p>No enough data for analysis.</p>
                                    <p className="text-xs mt-2">Add patient records with diagnoses like "Flu", "Diabetes", "Anemia" to see trends.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={classificationData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {classificationData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* COMPARATIVE BAR CHART (Mocked for now as we need more complex data structure for comparison) */}
                <motion.div variants={item} className="col-span-2 md:col-span-1">
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle>Prevalence by Category</CardTitle>
                            <p className="text-sm text-gray-500">Number of cases per category</p>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Loading...</div>
                            ) : classificationData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">No Data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classificationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="#8884d8" barSize={30} radius={[0, 4, 4, 0]}>
                                            {classificationData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* EDUCATIONAL / CONTEXT INFO */}
                <motion.div variants={item} className="col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Key Classifications Reference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <strong className="text-blue-800 block mb-1">Infectious</strong>
                                    <p className="text-gray-600">Transmissible (e.g. Flu, TB, COVID-19)</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                    <strong className="text-red-800 block mb-1">NCDs</strong>
                                    <p className="text-gray-600">Chronic/Lifestyle (e.g. Heart Disease, Diabetes)</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <strong className="text-yellow-800 block mb-1">Deficiency</strong>
                                    <p className="text-gray-600">Nutrient lack (e.g. Anemia, Scurvy)</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <strong className="text-purple-800 block mb-1">Genetic</strong>
                                    <p className="text-gray-600">Inherited (e.g. Cystic Fibrosis)</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <strong className="text-orange-800 block mb-1">Degenerative</strong>
                                    <p className="text-gray-600">Aging/Deterioration (e.g. Alzheimer's)</p>
                                </div>
                                <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                                    <strong className="text-pink-800 block mb-1">Autoimmune</strong>
                                    <p className="text-gray-600">Immune Attack (e.g. Lupus)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default DiseaseTrends;
