import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runQuery } from './db.js';

export async function seedDatabase() {
  const existingUsers = await queryAll('SELECT id FROM users LIMIT 1');
  if (existingUsers.length > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial database with sample surveys and responses...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create demo users
  const user1 = await runQuery(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    ['Alex Morgan', 'demo@pollpulse.io', passwordHash]
  );
  const alexId = user1.lastInsertRowid;

  const user2 = await runQuery(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    ['Prof. Jordan Reed', 'jordan@campus.edu', passwordHash]
  );
  const jordanId = user2.lastInsertRowid;

  // 2. Survey 1: Course Evaluation & Assignment Feedback (CS301)
  const survey1 = await runQuery(
    'INSERT INTO surveys (user_id, title, description, category, is_active) VALUES (?, ?, ?, ?, ?)',
    [
      jordanId,
      'CS301: Web Engineering Course & Assignment Feedback',
      'Please take 3 minutes to evaluate the weekly course assignments, lab instructions, and teaching support. Your honest feedback directly guides curriculum improvements.',
      'Education',
      1
    ]
  );
  const s1Id = survey1.lastInsertRowid;

  // Questions for Survey 1
  // Q1: Rating
  const q1 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'How would you rate the clarity of course assignments and grading rubrics?', 'rating', 1, 1, '1 = Very Unclear, 5 = Exceptionally Clear']
  );

  // Q2: Single Choice
  const q2 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'How manageable was the weekly assignment workload?', 'single_choice', 1, 2, 'Select the option that best reflects your schedule']
  );
  const q2Opts = ['Very manageable', 'Reasonable pace', 'Challenging but fair', 'Overwhelming'];
  for (let i = 0; i < q2Opts.length; i++) {
    await runQuery('INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)', [q2.lastInsertRowid, q2Opts[i], i + 1]);
  }

  // Q3: Multiple Choice
  const q3 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'Which technical topics would you like extra review workshops for?', 'multiple_choice', 0, 3, 'Select all that apply']
  );
  const q3Opts = ['Express.js & REST APIs', 'Relational Database Schema & SQL', 'React State Management & Hooks', 'Form Validation & Security', 'Deploying Cloud Applications'];
  for (let i = 0; i < q3Opts.length; i++) {
    await runQuery('INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)', [q3.lastInsertRowid, q3Opts[i], i + 1]);
  }

  // Q4: Yes / No
  const q4 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'Were TA office hours and discussion forums helpful for resolving roadblocks?', 'yes_no', 1, 4, 'Yes or No']
  );

  // Q5: Dropdown
  const q5 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'What is your preferred format for semester capstone projects?', 'dropdown', 1, 5, 'Choose your preferred structure']
  );
  const q5Opts = ['Individual project with custom topic', 'Paired programming with predefined prompt', 'Small team (3-4 members) agile sprint', 'Open-source contribution'];
  for (let i = 0; i < q5Opts.length; i++) {
    await runQuery('INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)', [q5.lastInsertRowid, q5Opts[i], i + 1]);
  }

  // Q6: Open-ended text
  const q6 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s1Id, 'What specific suggestions do you have to improve future assignments or lab sessions?', 'text', 0, 6, 'Share constructive feedback and ideas']
  );

  // Seed sample student responses for Survey 1
  const studentSampleResponses = [
    {
      answers: {
        [q1.lastInsertRowid]: '5',
        [q2.lastInsertRowid]: 'Reasonable pace',
        [q3.lastInsertRowid]: JSON.stringify(['Express.js & REST APIs', 'Deploying Cloud Applications']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Small team (3-4 members) agile sprint',
        [q6.lastInsertRowid]: 'More live debugging demos during lecture would make the assignment requirements much faster to absorb!'
      },
      seconds: 145
    },
    {
      answers: {
        [q1.lastInsertRowid]: '4',
        [q2.lastInsertRowid]: 'Challenging but fair',
        [q3.lastInsertRowid]: JSON.stringify(['Relational Database Schema & SQL', 'Form Validation & Security']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Paired programming with predefined prompt',
        [q6.lastInsertRowid]: 'The starter code was very clean. Providing a test suite we could run before submitting was huge.'
      },
      seconds: 180
    },
    {
      answers: {
        [q1.lastInsertRowid]: '5',
        [q2.lastInsertRowid]: 'Reasonable pace',
        [q3.lastInsertRowid]: JSON.stringify(['React State Management & Hooks']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Small team (3-4 members) agile sprint',
        [q6.lastInsertRowid]: 'Really enjoyed Assignment 3 building full-stack endpoints.'
      },
      seconds: 120
    },
    {
      answers: {
        [q1.lastInsertRowid]: '3',
        [q2.lastInsertRowid]: 'Challenging but fair',
        [q3.lastInsertRowid]: JSON.stringify(['Relational Database Schema & SQL', 'Deploying Cloud Applications']),
        [q4.lastInsertRowid]: 'No',
        [q5.lastInsertRowid]: 'Individual project with custom topic',
        [q6.lastInsertRowid]: 'TA hours overlapped with another mandatory lecture, so offering evening slots would be amazing.'
      },
      seconds: 210
    },
    {
      answers: {
        [q1.lastInsertRowid]: '4',
        [q2.lastInsertRowid]: 'Very manageable',
        [q3.lastInsertRowid]: JSON.stringify(['Form Validation & Security', 'Express.js & REST APIs']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Small team (3-4 members) agile sprint',
        [q6.lastInsertRowid]: 'Clear rubric breakdown helped me understand exactly where points were allocated.'
      },
      seconds: 95
    },
    {
      answers: {
        [q1.lastInsertRowid]: '5',
        [q2.lastInsertRowid]: 'Reasonable pace',
        [q3.lastInsertRowid]: JSON.stringify(['Deploying Cloud Applications']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Paired programming with predefined prompt',
        [q6.lastInsertRowid]: 'Great balance between frontend design and backend database integration.'
      },
      seconds: 130
    },
    {
      answers: {
        [q1.lastInsertRowid]: '4',
        [q2.lastInsertRowid]: 'Challenging but fair',
        [q3.lastInsertRowid]: JSON.stringify(['React State Management & Hooks', 'Relational Database Schema & SQL']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Small team (3-4 members) agile sprint',
        [q6.lastInsertRowid]: 'Would love a small bonus challenge question for students wanting to push further.'
      },
      seconds: 160
    },
    {
      answers: {
        [q1.lastInsertRowid]: '5',
        [q2.lastInsertRowid]: 'Reasonable pace',
        [q3.lastInsertRowid]: JSON.stringify(['Express.js & REST APIs']),
        [q4.lastInsertRowid]: 'Yes',
        [q5.lastInsertRowid]: 'Individual project with custom topic',
        [q6.lastInsertRowid]: 'One of the best structured courses this semester. Keep up the great teaching!'
      },
      seconds: 110
    }
  ];

  for (const resp of studentSampleResponses) {
    const res = await runQuery(
      'INSERT INTO responses (survey_id, respondent_identifier, completion_seconds) VALUES (?, ?, ?)',
      [s1Id, 'anon_' + Math.random().toString(36).substring(2, 9), resp.seconds]
    );
    const respId = res.lastInsertRowid;
    for (const [qId, val] of Object.entries(resp.answers)) {
      await runQuery('INSERT INTO answers (response_id, question_id, answer_value) VALUES (?, ?, ?)', [respId, Number(qId), val]);
    }
  }

  // 3. Survey 2: Product Feedback Survey (Alex Morgan)
  const survey2 = await runQuery(
    'INSERT INTO surveys (user_id, title, description, category, is_active) VALUES (?, ?, ?, ?, ?)',
    [
      alexId,
      'Product Satisfaction & User Feedback 2026',
      'Help us refine our platform roadmap by letting us know what works well and where we can do better.',
      'Product',
      1
    ]
  );
  const s2Id = survey2.lastInsertRowid;

  const sq1 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s2Id, 'Overall, how satisfied are you with the platform responsiveness and speed?', 'rating', 1, 1, '1 = Dissatisfied, 5 = Highly Delighted']
  );

  const sq2 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s2Id, 'How frequently do you log in to check your survey responses?', 'single_choice', 1, 2, '']
  );
  for (const opt of ['Daily', 'Multiple times a week', 'Once a week', 'Monthly']) {
    await runQuery('INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)', [sq2.lastInsertRowid, opt, 1]);
  }

  const sq3 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s2Id, 'Would you recommend PollPulse to colleagues or other teams?', 'yes_no', 1, 3, '']
  );

  const sq4 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s2Id, 'What is your primary use case?', 'dropdown', 1, 4, '']
  );
  for (const opt of ['Academic & Student Research', 'Customer Satisfaction (CSAT)', 'Employee Engagement', 'Event Feedback']) {
    await runQuery('INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)', [sq4.lastInsertRowid, opt, 1]);
  }

  const sq5 = await runQuery(
    'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
    [s2Id, 'What additional analytics or export options would benefit your workflow?', 'text', 0, 5, 'Any thoughts or feature requests']
  );

  // Seed sample responses for Survey 2
  const pResponses = [
    {
      answers: {
        [sq1.lastInsertRowid]: '5',
        [sq2.lastInsertRowid]: 'Daily',
        [sq3.lastInsertRowid]: 'Yes',
        [sq4.lastInsertRowid]: 'Academic & Student Research',
        [sq5.lastInsertRowid]: 'CSV export is great. Adding direct PDF summary reports would be a cherry on top.'
      },
      seconds: 115
    },
    {
      answers: {
        [sq1.lastInsertRowid]: '4',
        [sq2.lastInsertRowid]: 'Multiple times a week',
        [sq3.lastInsertRowid]: 'Yes',
        [sq4.lastInsertRowid]: 'Customer Satisfaction (CSAT)',
        [sq5.lastInsertRowid]: 'The real-time chart updates look really slick!'
      },
      seconds: 88
    },
    {
      answers: {
        [sq1.lastInsertRowid]: '5',
        [sq2.lastInsertRowid]: 'Multiple times a week',
        [sq3.lastInsertRowid]: 'Yes',
        [sq4.lastInsertRowid]: 'Employee Engagement',
        [sq5.lastInsertRowid]: 'Super straightforward to build questions with drag reordering.'
      },
      seconds: 140
    }
  ];

  for (const resp of pResponses) {
    const res = await runQuery(
      'INSERT INTO responses (survey_id, respondent_identifier, completion_seconds) VALUES (?, ?, ?)',
      [s2Id, 'user_' + Math.random().toString(36).substring(2, 9), resp.seconds]
    );
    const respId = res.lastInsertRowid;
    for (const [qId, val] of Object.entries(resp.answers)) {
      await runQuery('INSERT INTO answers (response_id, question_id, answer_value) VALUES (?, ?, ?)', [respId, Number(qId), val]);
    }
  }

  console.log('Database successfully seeded!');
}
