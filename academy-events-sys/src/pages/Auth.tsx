import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "student";

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form (Student)
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserTypeAndNavigate(session.user);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserTypeAndNavigate(session.user);
      }
    });
    fetchDepartments();

    return () => subscription.unsubscribe();
  }, []);

  const checkUserTypeAndNavigate = async (authUser: User) => {
    try {
      const { data: studentData } = await supabase
        .from("student")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (studentData) {
        navigate("/student/dashboard");
        return;
      }

      const { data: organizerData } = await supabase
        .from("organizer")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (organizerData) {
        navigate("/organizer/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking user type:", error);
    }
  };

  const fetchDepartments = async () => {
    const res = await fetch("http://localhost:8000/api/departments");
    const data = await res.json();
    setDepartments(data);
};


const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (userType === "student") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;

      toast.success("Student login successful!");

      const { user } = data;
      if (user) {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await fetch("http://localhost:8000/api/student/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load student profile");
        const studentData = await response.json();

        if (studentData) {
          navigate("/student/dashboard");
        } else {
          toast.error("Student data not found");
        }
      }
    } else {
      const response = await fetch("http://localhost:8000/api/organizer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Organizer login failed");
      localStorage.setItem("organizerData", JSON.stringify(result.organizer));
      toast.success(`Welcome, ${result.First_Name || "Organizer"}!`);
      navigate("/organizer/dashboard");
    }
  } catch (error: any) {
    toast.error(error.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (userType !== "student") {
      toast.error("Only students can register. Organizers are pre-added by admin.");
      setLoading(false);
      return;
    }

    if (!firstName || !lastName || !signupEmail || !signupPassword || !departmentId) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) throw authError;

    if (authData?.user) {
      const supabaseId = authData.user.id;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Please verify your email before continuing.");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/student/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: supabaseId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: signupEmail,
          phone: phone || null,
          year: year ? parseInt(year) : null,
          department_id: parseInt(departmentId), 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Flask API Error:", result);
        throw new Error(result.error || "Failed to save user in MySQL");
      }

      toast.success("Account created successfully!");
      navigate("/student/dashboard");
    } else {
      toast.info("Please check your email for verification before logging in.");
    }
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Signup failed");
  } finally {
    setLoading(false);
  }
};

  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-card border-border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {userType === "student" ? "Student" : "Organizer"} Portal
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {userType === "student" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Organizer accounts are created by administrators only.
                </p>
                <p className="text-muted-foreground mt-2">
                  Please contact your department admin for access.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-accent"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
