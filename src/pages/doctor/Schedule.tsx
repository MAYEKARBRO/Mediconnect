import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, Activity } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Event {
    id: string;
    title: string;
    start_time: string; // ISO string
    end_time: string; // ISO string
    type: 'appointment' | 'surgery' | 'other';
    patient_id?: string;
    notes?: string;
}

const DoctorSchedule = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [isAddEventOpen, setIsAddEventOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'appointment',
        time: '09:00',
        duration: 60, // minutes
        notes: ''
    });

    // Calendar Generation Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Fetch Events for the Month
    useEffect(() => {
        if (!user) return;
        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from('doctor_calendar_events')
                .select('*')
                .eq('doctor_id', user.id)
                .gte('start_time', startDate.toISOString())
                .lte('end_time', endDate.toISOString());

            if (data) setEvents(data);
            if (error) console.error('Error fetching events:', error);
        };
        fetchEvents();
    }, [user, currentDate]); // Re-fetch when month changes

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const startDateTime = new Date(selectedDate);
        const [hours, minutes] = formData.time.split(':').map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

        try {
            const { error } = await supabase.from('doctor_calendar_events').insert([{
                doctor_id: user.id,
                title: formData.title,
                type: formData.type,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                notes: formData.notes
            }]);

            if (error) throw error;

            // Refresh
            const { data } = await supabase
                .from('doctor_calendar_events')
                .select('*')
                .eq('doctor_id', user.id)
                .gte('start_time', startDate.toISOString())
                .lte('end_time', endDate.toISOString());
            if (data) setEvents(data);

            setIsAddEventOpen(false);
            setFormData({ title: '', type: 'appointment', time: '09:00', duration: 60, notes: '' });
            alert('Event added!');
        } catch (err: any) {
            alert('Error adding event: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(parseISO(event.start_time), day));
    };

    // Timeline / Free Slots Logic for Selected Day
    const dayEvents = getEventsForDay(selectedDate).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Simple free slot calculator (9AM - 5PM)
    const workStartHour = 9;
    const workEndHour = 17;
    const slots = [];
    for (let h = workStartHour; h < workEndHour; h++) {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(h, 0, 0, 0);
        const slotEnd = new Date(selectedDate);
        slotEnd.setHours(h + 1, 0, 0, 0);

        const isBusy = dayEvents.some(event => {
            const eStart = parseISO(event.start_time);
            const eEnd = parseISO(event.end_time);
            return (eStart < slotEnd && eEnd > slotStart);
        });

        slots.push({ time: `${h}:00 - ${h + 1}:00`, isFree: !isBusy });
    }


    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Schedule & Calendar</h2>
            </div>

            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" /> Schedule
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-md border bg-white shadow-sm">
                            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="w-32 text-center font-medium bg-transparent">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((day) => {
                            const dayEventsList = getEventsForDay(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentDate);

                            return (
                                <div
                                    key={day.toString()}
                                    className={`min-h-[100px] bg-white p-2 transition-all hover:bg-gray-50 cursor-pointer relative group flex flex-col gap-1
                                    ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-900'}
                                    ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
                                    ${isToday(day) ? 'bg-blue-50/30' : ''}
                                `}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-medium ${isToday(day) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setIsAddEventOpen(true); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded-full transition-opacity"
                                        >
                                            <Plus className="h-3 w-3 text-blue-600" />
                                        </button>
                                    </div>
                                    <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                                        {dayEventsList.slice(0, 3).map(event => (
                                            <div key={event.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 font-medium
                                            ${event.type === 'surgery' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-blue-50 border-blue-500 text-blue-700'}
                                        `}>
                                                {format(parseISO(event.start_time), 'HH:mm')} {event.title}
                                            </div>
                                        ))}
                                        {dayEventsList.length > 3 && (
                                            <div className="text-[10px] text-gray-400 pl-1">+{dayEventsList.length - 3} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline / Free Slots View (Below Calendar) */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Timeline & Availability for {format(selectedDate, 'MMMM do, yyyy')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Event List */}
                            <div className="col-span-2 space-y-3">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Scheduled Events</h4>
                                {dayEvents.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic py-4">No events scheduled for this day.</p>
                                ) : (
                                    dayEvents.map(event => (
                                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className={`p-2 rounded-full ${event.type === 'surgery' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {event.type === 'surgery' ? <Activity className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-900">{event.title}</h5>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                                                    </span>
                                                    <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 border text-gray-600">
                                                        {event.type}
                                                    </span>
                                                </div>
                                                {event.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{event.notes}</p>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Free Slots Sidebar */}
                            <div className="bg-gray-50 rounded-xl p-4 h-fit border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Free Time Slots</h4>
                                <div className="space-y-2">
                                    {slots.map((slot, i) => (
                                        <div key={i} className={`text-sm px-3 py-2 rounded-md border flex items-center justify-between
                                        ${slot.isFree ? 'bg-white border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'}
                                    `}>
                                            <span>{slot.time}</span>
                                            {slot.isFree ? <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-800 font-medium">Available</span> : <span className="text-xs">Busy</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* ADD EVENT MODAL */}
                <Modal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} title={`Add Event - ${format(selectedDate, 'MMM do')}`}>
                    <form onSubmit={handleAddEvent} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Event Title / Patient Name</label>
                            <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Consultation with John Doe" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Type</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="appointment">Appointment</option>
                                    <option value="surgery">Surgery</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Time</label>
                                <Input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Details / Notes</label>
                            <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Event'}</Button>
                        </div>
                    </form>
                </Modal>
            </Card>
        </div>
    );
};

export default DoctorSchedule;
