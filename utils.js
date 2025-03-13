// utils.js
export function predictNextPeriod(cycles) {
    if (cycles.length < 2) {
        return "Not enough data to predict.";
    }

    const averageCycleLength = calculateCycleLength(cycles);
    const lastPeriodEnd = new Date(cycles[0].endDate);

    if(cycles[0].endDate === null || lastPeriodEnd === null){
        return "now!";
    }

    const nextPeriodStart = new Date(lastPeriodEnd);
    nextPeriodStart.setDate(lastPeriodEnd.getDate() + averageCycleLength);
    const currentDate = new Date();
    const diffTime = Math.abs(nextPeriodStart - currentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export function calculateCycleStats(cycles) {
    if (cycles.length < 2) {
        return {
            avgCycleLength: "Not enough data",
            avgPeriodLength: "Not enough data",
            ovulationWindow: "Not enough data",
            fertileDays: "Not enough data"
        };
    }

    const avgCycleLength = calculateCycleLength(cycles);
    const avgPeriodLength = calculateAveragePeriodLength(cycles);
    const ovulationDay = Math.round(avgCycleLength - 14);
    const ovulationWindow = `Day ${ovulationDay - 2} to Day ${ovulationDay + 2}`;
    const fertileDays = `Day ${ovulationDay - 5} to Day ${ovulationDay + 1}`;

    return {
        avgCycleLength: `${avgCycleLength} days`,
        avgPeriodLength: `${avgPeriodLength} days`,
        ovulationWindow,
        fertileDays
    };
}

export function calculateCycleLength(cycles) {
    if (cycles.length < 2) {
        return "Not enough data to calculate cycle length.";
    }

    let totalDays = 0;
    for (let i = 0; i < cycles.length - 1; i++) {
        const endDate1 = new Date(cycles[i].startDate);
        const startDate2 = new Date(cycles[i + 1].startDate);
        const diffTime = Math.abs(startDate2 - endDate1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
    }

    return Math.round(totalDays / (cycles.length - 1));
}

export function calculateAveragePeriodLength(cycles) {
    if (cycles.length === 0) {
        return "Not enough data to calculate average period length.";
    }

    let totalDays = 0;


    if(cycles[0].endDate === null){
        for(let i = 1; i < cycles.length; i++){
            const startDate = new Date(cycles[i].startDate);
            const endDate = new Date(cycles[i].endDate);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays + 1;
        }
        return Math.round(totalDays / (cycles.length - 1));
    }
    else{
        for (const cycle of cycles) {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays + 1;
        }
        return Math.round(totalDays / cycles.length);
    }
}

export function getCurrentCyclePhase(cycles) {
    if (cycles.length < 1) {
        return "Not enough data to determine cycle phase.";
    }

    const lastPeriodEnd = new Date(cycles[0].endDate);
    const currentDate = new Date();
    const daysSinceLastPeriod = Math.floor((currentDate - lastPeriodEnd) / (1000 * 60 * 60 * 24));

    const averageCycleLength = parseInt(calculateCycleLength(cycles));

    if (daysSinceLastPeriod < 0) {
        return "unknown"; // Invalid data
    } else if (daysSinceLastPeriod <= 5) {
        return "menstrual";
    } else if (daysSinceLastPeriod <= 14) {
        return "follicular";
    } else if (daysSinceLastPeriod <= 16) {
        return "ovulation";
    } else if (daysSinceLastPeriod <= averageCycleLength) {
        return "luteal";
    } else {
        return "unknown"; // Outside the cycle range
    }
}

export function getNutritionTips(cyclePhase) {
    const nutritionTips = {
        follicular: "Focus on iron-rich foods like spinach and lean meats.",
        ovulation: "Increase intake of omega-3 fatty acids like salmon and flaxseeds.",
        luteal: "Eat magnesium-rich foods like nuts and dark chocolate.",
        menstrual: "Stay hydrated and consume calcium-rich foods like yogurt."
    };
    return nutritionTips[cyclePhase] || "No specific tips for this phase.";
}