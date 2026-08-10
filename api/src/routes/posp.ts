import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { IC38_QUESTION_BANK, Ic38Question } from '../lib/ic38Questions';
import { generateAgentId } from '../lib/idGenerator';

const router = Router();

const PASSING_THRESHOLD = 15; // score > 15 is pass (i.e. >= 16)
const EXAM_DURATION_MINUTES = 40;
const MAX_ATTEMPTS_PER_DAY = 4;
const COOLDOWN_HOURS = 3;

function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── GET /api/posp/syllabus ───────────────────────────────────────────────────
router.get('/syllabus', (_req: Request, res: Response): void => {
  res.json({
    title: 'IC-38 Insurance Agents (General) Syllabus',
    institution: 'Insurance Institute of India (IRDAI Approved)',
    passingScore: '16 out of 50 (> 15)',
    examDuration: '40 Minutes',
    maxRetakesPerDay: MAX_ATTEMPTS_PER_DAY,
    cooldownHours: COOLDOWN_HOURS,
    sections: [
      {
        title: 'SECTION 1: COMMON CHAPTERS',
        chapters: [
          'Chapter 1: Introduction to Insurance',
          'Chapter 2: Customer Service',
          'Chapter 3: Grievance Redressal Mechanism (IGMS & Ombudsman)',
          'Chapter 4: Regulatory Aspects of Insurance Agents',
          'Chapter 5: Legal Principles of an Insurance Contract',
        ],
      },
      {
        title: 'SECTION 2: HEALTH INSURANCE',
        chapters: [
          'Chapter 6: Introduction to Health Insurance',
          'Chapter 7: Insurance Documentation',
          'Chapter 8: Health Insurance Products',
          'Chapter 9: Health Insurance Underwriting',
          'Chapter 10: Health Insurance Claims',
        ],
      },
      {
        title: 'SECTION 3: GENERAL INSURANCE',
        chapters: [
          'Chapter 11: Principles of Insurance',
          'Chapter 12: Documentation',
          'Chapter 13: Theory & Practice of Premium Rating',
          'Chapter 14: Personal & Retail Insurance (Motor, PA, Householder)',
          'Chapter 15: Commercial Insurance (Fire, Marine, Burglary, Liability)',
          'Chapter 16: Claims Procedure',
        ],
      },
    ],
    // Direct PDF URL or CDN path
    pdfUrl: 'https://raw.githubusercontent.com/AkkhilCodingHub/ask-insurance/main/docs/IC-38-General-Syllabus.pdf',
  });
});

