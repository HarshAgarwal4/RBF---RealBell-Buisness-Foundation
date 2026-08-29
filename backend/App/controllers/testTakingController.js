import TestModel from '../models/test.js';
import TestAttemptModel from '../models/testAttempt.js';
import CertificateModel from '../models/certificate.js';
import CertificateAuditModel from '../models/certificateAudit.js';
import { calculateDeadline, isExpired, getRemainingSeconds } from '../../services/testTimer.js';
import { evaluateAttempt } from '../../services/testEvaluator.js';
import { generateCertificate } from '../../services/certificateGenerator.js';
import { logAudit } from '../../services/auditLogger.js';

export const getAvailableTests = async (req, res) => {
    try {
        const { domain, search, difficulty, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const query = { status: 'published' };
        
        const now = new Date();
        query.$or = [
            { startDate: { $lte: now }, endDate: { $gte: now } },
            { startDate: { $exists: false }, endDate: { $exists: false } },
            { startDate: null, endDate: null }
        ];

        if (domain) query.domain = domain;
        if (difficulty) query.difficulty = difficulty;
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const tests = await TestModel.find(query)
            .populate('domain subDomain')
            .populate('collaboratingOrgs', 'name logo')
            .select('-questions -questionBank')
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await TestModel.countDocuments(query);

        const userAttempts = await TestAttemptModel.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: '$test', count: { $sum: 1 } } }
        ]);

        const attemptsMap = userAttempts.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        const formattedTests = tests.map(test => ({
            _id: test._id,
            title: test.title,
            description: test.description,
            domain: test.domain,
            difficulty: test.difficulty,
            duration: test.duration,
            totalMarks: test.totalMarks,
            passingMarks: test.passingMarks,
            passingPercentage: test.passingPercentage,
            numberOfQuestions: test.numberOfQuestions,
            maxAttempts: test.maxAttempts,
            startDate: test.startDate,
            endDate: test.endDate,
            collaboratingOrgs: test.collaboratingOrgs,
            userAttemptCount: attemptsMap[test._id.toString()] || 0
        }));

        return res.json({
            status: 1,
            msg: "Available tests fetched successfully",
            data: {
                tests: formattedTests,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const getTestDetails = async (req, res) => {
    try {
        const testId = req.params.id;
        const test = await TestModel.findOne({ _id: testId, status: 'published' })
            .populate('domain subDomain')
            .populate('collaboratingOrgs')
            .lean();

        if (!test) {
            return res.json({ status: 0, msg: "Test not found or not available" });
        }

        const pastAttempts = await TestAttemptModel.find({ test: testId, user: req.user._id })
            .select('-answers')
            .sort({ createdAt: -1 })
            .lean();

        const attemptCount = pastAttempts.length;
        const remainingAttempts = test.maxAttempts > 0 ? Math.max(0, test.maxAttempts - attemptCount) : 'unlimited';

        return res.json({
            status: 1,
            msg: "Test details fetched successfully",
            data: {
                ...test,
                test,
                pastAttempts,
                attemptsHistory: pastAttempts,
                userAttemptsCount: attemptCount,
                remainingAttempts
            }
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const startTest = async (req, res) => {
    try {
        const testId = req.params.id;
        const test = await TestModel.findOne({ _id: testId, status: 'published' })
            .populate({
                path: 'questions.question',
                select: '-explanation -correctAnswer -options.isCorrect'
            })
            .lean();

        if (!test) {
            return res.json({ status: 0, msg: "Test not found or not published" });
        }

        if (test.startDate && test.endDate) {
            const now = new Date();
            if (now < test.startDate || now > test.endDate) {
                return res.json({ status: 0, msg: "Test is not currently active" });
            }
        }

        const pastAttempts = await TestAttemptModel.find({ test: testId, user: req.user._id }).lean();
        const attemptCount = pastAttempts.length;

        if (test.maxAttempts > 0 && attemptCount >= test.maxAttempts) {
            return res.json({ status: 0, msg: "Maximum attempts reached for this test" });
        }

        const existingInProgress = pastAttempts.find(a => a.status === 'in_progress');
        if (existingInProgress) {
            return res.json({ 
                status: 1, 
                msg: "Resuming in-progress test",
                data: {
                    attemptId: existingInProgress._id,
                    _id: existingInProgress._id
                }
            });
        }

        let selectedQuestions = [...(test.questions || [])];
        if (test.randomQuestionSelection) {
            selectedQuestions.sort(() => 0.5 - Math.random());
        }

        // Prepare stored attempt question references
        const storedQuestions = selectedQuestions.map((qItem, index) => ({
            question: qItem.question?._id || qItem.question,
            order: index + 1
        }));

        // Prepare client safe questions payload
        const safeQuestions = selectedQuestions.map((qItem, index) => {
            const q = qItem.question && typeof qItem.question === 'object' ? qItem.question : qItem;
            return {
                _id: q._id,
                questionId: q._id,
                questionText: q.questionText || 'Question item',
                questionType: q.questionType || 'mcq_single',
                marks: qItem.marks || q.marks || 1,
                negativeMark: q.negativeMark || 0,
                order: index + 1,
                options: (q.options || []).map(opt => ({
                    text: opt.text || opt,
                    _id: opt._id
                })),
                media: q.media,
                unit: q.unit
            };
        });

        const serverDeadline = calculateDeadline ? calculateDeadline(test.duration) : new Date(Date.now() + test.duration * 60000);
        
        const newAttempt = new TestAttemptModel({
            user: req.user._id,
            test: testId,
            attemptNumber: attemptCount + 1,
            status: 'in_progress',
            questions: storedQuestions,
            answers: [],
            serverDeadline,
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        await newAttempt.save();

        const remainingSeconds = getRemainingSeconds ? getRemainingSeconds(serverDeadline) : test.duration * 60;

        await logAudit({
            action: 'test_started',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: testId,
            details: { attemptId: newAttempt._id },
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        return res.json({
            status: 1,
            msg: "Test started successfully",
            data: {
                attemptId: newAttempt._id,
                _id: newAttempt._id,
                test: {
                    _id: test._id,
                    title: test.title,
                    duration: test.duration,
                    totalMarks: test.totalMarks,
                    questions: safeQuestions
                },
                questions: safeQuestions,
                serverDeadline,
                remainingSeconds
            }
        });

    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const attemptId = req.params.id;
        const { questionId, selectedOptions, textAnswer, numericalAnswer, answer } = req.body;

        const attempt = await TestAttemptModel.findOne({ _id: attemptId, user: req.user._id });
        if (!attempt) {
            return res.json({ status: 0, msg: "Attempt not found" });
        }

        if (attempt.status !== 'in_progress') {
            return res.json({ status: 0, msg: "Attempt is not in progress" });
        }

        const expired = isExpired ? isExpired(attempt.serverDeadline) : (new Date() > attempt.serverDeadline);
        if (expired) {
            return res.json({ status: 0, msg: "Time expired for this test attempt" });
        }

        const existingAnswerIndex = attempt.answers.findIndex(a => (a.question?._id || a.question || '').toString() === questionId);
        
        let selOpts = selectedOptions || [];
        let txtAns = textAnswer || '';
        let numAns = numericalAnswer !== undefined ? numericalAnswer : null;

        if (answer !== undefined) {
            if (typeof answer === 'number') {
                selOpts = [answer];
                numAns = answer;
            } else if (Array.isArray(answer)) {
                selOpts = answer;
            } else if (typeof answer === 'string') {
                txtAns = answer;
                const parsedNum = parseFloat(answer);
                if (!isNaN(parsedNum)) numAns = parsedNum;
            }
        }

        const answerData = {
            question: questionId,
            selectedOptions: selOpts,
            textAnswer: txtAns,
            numericalAnswer: numAns,
            answeredAt: new Date()
        };

        if (existingAnswerIndex >= 0) {
            attempt.answers[existingAnswerIndex] = answerData;
        } else {
            attempt.answers.push(answerData);
        }

        await attempt.save();

        return res.json({ status: 1, msg: "Answer saved successfully", data: {} });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const submitTest = async (req, res) => {
    try {
        const attemptId = req.params.id;
        
        const attempt = await TestAttemptModel.findOne({ _id: attemptId, user: req.user._id }).populate('test');
        if (!attempt) {
            return res.json({ status: 0, msg: "Attempt not found" });
        }

        if (attempt.status !== 'in_progress') {
            return res.json({ status: 0, msg: "Attempt is already submitted" });
        }

        attempt.status = 'submitted';
        attempt.submittedAt = new Date();
        await attempt.save();

        let evaluationResult = null;
        if (evaluateAttempt) {
            evaluationResult = await evaluateAttempt(attempt, attempt.test);
        }

        let certificate = null;
        if (evaluationResult && evaluationResult.evaluationComplete && evaluationResult.passed && generateCertificate) {
            try {
                certificate = await generateCertificate(attempt, attempt.test, req.user);
            } catch (certErr) {
                console.error("Certificate auto-generation note:", certErr.message);
            }
        }

        await logAudit({
            action: 'test_submitted',
            performedBy: req.user._id,
            targetType: 'TestAttempt',
            targetId: attemptId,
            details: { 
                score: evaluationResult?.obtainedMarks, 
                passed: evaluationResult?.passed,
                certificateId: certificate?.certificateId 
            },
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        return res.json({
            status: 1,
            msg: "Test submitted successfully",
            data: {
                ...(evaluationResult ? evaluationResult.toObject?.() || evaluationResult : {}),
                certificate: certificate ? {
                    _id: certificate._id,
                    certificateId: certificate.certificateId,
                    registrationId: certificate.registrationId,
                    pdfUrl: certificate.pdfUrl
                } : null,
                certificateId: certificate?.certificateId || null
            }
        });

    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const getAttemptStatus = async (req, res) => {
    try {
        const attemptId = req.params.id;
        const attempt = await TestAttemptModel.findOne({ _id: attemptId, user: req.user._id })
            .populate('test')
            .populate({
                path: 'questions.question',
                select: '-explanation -correctAnswer -options.isCorrect'
            });
        
        if (!attempt) {
            return res.json({ status: 0, msg: "Attempt not found" });
        }

        if (attempt.status === 'in_progress') {
            const expired = isExpired ? isExpired(attempt.serverDeadline) : (new Date() > attempt.serverDeadline);
            if (expired) {
                attempt.status = 'submitted';
                attempt.submittedAt = new Date();
                await attempt.save();
                if (evaluateAttempt) {
                    await evaluateAttempt(attempt);
                }
            }
        }

        const remainingSeconds = getRemainingSeconds ? getRemainingSeconds(attempt.serverDeadline) : 0;

        const safeQuestions = (attempt.questions || []).map((qItem, index) => {
            const q = qItem.question && typeof qItem.question === 'object' ? qItem.question : qItem;
            return {
                _id: q._id,
                questionId: q._id,
                questionText: q.questionText || 'Question',
                questionType: q.questionType || 'mcq_single',
                marks: q.marks || 1,
                negativeMark: q.negativeMark || 0,
                order: qItem.order || index + 1,
                options: (q.options || []).map(opt => ({
                    text: opt.text || opt,
                    _id: opt._id
                })),
                media: q.media,
                unit: q.unit
            };
        });

        if (attempt.status === 'in_progress') {
            return res.json({
                status: 1,
                msg: "Attempt status fetched",
                data: {
                    status: attempt.status,
                    attemptId: attempt._id,
                    _id: attempt._id,
                    answers: attempt.answers,
                    remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 0,
                    serverDeadline: attempt.serverDeadline,
                    test: {
                        _id: attempt.test?._id,
                        title: attempt.test?.title,
                        duration: attempt.test?.duration,
                        totalMarks: attempt.test?.totalMarks,
                        questions: safeQuestions
                    },
                    questions: safeQuestions
                }
            });
        } else {
            const fullAttempt = await TestAttemptModel.findById(attemptId).populate('test').lean();
            let cert = await CertificateModel.findOne({ testAttempt: attemptId }).populate('template').lean();
            
            if (!cert && fullAttempt?.passed && fullAttempt?.evaluationComplete && generateCertificate) {
                try {
                    const genCert = await generateCertificate(fullAttempt._id, fullAttempt.test, req.user);
                    cert = genCert?.toObject?.() || genCert;
                } catch (e) {
                    console.error("On-demand certificate generation fallback note:", e.message);
                }
            }

            return res.json({
                status: 1,
                msg: "Attempt status fetched",
                data: {
                    ...fullAttempt,
                    certificate: cert || null
                }
            });
        }
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const getMyAttempts = async (req, res) => {
    try {
        const attempts = await TestAttemptModel.find({ user: req.user._id })
            .populate('test', 'title domain')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            status: 1,
            msg: "Attempts fetched successfully",
            data: attempts
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const getMyCertificates = async (req, res) => {
    try {
        // Auto-heal / generate any missing certificates for passed attempts
        if (generateCertificate) {
            try {
                const passedAttemptsWithoutCert = await TestAttemptModel.find({
                    user: req.user._id,
                    passed: true,
                    evaluationComplete: true
                }).lean();

                for (const att of passedAttemptsWithoutCert) {
                    const exists = await CertificateModel.findOne({ testAttempt: att._id }).lean();
                    if (!exists) {
                        await generateCertificate(att._id, att.test, req.user);
                    }
                }
            } catch (autoErr) {
                console.error("My certificates auto-heal note:", autoErr.message);
            }
        }

        const certificates = await CertificateModel.find({ user: req.user._id })
            .populate({
                path: 'test',
                select: 'title domain certificateTemplate collaboratingOrgs',
                populate: { path: 'collaboratingOrgs' }
            })
            .populate('template')
            .sort({ issueDate: -1 })
            .lean();

        return res.json({
            status: 1,
            msg: "Certificates fetched successfully",
            data: certificates
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};

export const downloadCertificate = async (req, res) => {
    try {
        const idParam = req.params.id;
        const cert = await CertificateModel.findOne({ 
            $or: [
                { _id: idParam.match(/^[0-9a-fA-F]{24}$/) ? idParam : null },
                { certificateId: idParam }
            ], 
            user: req.user._id 
        }).lean();
        
        if (!cert) {
            return res.json({ status: 0, msg: "Certificate not found" });
        }

        await CertificateAuditModel.create({
            certificate: cert._id,
            performedBy: req.user._id,
            action: 'downloaded',
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        return res.json({
            status: 1,
            msg: "Certificate download initiated",
            data: {
                pdfUrl: cert.pdfUrl,
                certificateId: cert.certificateId,
                registrationId: cert.registrationId,
                certificate: cert
            }
        });
    } catch (error) {
        return res.json({ status: 0, msg: error.message });
    }
};
