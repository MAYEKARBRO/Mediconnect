import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Send, Bot, User, Stars } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getGeminiResponse } from '../../lib/gemini';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const Chatbot = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hello ${user?.full_name || 'there'}! I'm your AI Health Assistant. I can help you understand symptoms, find specialists, or answer general health questions. Note: I am an AI, so always consult a real doctor for medical advice.`,
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            const systemPrompt = "You are a helpful and knowledgeable medical assistant for the application MediConnect. Answer health questions safely, but always remind users to consult a real doctor. Be concise.";
            const fullPrompt = `${systemPrompt}\n\nUser: ${userMsg.content}`;

            const responseText = await getGeminiResponse(fullPrompt);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <Card className="flex-1 flex flex-col shadow-lg border-purple-100 h-full">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 py-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-2 rounded-full">
                            <Stars className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-purple-900">AI Health Assistant</CardTitle>
                            <p className="text-xs text-purple-600">Powered by Gemini</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                        {msg.role === 'user' ? <User className="h-4 w-4 text-blue-600" /> : <Bot className="h-4 w-4 text-purple-600" />}
                                    </div>
                                    <div className={`p-3 rounded-lg text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="bg-white border px-4 py-3 rounded-lg rounded-tl-none text-sm text-gray-400">
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-gray-50 flex gap-2">
                        <Input
                            placeholder="Type a health question..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="bg-white"
                        />
                        <Button onClick={handleSend} disabled={loading || !inputValue.trim()} className="bg-purple-600 hover:bg-purple-700">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Chatbot;
