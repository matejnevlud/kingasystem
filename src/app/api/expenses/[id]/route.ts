import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

export async function PUT(
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
        const userId = session.userId;

        const { id } = await params;
        const expenseId = parseInt(id);
        const {datetime, unitId, paymentTypeId, amount, description, vendor, category} = await request.json();

        if (!unitId || !paymentTypeId || !amount || !description || !vendor || !category) {
            return NextResponse.json(
                {error: 'All fields are required'},
                {status: 400}
            );
        }

        // Validate category
        const validCategories = ['D', 'I', 'O', 'T'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                {error: 'Invalid category. Must be one of: D, I, O, T'},
                {status: 400}
            );
        }

        // Check if expense exists and user has access to it
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                active: true,
            },
            include: {
                unit: true,
            },
        });

        if (!existingExpense) {
            return NextResponse.json(
                {error: 'Expense not found'},
                {status: 404}
            );
        }

        // Check if user has access to the unit (skip for user ID 1)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: userId,
                    idUnit: parseInt(unitId),
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this unit'},
                    {status: 403}
                );
            }
        }

        // Validate payment type exists
        const paymentType = await prisma.paymentType.findFirst({
            where: {
                id: parseInt(paymentTypeId),
                active: true,
            },
        });

        if (!paymentType) {
            return NextResponse.json(
                {error: 'Payment type not found'},
                {status: 404}
            );
        }

        // Update the expense
        const updatedExpense = await prisma.expense.update({
            where: {
                id: expenseId,
            },
            data: {
                idUnit: parseInt(unitId),
                idPaymentType: parseInt(paymentTypeId),
                vendor: parseInt(vendor),
                description: description,
                cost: parseFloat(amount),
                category: category,
                datetime: datetime ? new Date(datetime) : existingExpense.datetime,
            },
            include: {
                unit: {
                    select: {
                        unit: true,
                    },
                },
                paymentType: {
                    select: {
                        name: true,
                        abreviation: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json(
            {error: 'Failed to update expense'},
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
        const userId = session.userId;

        const { id } = await params;
        const expenseId = parseInt(id);

        // Check if expense exists and user has access to it
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                active: true,
            },
            include: {
                unit: true,
            },
        });

        if (!existingExpense) {
            return NextResponse.json(
                {error: 'Expense not found'},
                {status: 404}
            );
        }

        // Check if user has access to the unit (skip for user ID 1)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: userId,
                    idUnit: existingExpense.idUnit,
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this unit'},
                    {status: 403}
                );
            }
        }

        // Soft delete the expense (set active to false)
        const deletedExpense = await prisma.expense.update({
            where: {
                id: expenseId,
            },
            data: {
                active: false,
            },
        });

        return NextResponse.json({message: 'Expense deleted successfully'});
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            {error: 'Failed to delete expense'},
            {status: 500}
        );
    }
}