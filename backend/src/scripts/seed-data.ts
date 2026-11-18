import crypto from 'crypto';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { SurveyModel } from '../models/Survey.js';
import { ResponseModel } from '../models/Response.js';
import { hashPassword, hashIp } from '../utils/hash.js';
import { Question } from '@survey/shared';

export async function seedData(isAdminOnly = false): Promise<void> {
  // 1. Seed Admin from env
  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  let admin = await Admin.findOne({ email });

  if (!admin) {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    admin = await Admin.create({
      email,
      passwordHash,
    });
    console.log(`✅ Created admin user: ${email}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${email}`);
  }

  // Ensure fallback demo admin exists (admin@example.com / admin123)
  const fallbackEmail = 'admin@example.com';
  if (fallbackEmail !== email) {
    const fallbackAdmin = await Admin.findOne({ email: fallbackEmail });
    if (!fallbackAdmin) {
      const fallbackHash = await hashPassword('admin123');
      await Admin.create({
        email: fallbackEmail,
        passwordHash: fallbackHash,
      });
      console.log(`✅ Created fallback admin user: ${fallbackEmail}`);
    }
  }

  if (isAdminOnly) {
    console.log('🏁 Admin-only seeding completed.');
    return;
  }

  // 2. Seed Demo Survey ("Customer Feedback")
  const demoQuestions: Question[] = [
    {
      id: 'q1_usage',
      type: 'single_choice',
      label: 'Do you use our application regularly?',
      required: true,
      options: ['Yes', 'No'],
    },
    {
      id: 'q2_rating',
      type: 'rating',
      label: 'How would you rate your overall experience? (1-5)',
      required: true,
      condition: {
        questionId: 'q1_usage',
        operator: 'equals',
        value: 'Yes',
      },
    },
    {
      id: 'q3_features',
      type: 'checkbox',
      label: 'Which features do you value the most?',
      required: false,
      options: ['Surveys', 'Real-time Analytics', 'Conditional Logic', 'Export Data'],
      condition: {
        questionId: 'q1_usage',
        operator: 'equals',
        value: 'Yes',
      },
    },
    {
      id: 'q4_feedback',
      type: 'text',
      label: 'Any comments, suggestions, or reasons for your rating?',
      required: false,
    },
  ];

  // Find if demo survey already exists
  let demoSurvey = await SurveyModel.findOne({ title: 'Customer Feedback', isLatest: true });

  if (!demoSurvey) {
    const rootId = crypto.randomUUID();
    demoSurvey = await SurveyModel.create({
      rootId,
      version: 1,
      isLatest: true,
      title: 'Customer Feedback',
      description: 'Help us improve AiGeeks by sharing your experience!',
      questions: demoQuestions,
      status: 'published',
      createdBy: admin._id,
    });
    console.log(`✅ Created demo survey: Customer Feedback (rootId: ${rootId})`);
  } else {
    console.log(`ℹ️ Demo survey already exists (rootId: ${demoSurvey.rootId})`);
  }

  // 3. Seed ~25 Realistic Responses
  const existingResponsesCount = await ResponseModel.countDocuments({ rootId: demoSurvey.rootId });
  if (existingResponsesCount === 0) {
    console.log('📊 Seeding 25 realistic sample responses...');
    const sampleData = [
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Surveys', 'Real-time Analytics'], q4_feedback: 'Loving the real-time feedback loop!' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Conditional Logic', 'Surveys'], q4_feedback: 'Very intuitive logic builder.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Surveys', 'Export Data', 'Real-time Analytics'], q4_feedback: 'Super fast and reliable.' },
      { q1_usage: 'No', q4_feedback: 'Just getting started with the onboarding.' },
      { q1_usage: 'Yes', q2_rating: 3, q3_features: ['Surveys'], q4_feedback: 'Would like more chart visualization options.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Conditional Logic'], q4_feedback: 'The conditional branching works seamlessly.' },
      { q1_usage: 'No', q4_feedback: 'Evaluating competing solutions at the moment.' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Surveys', 'Real-time Analytics'], q4_feedback: 'Clean UI and responsive design.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Export Data', 'Surveys'], q4_feedback: 'Saves our team hours of manual work.' },
      { q1_usage: 'Yes', q2_rating: 2, q3_features: ['Surveys'], q4_feedback: 'Encountered a minor UI glitch on mobile.' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Conditional Logic', 'Export Data'], q4_feedback: 'Great developer documentation.' },
      { q1_usage: 'No', q4_feedback: 'Waiting for team approval.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Surveys', 'Real-time Analytics', 'Conditional Logic'], q4_feedback: 'Fantastic product all around!' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Surveys'], q4_feedback: 'Smooth survey creation workflow.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Real-time Analytics'], q4_feedback: 'Live counts are super helpful during presentations.' },
      { q1_usage: 'No', q4_feedback: 'Not using surveys currently in my team.' },
      { q1_usage: 'Yes', q2_rating: 3, q3_features: ['Export Data'], q4_feedback: 'Please add CSV and Excel export formats.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Surveys', 'Conditional Logic'], q4_feedback: 'Impressive architecture and execution.' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Surveys', 'Export Data'], q4_feedback: 'Good pricing and features.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Real-time Analytics'], q4_feedback: 'A+' },
      { q1_usage: 'No', q4_feedback: 'Looking for integrations with Slack.' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Surveys', 'Conditional Logic'], q4_feedback: 'Easy to share public survey links.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Surveys', 'Real-time Analytics', 'Export Data'], q4_feedback: 'Highly recommended!' },
      { q1_usage: 'Yes', q2_rating: 4, q3_features: ['Surveys'], q4_feedback: 'Solid experience.' },
      { q1_usage: 'Yes', q2_rating: 5, q3_features: ['Conditional Logic', 'Real-time Analytics'], q4_feedback: 'Rock solid stability.' },
    ];

    const responsesToInsert = sampleData.map((data, idx) => ({
      surveyId: demoSurvey._id,
      rootId: demoSurvey.rootId,
      version: demoSurvey.version,
      answers: data,
      submittedAt: new Date(Date.now() - (25 - idx) * 3600 * 1000), // Spaced out over last 24h
      meta: {
        ipHash: hashIp(`192.168.1.${idx + 1}`),
      },
    }));

    await ResponseModel.insertMany(responsesToInsert);
    console.log(`✅ Inserted ${responsesToInsert.length} sample responses.`);
  } else {
    console.log(`ℹ️ Demo survey already has ${existingResponsesCount} responses.`);
  }

  console.log('🎉 Seeding successfully finished!');
}
