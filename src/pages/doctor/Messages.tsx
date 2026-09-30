import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Send, Paperclip, MoreVertical, Phone } from 'lucide-react';

const MESSAGES = [
    { id: 1, sender: 'Sarah Wilson', lastMsg: 'Thank you, doctor. I will take the medication.', time: '10:30 AM', unread: 2, avatar: 'SW' },
    { id: 2, sender: 'Michael Chen', lastMsg: 'Is it okay if I reschedule?', time: 'Yesterday', unread: 0, avatar: 'MC' },
    { id: 3, sender: 'Emma Thompson', lastMsg: 'The pain has subsided a bit.', time: 'Yesterday', unread: 0, avatar: 'ET' },
    { id: 4, sender: 'James Rodriguez', lastMsg: 'Sent an attachment.', time: 'Mon', unread: 0, avatar: 'JR' },
];

const CHAT_HISTORY = [
    { id: 1, text: 'Good morning Sarah, how are you feeling today?', sender: 'me', time: '10:15 AM' },
    { id: 2, text: 'Much better, doctor. The fever has gone down.', sender: 'them', time: '10:18 AM' },
    { id: 3, text: 'That is great news. Are you still experiencing any headaches?', sender: 'me', time: '10:20 AM' },
    { id: 4, text: 'Slightly, but manageable.', sender: 'them', time: '10:22 AM' },
    { id: 5, text: 'Continue with the ibuprofen as needed. I will update your prescription.', sender: 'me', time: '10:25 AM' },
    { id: 6, text: 'Thank you, doctor. I will take the medication.', sender: 'them', time: '10:30 AM' },
];

const DoctorMessages = () => {
    const [activeChat, setActiveChat] = useState(MESSAGES[0]);
    const [newMessage, setNewMessage] = useState('');
    const [chatHistory, setChatHistory] = useState(CHAT_HISTORY);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setChatHistory([...chatHistory, {
            id: Date.now(),
            text: newMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setNewMessage('');
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search messages..." className="pl-9 bg-white" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {MESSAGES.map((msg) => (
                        <button
                            key={msg.id}
                            onClick={() => setActiveChat(msg)}
                            className={`w-full p-4 flex items-start gap-3 hover:bg-white transition-colors text-left border-b border-gray-100 ${activeChat?.id === msg.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''
                                }`}
                        >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                {msg.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-medium text-gray-900 truncate">{msg.sender}</span>
                                    <span className="text-xs text-gray-500">{msg.time}</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{msg.lastMsg}</p>
                            </div>
                            {msg.unread > 0 && (
                                <span className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                    {msg.unread}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {activeChat?.avatar}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{activeChat?.sender}</h3>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-600"></span> Online
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                    {chatHistory.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'me'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 rounded-bl-none'
                                }`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm">
                            <Paperclip className="h-5 w-5 text-gray-500" />
                        </Button>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button type="submit" size="sm" className="px-4">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DoctorMessages;
