import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, runQuery } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pollpulse-secure-secret-key-survey-platform-2026';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

// Authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

// Optional Auth (for attaching user if token present)
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      req.userId = decoded.id;
      req.userEmail = decoded.email;
    } catch {
      // Ignore if invalid
    }
  }
  next();
}

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await runQuery(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash]
    );

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: userId, name: name.trim(), email: cleanEmail },
      token
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await queryOne('SELECT id, name, email, password_hash FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

apiRouter.post('/auth/demo', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // 'instructor' or 'demo'
    const targetEmail = role === 'instructor' ? 'jordan@campus.edu' : 'demo@pollpulse.io';

    let user = await queryOne('SELECT id, name, email FROM users WHERE email = ?', [targetEmail]);
    if (!user) {
      // Fallback to first user
      user = await queryOne('SELECT id, name, email FROM users LIMIT 1');
    }

    if (!user) {
      return res.status(404).json({ error: 'No demo account available.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo sign in failed.' });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await queryOne('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ==========================================
// 2. SURVEY MANAGEMENT (Protected)
// ==========================================

apiRouter.get('/surveys', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Return surveys for current user or all surveys if they want to browse demo
    const surveys = await queryAll(`
      SELECT 
        s.id,
        s.user_id,
        s.title,
        s.description,
        s.category,
        s.is_active,
        s.created_at,
        s.updated_at,
        u.name as creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.survey_id = s.id) as question_count,
        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count,
        (SELECT MAX(submission_date) FROM responses r WHERE r.survey_id = s.id) as last_response_at
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [req.userId]);

    res.json({ surveys });
  } catch (err: any) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ error: 'Failed to fetch surveys.' });
  }
});

apiRouter.get('/surveys/all-community', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    // Return active public surveys so visitors can see featured surveys on landing page
    const surveys = await queryAll(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.category,
        s.is_active,
        s.created_at,
        u.name as creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.survey_id = s.id) as question_count,
        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = 1
      ORDER BY response_count DESC, s.created_at DESC
      LIMIT 6
    `);

    res.json({ surveys });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load community surveys.' });
  }
});

apiRouter.get('/surveys/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await queryOne(`
      SELECT s.*, u.name as creator_name
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [surveyId]);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found.' });
    }

    const questions = await queryAll(`
      SELECT id, survey_id, question_text, question_type, is_required, display_order, help_text
      FROM questions
      WHERE survey_id = ?
      ORDER BY display_order ASC
    `, [surveyId]);

    for (const q of questions) {
      const options = await queryAll(`
        SELECT id, option_text, display_order
        FROM options
        WHERE question_id = ?
        ORDER BY display_order ASC
      `, [q.id]);
      q.options = options;
    }

    const responseStats = await queryOne(`
      SELECT COUNT(*) as count, AVG(completion_seconds) as avg_time
      FROM responses
      WHERE survey_id = ?
    `, [surveyId]);

    res.json({
      survey,
      questions,
      stats: {
        totalResponses: responseStats?.count || 0,
        avgCompletionSeconds: Math.round(responseStats?.avg_time || 0)
      }
    });
  } catch (err: any) {
    console.error('Fetch survey error:', err);
    res.status(500).json({ error: 'Failed to retrieve survey.' });
  }
});

apiRouter.post('/surveys', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, questions } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Survey title is required.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required to create a survey.' });
    }

    // Validate questions
    const validTypes = ['multiple_choice', 'single_choice', 'text', 'yes_no', 'rating', 'dropdown'];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || typeof q.question_text !== 'string' || q.question_text.trim().length === 0) {
        return res.status(400).json({ error: `Question ${i + 1} must have non-empty text.` });
      }
      if (!validTypes.includes(q.question_type)) {
        return res.status(400).json({ error: `Question ${i + 1} has an invalid question type: ${q.question_type}` });
      }
      if (['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type)) {
        if (!Array.isArray(q.options) || q.options.filter((o: string) => o && o.trim().length > 0).length < 2) {
          return res.status(400).json({ error: `Question "${q.question_text}" must have at least 2 valid options.` });
        }
      }
    }

    // Insert survey
    const surveyResult = await runQuery(
      'INSERT INTO surveys (user_id, title, description, category, is_active) VALUES (?, ?, ?, ?, 1)',
      [req.userId, title.trim(), (description || '').trim(), category || 'General']
    );
    const surveyId = surveyResult.lastInsertRowid;

    // Insert questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qResult = await runQuery(
        'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
        [surveyId, q.question_text.trim(), q.question_type, q.is_required ? 1 : 0, i + 1, (q.help_text || '').trim()]
      );
      const questionId = qResult.lastInsertRowid;

      if (['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type) && Array.isArray(q.options)) {
        const cleanOpts = q.options.map((o: string) => o.trim()).filter((o: string) => o.length > 0);
        for (let j = 0; j < cleanOpts.length; j++) {
          await runQuery(
            'INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)',
            [questionId, cleanOpts[j], j + 1]
          );
        }
      }
    }

    res.status(201).json({
      message: 'Survey created successfully!',
      surveyId
    });
  } catch (err: any) {
    console.error('Create survey error:', err);
    res.status(500).json({ error: 'Failed to create survey.' });
  }
});

