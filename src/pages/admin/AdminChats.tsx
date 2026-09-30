import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, User } from 'lucide-react';

interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

interface StaffContact {
    id: string;
    full_name: string;
    role: string;
}

const AdminChats = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [contacts, setContacts] = useState<StaffContact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (selectedContactId) {
            fetchMessages(selectedContactId);
            // Realtime logic would go here
        }
    }, [selectedContactId]);

    const fetchContacts = async () => {
        // Allow admin to chat with any doctor or profile
        // For simplicity, fetching all doctor_profiles + profiles join
        const { data: doctors } = await supabase.from('doctor_profiles').select('id');
        if (doctors) {
            const ids = doctors.map(d => d.id);
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').in('id', ids);
            if (profiles) {
                setContacts(profiles.map(p => ({
                    id: p.id,
                    full_name: p.full_name || 'Unknown',
                    role: p.role
                })));
            }
        }
    };

    const fetchMessages = async (contactId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user?.id})`)
            .order('created_at', { ascending: true });

        if (data) setChats(data);
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedContactId || !user) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: selectedContactId,
                content: input
            });

        if (!error) {
            setInput('');
            fetchMessages(selectedContactId);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4">
            {/* Contacts Sidebar */}
            <Card className="w-1/3 flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">Staff Directory</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContactId(contact.id)}
                            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-100 ${selectedContactId === contact.id ? 'bg-blue-50 border-blue-200 border' : ''}`}
                        >
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="font-medium">{contact.full_name}</p>
                                <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-lg">
                        {selectedContactId ? contacts.find(c => c.id === selectedContactId)?.full_name : 'Select a Chat'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {chats.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-lg text-sm ${msg.sender_id === user?.id
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border rounded-tl-none shadow-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedContactId && (
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

export default AdminChats;