// ── GET /api/posp/exam/check-eligibility ─────────────────────────────────────
router.get('/exam/check-eligibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const phone = String(req.query.phone || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!phone && !email) {
      res.status(400).json({ error: 'Phone number or email required' });
      return;
    }

    // Check existing application status first
    const appFilters: Array<{ phone?: string; email?: string }> = [];
    if (phone) appFilters.push({ phone });
    if (email) appFilters.push({ email });

    const existingApp = appFilters.length > 0
      ? await prisma.pospApplication.findFirst({ where: { OR: appFilters } })
      : null;

    if (existingApp) {
      if (existingApp.status === 'approved') {
        res.json({
          eligible: false,
          reason: 'You are already an approved POSP Advisor!',
          status: 'already_approved',
          application: existingApp,
        });
        return;
      }
      if (existingApp.status === 'pending') {
        res.json({
          eligible: false,
          reason: 'Your POSP application is currently under review by Admin.',
          status: 'application_pending',
          application: existingApp,
        });
        return;
      }
    }

    const todayStr = getTodayString();

    const attemptsToday = await prisma.pospExamAttempt.findMany({
      where: {
        attemptDate: todayStr,
        OR: [
          ...(phone ? [{ candidatePhone: phone }] : []),
          ...(email ? [{ candidateEmail: email }] : []),
        ],
      },
      orderBy: { completedAt: 'desc' },
    });

    const attemptsCount = attemptsToday.length;

    if (attemptsCount >= MAX_ATTEMPTS_PER_DAY) {
      res.json({
        eligible: false,
        reason: `Daily attempt limit reached (${attemptsCount}/${MAX_ATTEMPTS_PER_DAY} attempts today). Please try again tomorrow!`,
        attemptsToday: attemptsCount,
        attemptsLeft: 0,
      });
      return;
    }

    // Check 3-hour cooldown from the last attempt
    const lastAttempt = attemptsToday[0];
    if (lastAttempt) {
      const lastCompleted = new Date(lastAttempt.completedAt).getTime();
      const now = Date.now();
      const elapsedHours = (now - lastCompleted) / (1000 * 60 * 60);

      if (elapsedHours < COOLDOWN_HOURS) {
        const remainingMs = COOLDOWN_HOURS * 60 * 60 * 1000 - (now - lastCompleted);
        const nextEligibleAt = new Date(now + remainingMs).toISOString();

        res.json({
          eligible: false,
          reason: `Co-oldown active. Please wait ${COOLDOWN_HOURS} hours between test attempts.`,
          nextEligibleAt,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          attemptsToday: attemptsCount,
          attemptsLeft: MAX_ATTEMPTS_PER_DAY - attemptsCount,
        });
        return;
      }
    }

    res.json({
      eligible: true,
      attemptsToday: attemptsCount,
      attemptsLeft: MAX_ATTEMPTS_PER_DAY - attemptsCount,
      cooldownHours: COOLDOWN_HOURS,
      maxRetakesPerDay: MAX_ATTEMPTS_PER_DAY,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/posp/exam/start ────────────────────────────────────────────────
router.post('/exam/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
      email: z.string().email(),
    }).parse(req.body);

    const todayStr = getTodayString();

    // Verify eligibility
    const attemptsToday = await prisma.pospExamAttempt.findMany({
      where: {
        attemptDate: todayStr,
        OR: [{ candidatePhone: phone }, { candidateEmail: email.toLowerCase() }],
      },
      orderBy: { completedAt: 'desc' },
    });

    if (attemptsToday.length >= MAX_ATTEMPTS_PER_DAY) {
      res.status(429).json({ error: 'Daily exam attempt limit reached (max 4 per day).' });
      return;
    }

    const lastAttempt = attemptsToday[0];
    if (lastAttempt) {
      const lastCompleted = new Date(lastAttempt.completedAt).getTime();
      const elapsedHours = (Date.now() - lastCompleted) / (1000 * 60 * 60);
      if (elapsedHours < COOLDOWN_HOURS) {
        res.status(429).json({ error: `Mandatory ${COOLDOWN_HOURS}-hour cooldown required between exam attempts.` });
        return;
      }
    }

    // Select all 50 questions
    const questions = IC38_QUESTION_BANK.map((q) => ({
      id: q.id,
      chapter: q.chapter,
      question: q.question,
      options: q.options,
    }));

    // Create pending exam attempt record
    const attempt = await prisma.pospExamAttempt.create({
      data: {
        candidateName: name,
        candidatePhone: phone,
        candidateEmail: email.toLowerCase(),
        score: 0,
        totalQuestions: questions.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        passed: false,
        attemptDate: todayStr,
        startedAt: new Date(),
      },
    });

    res.json({
      attemptId: attempt.id,
      candidateName: name,
      durationMinutes: EXAM_DURATION_MINUTES,
      totalQuestions: questions.length,
      passingScore: PASSING_THRESHOLD + 1, // score > 15 => >= 16
      questions,
      startedAt: attempt.startedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.issues[0]?.message || 'Validation error' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to start POSP exam' });
  }
});