apiRouter.put('/surveys/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const existing = await queryOne('SELECT user_id FROM surveys WHERE id = ?', [surveyId]);
    if (!existing) {
      return res.status(404).json({ error: 'Survey not found.' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this survey.' });
    }

    const { title, description, category, is_active, questions } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Survey title is required.' });
    }

    // Update survey table
    await runQuery(
      'UPDATE surveys SET title = ?, description = ?, category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title.trim(), (description || '').trim(), category || 'General', is_active !== undefined ? (is_active ? 1 : 0) : 1, surveyId]
    );

    // If new questions array provided, rebuild questions
    if (Array.isArray(questions)) {
      // Clear existing questions (cascade will remove options & answers if needed)
      // Note: to preserve previous responses, we can check or replace
      await runQuery('DELETE FROM questions WHERE survey_id = ?', [surveyId]);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qResult = await runQuery(
          'INSERT INTO questions (survey_id, question_text, question_type, is_required, display_order, help_text) VALUES (?, ?, ?, ?, ?, ?)',
          [surveyId, q.question_text.trim(), q.question_type, q.is_required ? 1 : 0, i + 1, (q.help_text || '').trim()]
        );
        const questionId = qResult.lastInsertRowid;

        if (['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type) && Array.isArray(q.options)) {
          const cleanOpts = q.options.map((o: string) => o.trim()).filter((o: string) => o.length > 0);
          for (let j = 0; j < cleanOpts.length; j++) {
            await runQuery(
              'INSERT INTO options (question_id, option_text, display_order) VALUES (?, ?, ?)',
              [questionId, cleanOpts[j], j + 1]
            );
          }
        }
      }
    }

    res.json({ message: 'Survey updated successfully.' });
  } catch (err: any) {
    console.error('Update survey error:', err);
    res.status(500).json({ error: 'Failed to update survey.' });
  }
});

apiRouter.delete('/surveys/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const existing = await queryOne('SELECT user_id FROM surveys WHERE id = ?', [surveyId]);
    if (!existing) {
      return res.status(404).json({ error: 'Survey not found.' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this survey.' });
    }

    // Cascade delete in SQLite
    await runQuery('DELETE FROM surveys WHERE id = ?', [surveyId]);
    res.json({ message: 'Survey deleted successfully.' });
  } catch (err: any) {
    console.error('Delete survey error:', err);
    res.status(500).json({ error: 'Failed to delete survey.' });
  }
});

