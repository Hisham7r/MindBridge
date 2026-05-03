// Mock data for MindBridge platform

export const therapists = [
  {
    id: 1,
    name: "Dr. Sarah Ahmed",
    title: "Clinical Psychologist",
    credentials: "PhD, 8yr Experience",
    specializations: ["Anxiety", "Depression", "Trauma", "CBT"],
    fee: 4500,
    feeDisplay: "PKR 4,500/hr",
    rating: 4.9,
    reviews: 120,
    sessionsCount: 342,
    languages: ["English", "Urdu"],
    image: null,
    initials: "SA",
    color: "#22C55E",
    about: "I believe in a collaborative approach to healing. My practice focuses on evidence-based treatments for anxiety, depression, and life transitions. I help clients build resilience and self-compassion through a warm, non-judgmental space.",
    methodology: "Cognitive Behavioral Therapy (CBT), Person-centered",
    availableSlots: {
      "2026-04-14": ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
      "2026-04-15": ["10:00 AM", "01:00 PM", "03:00 PM"],
      "2026-04-16": ["09:00 AM", "12:00 PM"],
    },
    track: "mental-health",
  },
  {
    id: 2,
    name: "Zain Malik",
    title: "Career Counselor",
    credentials: "MSc, 6yr Experience",
    specializations: ["Career Guidance", "Anxiety", "Life Transitions"],
    fee: 3200,
    feeDisplay: "PKR 3,200/hr",
    rating: 4.7,
    reviews: 85,
    sessionsCount: 198,
    languages: ["English", "Urdu", "Punjabi"],
    image: null,
    initials: "ZM",
    color: "#3B82F6",
    about: "Helping young professionals and students navigate career pivots and ambition-alignment. I focus on mental blocks that prevent career growth alongside strategic planning.",
    methodology: "Solution-focused, Strength-based therapy",
    availableSlots: {
      "2026-04-14": ["10:00 AM", "02:00 PM", "05:00 PM"],
      "2026-04-15": ["09:00 AM", "11:00 AM", "04:00 PM"],
    },
    track: "career",
  },
  {
    id: 3,
    name: "Dr. Alizeh Shah",
    title: "Trauma Specialist",
    credentials: "PhD, 10yr Experience",
    specializations: ["Trauma", "PTSD", "Couples Therapy", "Anxiety Relief"],
    fee: 5500,
    feeDisplay: "PKR 5,500/hr",
    rating: 5.0,
    reviews: 64,
    sessionsCount: 510,
    languages: ["English", "Urdu"],
    image: null,
    initials: "AS",
    color: "#8B5CF6",
    about: "Specializing in trauma-informed care with a deep compassion for survivors of difficult life experiences. I hold a space where healing is not rushed.",
    methodology: "EMDR, Trauma-informed CBT",

    // patientReview: {
    //   text: "Dr. Alizeh Shah has a way of making you feel heard and understood from the very first minute. Her sessions are a sanctuary.",
    //   author: "Sarah J."
    // },  
 
    availableSlots: {
      "2026-04-15": ["09:00 AM", "11:30 AM"],
      "2026-04-16": ["10:00 AM", "01:00 PM", "03:30 PM"],
    },
    track: "mental-health",
  },
  {
    id: 4,
    name: "Dr. Amara Malik",
    title: "Clinical Psychologist, PhD",
    credentials: "PhD, 7yr Experience",
    specializations: ["CBT", "Trauma-Informed", "Anxiety Relief", "Couples Therapy"],
    fee: 4200,
    feeDisplay: "PKR 4,200/hr",
    rating: 4.9,
    reviews: 120,
    sessionsCount: 280,
    languages: ["English", "Urdu", "Punjabi"],
    image: null,
    initials: "AM",
    color: "#F59E0B",
    about: "My approach is rooted in the belief that healing is a collaborative journey. I specialize in evidence-based treatments for anxiety, depression, and trauma, helping individuals navigate life's transitions with resilience and self-compassion.",
    methodology: "Person-centered therapy",
    // patientReview: {
    //   text: "Dr. Malik has a way of making you feel heard and understood from the very first minute. Her sessions are a sanctuary.",
    //   author: "Sarah J."
    // },
    availableSlots: {
      "2026-04-14": ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
      "2026-04-15": ["10:00 AM", "03:00 PM"],
      "2026-04-16": ["09:00 AM", "01:00 PM"],
    },
    track: "mental-health",
  },
];