// ── POST /api/posp/exam/submit ───────────────────────────────────────────────
router.post('/exam/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId, userAnswers, terminatedEarly, terminationReason } = z.object({
      attemptId: z.string(),
      userAnswers: z.record(z.string(), z.number()), // questionId -> selectedOptionIndex (0..3)
      terminatedEarly: z.boolean().optional(),
      terminationReason: z.string().optional(),
    }).parse(req.body);

    const attempt = await prisma.pospExamAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Exam attempt record not found' });
      return;
    }

    let correctCount = 0;
    let wrongCount = 0;
    const questionsReview: Array<{
      id: number;
      chapter: string;
      question: string;
      options: string[];
      selectedAnswer: number | null;
      correctAnswer: number;
      isCorrect: boolean;
      explanation: string;
    }> = [];

    IC38_QUESTION_BANK.forEach((q) => {
      const selected = userAnswers[String(q.id)];
      const isSelected = selected !== undefined && selected !== null;
      const isCorrect = isSelected && Number(selected) === q.correctAnswer;

      if (isCorrect) correctCount++;
      else if (isSelected) wrongCount++;

      questionsReview.push({
        id: q.id,
        chapter: q.chapter,
        question: q.question,
        options: q.options,
        selectedAnswer: isSelected ? Number(selected) : null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      });
    });

    // Forced exit or cheating automatically results in score 0 and failed exam
    const isTerminated = Boolean(terminatedEarly);
    const finalScore = isTerminated ? 0 : correctCount;
    const passed = !isTerminated && finalScore > PASSING_THRESHOLD; // score > 15 (>= 16)

    const updated = await prisma.pospExamAttempt.update({
      where: { id: attemptId },
      data: {
        score: finalScore,
        correctAnswers: isTerminated ? 0 : correctCount,
        wrongAnswers: isTerminated ? IC38_QUESTION_BANK.length : wrongCount,
        passed,
        terminatedEarly: isTerminated,
        terminationReason: isTerminated ? (terminationReason || 'App exited during active exam session') : null,
        completedAt: new Date(),
      },
    });

    res.json({
      attemptId: updated.id,
      candidateName: updated.candidateName,
      candidatePhone: updated.candidatePhone,
      candidateEmail: updated.candidateEmail,
      score: updated.score,
      totalQuestions: IC38_QUESTION_BANK.length,
      correctAnswers: updated.correctAnswers,
      wrongAnswers: updated.wrongAnswers,
      passed: updated.passed,
      passingScoreRequired: PASSING_THRESHOLD + 1,
      terminatedEarly: updated.terminatedEarly,
      terminationReason: updated.terminationReason,
      completedAt: updated.completedAt.toISOString(),
      questionsReview,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.issues[0]?.message || 'Validation error' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to submit POSP exam' });
  }
});

// ── POST /api/posp/apply ─────────────────────────────────────────────────────
router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, email, phone, examAttemptId,
      aadhaarNumber, aadhaarDocUrl, panNumber, panDocUrl,
    } = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      examAttemptId: z.string(),
      aadhaarNumber: z.string().min(12, '12-digit Aadhaar number required'),
      aadhaarDocUrl: z.string().url('Valid Aadhaar document URL required'),
      panNumber: z.string().min(10, '10-character PAN number required'),
      panDocUrl: z.string().url('Valid PAN document URL required'),
    }).parse(req.body);

    const normEmail = email.toLowerCase().trim();
    const normPhone = phone.trim();

    // Verify exam passed
    const attempt = await prisma.pospExamAttempt.findUnique({
      where: { id: examAttemptId },
    });

    if (!attempt || !attempt.passed) {
      res.status(400).json({ error: 'Valid passed POSP exam attempt (> 15/50) required before applying.' });
      return;
    }

    const existingApp = await prisma.pospApplication.findFirst({
      where: { OR: [{ email: normEmail }, { phone: normPhone }] },
    });

    if (existingApp) {
      if (existingApp.status === 'pending') {
        res.json({
          success: true,
          applicationNumber: existingApp.applicationNumber,
          status: 'pending',
          message: 'Your POSP application is already pending review by Admin.',
        });
        return;
      }
      if (existingApp.status === 'approved') {
        res.json({
          success: true,
          applicationNumber: existingApp.applicationNumber,
          status: 'approved',
          assignedAgentCode: existingApp.assignedAgentCode,
          message: 'Your POSP application is already approved!',
        });
        return;
      }
    }

    const appNum = `POSP-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const application = await prisma.pospApplication.create({
      data: {
        applicationNumber: appNum,
        name: name.trim(),
        email: normEmail,
        phone: normPhone,
        examScore: attempt.score,
        examPassedAt: attempt.completedAt,
        examAttemptId: attempt.id,
        aadhaarNumber: aadhaarNumber.trim().toUpperCase(),
        aadhaarDocUrl,
        panNumber: panNumber.trim().toUpperCase(),
        panDocUrl,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      applicationNumber: application.applicationNumber,
      status: 'pending',
      message: 'POSP Advisor application submitted successfully! It has been routed to the Admin Panel for verification & approval.',
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.issues[0]?.message || 'Validation error' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to submit POSP application' });
  }
});

// ── GET /api/posp/application/status ─────────────────────────────────────────
router.get('/application/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const phone = String(req.query.phone || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!phone && !email) {
      res.status(400).json({ error: 'Phone or email parameter required' });
      return;
    }

    const application = await prisma.pospApplication.findFirst({
      where: { OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])] },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      res.json({ hasApplication: false });
      return;
    }

    res.json({
      hasApplication: true,
      application,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