apiRouter.patch('/surveys/:id/toggle-status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const existing = await queryOne('SELECT user_id, is_active FROM surveys WHERE id = ?', [surveyId]);
    if (!existing) {
      return res.status(404).json({ error: 'Survey not found.' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const nextStatus = existing.is_active === 1 ? 0 : 1;
    await runQuery('UPDATE surveys SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextStatus, surveyId]);

    res.json({ is_active: nextStatus, message: nextStatus === 1 ? 'Survey is now open for responses' : 'Survey is now closed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle status.' });
  }
});

// ==========================================
// 3. PUBLIC SURVEY SUBMISSION (Respondents)
// ==========================================

apiRouter.get('/public/surveys/:id', async (req: Request, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await queryOne(`
      SELECT s.id, s.title, s.description, s.category, s.is_active, s.created_at, u.name as author_name
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [surveyId]);

    if (!survey) {
      return res.status(404).json({ error: 'Survey does not exist.' });
    }

    const questions = await queryAll(`
      SELECT id, question_text, question_type, is_required, display_order, help_text
      FROM questions
      WHERE survey_id = ?
      ORDER BY display_order ASC
    `, [surveyId]);

    for (const q of questions) {
      const options = await queryAll(`
        SELECT id, option_text, display_order
        FROM options
        WHERE question_id = ?
        ORDER BY display_order ASC
      `, [q.id]);
      q.options = options.map(o => o.option_text);
    }

    res.json({
      survey,
      questions
    });
  } catch (err: any) {
    console.error('Public survey error:', err);
    res.status(500).json({ error: 'Could not load survey form.' });
  }
});

apiRouter.post('/public/surveys/:id/responses', async (req: Request, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const { answers, completion_seconds, respondent_identifier } = req.body;

    const survey = await queryOne('SELECT id, is_active FROM surveys WHERE id = ?', [surveyId]);
    if (!survey) {
      return res.status(404).json({ error: 'Survey does not exist.' });
    }
    if (survey.is_active !== 1) {
      return res.status(403).json({ error: 'This survey is currently closed to new responses.' });
    }

    const questions = await queryAll('SELECT id, question_text, question_type, is_required FROM questions WHERE survey_id = ?', [surveyId]);

    // Validation: check required questions
    for (const q of questions) {
      const val = answers ? answers[q.id] : undefined;
      const isMissing = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
      
      if (q.is_required && isMissing) {
        return res.status(400).json({ error: `Please answer required question: "${q.question_text}"` });
      }

      // Check rating boundaries
      if (q.question_type === 'rating' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 1 || num > 5) {
          return res.status(400).json({ error: `Rating for "${q.question_text}" must be between 1 and 5.` });
        }
      }

      // Check max length on text answers
      if (q.question_type === 'text' && typeof val === 'string' && val.length > 2000) {
        return res.status(400).json({ error: `Text response for "${q.question_text}" exceeds 2000 characters limit.` });
      }
    }

    // Insert response record
    const identifier = respondent_identifier || ('resp_' + Math.random().toString(36).substring(2, 9));
    const respResult = await runQuery(
      'INSERT INTO responses (survey_id, respondent_identifier, completion_seconds) VALUES (?, ?, ?)',
      [surveyId, identifier, Math.max(0, Number(completion_seconds) || 0)]
    );
    const responseId = respResult.lastInsertRowid;

    // Insert answers
    for (const q of questions) {
      const rawVal = answers ? answers[q.id] : undefined;
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        const storedVal = Array.isArray(rawVal) ? JSON.stringify(rawVal) : String(rawVal);
        await runQuery(
          'INSERT INTO answers (response_id, question_id, answer_value) VALUES (?, ?, ?)',
          [responseId, q.id, storedVal]
        );
      }
    }

    res.status(201).json({
      success: true,
      responseId,
      message: 'Thank you! Your feedback has been securely recorded.'
    });
  } catch (err: any) {
    console.error('Response submission error:', err);
    res.status(500).json({ error: 'Failed to record response.' });
  }
});

// ==========================================
// 4. ANALYTICS & RESULTS (Survey Owners)
// ==========================================

apiRouter.get('/surveys/:id/results', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await queryOne(`
      SELECT s.*, u.name as creator_name
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [surveyId]);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found.' });
    }

    const totalResponsesRow = await queryOne('SELECT COUNT(*) as count, AVG(completion_seconds) as avg_time FROM responses WHERE survey_id = ?', [surveyId]);
    const totalResponses = totalResponsesRow?.count || 0;
    const avgCompletionSeconds = Math.round(totalResponsesRow?.avg_time || 0);

    const questions = await queryAll(`
      SELECT id, question_text, question_type, is_required, display_order, help_text
      FROM questions
      WHERE survey_id = ?
      ORDER BY display_order ASC
    `, [surveyId]);

    const questionAnalytics: any[] = [];

    for (const q of questions) {
      const rawAnswers = await queryAll(`
        SELECT a.answer_value, r.submission_date, r.id as response_id
        FROM answers a
        JOIN responses r ON a.response_id = r.id
        WHERE a.question_id = ?
        ORDER BY r.submission_date DESC
      `, [q.id]);

      if (q.question_type === 'rating') {
        let sum = 0;
        let count = 0;
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const row of rawAnswers) {
          const val = Number(row.answer_value);
          if (val >= 1 && val <= 5) {
            counts[val] = (counts[val] || 0) + 1;
            sum += val;
            count++;
          }
        }
        questionAnalytics.push({
          ...q,
          totalAnswers: count,
          averageRating: count > 0 ? Number((sum / count).toFixed(2)) : 0,
          distribution: counts
        });
      } else if (['single_choice', 'dropdown', 'yes_no'].includes(q.question_type)) {
        const counts: Record<string, number> = {};
        let totalAnswered = 0;

        // Initialize with defined options if any
        if (q.question_type === 'yes_no') {
          counts['Yes'] = 0;
          counts['No'] = 0;
        } else {
          const opts = await queryAll('SELECT option_text FROM options WHERE question_id = ? ORDER BY display_order ASC', [q.id]);
          for (const o of opts) {
            counts[o.option_text] = 0;
          }
        }

        for (const row of rawAnswers) {
          const val = row.answer_value;
          if (val) {
            counts[val] = (counts[val] || 0) + 1;
            totalAnswered++;
          }
        }

        const breakdown = Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0
        }));

        questionAnalytics.push({
          ...q,
          totalAnswers: totalAnswered,
          breakdown
        });
      } else if (q.question_type === 'multiple_choice') {
        const counts: Record<string, number> = {};
        const opts = await queryAll('SELECT option_text FROM options WHERE question_id = ? ORDER BY display_order ASC', [q.id]);
        for (const o of opts) {
          counts[o.option_text] = 0;
        }

        let respondentCount = 0;
        for (const row of rawAnswers) {
          respondentCount++;
          try {
            const arr = JSON.parse(row.answer_value);
            if (Array.isArray(arr)) {
              for (const item of arr) {
                counts[item] = (counts[item] || 0) + 1;
              }
            }
          } catch {
            counts[row.answer_value] = (counts[row.answer_value] || 0) + 1;
          }
        }

        const breakdown = Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          percentage: respondentCount > 0 ? Math.round((count / respondentCount) * 100) : 0
        }));

        questionAnalytics.push({
          ...q,
          totalAnswers: respondentCount,
          breakdown
        });
      } else {
        // Open-ended text
        questionAnalytics.push({
          ...q,
          totalAnswers: rawAnswers.length,
          textResponses: rawAnswers.map(r => ({
            id: r.response_id,
            text: r.answer_value,
            date: r.submission_date
          }))
        });
      }
    }

    res.json({
      survey,
      summary: {
        totalResponses,
        avgCompletionSeconds
      },
      questions: questionAnalytics
    });
  } catch (err: any) {
    console.error('Results analytics error:', err);
    res.status(500).json({ error: 'Failed to compute survey results.' });
  }
});

