import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

interface DoctorContact {
    id: string; // doctor user id (auth.id)
    name: string;
    specialization?: string;
}

const PatientMessages = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [contacts, setContacts] = useState<DoctorContact[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchContacts();
        }
    }, [user]);

    useEffect(() => {
        if (user && selectedDoctorId) {
            fetchMessages(selectedDoctorId);
            // In a real app, subscribe to realtime changes here
            const channel = supabase
                .channel('chat_room')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
                    (payload) => {
                        if (payload.new.sender_id === selectedDoctorId) {
                            setChats(prev => [...prev, payload.new as ChatMessage]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, selectedDoctorId]);

    const fetchContacts = async () => {
        // Find doctors this patient is connected to via 'doctor_patients' (by email usually)
        // AND getting the doctor's auth ID.
        // It's tricky because doctor_patients links Doctor(auth) -> Patient(email).
        // So we search doctor_patients where email = user.email, then get doctor_id.
        // Then get profile of doctor_id.

        if (!user?.email) return;

        const { data: relations } = await supabase
            .from('doctor_patients')
            .select('doctor_id')
            .eq('email', user.email);

        if (relations) {
            const docIds = [...new Set(relations.map(r => r.doctor_id))];

            if (docIds.length > 0) {
                const { data: docs } = await supabase
                    .from('profiles')
                    .select('id, full_name, specialization') // Assuming specialization exists in profiles or we fetch from doctor_profiles
                    .in('id', docIds);

                if (docs) {
                    setContacts(docs.map(d => ({
                        id: d.id,
                        name: d.full_name || 'Unknown Doctor',
                        specialization: d.specialization || 'General'
                    })));
                    if (docs.length > 0) setSelectedDoctorId(docs[0].id);
                }
            }
        }
        setLoading(false);
    };

    const fetchMessages = async (doctorId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${user?.id})`)
            .order('created_at', { ascending: true });

        if (data) setChats(data);
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedDoctorId || !user) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: selectedDoctorId,
                content: input
            });

        if (error) {
            console.error(error);
            alert('Failed to send message');
        } else {
            setInput('');
            fetchMessages(selectedDoctorId); // Refresh to be safe
        }
    };

    if (loading) return <div>Loading chats...</div>;

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4">
            {/* Contacts Sidebar */}
            <Card className="w-1/3 flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">My Doctors</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                    {contacts.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 text-sm">
                            No doctors connected yet. Visits connect you automatically.
                        </div>
                    ) : (
                        contacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedDoctorId(contact.id)}
                                className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-100 ${selectedDoctorId === contact.id ? 'bg-blue-50 border-blue-200 border' : ''}`}
                            >
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{contact.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{contact.specialization}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {selectedDoctorId
                            ? contacts.find(c => c.id === selectedDoctorId)?.name
                            : 'Select a Doctor to Chat'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {chats.length === 0 && selectedDoctorId && (
                            <div className="text-center text-gray-400 mt-10">Start the conversation...</div>
                        )}
                        {chats.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-lg text-sm ${msg.sender_id === user?.id
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border rounded-tl-none shadow-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedDoctorId && (
                        <div className="p-4 border-t bg-white flex gap-2">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                            />
                            <Button onClick={handleSend} disabled={!input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientMessages;
