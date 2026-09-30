import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, Phone, Activity, AlertCircle, Heart, Globe } from 'lucide-react';

const PatientProfile = () => {
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        emergency_contact: '',
        height: '',
        weight: '',
        allergies: '',
        medical_conditions: ''
    });

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    emergency_contact: data.emergency_contact || '',
                    height: data.height || '',
                    weight: data.weight || '',
                    allergies: data.allergies || '',
                    medical_conditions: data.medical_conditions || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    updated_at: new Date()
                })
                .eq('id', user?.id);

            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>{t('profile.loading') || 'Loading...'}</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('profile.title')}</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Interface Settings */}
                <Card className="md:col-span-2 border-blue-200 shadow-sm">
                    <CardHeader className="bg-indigo-50 border-b border-indigo-100">
                        <CardTitle className="flex items-center gap-2 text-indigo-800">
                            <Globe className="h-5 w-5" /> {t('profile.interface_settings')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900">{t('profile.change_language')}</h3>
                                <p className="text-sm text-gray-500">Select your preferred language for the patient portal.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={language === 'en' ? 'primary' : 'outline'}
                                    onClick={() => setLanguage('en')}
                                    className={language === 'en' ? 'bg-indigo-600' : ''}
                                >
                                    English
                                </Button>
                                <Button
                                    variant={language === 'hi' ? 'primary' : 'outline'}
                                    onClick={() => setLanguage('hi')}
                                    className={language === 'hi' ? 'bg-indigo-600' : ''}
                                >
                                    हिंदी (Hindi)
                                </Button>
                                <Button
                                    variant={language === 'mr' ? 'primary' : 'outline'}
                                    onClick={() => setLanguage('mr')}
                                    className={language === 'mr' ? 'bg-indigo-600' : ''}
                                >
                                    मराठी (Marathi)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <User className="h-5 w-5" /> {t('profile.personal_info')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.full_name')}</label>
                            <Input
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('profile.phone')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        name="phone"
                                        className="pl-8"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('profile.emergency_contact')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-red-500" />
                                    <Input
                                        name="emergency_contact"
                                        className="pl-8"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                        placeholder="Name & Number"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Physical Stats */}
                <Card>
                    <CardHeader className="bg-green-50 border-b border-green-100">
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <Activity className="h-5 w-5" /> {t('profile.vitals')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('profile.height')}</label>
                                <Input
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="e.g. 5'10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('profile.weight')}</label>
                                <Input
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="e.g. 75 kg"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Info */}
                <Card className="md:col-span-2">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <Heart className="h-5 w-5" /> {t('profile.medical_details')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500" /> {t('profile.allergies')}
                            </label>
                            <Input
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                placeholder="Peanuts, Penicillin, Dust..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.conditions')}</label>
                            <textarea
                                name="medical_conditions"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.medical_conditions}
                                onChange={handleChange}
                                placeholder="Asthma, Diabetes, Past Surgeries..."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} disabled={saving} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                    {saving ? t('profile.saving') : t('profile.save')}
                </Button>
            </div>
        </div>
    );
};

export default PatientProfile;
