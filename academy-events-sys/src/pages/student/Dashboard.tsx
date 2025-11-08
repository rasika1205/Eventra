import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, DollarSign, LogOut , Search} from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";


const API_BASE = "http://localhost:8000/api"; 
const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth?type=student");
        } else {
          loadStudentData(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth?type=student");
      } else {
        loadStudentData(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  const loadStudentData = async (authUser) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resStudent = await fetch(`${API_BASE}/student/profile`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      if (!resStudent.ok) throw new Error("Failed to load student data");
      const studentData = await resStudent.json();
      setStudent(studentData);


      const resEvents = await fetch(`${API_BASE}/events`);
      if (!resEvents.ok) throw new Error("Failed to load events");
      const eventsData = await resEvents.json();
      setEvents(eventsData);

      const resRegs = await fetch(`${API_BASE}/registrations/${studentData.Student_ID}`);
      if (!resRegs.ok) throw new Error("Failed to load registrations");
      const regsData = await resRegs.json();
      setRegistrations(regsData);

      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load data");
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    if (!student) return;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch(`${API_BASE}/register_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
      }),
    });
      if (!res.ok) throw new Error("Registration failed");

      toast.success("Successfully registered for event!");
      if (user) loadStudentData(user);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (registrationId) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch(`${API_BASE}/cancel_registration/${registrationId}`, { method: "DELETE",headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }, });
      if (!res.ok) throw new Error("Failed to cancel registration");
      toast.success("Registration cancelled!");
      if (user) loadStudentData(user);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isRegistered = (eventId) =>
    registrations.some((reg) => reg.event_id === eventId);

  const filteredEvents = events.filter((event) =>
    event.event_name.toLowerCase().includes(searchQuery.toLowerCase())
  );



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
          <h1 className="text-2xl font-bold text-primary">UniEvent Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-foreground">
              {student?.first_name} {student?.last_name}
            </span>
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
            <h3 className="text-sm text-muted-foreground mb-2">My Registrations</h3>
            <p className="text-3xl font-bold text-accent">{registrations.length}</p>
          </Card>
          <Card className="p-6 bg-card border-success/50">
            <h3 className="text-sm text-muted-foreground mb-2">Department</h3>
            <p className="text-lg font-semibold text-success">{student?.Dept_Name}</p>
          </Card>
        </div>

        {/* My Registrations */}
        {registrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">My Registered Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => (
                <Card key={reg.registration_id} className="p-6 bg-card border-border hover:border-accent transition-colors">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{reg.event_name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(reg.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{reg.venue}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={reg.payment_status === "Paid" ? "default" : "secondary"}>
                        {reg.payment_status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">All Events</h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.event_id} className="p-6 bg-card border-border hover:border-primary transition-all hover:scale-105 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-foreground">{event.event_name}</h3>
                  <Badge variant="outline" className="border-accent text-accent">
                    {event.event_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-success" />
                    <span>Max: {event.max_participants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-warning" />
                    <span>Fee: ₹{event.registration_fee}</span>
                  </div>
                </div>
                {isRegistered(event.event_id) ? (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      Already Registered
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        const registration = registrations.find(
                          (r) => r.event_id === event.event_id
                        );
                        if (registration) handleCancel(registration.registration_id);
                      }}
                    >
                      Cancel Registration
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleRegister(event.event_id)}
                  >
                    Register Now
                  </Button>
                )}

              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
