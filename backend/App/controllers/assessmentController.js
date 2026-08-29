import mongoose from 'mongoose';
import DomainModel from '../models/domain.js';
import QuestionModel from '../models/question.js';
import QuestionBankModel from '../models/questionBank.js';
import TestModel from '../models/test.js';
import CollaboratingOrgModel from '../models/collaboratingOrg.js';
import TestAttemptModel from '../models/testAttempt.js';
import CertificateModel from '../models/certificate.js';
import { logAudit } from '../../services/auditLogger.js';
import { uploadFileToCloud, deleteImageByPublicId } from '../../services/upload.js';
import { evaluateTextAnswer } from '../../services/testEvaluator.js';
import { generateCertificate } from '../../services/certificateGenerator.js';

// --- Domain CRUD ---
export const createDomain = async (req, res) => {
    try {
        const { name, description, parentDomain, status } = req.body;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        
        const existing = await DomainModel.findOne({ slug });
        if (existing) {
            return res.status(400).json({ status: 0, msg: "Domain with this name already exists" });
        }

        const domain = new DomainModel({
            name,
            slug,
            description,
            parentDomain: parentDomain || null,
            status: status || 'active',
            createdBy: req.user._id
        });
        await domain.save();

        await logAudit({
            action: 'CREATE_DOMAIN',
            performedBy: req.user._id,
            targetType: 'Domain',
            targetId: domain._id,
            details: `Created domain ${name}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Domain created successfully", data: domain });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getDomains = async (req, res) => {
    try {
        const { status, parent } = req.query;
        let query = {};
        if (status) query.status = status;
        if (parent === 'null') query.parentDomain = null;

        const domains = await DomainModel.find(query)
            .populate('parentDomain')
            .sort({ name: 1 });

        return res.json({ status: 1, msg: "Domains fetched", data: domains });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const updateDomain = async (req, res) => {
    try {
        const { name, description, parentDomain, status } = req.body;
        const domain = await DomainModel.findById(req.params.id);
        
        if (!domain) return res.status(404).json({ status: 0, msg: "Domain not found" });

        if (name && name !== domain.name) {
            domain.name = name;
            domain.slug = name.toLowerCase().replace(/\s+/g, '-');
        }
        if (description !== undefined) domain.description = description;
        if (parentDomain !== undefined) domain.parentDomain = parentDomain || null;
        if (status !== undefined) domain.status = status;

        await domain.save();

        await logAudit({
            action: 'UPDATE_DOMAIN',
            performedBy: req.user._id,
            targetType: 'Domain',
            targetId: domain._id,
            details: `Updated domain ${domain.name}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Domain updated", data: domain });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const deleteDomain = async (req, res) => {
    try {
        const domain = await DomainModel.findById(req.params.id);
        if (!domain) return res.status(404).json({ status: 0, msg: "Domain not found" });

        const qCount = await QuestionModel.countDocuments({ $or: [{ domain: domain._id }, { subDomain: domain._id }] });
        const tCount = await TestModel.countDocuments({ $or: [{ domain: domain._id }, { subDomain: domain._id }] });

        if (qCount > 0 || tCount > 0) {
            return res.status(400).json({ status: 0, msg: "Cannot delete domain referenced by questions or tests" });
        }

        await DomainModel.deleteMany({ parentDomain: domain._id });
        await DomainModel.findByIdAndDelete(domain._id);

        await logAudit({
            action: 'DELETE_DOMAIN',
            performedBy: req.user._id,
            targetType: 'Domain',
            targetId: domain._id,
            details: `Deleted domain ${domain.name}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Domain deleted successfully" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Question CRUD ---
export const createQuestion = async (req, res) => {
    try {
        const { questionType, questionText, options, correctAnswer, domain, subDomain, difficulty, status, marks } = req.body;

        if (questionType === 'mcq') {
            if (!options || options.length === 0) return res.status(400).json({ status: 0, msg: "MCQ needs options" });
            const hasCorrect = options.some(opt => opt.isCorrect);
            if (!hasCorrect) return res.status(400).json({ status: 0, msg: "MCQ needs at least one correct option" });
        } else if (questionType === 'numerical' && correctAnswer === undefined) {
            return res.status(400).json({ status: 0, msg: "Numerical question needs a correct answer" });
        }

        const question = new QuestionModel({
            questionType,
            questionText,
            options,
            correctAnswer,
            domain,
            subDomain,
            difficulty,
            status,
            marks: marks || 1,
            createdBy: req.user._id
        });

        await question.save();

        await logAudit({
            action: 'CREATE_QUESTION',
            performedBy: req.user._id,
            targetType: 'Question',
            targetId: question._id,
            details: `Created question`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question created successfully", data: question });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getQuestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { domain, questionType, difficulty, status, search } = req.query;
        let query = {};
        
        if (domain) query.domain = domain;
        if (questionType) query.questionType = questionType;
        if (difficulty) query.difficulty = difficulty;
        if (status) query.status = status;
        if (search) query.questionText = { $regex: search, $options: 'i' };

        const questions = await QuestionModel.find(query)
            .populate('domain')
            .populate('subDomain')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await QuestionModel.countDocuments(query);

        return res.json({ status: 1, msg: "Questions fetched", data: { questions, total, page, limit } });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getQuestion = async (req, res) => {
    try {
        const question = await QuestionModel.findById(req.params.id)
            .populate('domain')
            .populate('subDomain');
        
        if (!question) return res.status(404).json({ status: 0, msg: "Question not found" });

        return res.json({ status: 1, msg: "Question fetched", data: question });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { questionType, questionText, options, correctAnswer, domain, subDomain, difficulty, status, marks, negativeMark, tolerance, explanation } = req.body;
        const question = await QuestionModel.findById(req.params.id);
        
        if (!question) return res.status(404).json({ status: 0, msg: "Question not found" });

        const typeToUse = questionType || question.questionType;

        if (typeToUse && typeToUse.startsWith('mcq')) {
            const optsToUse = options || question.options;
            if (!optsToUse || optsToUse.length === 0) return res.status(400).json({ status: 0, msg: "MCQ question needs options" });
            const hasCorrect = optsToUse.some(opt => opt.isCorrect);
            if (!hasCorrect) return res.status(400).json({ status: 0, msg: "MCQ question needs at least one correct option" });
        } else if (typeToUse === 'numerical') {
            const ansToUse = correctAnswer !== undefined ? correctAnswer : question.correctAnswer;
            if (ansToUse === undefined || ansToUse === null || ansToUse === '') return res.status(400).json({ status: 0, msg: "Numerical question needs a correct answer" });
        }

        if (questionType) question.questionType = questionType;
        if (questionText) question.questionText = questionText;
        if (options) question.options = options;
        if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
        if (tolerance !== undefined) question.tolerance = tolerance;
        if (explanation !== undefined) question.explanation = explanation;
        if (domain) question.domain = domain;
        if (subDomain !== undefined) question.subDomain = subDomain || null;
        if (difficulty) question.difficulty = difficulty;
        if (status) question.status = status;
        if (marks !== undefined) question.marks = Number(marks);
        if (negativeMark !== undefined) question.negativeMark = Number(negativeMark);

        await question.save();

        await logAudit({
            action: 'UPDATE_QUESTION',
            performedBy: req.user._id,
            targetType: 'Question',
            targetId: question._id,
            details: `Updated question`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question updated successfully", data: question });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const testCount = await TestModel.countDocuments({ "questions.question": req.params.id });
        if (testCount > 0) {
            return res.status(400).json({ status: 0, msg: `Cannot delete question as it is assigned to ${testCount} assessment test(s). Remove it from the test(s) first or archive it.` });
        }

        const question = await QuestionModel.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ status: 0, msg: "Question not found" });

        await logAudit({
            action: 'DELETE_QUESTION',
            performedBy: req.user._id,
            targetType: 'Question',
            targetId: req.params.id,
            details: `Deleted question`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question deleted successfully" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const duplicateQuestion = async (req, res) => {
    try {
        const original = await QuestionModel.findById(req.params.id);
        if (!original) return res.status(404).json({ status: 0, msg: "Question not found" });

        const newQuestion = new QuestionModel({
            ...original.toObject(),
            _id: undefined,
            questionText: `${original.questionText} (Copy)`,
            createdBy: req.user._id,
            createdAt: undefined,
            updatedAt: undefined
        });

        await newQuestion.save();

        return res.json({ status: 1, msg: "Question duplicated", data: newQuestion });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Question Bank CRUD ---
export const createQuestionBank = async (req, res) => {
    try {
        const { name, description, domain, status } = req.body;
        const bank = new QuestionBankModel({
            name, description, domain, status, createdBy: req.user._id
        });
        await bank.save();

        await logAudit({
            action: 'CREATE_QUESTION_BANK',
            performedBy: req.user._id,
            targetType: 'QuestionBank',
            targetId: bank._id,
            details: `Created question bank ${name}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question bank created", data: bank });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getQuestionBanks = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const banks = await QuestionBankModel.find(query).populate('domain');
        return res.json({ status: 1, msg: "Question banks fetched", data: banks });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const updateQuestionBank = async (req, res) => {
    try {
        const bank = await QuestionBankModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bank) return res.status(404).json({ status: 0, msg: "Question bank not found" });

        await logAudit({
            action: 'UPDATE_QUESTION_BANK',
            performedBy: req.user._id,
            targetType: 'QuestionBank',
            targetId: bank._id,
            details: `Updated question bank`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question bank updated", data: bank });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const deleteQuestionBank = async (req, res) => {
    try {
        const tCount = await TestModel.countDocuments({ questionBank: req.params.id });
        if (tCount > 0) return res.status(400).json({ status: 0, msg: "Bank referenced by test(s)" });

        const bank = await QuestionBankModel.findByIdAndDelete(req.params.id);
        if (!bank) return res.status(404).json({ status: 0, msg: "Question bank not found" });

        await logAudit({
            action: 'DELETE_QUESTION_BANK',
            performedBy: req.user._id,
            targetType: 'QuestionBank',
            targetId: bank._id,
            details: `Deleted question bank`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Question bank deleted" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Test CRUD ---
export const createTest = async (req, res) => {
    try {
        const testData = { ...req.body };
        testData.createdBy = req.user._id;
        
        // Ensure status is respected, defaulting to 'draft'
        testData.status = testData.status === 'published' ? 'published' : 'draft';

        // Clean empty string ObjectIds to prevent Mongoose CastErrors
        if (!testData.subDomain) delete testData.subDomain;
        if (!testData.certificateTemplate) delete testData.certificateTemplate;
        if (!testData.questionBank) delete testData.questionBank;
        if (Array.isArray(testData.collaboratingOrgs)) {
            testData.collaboratingOrgs = testData.collaboratingOrgs.filter(id => id && mongoose.Types.ObjectId.isValid(id));
        }

        if (testData.questions && testData.questions.length > 0) {
            testData.questions = testData.questions
                .filter(q => q && (q.question?._id || q.question))
                .map((q, idx) => ({
                    question: q.question?._id || q.question,
                    order: q.order !== undefined ? q.order : idx + 1,
                    marks: Number(q.marks) || 1
                }));
            testData.totalMarks = testData.questions.reduce((sum, q) => sum + q.marks, 0);
            testData.numberOfQuestions = testData.questions.length;
        } else {
            testData.questions = [];
            testData.totalMarks = 0;
            testData.numberOfQuestions = 0;
        }

        if (testData.status === 'published' && testData.questions.length === 0) {
            return res.status(400).json({ status: 0, msg: "Cannot publish a test without any questions. Please add questions or save as draft." });
        }

        const test = new TestModel(testData);
        await test.save();

        await logAudit({
            action: 'CREATE_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Created test ${test.title} (${test.status})`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: `Test ${test.status === 'published' ? 'published' : 'saved as draft'} successfully`, data: test });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getTests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { status, domain, search } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (domain) query.domain = domain;
        if (search) query.title = { $regex: search, $options: 'i' };

        const tests = await TestModel.find(query)
            .populate('domain subDomain collaboratingOrgs')
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await TestModel.countDocuments(query);

        return res.json({ status: 1, msg: "Tests fetched", data: { tests, total, page, limit } });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getTest = async (req, res) => {
    try {
        const test = await TestModel.findById(req.params.id)
            .populate('domain subDomain collaboratingOrgs questionBank certificateTemplate createdBy')
            .populate('questions.question');
        
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });

        return res.json({ status: 1, msg: "Test fetched", data: test });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const updateTest = async (req, res) => {
    try {
        const test = await TestModel.findById(req.params.id);
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });
        if (test.status === 'archived') return res.status(400).json({ status: 0, msg: "Cannot edit archived test" });

        const updateData = { ...req.body };

        // Clean empty string ObjectIds to prevent Mongoose CastErrors
        if (!updateData.subDomain) updateData.subDomain = null;
        if (!updateData.certificateTemplate) updateData.certificateTemplate = null;
        if (!updateData.questionBank) updateData.questionBank = null;
        if (Array.isArray(updateData.collaboratingOrgs)) {
            updateData.collaboratingOrgs = updateData.collaboratingOrgs.filter(id => id && mongoose.Types.ObjectId.isValid(id));
        }

        if (updateData.questions) {
            updateData.questions = updateData.questions
                .filter(q => q && (q.question?._id || q.question))
                .map((q, idx) => ({
                    question: q.question?._id || q.question,
                    order: q.order !== undefined ? q.order : idx + 1,
                    marks: Number(q.marks) || 1
                }));
            updateData.totalMarks = updateData.questions.reduce((sum, q) => sum + q.marks, 0);
            updateData.numberOfQuestions = updateData.questions.length;
        }

        if (updateData.status === 'published' && (!updateData.questions || updateData.questions.length === 0) && test.questions.length === 0) {
            return res.status(400).json({ status: 0, msg: "Cannot publish a test without any questions" });
        }

        Object.assign(test, updateData);
        await test.save();

        await logAudit({
            action: 'UPDATE_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Updated test ${test.title} (${test.status})`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Test updated successfully", data: test });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const deleteTest = async (req, res) => {
    try {
        const attemptCount = await TestAttemptModel.countDocuments({ test: req.params.id, status: 'in-progress' });
        if (attemptCount > 0) return res.status(400).json({ status: 0, msg: "Cannot delete test with active attempts" });

        const test = await TestModel.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });

        await logAudit({
            action: 'ARCHIVE_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Archived test ${test.title} via delete`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Test archived successfully" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const publishTest = async (req, res) => {
    try {
        const test = await TestModel.findById(req.params.id);
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });
        
        if (!test.questions || test.questions.length === 0) {
            return res.status(400).json({ status: 0, msg: "Cannot publish test with no questions. Please add questions first." });
        }
        if (test.passingPercentage == null && test.passingMarks == null) {
            test.passingPercentage = 50;
        }

        test.status = 'published';
        await test.save();

        await logAudit({
            action: 'PUBLISH_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Published test ${test.title}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Test published" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const unpublishTest = async (req, res) => {
    try {
        const test = await TestModel.findById(req.params.id);
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });
        if (test.status !== 'published') return res.status(400).json({ status: 0, msg: "Test is not published" });

        test.status = 'draft';
        await test.save();

        await logAudit({
            action: 'UNPUBLISH_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Unpublished test ${test.title}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Test unpublished" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const archiveTest = async (req, res) => {
    try {
        const test = await TestModel.findById(req.params.id);
        if (!test) return res.status(404).json({ status: 0, msg: "Test not found" });

        test.status = 'archived';
        await test.save();

        await logAudit({
            action: 'ARCHIVE_TEST',
            performedBy: req.user._id,
            targetType: 'Test',
            targetId: test._id,
            details: `Archived test ${test.title}`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Test archived" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Collaborator CRUD ---
export const createCollaborator = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        if (!name) return res.status(400).json({ status: 0, msg: "Organization name is required" });

        const website = req.body.website || req.body.websiteUrl || '';
        const description = req.body.description || '';
        const contactEmail = req.body.contactEmail || '';
        const contactPhone = req.body.contactPhone || '';
        const collaborationDetails = req.body.collaborationDetails || '';
        
        let status = 'active';
        if (req.body.status) {
            status = req.body.status;
        } else if (req.body.isActive !== undefined) {
            status = (req.body.isActive === 'true' || req.body.isActive === true) ? 'active' : 'inactive';
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
        
        let logo = { url: '', publicId: '' };
        if (req.file) {
            try {
                const uploadResult = await uploadFileToCloud(req.file.buffer, 'collaborators');
                logo = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
            } catch (err) {
                const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                logo = { url: base64, publicId: '' };
            }
        } else if (req.body.logoUrl || req.body.logo) {
            const logoStr = req.body.logoUrl || req.body.logo;
            logo = { url: typeof logoStr === 'string' ? logoStr : (logoStr.url || ''), publicId: '' };
        }

        const org = new CollaboratingOrgModel({
            name,
            slug,
            website,
            description,
            contactEmail,
            contactPhone,
            collaborationDetails,
            status,
            logo,
            createdBy: req.user._id
        });
        await org.save();

        await logAudit({
            action: 'CREATE_COLLABORATOR',
            performedBy: req.user._id,
            targetType: 'CollaboratingOrg',
            targetId: org._id,
            details: `Created collaborator ${name}`,
            ipAddress: req.ip
        });

        // Normalize response object
        const orgObj = org.toObject();
        orgObj.logoUrl = org.logo?.url || (typeof org.logo === 'string' ? org.logo : '');
        orgObj.websiteUrl = org.website;
        orgObj.isActive = org.status === 'active';

        return res.json({ status: 1, msg: "Collaborator created", data: orgObj });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getCollaborators = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const orgs = await CollaboratingOrgModel.find(query).sort({ name: 1 });
        const normalized = orgs.map(org => {
            const obj = org.toObject();
            obj.logoUrl = org.logo?.url || (typeof org.logo === 'string' ? org.logo : '');
            obj.websiteUrl = org.website;
            obj.isActive = org.status === 'active';
            return obj;
        });

        return res.json({ status: 1, msg: "Collaborators fetched", data: normalized });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const updateCollaborator = async (req, res) => {
    try {
        const org = await CollaboratingOrgModel.findById(req.params.id);
        if (!org) return res.status(404).json({ status: 0, msg: "Collaborator not found" });

        const { name, website, websiteUrl, description, status, isActive, contactEmail, contactPhone, collaborationDetails, logoUrl } = req.body;
        
        if (name && name !== org.name) {
            org.name = name;
        }
        if (website !== undefined || websiteUrl !== undefined) {
            org.website = website !== undefined ? website : websiteUrl;
        }
        if (description !== undefined) org.description = description;
        if (contactEmail !== undefined) org.contactEmail = contactEmail;
        if (contactPhone !== undefined) org.contactPhone = contactPhone;
        if (collaborationDetails !== undefined) org.collaborationDetails = collaborationDetails;
        
        if (status !== undefined) {
            org.status = status;
        } else if (isActive !== undefined) {
            org.status = (isActive === 'true' || isActive === true) ? 'active' : 'inactive';
        }

        if (req.file) {
            try {
                const uploadResult = await uploadFileToCloud(req.file.buffer, 'collaborators');
                org.logo = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
            } catch (err) {
                const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                org.logo = { url: base64, publicId: '' };
            }
        } else if (logoUrl !== undefined) {
            org.logo = { url: logoUrl, publicId: org.logo?.publicId || '' };
        }

        await org.save();

        await logAudit({
            action: 'UPDATE_COLLABORATOR',
            performedBy: req.user._id,
            targetType: 'CollaboratingOrg',
            targetId: org._id,
            details: `Updated collaborator ${org.name}`,
            ipAddress: req.ip
        });

        const orgObj = org.toObject();
        orgObj.logoUrl = org.logo?.url || (typeof org.logo === 'string' ? org.logo : '');
        orgObj.websiteUrl = org.website;
        orgObj.isActive = org.status === 'active';

        return res.json({ status: 1, msg: "Collaborator updated", data: orgObj });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const deleteCollaborator = async (req, res) => {
    try {
        const tCount = await TestModel.countDocuments({ collaboratingOrgs: req.params.id });
        if (tCount > 0) return res.status(400).json({ status: 0, msg: "Collaborator used in test(s)" });

        const org = await CollaboratingOrgModel.findByIdAndDelete(req.params.id);
        if (!org) return res.status(404).json({ status: 0, msg: "Collaborator not found" });

        await logAudit({
            action: 'DELETE_COLLABORATOR',
            performedBy: req.user._id,
            targetType: 'CollaboratingOrg',
            targetId: req.params.id,
            details: `Deleted collaborator`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Collaborator deleted" });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Attempt Management ---
export const getTestAttempts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { status } = req.query;
        let query = { test: req.params.id };
        if (status) query.status = status;

        const attempts = await TestAttemptModel.find(query)
            .populate('user', 'name email company_name')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await TestAttemptModel.countDocuments(query);

        return res.json({ status: 1, msg: "Attempts fetched", data: { attempts, total, page, limit } });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const getAttemptDetail = async (req, res) => {
    try {
        const attempt = await TestAttemptModel.findById(req.params.id)
            .populate('user')
            .populate('test')
            .populate('answers.question')
            .populate('answers.evaluatedBy');
        
        if (!attempt) return res.status(404).json({ status: 0, msg: "Attempt not found" });

        return res.json({ status: 1, msg: "Attempt fetched", data: attempt });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const evaluateTextAnswerHandler = async (req, res) => {
    try {
        const attemptId = req.params.id;
        const { questionId, isCorrect, marksAwarded, comment } = req.body;
        
        const attempt = await TestAttemptModel.findById(attemptId).populate('test');
        if (!attempt) return res.status(404).json({ status: 0, msg: "Attempt not found" });

        const updatedAttempt = await evaluateTextAnswer(attempt, questionId, isCorrect, marksAwarded, req.user._id, comment);

        if (updatedAttempt.evaluationComplete && updatedAttempt.passed) {
            try {
                await generateCertificate(updatedAttempt);
            } catch (certErr) {
                console.error("Certificate auto-generation note:", certErr.message);
            }
        }

        await logAudit({
            action: 'EVALUATE_ANSWER',
            performedBy: req.user._id,
            targetType: 'TestAttempt',
            targetId: attempt._id,
            details: `Evaluated question ${questionId} for attempt`,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: "Answer evaluated successfully", data: updatedAttempt });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

// --- Analytics ---
export const getAnalytics = async (req, res) => {
    try {
        const totalTests = await TestModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        const totalQuestions = await QuestionModel.aggregate([
            { $group: { _id: "$questionType", count: { $sum: 1 } } }
        ]);

        const totalAttempts = await TestAttemptModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const totalCertificates = await CertificateModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const totalAttemptsPassed = await TestAttemptModel.countDocuments({ isPassed: true });
        const totalCompletedAttempts = await TestAttemptModel.countDocuments({ status: 'completed' });
        const passRate = totalCompletedAttempts > 0 ? (totalAttemptsPassed / totalCompletedAttempts) * 100 : 0;

        const collaborationStats = await TestModel.aggregate([
            { $unwind: "$collaboratingOrgs" },
            { $lookup: { from: 'testattempts', localField: '_id', foreignField: 'test', as: 'attempts' } },
            { $project: { org: "$collaboratingOrgs", attemptCount: { $size: "$attempts" } } },
            { $group: { _id: "$org", totalAttempts: { $sum: "$attemptCount" } } }
        ]);

        return res.json({ 
            status: 1, 
            msg: "Analytics fetched", 
            data: {
                totalTests,
                totalQuestions,
                totalAttempts,
                totalCertificates,
                passRate,
                collaborationStats
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 0, msg: error.message });
    }
};
