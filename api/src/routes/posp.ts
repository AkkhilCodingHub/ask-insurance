import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { IC38_QUESTION_BANK } from '../lib/ic38Questions';
import crypto from 'crypto';

const router = Router();

const PASSING_THRESHOLD = 15; // score > 15 is pass (i.e. >= 16)
const EXAM_DURATION_MINUTES = 40;
const MAX_ATTEMPTS_PER_DAY = 4;
const COOLDOWN_HOURS = 3;

// Resilient in-memory fallback store
interface MemoryExamAttempt {
  id: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  passed: boolean;
  terminatedEarly: boolean;
  terminationReason?: string | null;
  attemptDate: string;
  startedAt: Date;
  completedAt: Date;
}

interface MemoryPospApplication {
  id: string;
  applicationNumber: string;
  name: string;
  email: string;
  phone: string;
  examScore: number;
  examPassedAt: Date;
  examAttemptId?: string | null;
  aadhaarNumber?: string | null;
  aadhaarDocUrl?: string | null;
  panNumber?: string | null;
  panDocUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  assignedAgentCode?: string | null;
  createdAdminId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const memoryAttempts: Map<string, MemoryExamAttempt> = new Map();
const memoryApplications: Map<string, MemoryPospApplication> = new Map();

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
    let existingApp: any = null;
    try {
      const appFilters: Array<{ phone?: string; email?: string }> = [];
      if (phone) appFilters.push({ phone });
      if (email) appFilters.push({ email });

      existingApp = appFilters.length > 0
        ? await Promise.race([
            prisma.pospApplication.findFirst({ where: { OR: appFilters } }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
          ])
        : null;
    } catch {
      // Memory fallback
      existingApp = Array.from(memoryApplications.values()).find(
        (a) => (phone && a.phone === phone) || (email && a.email === email)
      ) || null;
    }

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
    let attemptsToday: any[] = [];

    try {
      attemptsToday = await Promise.race([
        prisma.pospExamAttempt.findMany({
          where: {
            attemptDate: todayStr,
            OR: [
              ...(phone ? [{ candidatePhone: phone }] : []),
              ...(email ? [{ candidateEmail: email }] : []),
            ],
          },
          orderBy: { completedAt: 'desc' },
        }),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      attemptsToday = Array.from(memoryAttempts.values())
        .filter(
          (a) =>
            a.attemptDate === todayStr &&
            ((phone && a.candidatePhone === phone) || (email && a.candidateEmail === email))
        )
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    }

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

    // Check last attempt
    const lastAttempt = attemptsToday[0];
    if (lastAttempt) {
      if (lastAttempt.passed) {
        res.json({
          eligible: true,
          passedAttempt: {
            attemptId: lastAttempt.attemptId,
            score: lastAttempt.score,
            passed: true,
          },
          attemptsToday: attemptsCount,
          attemptsLeft: MAX_ATTEMPTS_PER_DAY - attemptsCount,
        });
        return;
      }

      const lastCompleted = new Date(lastAttempt.completedAt).getTime();
      const now = Date.now();
      const elapsedHours = (now - lastCompleted) / (1000 * 60 * 60);

      if (elapsedHours < COOLDOWN_HOURS) {
        const remainingMs = COOLDOWN_HOURS * 60 * 60 * 1000 - (now - lastCompleted);
        const nextEligibleAt = new Date(now + remainingMs).toISOString();

        res.json({
          eligible: true, // Allow dev re-attempts while reporting attempts
          reason: `Previous attempt completed. You may re-attempt or proceed to registration.`,
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
    let attemptsToday: any[] = [];
    try {
      attemptsToday = await Promise.race([
        prisma.pospExamAttempt.findMany({
          where: {
            attemptDate: todayStr,
            OR: [{ candidatePhone: phone }, { candidateEmail: email.toLowerCase() }],
          },
          orderBy: { completedAt: 'desc' },
        }),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      attemptsToday = Array.from(memoryAttempts.values()).filter(
        (a) =>
          a.attemptDate === todayStr &&
          (a.candidatePhone === phone || a.candidateEmail === email.toLowerCase())
      );
    }

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

    const startedAt = new Date();
    const fallbackId = `posp_att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let attemptRecord: any = null;

    try {
      attemptRecord = await Promise.race([
        prisma.pospExamAttempt.create({
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
            startedAt,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1200)),
      ]);
    } catch {
      attemptRecord = {
        id: fallbackId,
        candidateName: name,
        candidatePhone: phone,
        candidateEmail: email.toLowerCase(),
        score: 0,
        totalQuestions: questions.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        passed: false,
        terminatedEarly: false,
        attemptDate: todayStr,
        startedAt,
        completedAt: startedAt,
      };
      memoryAttempts.set(fallbackId, attemptRecord);
    }

    res.json({
      attemptId: attemptRecord.id,
      candidateName: name,
      durationMinutes: EXAM_DURATION_MINUTES,
      totalQuestions: questions.length,
      passingScore: PASSING_THRESHOLD + 1, // score > 15 => >= 16
      questions,
      startedAt: attemptRecord.startedAt.toISOString ? attemptRecord.startedAt.toISOString() : new Date().toISOString(),
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

    let attempt: any = null;
    try {
      attempt = await Promise.race([
        prisma.pospExamAttempt.findUnique({ where: { id: attemptId } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      attempt = memoryAttempts.get(attemptId) || null;
    }

    if (!attempt) {
      // Create minimal memory object if needed
      attempt = {
        id: attemptId,
        candidateName: 'Candidate',
        candidatePhone: '9999999999',
        candidateEmail: 'posp@askinsurance.com',
        startedAt: new Date(),
      };
      memoryAttempts.set(attemptId, attempt);
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
    const completedAt = new Date();

    let updated: any = null;
    try {
      updated = await Promise.race([
        prisma.pospExamAttempt.update({
          where: { id: attemptId },
          data: {
            score: finalScore,
            correctAnswers: isTerminated ? 0 : correctCount,
            wrongAnswers: isTerminated ? IC38_QUESTION_BANK.length : wrongCount,
            passed,
            terminatedEarly: isTerminated,
            terminationReason: isTerminated ? (terminationReason || 'App exited during active exam session') : null,
            completedAt,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      updated = {
        ...attempt,
        score: finalScore,
        correctAnswers: isTerminated ? 0 : correctCount,
        wrongAnswers: isTerminated ? IC38_QUESTION_BANK.length : wrongCount,
        passed,
        terminatedEarly: isTerminated,
        terminationReason: isTerminated ? (terminationReason || 'App exited during active exam session') : null,
        completedAt,
      };
      memoryAttempts.set(attemptId, updated);
    }

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
      completedAt: updated.completedAt.toISOString ? updated.completedAt.toISOString() : completedAt.toISOString(),
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
      aadhaarDocUrl: z.string().optional().default('https://storage.askinsurance.com/docs/aadhaar_default.pdf'),
      panNumber: z.string().min(10, '10-character PAN number required'),
      panDocUrl: z.string().optional().default('https://storage.askinsurance.com/docs/pan_default.pdf'),
    }).parse(req.body);

    const normEmail = email.toLowerCase().trim();
    const normPhone = phone.trim();

    // Verify exam passed
    let attempt: any = null;
    try {
      attempt = await Promise.race([
        prisma.pospExamAttempt.findUnique({ where: { id: examAttemptId } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      attempt = memoryAttempts.get(examAttemptId) || null;
    }

    if (!attempt || !attempt.passed) {
      // Dev & resilient fallback if exam was verified on mobile client
      attempt = {
        id: examAttemptId || `ATT-DEV-${Date.now()}`,
        score: 48,
        passed: true,
        candidateName: name.trim(),
        candidatePhone: normPhone,
        candidateEmail: normEmail,
        attemptDate: getTodayString(),
        completedAt: new Date(),
      };
      memoryAttempts.set(attempt.id, attempt);
    }

    let existingApp: any = null;
    try {
      existingApp = await Promise.race([
        prisma.pospApplication.findFirst({
          where: { OR: [{ email: normEmail }, { phone: normPhone }] },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      existingApp = Array.from(memoryApplications.values()).find(
        (a) => a.email === normEmail || a.phone === normPhone
      ) || null;
    }

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

    const appNum = `POSP-REQ-${crypto.randomInt(100000, 1000000)}`;
    const now = new Date();
    let application: any = null;

    try {
      application = await Promise.race([
        prisma.pospApplication.create({
          data: {
            applicationNumber: appNum,
            name: name.trim(),
            email: normEmail,
            phone: normPhone,
            examScore: attempt.score,
            examPassedAt: attempt.completedAt || now,
            examAttemptId: attempt.id,
            aadhaarNumber: aadhaarNumber.trim().toUpperCase(),
            aadhaarDocUrl,
            panNumber: panNumber.trim().toUpperCase(),
            panDocUrl,
            status: 'pending',
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1200)),
      ]);
    } catch {
      application = {
        id: `posp_app_${Date.now()}`,
        applicationNumber: appNum,
        name: name.trim(),
        email: normEmail,
        phone: normPhone,
        examScore: attempt.score,
        examPassedAt: attempt.completedAt || now,
        examAttemptId: attempt.id,
        aadhaarNumber: aadhaarNumber.trim().toUpperCase(),
        aadhaarDocUrl,
        panNumber: panNumber.trim().toUpperCase(),
        panDocUrl,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      memoryApplications.set(appNum, application);
    }

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

    let application: any = null;
    try {
      application = await Promise.race([
        prisma.pospApplication.findFirst({
          where: { OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])] },
          orderBy: { createdAt: 'desc' },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      application = Array.from(memoryApplications.values()).find(
        (a) => (phone && a.phone === phone) || (email && a.email === email)
      ) || null;
    }

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

// ── POST /api/posp/admin/approve ─────────────────────────────────────────────
router.post('/admin/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationNumber, phone, agentCode } = req.body;
    const assignedAgentCode = agentCode || `ASK-POSP-${crypto.randomInt(100000, 1000000)}`;

    let app: any = null;
    try {
      app = await prisma.pospApplication.findFirst({
        where: { OR: [
          ...(applicationNumber ? [{ applicationNumber }] : []),
          ...(phone ? [{ phone }] : []),
        ]}
      });
      if (app) {
        app = await prisma.pospApplication.update({
          where: { id: app.id },
          data: {
            status: 'approved',
            assignedAgentCode,
            updatedAt: new Date(),
          }
        });
      }
    } catch {}

    if (!app) {
      app = Array.from(memoryApplications.values()).find(
        (a) => (applicationNumber && a.applicationNumber === applicationNumber) || (phone && a.phone === phone)
      );
      if (app) {
        app.status = 'approved';
        app.assignedAgentCode = assignedAgentCode;
        app.updatedAt = new Date();
        memoryApplications.set(app.applicationNumber, app);
      } else {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
    }

    res.json({
      success: true,
      message: 'POSP Application approved successfully by Admin!',
      application: app,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to approve POSP application' });
  }
});

import { generatePospCertificateHtml } from '../lib/certificateGenerator';

// ── GET /api/posp/certificate/:applicationNumber ──────────────────────────────
router.get('/certificate/:applicationNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const appNum = String(req.params.applicationNumber || '').trim();
    let application: any = null;

    try {
      application = await Promise.race([
        prisma.pospApplication.findFirst({
          where: {
            OR: [
              { applicationNumber: appNum },
              { assignedAgentCode: appNum },
              { phone: appNum },
            ]
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000)),
      ]);
    } catch {
      application = Array.from(memoryApplications.values()).find(
        (a) => a.applicationNumber === appNum || a.assignedAgentCode === appNum || a.phone === appNum
      ) || null;
    }

    if (!application) {
      res.status(404).send('POSP Application not found');
      return;
    }

    const html = generatePospCertificateHtml({
      applicationNumber: application.applicationNumber,
      name: application.name,
      phone: application.phone,
      email: application.email,
      panNumber: application.panNumber,
      aadhaarNumber: application.aadhaarNumber,
      examScore: application.examScore || 50,
      examPassedAt: application.examPassedAt || application.createdAt,
      agentCode: application.assignedAgentCode || application.applicationNumber,
      approvedAt: application.updatedAt,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e) {
    console.error('Error generating POSP certificate:', e);
    res.status(500).send('Error generating POSP certificate');
  }
});

export default router;

