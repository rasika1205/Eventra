import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              UniEvent Portal
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
              Streamline University Events, Empower Student Engagement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              <Button
                size="lg"
                onClick={() => navigate("/auth?type=student")}
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
              >
                Student Login
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth?type=organizer")}
                className="text-lg px-8 py-6 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105"
              >
                Organizer Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 bg-card border-border hover:border-primary transition-all duration-300 hover:scale-105 group">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Discover Events</h3>
              <p className="text-muted-foreground">
                Browse and register for exciting campus events across all departments
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-accent transition-all duration-300 hover:scale-105 group">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Easy Registration</h3>
              <p className="text-muted-foreground">
                Simple one-click registration process with instant confirmation
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-success transition-all duration-300 hover:scale-105 group">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                <Award className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Track Participation</h3>
              <p className="text-muted-foreground">
                Keep track of your registered events and payment status
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