apiRouter.get('/surveys/:id/responses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const responses = await queryAll(`
      SELECT id, respondent_identifier, submission_date, completion_seconds
      FROM responses
      WHERE survey_id = ?
      ORDER BY submission_date DESC
    `, [surveyId]);

    const questions = await queryAll('SELECT id, question_text, question_type FROM questions WHERE survey_id = ? ORDER BY display_order ASC', [surveyId]);

    const detailedResponses = [];
    for (const r of responses) {
      const answers = await queryAll('SELECT question_id, answer_value FROM answers WHERE response_id = ?', [r.id]);
      const answerMap: Record<number, string> = {};
      for (const a of answers) {
        answerMap[a.question_id] = a.answer_value;
      }
      detailedResponses.push({
        ...r,
        answers: answerMap
      });
    }

    res.json({
      questions,
      responses: detailedResponses
    });
  } catch (err: any) {
    console.error('Individual responses error:', err);
    res.status(500).json({ error: 'Failed to fetch responses list.' });
  }
});

apiRouter.delete('/surveys/:id/responses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const existing = await queryOne('SELECT user_id FROM surveys WHERE id = ?', [surveyId]);
    if (!existing) {
      return res.status(404).json({ error: 'Survey not found.' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await runQuery('DELETE FROM responses WHERE survey_id = ?', [surveyId]);
    res.json({ message: 'All responses for this survey have been cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear responses.' });
  }
});

apiRouter.get('/surveys/:id/export/csv', async (req: Request, res: Response) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await queryOne('SELECT title FROM surveys WHERE id = ?', [surveyId]);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    const questions = await queryAll('SELECT id, question_text FROM questions WHERE survey_id = ? ORDER BY display_order ASC', [surveyId]);
    const responses = await queryAll('SELECT id, submission_date, completion_seconds FROM responses WHERE survey_id = ? ORDER BY submission_date ASC', [surveyId]);

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // CSV Header
    const headers = ['Response ID', 'Submission Date', 'Duration (seconds)', ...questions.map(q => q.question_text)];
    const csvLines = [headers.map(escapeCsv).join(',')];

    for (const r of responses) {
      const answers = await queryAll('SELECT question_id, answer_value FROM answers WHERE response_id = ?', [r.id]);
      const aMap: Record<number, string> = {};
      for (const a of answers) {
        aMap[a.question_id] = a.answer_value;
      }

      const row = [
        r.id,
        r.submission_date,
        r.completion_seconds,
        ...questions.map(q => {
          const raw = aMap[q.id];
          if (!raw) return '';
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.join('; ');
          } catch {
            // Not JSON
          }
          return raw;
        })
      ];
      csvLines.push(row.map(escapeCsv).join(','));
    }

    const csvContent = csvLines.join('\r\n');
    const safeTitle = survey.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filename = `PollPulse_Survey_${surveyId}_${safeTitle}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Export CSV error:', err);
    res.status(500).send('Failed to export CSV');
  }
});

