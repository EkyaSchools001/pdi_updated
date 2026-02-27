import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';
import { getIO } from '../../core/socket';



// Get all courses (with optional filters)
export const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, category } = req.query;

        const filter: any = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const courses = await prisma.course.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (err) {
        next(err);
    }
};

// Get a single course
export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true, department: true }
                        }
                    }
                }
            }
        });

        if (!course) {
            return next(new AppError('No course found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { course }
        });
    } catch (err) {
        next(err);
    }
};

// Create a new course (Admin only)
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, category, hours, instructor, status, description, url, isDownloadable } = req.body;

        const newCourse = await prisma.course.create({
            data: {
                title,
                category,
                hours: Number(hours),
                instructor,
                status: status || 'Draft',
                description,
                url,
                isDownloadable: Boolean(isDownloadable)
            }
        });

        // Emit socket event for real-time updates
        getIO().emit('course:created', newCourse);

        res.status(201).json({
            status: 'success',
            data: { course: newCourse }
        });
    } catch (err) {
        next(err);
    }
};

// Update course (Admin only)
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: req.body
        });

        // Emit socket event for real-time updates
        getIO().emit('course:updated', updatedCourse);

        res.status(200).json({
            status: 'success',
            data: { course: updatedCourse }
        });
    } catch (err) {
        next(err);
    }
};

// Delete course (Admin only)
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma.course.delete({
            where: { id }
        });

        // Emit socket event for real-time updates
        getIO().emit('course:deleted', { id });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};

// Enroll in a course (Teacher)
export const enrollInCourse = async (req: any, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id; // From auth middleware

        // Check if already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: {
                    courseId,
                    userId
                }
            }
        });

        if (existingEnrollment) {
            return next(new AppError('You are already enrolled in this course', 400));
        }

        const enrollment = await prisma.courseEnrollment.create({
            data: {
                courseId,
                userId,
                status: 'IN_PROGRESS'
            }
        });

        res.status(201).json({
            status: 'success',
            data: { enrollment }
        });
    } catch (err) {
        next(err);
    }
};

// Update enrollment progress (Teacher)
export const updateProgress = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { progress, status } = req.body;
        const courseId = req.params.id;
        const userId = req.user.id;

        const enrollment = await prisma.courseEnrollment.update({
            where: {
                courseId_userId: {
                    courseId,
                    userId
                }
            },
            data: {
                progress,
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null
            }
        });

        res.status(200).json({
            status: 'success',
            data: { enrollment }
        });
    } catch (err) {
        next(err);
    }
};

// Get my enrollments (Teacher)
export const getMyEnrollments = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { userId },
            include: {
                course: true
            }
        });

        res.status(200).json({
            status: 'success',
            results: enrollments.length,
            data: { enrollments }
        });
    } catch (err) {
        next(err);
    }
};
