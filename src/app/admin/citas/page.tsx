'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface CalendlyEvent {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: string;
  color?: string;
}

interface ScheduledEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location: string;
  };
  invitees_counter?: {
    total: number;
    active: number;
  };
}

export default function CitasPage() {
  const toast = useToast();
  const [eventTypes, setEventTypes] = useState<CalendlyEvent[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
  }>({
    isOpen: false,
    eventId: '',
    eventName: '',
  });
  const [formData, setFormData] = useState({
    eventTypeUri: '',
    inviteeEmail: '',
    inviteeName: '',
    startTime: '',
    timezone: 'America/Santiago',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const res = await fetch(
        `/api/calendly/events?min_start_time=${now.toISOString()}&max_start_time=${nextMonth.toISOString()}&count=50`
      );

      if (res.ok) {
        const data = await res.json();
        setEventTypes(data.eventTypes || []);
        setScheduledEvents(data.scheduledEvents || []);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al cargar eventos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/calendly/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Evento creado exitosamente');
        
        // Si hay un schedulingLink (plan gratuito), ofrecer copiarlo
        if (data.schedulingLink) {
          const message = `${data.message}\n\nEnlace: ${data.schedulingLink}\n\n¿Deseas copiar el enlace al portapapeles?`;
          const shouldCopy = window.confirm(message);
          if (shouldCopy) {
            await navigator.clipboard.writeText(data.schedulingLink);
            toast.info('Enlace copiado al portapapeles');
          }
        }
        
        setShowCreateModal(false);
        setFormData({
          eventTypeUri: '',
          inviteeEmail: '',
          inviteeName: '',
          startTime: '',
          timezone: 'America/Santiago',
        });
        fetchEvents();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear evento');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear evento');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelEvent = async () => {
    try {
      const eventId = showCancelDialog.eventId.split('/').pop();
      const res = await fetch(`/api/calendly/events/${eventId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelado desde el panel de administración' }),
      });

      if (res.ok) {
        toast.success('Evento cancelado exitosamente');
        setShowCancelDialog({ isOpen: false, eventId: '', eventName: '' });
        fetchEvents();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al cancelar evento');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cancelar evento');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Activa' },
      canceled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelada' },
      completed: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Completada' },
    };

    const statusInfo = statusMap[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Agrupar eventos por fecha
  const eventsByDate: Record<string, ScheduledEvent[]> = {};
  scheduledEvents.forEach((event) => {
    const dateKey = new Date(event.start_time).toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Generar calendario mensual
  const generateMonthCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Domingo de la semana

    const days: Array<{ date: Date; events: ScheduledEvent[] }> = [];
    const current = new Date(startDate);

    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dateKey = current.toISOString().split('T')[0];
      days.push({
        date: new Date(current),
        events: eventsByDate[dateKey] || [],
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Citas y Reuniones</h1>
          <p className="text-slate-400 mt-1">Gestiona tus eventos programados en Calendly</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Evento
          </button>
        </div>
      </div>

      {/* Tipos de Evento */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tipos de Evento Disponibles</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : eventTypes.length === 0 ? (
          <p className="text-slate-400">No hay tipos de evento configurados</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((eventType) => (
              <div
                key={eventType.uri}
                className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white">{eventType.name}</h3>
                  {eventType.active ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Duración: {eventType.duration} minutos
                </p>
                <a
                  href={eventType.scheduling_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-medium inline-flex items-center gap-1"
                >
                  Ver en Calendly
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eventos Programados */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Eventos Programados</h2>
          <button
            onClick={fetchEvents}
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : scheduledEvents.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No hay eventos programados</p>
        ) : view === 'list' ? (
          <div className="space-y-4">
            {scheduledEvents
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((event) => (
                <div
                  key={event.uri}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{event.name}</h3>
                      <p className="text-sm text-slate-400">{formatDate(event.start_time)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.status)}
                      {event.status === 'active' && (
                        <button
                          onClick={() => setShowCancelDialog({
                            isOpen: true,
                            eventId: event.uri,
                            eventName: event.name,
                          })}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          title="Cancelar evento"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {event.invitees_counter && (
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Invitados: {event.invitees_counter.active}/{event.invitees_counter.total}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : view === 'month' ? (
          <div className="bg-slate-900/30 rounded-xl p-6">
            {/* Navegación del mes */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-white">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h3>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-2">
              {generateMonthCalendar().map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === selectedDate.getMonth();
                const isToday = day.date.toDateString() === new Date().toDateString();
                const hasEvents = day.events.length > 0;

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                      isCurrentMonth
                        ? isToday
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-800/30 border-slate-700/50'
                        : 'bg-slate-900/20 border-slate-800/50 opacity-50'
                    } ${hasEvents ? 'hover:border-cyan-500/50 cursor-pointer' : ''}`}
                    onClick={() => {
                      if (hasEvents) {
                        setView('list');
                      }
                    }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth
                        ? isToday
                          ? 'text-cyan-400'
                          : 'text-slate-300'
                        : 'text-slate-500'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map((event) => (
                        <div
                          key={event.uri}
                          className="text-xs bg-cyan-500/20 text-cyan-300 rounded px-1.5 py-0.5 truncate"
                          title={event.name}
                        >
                          {new Date(event.start_time).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - {event.name}
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-slate-400">
                          +{day.events.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(eventsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, events]) => (
                <div key={date} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-white mb-3 text-sm">
                    {new Date(date).toLocaleDateString('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.uri}
                        className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-white text-sm">{event.name}</p>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(event.start_time).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal Crear Evento */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Evento</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Evento <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.eventTypeUri}
                  onChange={(e) => setFormData({ ...formData, eventTypeUri: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                >
                  <option value="">Selecciona un tipo de evento</option>
                  {eventTypes
                    .filter(et => et.active)
                    .map((eventType) => (
                      <option key={eventType.uri} value={eventType.uri}>
                        {eventType.name} ({eventType.duration} min)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Invitado <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.inviteeEmail}
                    onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    required
                    placeholder="invitado@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre Invitado
                  </label>
                  <input
                    type="text"
                    value={formData.inviteeName}
                    onChange={(e) => setFormData({ ...formData, inviteeName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="Nombre completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha y Hora <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                >
                  <option value="America/Santiago">Santiago, Chile (GMT-3)</option>
                  <option value="America/Lima">Lima, Perú (GMT-5)</option>
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/New_York">Nueva York, USA (GMT-5)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Cancelar Evento */}
      <ConfirmDialog
        isOpen={showCancelDialog.isOpen}
        title="Cancelar Evento"
        message={`¿Estás seguro de que deseas cancelar el evento '${showCancelDialog.eventName}'? Esta acción no se puede deshacer.`}
        type="danger"
        onConfirm={handleCancelEvent}
        onCancel={() => setShowCancelDialog({ isOpen: false, eventId: '', eventName: '' })}
      />
    </div>
  );
}
