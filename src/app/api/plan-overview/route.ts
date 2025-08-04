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

        // Check if user has access to all requested units (skip check for admin users)
        if (!session.pageAccess.pgAdmin) {
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

        // Calculate budget revenue based on date range (like SQL function)
        const calculateBudgetRevenue = async () => {
            let totalBudget = 0;
            
            // Get start and end month details
            const startYear = fromDate.getFullYear();
            const startMonth = fromDate.getMonth() + 1;
            const startDay = fromDate.getDate();
            
            const endYear = toDate.getFullYear();
            const endMonth = toDate.getMonth() + 1;
            const endDay = toDate.getDate();
            
            // If same month and year
            if (startYear === endYear && startMonth === endMonth) {
                const businessPlans = await prisma.businessPlan.findMany({
                    where: {
                        idUnit: {in: unitIdNumbers},
                        year: startYear,
                        month: startMonth,
                    },
                });
                
                const monthRevenue = businessPlans.reduce((sum, plan) => sum + plan.revenue, 0);
                const daysInMonth = new Date(startYear, startMonth, 0).getDate();
                const daysBetween = endDay - startDay + 1;
                totalBudget = monthRevenue * daysBetween / daysInMonth;
            } else {
                // Calculate for start month (partial)
                const startPlans = await prisma.businessPlan.findMany({
                    where: {
                        idUnit: {in: unitIdNumbers},
                        year: startYear,
                        month: startMonth,
                    },
                });
                
                const startMonthRevenue = startPlans.reduce((sum, plan) => sum + plan.revenue, 0);
                const startDaysInMonth = new Date(startYear, startMonth, 0).getDate();
                const startDaysToSubtract = startDay - 1;
                totalBudget += startMonthRevenue - (startMonthRevenue * startDaysToSubtract / startDaysInMonth);
                
                // Calculate for end month (partial)
                const endPlans = await prisma.businessPlan.findMany({
                    where: {
                        idUnit: {in: unitIdNumbers},
                        year: endYear,
                        month: endMonth,
                    },
                });
                
                const endMonthRevenue = endPlans.reduce((sum, plan) => sum + plan.revenue, 0);
                const endDaysInMonth = new Date(endYear, endMonth, 0).getDate();
                const endDaysToSubtract = endDaysInMonth - endDay;
                totalBudget += endMonthRevenue - (endMonthRevenue * endDaysToSubtract / endDaysInMonth);
                
                // Calculate for full months in between
                let currentDate = new Date(startYear, startMonth, 1); // Next month after start
                const endDate = new Date(endYear, endMonth - 1, 1); // Month before end
                
                while (currentDate <= endDate) {
                    const fullMonthPlans = await prisma.businessPlan.findMany({
                        where: {
                            idUnit: {in: unitIdNumbers},
                            year: currentDate.getFullYear(),
                            month: currentDate.getMonth() + 1,
                        },
                    });
                    
                    totalBudget += fullMonthPlans.reduce((sum, plan) => sum + plan.revenue, 0);
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }
            
            return totalBudget;
        };

        const budgetRevenue = await calculateBudgetRevenue();

        // Fetch all business plans for the date range to calculate other budget items
        const allBusinessPlans = await prisma.businessPlan.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                OR: [
                    {
                        year: fromDate.getFullYear(),
                        month: {
                            gte: fromDate.getMonth() + 1,
                            lte: fromDate.getFullYear() === toDate.getFullYear() ? toDate.getMonth() + 1 : 12
                        }
                    },
                    ...(fromDate.getFullYear() !== toDate.getFullYear() ? [{
                        year: toDate.getFullYear(),
                        month: {
                            gte: 1,
                            lte: toDate.getMonth() + 1
                        }
                    }] : [])
                ]
            },
        });

        // Fetch real sales data
        const sales = await prisma.sale.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                active: true,
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

        // Calculate budget direct (assuming it's revenue minus margin)
        const budgetDirect = budgetRevenue * 0.6; // Assuming 60% direct costs, adjust as needed

        // Calculate other budget totals (proportional to revenue ratio)
        const totalPlannedRevenue = allBusinessPlans.reduce((sum, plan) => sum + plan.revenue, 0);
        const revenueRatio = totalPlannedRevenue > 0 ? budgetRevenue / totalPlannedRevenue : 0;
        const budgetIndirect = budgetDirect * (allBusinessPlans.reduce((sum, plan) => sum + plan.indirectPerc, 0) / allBusinessPlans.length) / 100;
        const budgetFix = allBusinessPlans.reduce((sum, plan) => sum + plan.tax, 0) * revenueRatio;
        const budgetOoc = allBusinessPlans.reduce((sum, plan) => sum + plan.ooc, 0) * revenueRatio;
        const budgetExpenses = budgetIndirect + budgetFix + budgetOoc;

        // Calculate real totals
        const realRevenue = sales.reduce((sum, sale) => sum + (sale.sellPrice * sale.amount), 0);

        // Calculate real expenses by category
        const realDirect = expenses.filter(e => e.category === 'D').reduce((sum, e) => sum + e.cost, 0);
        const realIndirect = expenses.filter(e => e.category === 'I').reduce((sum, e) => sum + e.cost, 0);
        const realFix = expenses.filter(e => e.category === 'F').reduce((sum, e) => sum + e.cost, 0);
        const realOoc = expenses.filter(e => e.category === 'O').reduce((sum, e) => sum + e.cost, 0);
        const realExpenses = realDirect + realIndirect + realFix + realOoc;

        // Calculate profits
        const budgetProfit = budgetRevenue - budgetDirect - budgetExpenses;
        const realProfit = realRevenue - realExpenses;

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
            ooc: {
                budget: budgetOoc,
                real: realOoc,
                ...calculateDelta(realOoc, budgetOoc),
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