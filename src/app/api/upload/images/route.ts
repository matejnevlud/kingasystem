import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';
import {promises as fs} from 'fs';
import path from 'path';

// Use Railway volume path if available, fallback to local for development
const UPLOAD_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'expenses')
    : path.join(process.cwd(), 'public', 'uploads', 'expenses');

// Ensure upload directory exists
async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, {recursive: true});
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');

        if (!sessionCookie) {
            return NextResponse.json(
                {error: 'No active session'},
                {status: 401}
            );
        }

        // Parse the session data
        const session = JSON.parse(sessionCookie.value);

        const formData = await request.formData();
        const files = formData.getAll('images') as File[];
        const expenseId = formData.get('expenseId') as string;

        if (!expenseId) {
            return NextResponse.json(
                {error: 'Expense ID is required'},
                {status: 400}
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                {error: 'No files uploaded'},
                {status: 400}
            );
        }

        // Verify expense exists and user has access to it
        const expense = await prisma.expense.findFirst({
            where: {
                id: parseInt(expenseId),
                active: true,
            },
            include: {
                unit: true,
            },
        });

        if (!expense) {
            return NextResponse.json(
                {error: 'Expense not found'},
                {status: 404}
            );
        }

        // Check if user has access to this expense's unit
        if (!session.pageAccess.pgAdmin) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: session.userId,
                    idUnit: expense.idUnit,
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this expense'},
                    {status: 403}
                );
            }
        }

        await ensureUploadDir();

        const uploadedImages = [];

        for (const file of files) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                return NextResponse.json(
                    {error: `File ${file.name} is not an image`},
                    {status: 400}
                );
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    {error: `File ${file.name} is too large (max 10MB)`},
                    {status: 400}
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = path.extname(file.name);
            const fileName = `expense_${expenseId}_${timestamp}_${randomString}${fileExtension}`;
            const filePath = path.join(UPLOAD_DIR, fileName);
            // Use API route for serving images instead of direct public path
            const relativeFilePath = `/api/images/${fileName}`;

            // Save file to disk
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filePath, buffer);

            // Save file info to database
            const expenseImage = await prisma.expenseImage.create({
                data: {
                    idExpense: parseInt(expenseId),
                    fileName: fileName,
                    filePath: relativeFilePath,
                    fileSize: file.size,
                    mimeType: file.type,
                },
            });

            uploadedImages.push(expenseImage);
        }

        return NextResponse.json({
            message: 'Images uploaded successfully',
            images: uploadedImages,
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        return NextResponse.json(
            {error: 'Failed to upload images'},
            {status: 500}
        );
    }
}