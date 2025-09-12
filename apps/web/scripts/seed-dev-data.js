#!/usr/bin/env node

/**
 * Development Database Seeding Script
 *
 * This script populates the database with sample data for local development.
 * It should only be run in development environments.
 *
 * Usage:
 *   npm run seed --workspace=apps/web
 *   node scripts/seed-dev-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../../../.env.local');
dotenv.config({ path: envPath });

// Sample development data
const sampleUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'student1@example.com',
    role: 'student',
    first_name: 'Jane',
    last_name: 'Student',
    created_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'instructor@example.com',
    role: 'instructor',
    first_name: 'John',
    last_name: 'Instructor',
    created_at: new Date().toISOString(),
  },
];

const sampleQuestions = [
  {
    id: 1,
    question_text:
      'Which of the following is the most appropriate nursing intervention for a client experiencing severe anxiety?',
    question_type: 'multiple_choice',
    difficulty: 'medium',
    category: 'mental_health',
    explanation:
      'Providing a calm, structured environment helps reduce anxiety by creating predictability and safety.',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    question_text:
      'A client is prescribed 0.25 mg of digoxin daily. The available tablets are 0.125 mg each. How many tablets should the nurse administer?',
    question_type: 'multiple_choice',
    difficulty: 'easy',
    category: 'pharmacology',
    explanation: '0.25 mg ÷ 0.125 mg per tablet = 2 tablets',
    created_at: new Date().toISOString(),
  },
];

const sampleAnswers = [
  // Question 1 answers
  {
    question_id: 1,
    answer_text: 'Encourage the client to talk about their fears',
    is_correct: false,
  },
  {
    question_id: 1,
    answer_text: 'Provide a calm, quiet environment',
    is_correct: true,
  },
  {
    question_id: 1,
    answer_text: 'Administer anti-anxiety medication immediately',
    is_correct: false,
  },
  {
    question_id: 1,
    answer_text: 'Leave the client alone to work through their anxiety',
    is_correct: false,
  },

  // Question 2 answers
  { question_id: 2, answer_text: '1 tablet', is_correct: false },
  { question_id: 2, answer_text: '2 tablets', is_correct: true },
  { question_id: 2, answer_text: '3 tablets', is_correct: false },
  { question_id: 2, answer_text: '0.5 tablets', is_correct: false },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  // Check environment
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seeding is not allowed in production environment');
    process.exit(1);
  }

  let supabase;

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase configuration. Please check your .env.local file.'
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase');

    // Check if tables exist by attempting to query them
    const { error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    if (testError && testError.code === '42P01') {
      console.log('⚠️  Tables do not exist yet. Please run migrations first:');
      console.log('   npm run migrate --workspace=apps/web');
      process.exit(1);
    }

    // Clear existing dev data (optional - comment out if you want to preserve data)
    console.log('🧹 Clearing existing development data...');
    await supabase.from('answers').delete().neq('id', 0);
    await supabase.from('questions').delete().neq('id', 0);
    await supabase.from('users').delete().neq('id', '');

    // Seed users
    console.log('👥 Seeding users...');
    const { error: usersError } = await supabase
      .from('users')
      .insert(sampleUsers);

    if (usersError) {
      console.warn(
        '⚠️  Users seeding skipped (table may not exist yet):',
        usersError.message
      );
    } else {
      console.log(`✅ Seeded ${sampleUsers.length} users`);
    }

    // Seed questions
    console.log('❓ Seeding questions...');
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(sampleQuestions);

    if (questionsError) {
      console.warn(
        '⚠️  Questions seeding skipped (table may not exist yet):',
        questionsError.message
      );
    } else {
      console.log(`✅ Seeded ${sampleQuestions.length} questions`);
    }

    // Seed answers
    console.log('💭 Seeding answers...');
    const { error: answersError } = await supabase
      .from('answers')
      .insert(sampleAnswers);

    if (answersError) {
      console.warn(
        '⚠️  Answers seeding skipped (table may not exist yet):',
        answersError.message
      );
    } else {
      console.log(`✅ Seeded ${sampleAnswers.length} answers`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Sample data includes:');
    console.log('  - 2 users (student and instructor)');
    console.log('  - 2 sample NCLEX questions');
    console.log('  - Multiple choice answers for each question');
    console.log('');
    console.log('You can now start the development server: npm run dev');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeding if script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
