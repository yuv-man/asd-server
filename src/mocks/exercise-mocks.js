const sampleExercises = [
  {
    title: 'Hand-Eye Coordination Game',
    description: 'A game that improves hand-eye coordination through object tracking',
    area: 'occupationalTherapy',
    difficultyLevels: [
      { level: 1, description: 'Beginner', passingScore: 60 },
      { level: 2, description: 'Intermediate', passingScore: 70 },
      { level: 3, description: 'Advanced', passingScore: 80 }
    ],
    instructions: 'Follow the moving object with your finger',
    isTest: false,
    estimatedTimeMinutes: 5,
    skills: ['hand-eye coordination', 'focus', 'motor skills']
  },
  {
    title: 'Word Association Exercise',
    description: 'Practice associating related words to improve vocabulary',
    area: 'speechTherapy',
    difficultyLevels: [
      { level: 1, description: 'Beginner', passingScore: 60 },
      { level: 2, description: 'Intermediate', passingScore: 70 },
      { level: 3, description: 'Advanced', passingScore: 80 }
    ],
    instructions: 'Match the related words as quickly as possible',
    isTest: false,
    estimatedTimeMinutes: 8,
    skills: ['vocabulary', 'word association', 'language']
  },
  {
    title: 'Pattern Recognition Test',
    description: 'Identify patterns in sequences to improve cognitive abilities',
    area: 'cognitive',
    difficultyLevels: [
      { level: 1, description: 'Beginner', passingScore: 60 },
      { level: 2, description: 'Intermediate', passingScore: 70 },
      { level: 3, description: 'Advanced', passingScore: 80 }
    ],
    instructions: 'Identify the next item in the pattern sequence',
    isTest: true,
    estimatedTimeMinutes: 10,
    skills: ['pattern recognition', 'logical thinking', 'focus']
  }
];

module.exports = { sampleExercises }; 