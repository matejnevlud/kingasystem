import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

export async function GET(request: NextRequest) {
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

        const searchParams = request.nextUrl.searchParams;
        const unitIds = searchParams.getAll('unitIds');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        if (!unitIds.length) {
            return NextResponse.json(
                {error: 'Unit IDs are required'},
                {status: 400}
            );
        }

        if (!dateFrom || !dateTo) {
            return NextResponse.json(
                {error: 'Date range is required'},
                {status: 400}
            );
        }

        // Convert unitIds to numbers
        const unitIdNumbers = unitIds.map(id => parseInt(id));

        // Check if user has access to all requested units (skip check for user ID 1)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findMany({
                where: {
                    idUser: userId,
                    idUnit: {in: unitIdNumbers},
                },
            });

            if (unitAccess.length !== unitIdNumbers.length) {
                return NextResponse.json(
                    {error: 'You do not have access to all requested units'},
                    {status: 403}
                );
            }
        }

        // Create date range for filtering
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);

        // Get year and month for budget data
        const year = fromDate.getFullYear();
        const month = fromDate.getMonth() + 1;

        // Fetch budget data from business plans
        const businessPlans = await prisma.businessPlan.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                year: year,
                month: month,
            },
        });

        // Fetch real sales data
        const sales = await prisma.sale.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                active: true,
                confirmed: true,
                datetime: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
        });

        // Fetch real expenses data
        const expenses = await prisma.expense.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                active: true,
                datetime: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
        });

        // Calculate budget totals
        const budgetRevenue = businessPlans.reduce((sum, plan) => sum + plan.revenue, 0);
        const budgetIndirect = businessPlans.reduce((sum, plan) => sum + (plan.revenue * plan.indirectPerc / 100), 0);
        const budgetFix = businessPlans.reduce((sum, plan) => sum + plan.tax, 0);
        const budgetOoc = businessPlans.reduce((sum, plan) => sum + plan.ooc, 0);
        const budgetExpenses = budgetIndirect + budgetFix + budgetOoc;

        // Calculate real totals
        const realRevenue = sales.reduce((sum, sale) => sum + (sale.sellPrice * sale.amount), 0);

        // Calculate real expenses by category
        const realDirect = expenses.filter(e => e.category === 'D').reduce((sum, e) => sum + e.cost, 0);
        const realIndirect = expenses.filter(e => e.category === 'I').reduce((sum, e) => sum + e.cost, 0);
        const realFix = expenses.filter(e => e.category === 'T').reduce((sum, e) => sum + e.cost, 0);
        const realOoc = expenses.filter(e => e.category === 'O').reduce((sum, e) => sum + e.cost, 0);
        const realExpenses = realDirect + realIndirect + realFix + realOoc;

        // Calculate budget direct (assuming it's revenue minus margin)
        const budgetDirect = budgetRevenue * 0.6; // Assuming 60% direct costs, adjust as needed

        // Calculate profits
        const budgetProfit = budgetRevenue - budgetDirect - budgetExpenses;
        const realProfit = realRevenue - realDirect - realExpenses;

        // Helper function to calculate delta
        const calculateDelta = (real: number, budget: number) => {
            const delta = real - budget;
            const deltaPercentage = budget !== 0 ? (delta / budget) * 100 : 0;
            return {delta, deltaPercentage};
        };

        // Build response data
        const responseData = {
            revenue: {
                budget: budgetRevenue,
                real: realRevenue,
                ...calculateDelta(realRevenue, budgetRevenue),
            },
            direct: {
                budget: budgetDirect,
                real: realDirect,
                ...calculateDelta(realDirect, budgetDirect),
            },
            indirect: {
                budget: budgetIndirect,
                real: realIndirect,
                ...calculateDelta(realIndirect, budgetIndirect),
            },
            fix: {
                budget: budgetFix,
                real: realFix,
                ...calculateDelta(realFix, budgetFix),
            },
            expenses: {
                budget: budgetExpenses,
                real: realExpenses,
                ...calculateDelta(realExpenses, budgetExpenses),
            },
            profit: {
                budget: budgetProfit,
                real: realProfit,
                ...calculateDelta(realProfit, budgetProfit),
            },
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching plan overview:', error);
        return NextResponse.json(
            {error: 'Failed to fetch plan overview'},
            {status: 500}
        );
    }
}