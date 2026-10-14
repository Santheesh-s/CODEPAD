// High-contrast, vibrant colors for collaborators in real-time sessions
export const COLLABORATOR_COLORS = [
    { bg: '#3B82F6', text: '#FFFFFF', lightBg: '#DBEAFE', darkBg: '#1E3A8A' }, // Blue
    { bg: '#10B981', text: '#FFFFFF', lightBg: '#D1FAE5', darkBg: '#064E3B' }, // Emerald
    { bg: '#8B5CF6', text: '#FFFFFF', lightBg: '#EDE9FE', darkBg: '#4C1D95' }, // Purple
    { bg: '#F59E0B', text: '#FFFFFF', lightBg: '#FEF3C7', darkBg: '#78350F' }, // Amber
    { bg: '#EC4899', text: '#FFFFFF', lightBg: '#FCE7F3', darkBg: '#831843' }, // Pink
    { bg: '#06B6D4', text: '#FFFFFF', lightBg: '#CFFAFE', darkBg: '#164E63' }, // Cyan
    { bg: '#F97316', text: '#FFFFFF', lightBg: '#FFEDD5', darkBg: '#7C2D12' }, // Orange
    { bg: '#14B8A6', text: '#FFFFFF', lightBg: '#CCFBF1', darkBg: '#134E4A' }, // Teal
    { bg: '#6366F1', text: '#FFFFFF', lightBg: '#E0E7FF', darkBg: '#312E81' }, // Indigo
    { bg: '#E11D48', text: '#FFFFFF', lightBg: '#FFE4E6', darkBg: '#881337' }, // Rose
];

const ADJECTIVES = [
    'Cosmic', 'Quantum', 'Neon', 'Swift', 'Bright', 'Crypto', 'Hyper',
    'Pixel', 'Binary', 'Nova', 'Cyber', 'Solar', 'Lunar', 'Astral'
];

const NOUNS = [
    'Coder', 'Falcon', 'Otter', 'Panda', 'Hacker', 'Ninja', 'Pilot',
    'Sphinx', 'Phoenix', 'Cheetah', 'Wizard', 'Voyager', 'Pioneer'
];

export function getRandomCollaborator(user = null) {
    const colorIndex = Math.floor(Math.random() * COLLABORATOR_COLORS.length);
    const color = COLLABORATOR_COLORS[colorIndex];

    if (user?.displayName) {
        return {
            name: user.displayName,
            email: user.email || '',
            photoURL: user.photoURL || null,
            color: color.bg,
            colorScheme: color,
            isUser: true
        };
    }

    const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

    return {
        name: `${randomAdj} ${randomNoun}`,
        email: '',
        photoURL: null,
        color: color.bg,
        colorScheme: color,
        isUser: false
    };
}
