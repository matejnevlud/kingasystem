import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const expenseId = parseInt(id);

        // Verify expense exists and user has access to it
        const expense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                active: true,
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

        // Fetch images for this expense
        const images = await prisma.expenseImage.findMany({
            where: {
                idExpense: expenseId,
                active: true,
            },
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error('Error fetching expense images:', error);
        return NextResponse.json(
            {error: 'Failed to fetch expense images'},
            {status: 500}
        );
    }
}

export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const expenseId = parseInt(id);
        const {imageId} = await request.json();

        if (!imageId) {
            return NextResponse.json(
                {error: 'Image ID is required'},
                {status: 400}
            );
        }

        // Verify image belongs to the expense and user has access
        const image = await prisma.expenseImage.findFirst({
            where: {
                id: parseInt(imageId),
                idExpense: expenseId,
                active: true,
            },
            include: {
                expense: true,
            },
        });

        if (!image) {
            return NextResponse.json(
                {error: 'Image not found'},
                {status: 404}
            );
        }

        // Check if user has access to this expense's unit
        if (!session.pageAccess.pgAdmin) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: session.userId,
                    idUnit: image.expense.idUnit,
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this expense'},
                    {status: 403}
                );
            }
        }

        // Soft delete the image
        await prisma.expenseImage.update({
            where: {
                id: parseInt(imageId),
            },
            data: {
                active: false,
            },
        });

        return NextResponse.json({message: 'Image deleted successfully'});
    } catch (error) {
        console.error('Error deleting expense image:', error);
        return NextResponse.json(
            {error: 'Failed to delete expense image'},
            {status: 500}
        );
    }
}