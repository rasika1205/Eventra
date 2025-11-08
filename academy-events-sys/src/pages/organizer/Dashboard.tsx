import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, Calendar, Users, DollarSign, Pencil } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

const API_BASE = "http://localhost:8000/api";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [eventType, setEventType] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  useEffect(() => {
    const storedOrganizer = localStorage.getItem("organizerData");
  if (storedOrganizer) {
    const parsed = JSON.parse(storedOrganizer);
    setOrganizer(parsed);
    loadOrganizerData(parsed.Organizer_ID);
  } else {
    navigate("/auth?type=organizer");
  }
}, [navigate]);


  const loadOrganizerData = async (organizerId: number) => {
    try {
      const res = await fetch(`${API_BASE}/organizer/${organizerId}`);
      if (!res.ok) throw new Error("Failed to load organizer data");

      const data = await res.json();
      console.log("Organizer Dashboard Data:", data);

      setOrganizer(data.organizer);
      setEvents(data.events);
      const sponsorRes = await fetch(`${API_BASE}/sponsors`);
      const sponsorData = await sponsorRes.json();
      setSponsors(sponsorData);
      const deptRes = await fetch(`${API_BASE}/departments`);
      const deptData = await deptRes.json();
      setDepartments(deptData);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };
  console.log(sponsors)

  const handleCreateEvent = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!organizer) return;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const response = await fetch("http://localhost:8000/api/organizer/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: eventName,
        description: description,
        date: date,
        time: time,
        venue: venue,
        department_id: organizer.Department_ID,  
        sponsor_id: sponsorId || null,
        max_participants: parseInt(maxParticipants),
        fee: parseFloat(registrationFee),
        type: eventType,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to create event");

    toast.success("Event created successfully!");
    setIsDialogOpen(false);


    setEventName("");
    setDescription("");
    setDate("");
    setTime("");
    setVenue("");
    setMaxParticipants("");
    setRegistrationFee("");
    setEventType("");
    setSponsorId("");

    if (organizer?.Organizer_ID) {
      await loadOrganizerData(organizer.Organizer_ID);
    }
  } catch (error: any) {
    console.error("Event creation error:", error);
    toast.error(error.message || "Failed to create event");
  }
};

  const handleUpdateEvent = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingEvent) return;
  console.log("Updating Event ID:", editingEvent.event_id);
  try {
    const response = await fetch(`http://localhost:8000/api/events/${editingEvent.Event_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: eventName,
        description,
        date,
        time,
        venue,
        sponsor_id: sponsorId || null,
        max_participants: parseInt(maxParticipants),
        fee: parseFloat(registrationFee),
        type: eventType,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to update event");

    toast.success("Event updated successfully!");
    setIsEditDialogOpen(false);
    setEditingEvent(null);

    // Reset form
    setEventName("");
    setDescription("");
    setDate("");
    setTime("");
    setVenue("");
    setMaxParticipants("");
    setRegistrationFee("");
    setEventType("");
    setSponsorId("");

    // Reload events
    if (organizer?.Organizer_ID) {
      await loadOrganizerData(organizer.Organizer_ID);
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to update event");
  }
};


  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    setEventName(event.event_name);
    setDescription(event.description || "");
    setDate(event.date);
    setTime(event.time);
    setVenue(event.venue);
    setMaxParticipants(event.max_participants?.toString() || "");
    setRegistrationFee(event.registration_fee?.toString() || "");
    setEventType(event.event_type || "");
    setSponsorId(event.sponsor_id || "");
    setIsEditDialogOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Organizer Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-foreground">{organizer?.Name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card border-primary/50">
            <h3 className="text-sm text-muted-foreground mb-2">Total Events</h3>
            <p className="text-3xl font-bold text-primary">{events.length}</p>
          </Card>
          <Card className="p-6 bg-card border-accent/50">
            <h3 className="text-sm text-muted-foreground mb-2">Department</h3>
            <p className="text-lg font-semibold text-accent">{organizer?.Dept_Name}</p>
          </Card>
          <Card className="p-6 bg-card border-success/50">
            <h3 className="text-sm text-muted-foreground mb-2">Role</h3>
            <p className="text-lg font-semibold text-success">{organizer?.Role}</p>
          </Card>
        </div>

        {/* Create Event Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">My Events</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <Label htmlFor="event-name">Event Name</Label>
                  <Input
                    id="event-name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-input border-border"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-participants">Max Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="registration-fee">Registration Fee</Label>
                    <Input
                      id="registration-fee"
                      type="number"
                      step="0.01"
                      value={registrationFee}
                      onChange={(e) => setRegistrationFee(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                {/* Department Dropdown */}
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.department_id} value={dept.department_id}>
                          {dept.dept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Seminar">Seminar</SelectItem>
                      <SelectItem value="Competition">Competition</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sponsor">Sponsor (Optional)</Label>
                  <Select value={sponsorId} onValueChange={setSponsorId}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsors.map((sponsor) => (
                        <SelectItem key={sponsor.Sponsor_ID} value={sponsor.Sponsor_ID.toString()}>
                          {sponsor.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Create Event
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.event_id} className="p-6 bg-card border-border hover:border-primary transition-all">
              <h3 className="text-xl font-semibold mb-2 text-foreground">{event.Event_Name}</h3>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-foreground">{event.event_name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(event)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.Description}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(event.Date).toLocaleDateString()} at {event.Time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span>Max: {event.Max_Participants}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span>Fee: ₹{event.Registration_Fee}</span>
                </div>
                {event.sponsor && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sponsored by: {event.Sponsor_Name}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
        {/* Edit Event Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <Label htmlFor="edit-event-name">Event Name</Label>
                <Input
                  id="edit-event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-venue">Venue</Label>
                <Input
                  id="edit-venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-max-participants">Max Participants</Label>
                  <Input
                    id="edit-max-participants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-registration-fee">Registration Fee</Label>
                  <Input
                    id="edit-registration-fee"
                    type="number"
                    step="0.01"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-event-type">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Seminar">Seminar</SelectItem>
                    <SelectItem value="Competition">Competition</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sponsor">Sponsor (Optional)</Label>
                <Select value={sponsorId} onValueChange={setSponsorId}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.sponsor_id} value={sponsor.sponsor_id}>
                        {sponsor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Update Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
