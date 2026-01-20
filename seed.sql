-- Quick Seed Script for Local Development
-- Run this AFTER creating your first account and workspace

-- ====================================
-- SAMPLE COURSE: AML Refresher
-- ====================================

-- 1. Insert course (global, visible to all orgs)
INSERT INTO courses (org_id, title, description, category, tags, status)
VALUES (
  NULL,
  'AML Refresher (Annual)',
  'Essential Anti-Money Laundering training for regulated firms. Covers identification, reporting, and compliance obligations under MLR 2017.',
  'AML/CTF',
  ARRAY['AML', 'Money Laundering', 'Compliance', 'Annual'],
  'published'
) RETURNING id;

-- Note the ID returned above, use it below (or query it)
-- Get the course ID:
DO $$
DECLARE
  v_course_id UUID;
  v_version_id UUID;
  v_module1_id UUID;
  v_module2_id UUID;
  v_lesson1_id UUID;
  v_lesson2_id UUID;
  v_lesson3_id UUID;
  v_quiz_id UUID;
  v_q1_id UUID;
  v_q2_id UUID;
  v_q3_id UUID;
BEGIN
  -- Get the course we just created
  SELECT id INTO v_course_id FROM courses WHERE title = 'AML Refresher (Annual)' LIMIT 1;

  -- 2. Create version 1
  INSERT INTO course_versions (course_id, version, status, change_log)
  VALUES (
    v_course_id,
    1,
    'published',
    'Initial release'
  ) RETURNING id INTO v_version_id;

  -- 3. Add Module 1: Introduction
  INSERT INTO modules (course_version_id, title, sort_order)
  VALUES (
    v_version_id,
    'Introduction to AML',
    1
  ) RETURNING id INTO v_module1_id;

  -- 4. Add Lesson 1.1: What is Money Laundering?
  INSERT INTO lessons (module_id, title, lesson_type, sort_order, estimated_minutes)
  VALUES (
    v_module1_id,
    'What is Money Laundering?',
    'text',
    1,
    10
  ) RETURNING id INTO v_lesson1_id;

  -- Add blocks to Lesson 1.1
  INSERT INTO lesson_blocks (lesson_id, block_type, content, sort_order)
  VALUES
    (
      v_lesson1_id,
      'heading',
      '{"text": "Understanding Money Laundering"}',
      1
    ),
    (
      v_lesson1_id,
      'text',
      '{"html": "<p>Money laundering is the process of making illegally-gained proceeds appear legal. Criminals use money laundering to hide the origins of funds obtained through illegal activities such as drug trafficking, fraud, corruption, and terrorism.</p><p>The process typically involves three distinct stages that work together to obscure the criminal origin of the funds.</p>"}',
      2
    ),
    (
      v_lesson1_id,
      'callout',
      '{"type": "info", "text": "Money laundering costs the UK economy an estimated £90 billion annually and funds serious crime and terrorism."}',
      3
    ),
    (
      v_lesson1_id,
      'heading',
      '{"text": "The Three Stages"}',
      4
    ),
    (
      v_lesson1_id,
      'list',
      '{"items": ["Placement: Introducing criminal funds into the financial system", "Layering: Concealing the source through complex transactions", "Integration: Making the money appear legitimate"]}',
      5
    );

  -- 5. Add Lesson 1.2: Your Legal Obligations
  INSERT INTO lessons (module_id, title, lesson_type, sort_order, estimated_minutes)
  VALUES (
    v_module1_id,
    'Your Legal Obligations',
    'text',
    2,
    8
  ) RETURNING id INTO v_lesson2_id;

  -- Add blocks to Lesson 1.2
  INSERT INTO lesson_blocks (lesson_id, block_type, content, sort_order)
  VALUES
    (
      v_lesson2_id,
      'heading',
      '{"text": "Money Laundering Regulations 2017"}',
      1
    ),
    (
      v_lesson2_id,
      'text',
      '{"html": "<p>As a regulated firm, you have legal obligations under the Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017).</p><p>These obligations are designed to prevent your business from being used for money laundering or terrorist financing purposes.</p>"}',
      2
    ),
    (
      v_lesson2_id,
      'callout',
      '{"type": "warning", "text": "Failure to comply with MLR 2017 can result in criminal prosecution, unlimited fines, and up to 2 years imprisonment."}',
      3
    ),
    (
      v_lesson2_id,
      'list',
      '{"items": ["Conduct customer due diligence (CDD)", "Implement risk-based controls", "Report suspicious activity to the NCA", "Maintain records for at least 5 years", "Provide staff training"]}',
      4
    );

  -- 6. Add Module 2: Risk Recognition
  INSERT INTO modules (course_version_id, title, sort_order)
  VALUES (
    v_version_id,
    'Recognizing Money Laundering',
    2
  ) RETURNING id INTO v_module2_id;

  -- 7. Add Lesson 2.1: Red Flags
  INSERT INTO lessons (module_id, title, lesson_type, sort_order, estimated_minutes)
  VALUES (
    v_module2_id,
    'Red Flags and Warning Signs',
    'text',
    1,
    12
  ) RETURNING id INTO v_lesson3_id;

  -- Add blocks to Lesson 2.1
  INSERT INTO lesson_blocks (lesson_id, block_type, content, sort_order)
  VALUES
    (
      v_lesson3_id,
      'heading',
      '{"text": "Spotting Suspicious Activity"}',
      1
    ),
    (
      v_lesson3_id,
      'text',
      '{"html": "<p>Being able to identify potential money laundering is crucial to your role. While every situation is different, there are common red flags that should raise your suspicions.</p>"}',
      2
    ),
    (
      v_lesson3_id,
      'callout',
      '{"type": "info", "text": "Remember: A single red flag does not necessarily mean money laundering is occurring. Look for patterns and combinations of suspicious indicators."}',
      3
    ),
    (
      v_lesson3_id,
      'list',
      '{"items": ["Customer reluctant to provide information", "Unusual transaction patterns or amounts", "Transactions inconsistent with customer profile", "Use of multiple accounts without clear reason", "Last-minute changes to transaction details", "Overly complex payment structures"]}',
      4
    );

  -- 8. Add Quiz
  INSERT INTO quizzes (course_version_id, pass_mark, attempts_allowed, randomize)
  VALUES (
    v_version_id,
    70,
    3,
    false
  ) RETURNING id INTO v_quiz_id;

  -- 9. Add Quiz Questions
  -- Question 1
  INSERT INTO questions (quiz_id, prompt, type, rationale, sort_order)
  VALUES (
    v_quiz_id,
    'What are the three stages of money laundering?',
    'mcq',
    'Money laundering typically involves three stages: Placement (introducing criminal funds), Layering (concealing the source), and Integration (making funds appear legitimate).',
    1
  ) RETURNING id INTO v_q1_id;

  INSERT INTO question_options (question_id, text, is_correct, sort_order)
  VALUES
    (v_q1_id, 'Placement, Layering, Integration', true, 1),
    (v_q1_id, 'Detection, Prevention, Reporting', false, 2),
    (v_q1_id, 'Identification, Verification, Monitoring', false, 3),
    (v_q1_id, 'Collection, Transfer, Concealment', false, 4);

  -- Question 2
  INSERT INTO questions (quiz_id, prompt, type, rationale, sort_order)
  VALUES (
    v_quiz_id,
    'Under MLR 2017, how long must you retain customer due diligence records?',
    'mcq',
    'The Money Laundering Regulations 2017 require firms to retain CDD records for at least 5 years after the business relationship ends.',
    2
  ) RETURNING id INTO v_q2_id;

  INSERT INTO question_options (question_id, text, is_correct, sort_order)
  VALUES
    (v_q2_id, '3 years', false, 1),
    (v_q2_id, '5 years', true, 2),
    (v_q2_id, '7 years', false, 3),
    (v_q2_id, '10 years', false, 4);

  -- Question 3
  INSERT INTO questions (quiz_id, prompt, type, rationale, sort_order)
  VALUES (
    v_quiz_id,
    'What should you do if you identify suspicious activity?',
    'mcq',
    'If you identify suspicious activity, you must report it to your Money Laundering Reporting Officer (MLRO) immediately. The MLRO will then decide whether to submit a Suspicious Activity Report (SAR) to the National Crime Agency.',
    3
  ) RETURNING id INTO v_q3_id;

  INSERT INTO question_options (question_id, text, is_correct, sort_order)
  VALUES
    (v_q3_id, 'Ignore it if you are unsure', false, 1),
    (v_q3_id, 'Report it to your MLRO immediately', true, 2),
    (v_q3_id, 'Warn the customer', false, 3),
    (v_q3_id, 'Wait until you have more evidence', false, 4);

  RAISE NOTICE 'Sample course created successfully!';
  RAISE NOTICE 'Course ID: %', v_course_id;
  RAISE NOTICE 'Version ID: %', v_version_id;
END $$;

-- ====================================
-- SUCCESS MESSAGE
-- ====================================
-- You should now have:
-- - 1 course: "AML Refresher (Annual)"
-- - 1 version (published)
-- - 2 modules
-- - 3 lessons with content blocks
-- - 1 quiz with 3 questions

-- To see it in the UI:
-- 1. Log in to your account
-- 2. Go to Course Catalogue
-- 3. You should see "AML Refresher (Annual)"
-- 4. Click "Start Course"
-- 5. Complete lessons and take the quiz!
