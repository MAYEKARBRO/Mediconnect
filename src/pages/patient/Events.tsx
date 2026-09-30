import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, MapPin, Clock, X, Info, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

interface HealthEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    image_url?: string;
    organizer?: string;
}

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<HealthEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<HealthEvent | null>(null);
    const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false); // Success Popup State

    useEffect(() => {
        fetchEvents();
        if (user) fetchRegistrations();
    }, [user]);

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
        if (data && data.length > 0) {
            setEvents(data);
        } else {
            setEvents([]);
        }
        setLoading(false);
    };

    const fetchRegistrations = async () => {
        if (!user) return;
        const { data } = await supabase.from('event_registrations').select('event_id').eq('user_id', user.id);
        if (data) {
            setRegisteredEventIds(new Set(data.map(r => r.event_id)));
        }
    };

    const handleRegister = async (eventId: string) => {
        if (!user) {
            alert("Please login to register.");
            return;
        }

        const { error } = await supabase.from('event_registrations').insert({
            event_id: eventId,
            user_id: user.id
        });

        if (error) {
            alert('Registration failed: ' + error.message);
        } else {
            // alert('Successfully registered!'); // Removed alert
            setRegisteredEventIds(prev => new Set(prev).add(eventId));
            setIsSuccessOpen(true); // Open Success Modal
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Health Events</h1>

            {/* Success Modal */}
            <Modal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} title="Success">
                <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Registered Successfully!</h3>
                    <p className="text-sm text-gray-500">You have been registered for this event.</p>
                    <Button onClick={() => setIsSuccessOpen(false)} className="w-full bg-green-600 hover:bg-green-700">
                        Close
                    </Button>
                </div>
            </Modal>

            {/* List View */}
            <div className="space-y-4 max-w-4xl">

                {events.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">
                        No upcoming events found. Check back later!
                    </div>
                )}
                {events.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card
                            className={`flex flex-row overflow-hidden cursor-pointer hover:shadow-md transition-all border-l-4 ${registeredEventIds.has(event.id) ? 'border-l-green-500' : 'border-l-blue-500'}`}
                            onClick={() => setSelectedEvent(event)}
                        >
                            <div className="w-32 bg-gray-100 hidden sm:block relative">
                                {event.image_url ? (
                                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <Calendar className="h-8 w-8 text-blue-300" />
                                    </div>
                                )}
                                {registeredEventIds.has(event.id) && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-bl-lg">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <CardContent className="flex-1 p-4 flex flex-col justify-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(event.event_date), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(event.event_date), 'h:mm a')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                    </span>
                                </div>
                            </CardContent>
                            <div className="p-4 flex items-center justify-center border-l bg-gray-50/50">
                                <Info className="h-5 w-5 text-gray-400" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-48 bg-gray-200 relative">
                                {selectedEvent.image_url && (
                                    <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h2 className="text-2xl font-bold leading-tight">{selectedEvent.title}</h2>
                                    {selectedEvent.organizer && <p className="text-sm opacity-90">by {selectedEvent.organizer}</p>}
                                </div>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Date & Time</p>
                                        <p className="font-semibold text-gray-900">{format(new Date(selectedEvent.event_date), 'PPP')}</p>
                                        <p className="text-sm text-gray-600">{format(new Date(selectedEvent.event_date), 'p')}</p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <p className="text-xs text-purple-600 font-bold uppercase mb-1">Location</p>
                                        <p className="font-semibold text-gray-900">{selectedEvent.location}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">About Event</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {selectedEvent.description}
                                    </p>
                                </div>

                                <div className="pt-4 border-t flex gap-3">
                                    {registeredEventIds.has(selectedEvent.id) ? (
                                        <Button className="flex-1 bg-green-600 hover:bg-green-700 cursor-default" disabled>
                                            <Check className="h-4 w-4 mr-2" /> Registered
                                        </Button>
                                    ) : (
                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleRegister(selectedEvent.id)}>
                                            Register Now
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Events;
