import { HubType, SubjectDefinition } from '../types/academic';

export const GENERAL_HUB_SUBJECTS: SubjectDefinition[] = [
  {
    id: 'gen-arabic',
    hub: 'general',
    name: 'Arabic',
    shortCode: 'ARB 101',
    description: 'Arabic language, grammar, reading comprehension, literature, and structured expression.',
    focusAreas: ['Grammar', 'Literature', 'Composition'],
    accentTone: 'blue',
  },
  {
    id: 'gen-math',
    hub: 'general',
    name: 'Math',
    shortCode: 'MTH 102',
    description: 'Algebra, geometry, trigonometry, calculus fundamentals, and analytical problem solving.',
    focusAreas: ['Algebra', 'Geometry', 'Calculus'],
    accentTone: 'blue',
  },
  {
    id: 'gen-english',
    hub: 'general',
    name: 'English',
    shortCode: 'ENG 103',
    description: 'English grammar, reading fluency, vocabulary building, and academic writing.',
    focusAreas: ['Grammar', 'Reading', 'Writing'],
    accentTone: 'blue',
  },
  {
    id: 'gen-physics',
    hub: 'general',
    name: 'Physics',
    shortCode: 'PHY 104',
    description: 'Matter, energy, electricity, waves, optics, and fundamental physical laws.',
    focusAreas: ['Electricity', 'Waves & Optics', 'Matter & Energy'],
    accentTone: 'blue',
  },
  {
    id: 'gen-mechanics',
    hub: 'general',
    name: 'Mechanics',
    shortCode: 'MEC 105',
    description: 'Statics, dynamics, forces, motion analysis, equilibrium, and rigid body principles.',
    focusAreas: ['Statics', 'Dynamics', 'Kinematics'],
    accentTone: 'blue',
  },
  {
    id: 'gen-social-studies',
    hub: 'general',
    name: 'Social Studies',
    shortCode: 'SOC 106',
    description: 'History, geography, societies, civic development, and human-environment relationships.',
    focusAreas: ['History', 'Geography', 'Society'],
    accentTone: 'blue',
  },
  {
    id: 'gen-religious-education',
    hub: 'general',
    name: 'Religious Education',
    shortCode: 'REL 107',
    description: 'Foundational religious teachings, values, ethics, and moral character development.',
    focusAreas: ['Values', 'Ethics', 'Teachings'],
    accentTone: 'blue',
  },
  {
    id: 'gen-national-education',
    hub: 'general',
    name: 'National Education',
    shortCode: 'NAT 108',
    description: 'Citizenship, national identity, civic responsibility, rights, and community participation.',
    focusAreas: ['Citizenship', 'Civic Duty', 'National Identity'],
    accentTone: 'blue',
  },
];

export const SPECIALIZED_SUBJECT_ID = 'computer-science';
export const SPECIALIZED_SUBJECT_NAME = 'Computer Science';

export const COMPUTER_SCIENCE_SUBJECT: SubjectDefinition = {
  id: SPECIALIZED_SUBJECT_ID,
  hub: 'specialized',
  name: SPECIALIZED_SUBJECT_NAME,
  shortCode: 'CS',
  description: 'Unified Computer Science curriculum, courses, technical guides, and engineering resources.',
  focusAreas: ['Computer Science'],
  accentTone: 'red',
};

export const SPECIALIZED_HUB_SUBJECTS: SubjectDefinition[] = [];

export function getSubjectsByHub(hub: HubType): SubjectDefinition[] {
  return hub === 'general' ? GENERAL_HUB_SUBJECTS : SPECIALIZED_HUB_SUBJECTS;
}

export function findSubjectById(subjectId?: string): SubjectDefinition | undefined {
  if (!subjectId) return undefined;
  const generalMatch = GENERAL_HUB_SUBJECTS.find(
    (s) => s.id === subjectId || s.name === subjectId
  );
  if (generalMatch) return generalMatch;

  if (
    subjectId === SPECIALIZED_SUBJECT_ID ||
    subjectId === SPECIALIZED_SUBJECT_NAME ||
    subjectId.startsWith('spec-')
  ) {
    return COMPUTER_SCIENCE_SUBJECT;
  }

  return undefined;
}

export const NEWS_CATEGORIES = [
  'Curriculum Updates',
  'Technology Research',
  'Campus & Cohort Events',
  'Competitions & Hackathons',
  'Scholarships & Opportunities',
];

export const WEBSITE_CATEGORIES = [
  'Interactive Labs & Simulators',
  'Documentation & References',
  'Open Courseware',
  'Developer & Engineering Tools',
  'Research Databases',
];

export const COMMUNITY_SUBJECTS = [
  'General Hub · Mathematics & Sciences',
  'General Hub · Writing & Logic',
  'Specialized Hub · Software & AI',
  'Specialized Hub · Hardware & Robotics',
  'Specialized Hub · Security & Cloud',
  'Study Methods & Project Help',
];