export const patientSessions = [
  {
    id: 1,
    therapist: "Dr. Sarah Jenkins",
    therapistInitials: "SJ",
    therapistColor: "#22C55E",
    type: "Mental Health Therapy",
    date: "2026-04-13",
    time: "5:00 PM",
    status: "upcoming",
    zoomLink: "https://zoom.us/j/123456789",
    sessionNumber: 3,
  },
  {
    id: 2,
    therapist: "Career Counseling",
    therapistInitials: "CC",
    therapistColor: "#3B82F6",
    type: "Career Guidance",
    date: "2026-04-18",
    time: "10:00 AM",
    status: "upcoming",
    zoomLink: null,
    sessionNumber: 1,
  },
];

export const pastSessions = [
  { id: 1, therapist: "Michael Aris", initials: "MA", color: "#8B5CF6", date: "Oct 12, 2024", duration: "50 mins", mood: "Calm", moodColor: "green" },
  { id: 2, therapist: "Dr. Sarah Jenkins", initials: "SJ", color: "#22C55E", date: "Oct 05, 2024", duration: "60 mins", mood: "Energetic", moodColor: "blue" },
  { id: 3, therapist: "Michael Aris", initials: "MA", color: "#8B5CF6", date: "Sept 28, 2024", duration: "50 mins", mood: "Tired", moodColor: "gray" },
];

export const therapistSchedule = [
  {
    id: 1,
    patient: "Fatima Batool",
    type: "Cognitive Behavioral Therapy",
    time: "10:00 AM",
    sessionNumber: 3,
    status: "in-progress",
    notes: "Patient has noted increased stress levels recently.",
  },
  {
    id: 2,
    patient: "Omar Farooq",
    type: "General Session",
    time: "12:00 PM",
    sessionNumber: 1,
    status: "upcoming",
    notes: "",
  },
  {
    id: 3,
    patient: "Zainab Malik",
    time: "11:30 AM",
    type: "Anxiety Management",
    sessionNumber: 4,
    status: "upcoming",
    notes: "Review the journal entries.",
  },
  {
    id: 4,
    patient: "Ahmed Raza",
    time: "2:00 PM",
    type: "Career Therapy – Introductory Session",
    sessionNumber: 1,
    status: "upcoming",
    notes: "First career guidance session.",
  },
];

export const adminPayments = [
  { id: 1, user: "Sarah Jenkins", email: "sarah.j@example.com", amount: "PKR 4,500", status: "pending" },
  { id: 2, user: "Michael Thorne", email: "m.thorne@corp.com", amount: "PKR 3,200", status: "pending" },
  { id: 3, user: "Aisha Rahman", email: "aisha_rah@outlook.pk", amount: "PKR 5,500", status: "pending" },
  { id: 4, user: "Omar Farooq", email: "omar.f@gmail.com", amount: "PKR 4,500", status: "approved" },
];

export const adminTherapists = [
  { id: 1, name: "Dr. Sarah Ahmed", patientsToday: 4, patientsWeek: 18, totalAllTime: 342, upcoming: 3, status: "Active" },
  { id: 2, name: "Zain Malik", patientsToday: 2, patientsWeek: 12, totalAllTime: 198, upcoming: 2, status: "Active" },
  { id: 3, name: "Dr. Alizeh Shah", patientsToday: 3, patientsWeek: 15, totalAllTime: 510, upcoming: 4, status: "Active" },
  { id: 4, name: "Dr. Amara Malik", patientsToday: 1, patientsWeek: 8, totalAllTime: 280, upcoming: 2, status: "Inactive" },
];
