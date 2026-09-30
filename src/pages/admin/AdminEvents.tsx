import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Clock, Trash2, Plus, Image as ImageIcon, Users } from 'lucide-react';
import { format } from 'date-fns';

interface HealthEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    image_url?: string;
}

const AdminEvents = () => {
    const [events, setEvents] = useState<HealthEvent[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<HealthEvent>>({
        title: '',
        description: '',
        event_date: '',
        location: ''
    });
    const [participants, setParticipants] = useState<{ name: string, email: string }[]>([]);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    // ...

    const fetchParticipants = async (eventId: string) => {
        setLoadingParticipants(true);
        setViewingEventId(eventId);

        // Join with profiles
        const { data } = await supabase
            .from('event_registrations')
            .select(`
                user_id,
                profiles:user_id (full_name)
            `)
            .eq('event_id', eventId);

        if (data) {
            // @ts-ignore
            setParticipants(data.map(d => {
                const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
                return {
                    name: profile?.full_name || 'Unknown User'
                };
            }));
        }
        setLoadingParticipants(false);
    };

    // ... inside return (render)
    {/* Participants Modal */ }
    {
        viewingEventId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-xl font-bold">Participants</h2>
                        <button onClick={() => setViewingEventId(null)} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {loadingParticipants ? (
                            <p className="text-center text-gray-500 py-4">Loading...</p>
                        ) : participants.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No registered participants.</p>
                        ) : (
                            participants.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                        {p.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-700">{p.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
        if (data) setEvents(data);
    };

    const handleAddEvent = async () => {
        if (!newEvent.title || !newEvent.event_date) return;
        const { error } = await supabase.from('events').insert([newEvent]);
        if (error) {
            alert('Error adding event: ' + error.message);
        } else {
            setShowAddModal(false);
            setNewEvent({ title: '', description: '', event_date: '', location: '' });
            fetchEvents();
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        await supabase.from('events').delete().eq('id', id);
        fetchEvents();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Event Management</h1>
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" /> Create Event
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-lg border border-dashed">
                        No events found. Create one to get started.
                    </div>
                )}
                {events.map((event) => (
                    <Card key={event.id} className="overflow-hidden flex flex-col group">
                        <div className="h-40 bg-gray-100 relative">
                            {event.image_url ? (
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    <ImageIcon className="h-10 w-10" />
                                </div>
                            )}
                            <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                title="Delete Event"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3">
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>{format(new Date(event.event_date), 'PPP')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{format(new Date(event.event_date), 'p')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span>{event.location}</span>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-2">{event.description}</p>
                            <Button variant="outline" size="sm" onClick={() => fetchParticipants(event.id)} className="mt-auto w-full">
                                <Users className="h-4 w-4 mr-2" /> View Participants
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
                        <h2 className="text-xl font-bold">Create New Event</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Event Title</label>
                            <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Free Eye Checkup" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date & Time</label>
                            <Input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Input value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="e.g. Hall A" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm min-h-[80px]"
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Event details..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Image URL (Optional)</label>
                            <Input value={newEvent.image_url} onChange={e => setNewEvent({ ...newEvent, image_url: e.target.value })} placeholder="https://..." />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button onClick={handleAddEvent}>Create Event</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