// ==========================================
// 5. TEMPLATES
// ==========================================

apiRouter.get('/templates', (_req: Request, res: Response) => {
  const templates = [
    {
      id: 'course-feedback',
      title: 'Course Evaluation & Assignment Feedback',
      category: 'Education',
      description: 'Collect student feedback on lectures, homework workload, assignment instructions, and teaching clarity.',
      questions: [
        {
          question_text: 'Overall, how would you rate the clarity and usefulness of the assignment instructions?',
          question_type: 'rating',
          is_required: true,
          help_text: '1 = Very Unclear, 5 = Crystal Clear'
        },
        {
          question_text: 'How would you describe the weekly homework workload for this course?',
          question_type: 'single_choice',
          is_required: true,
          help_text: 'Select the option that best fits your experience',
          options: ['Light & very manageable', 'Appropriate pace', 'Heavy but rewarding', 'Excessive workload']
        },
        {
          question_text: 'Which course topic areas would you benefit from reviewing before the exam?',
          question_type: 'multiple_choice',
          is_required: false,
          help_text: 'Select any that apply',
          options: ['Backend API Design', 'Database Queries & Normalization', 'Frontend UI Architecture', 'Authentication & Security']
        },
        {
          question_text: 'Did you find instructor and TA office hours helpful and accessible?',
          question_type: 'yes_no',
          is_required: true,
          help_text: 'Yes or No'
        },
        {
          question_text: 'What format do you prefer for lab assignments?',
          question_type: 'dropdown',
          is_required: true,
          help_text: 'Pick one option',
          options: ['Step-by-step guided tutorials', 'Open-ended problem specifications', 'Pair-programming coding labs']
        },
        {
          question_text: 'What constructive advice or suggestions do you have for the teaching staff?',
          question_type: 'text',
          is_required: false,
          help_text: 'Optional thoughts or ideas'
        }
      ]
    },
    {
      id: 'product-csat',
      title: 'Customer Satisfaction & Feature Request Survey',
      category: 'Product',
      description: 'Measure customer happiness, NPS loyalty, and discover which features your users want most.',
      questions: [
        {
          question_text: 'How satisfied are you with our web application experience?',
          question_type: 'rating',
          is_required: true,
          help_text: '1 = Very Dissatisfied, 5 = Highly Delighted'
        },
        {
          question_text: 'How frequently do you utilize the platform in your workflow?',
          question_type: 'single_choice',
          is_required: true,
          help_text: '',
          options: ['Daily', '2-3 times per week', 'A few times a month', 'First time today']
        },
        {
          question_text: 'Which prospective features would deliver the highest value to your team?',
          question_type: 'multiple_choice',
          is_required: false,
          help_text: '',
          options: ['Automated email digest reports', 'Webhooks & Zapier integrations', 'Custom branding colors & logos', 'Advanced filter presets']
        },
        {
          question_text: 'Would you recommend our product to a peer or coworker?',
          question_type: 'yes_no',
          is_required: true,
          help_text: ''
        },
        {
          question_text: 'What is your primary functional role?',
          question_type: 'dropdown',
          is_required: true,
          help_text: '',
          options: ['Engineering / Development', 'Product Management', 'Design / UX', 'Operations & Marketing', 'Student / Academic']
        },
        {
          question_text: 'What is one thing we could do to make this tool indispensable to you?',
          question_type: 'text',
          is_required: false,
          help_text: 'Your voice shapes our roadmap'
        }
      ]
    },
    {
      id: 'event-feedback',
      title: 'Workshop & Tech Event Feedback',
      category: 'Events',
      description: 'Post-event attendee survey gathering feedback on speakers, session pacing, and future topics.',
      questions: [
        {
          question_text: 'How would you rate the overall quality of today event sessions?',
          question_type: 'rating',
          is_required: true,
          help_text: '1 = Poor, 5 = Excellent'
        },
        {
          question_text: 'How appropriate was the session pace and technical depth?',
          question_type: 'single_choice',
          is_required: true,
          help_text: '',
          options: ['Too introductory', 'Just right for my background', 'A bit too fast/advanced']
        },
        {
          question_text: 'Will you attend our next workshop series?',
          question_type: 'yes_no',
          is_required: true,
          help_text: ''
        },
        {
          question_text: 'What topics would you like to see covered at upcoming workshops?',
          question_type: 'text',
          is_required: false,
          help_text: 'Let us know your interests'
        }
      ]
    }
  ];

  res.json({ templates });
});
