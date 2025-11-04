-- Create Department table
CREATE TABLE IF NOT EXISTS public.department (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dept_name TEXT NOT NULL UNIQUE
);

-- Create Student table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.student (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    year INTEGER,
    department_id UUID REFERENCES public.department(department_id)
);

-- Create Organizer table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.organizer (
    organizer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT,
    department_id UUID REFERENCES public.department(department_id)
);

-- Create Sponsor table
CREATE TABLE IF NOT EXISTS public.sponsor (
    sponsor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    contribution_amount DECIMAL(10, 2)
);

-- Create Event table
CREATE TABLE IF NOT EXISTS public.event (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue TEXT NOT NULL,
    department_id UUID REFERENCES public.department(department_id),
    sponsor_id UUID REFERENCES public.sponsor(sponsor_id),
    max_participants INTEGER,
    registration_fee DECIMAL(10, 2) DEFAULT 0,
    event_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Registration table
CREATE TABLE IF NOT EXISTS public.registration (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.event(event_id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.student(student_id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status TEXT DEFAULT 'Unpaid',
    UNIQUE(event_id, student_id)
);

-- Create EventOrganizer junction table
CREATE TABLE IF NOT EXISTS public.event_organizer (
    event_id UUID REFERENCES public.event(event_id) ON DELETE CASCADE NOT NULL,
    organizer_id UUID REFERENCES public.organizer(organizer_id) ON DELETE CASCADE NOT NULL,
    role TEXT,
    PRIMARY KEY (event_id, organizer_id)
);

-- Enable Row Level Security
ALTER TABLE public.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizer ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Department (public read)
CREATE POLICY "Anyone can view departments" ON public.department FOR SELECT USING (true);

-- RLS Policies for Student
CREATE POLICY "Students can view their own profile" ON public.student FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update their own profile" ON public.student FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own profile" ON public.student FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Organizer
CREATE POLICY "Organizers can view their own profile" ON public.organizer FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can update their own profile" ON public.organizer FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view all organizers" ON public.organizer FOR SELECT USING (true);

-- RLS Policies for Sponsor (organizers can manage, everyone can read)
CREATE POLICY "Anyone can view sponsors" ON public.sponsor FOR SELECT USING (true);
CREATE POLICY "Organizers can manage sponsors" ON public.sponsor FOR ALL USING (
    EXISTS (SELECT 1 FROM public.organizer WHERE organizer.user_id = auth.uid())
);

-- RLS Policies for Event (everyone can read, organizers can manage)
CREATE POLICY "Anyone can view events" ON public.event FOR SELECT USING (true);
CREATE POLICY "Organizers can create events" ON public.event FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organizer WHERE organizer.user_id = auth.uid())
);
CREATE POLICY "Organizers can update events in their department" ON public.event FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.organizer 
        WHERE organizer.user_id = auth.uid() 
        AND organizer.department_id = event.department_id
    )
);
CREATE POLICY "Organizers can delete events in their department" ON public.event FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.organizer 
        WHERE organizer.user_id = auth.uid() 
        AND organizer.department_id = event.department_id
    )
);

-- RLS Policies for Registration
CREATE POLICY "Students can view their own registrations" ON public.registration FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student WHERE student.student_id = registration.student_id AND student.user_id = auth.uid())
);
CREATE POLICY "Students can create registrations" ON public.registration FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.student WHERE student.student_id = registration.student_id AND student.user_id = auth.uid())
);
CREATE POLICY "Organizers can view registrations for their department events" ON public.registration FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.organizer o
        JOIN public.event e ON e.department_id = o.department_id
        WHERE o.user_id = auth.uid() AND e.event_id = registration.event_id
    )
);
CREATE POLICY "Organizers can update registrations for their department events" ON public.registration FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.organizer o
        JOIN public.event e ON e.department_id = o.department_id
        WHERE o.user_id = auth.uid() AND e.event_id = registration.event_id
    )
);

-- RLS Policies for EventOrganizer
CREATE POLICY "Anyone can view event organizers" ON public.event_organizer FOR SELECT USING (true);
CREATE POLICY "Organizers can manage event assignments" ON public.event_organizer FOR ALL USING (
    EXISTS (SELECT 1 FROM public.organizer WHERE organizer.user_id = auth.uid())
);

-- Insert some sample departments
INSERT INTO public.department (dept_name) VALUES 
    ('Computer Science'),
    ('Electronics'),
    ('Mechanical'),
    ('Civil'),
    ('Business Administration')
ON CONFLICT (dept_name) DO NOTHING;