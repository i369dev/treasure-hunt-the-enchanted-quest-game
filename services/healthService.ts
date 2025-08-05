
import { User } from '../types';

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (years) + s
 * where s is +5 for males and -161 for females.
 *
 * This is the energy expenditure for a person at rest.
 *
 * @param user The user object containing necessary profile data (weight, height, age, gender).
 * @returns The calculated BMR as a number (calories per day), or null if essential data is missing or invalid.
 */
export const calculateBMR = (user: User): number | null => {
    const { weight, height, age, gender } = user;

    // The Mifflin-St Jeor equation requires weight, height, age, and a binary gender.
    // If any are missing or invalid, we cannot perform the calculation accurately.
    if (!weight || !height || !age || !gender || (gender !== 'Male' && gender !== 'Female')) {
        return null;
    }

    const ageNum = parseInt(age, 10);
    // Ensure age is a valid positive number.
    if (isNaN(ageNum) || ageNum <= 0) {
        return null;
    }
    
    // 's' is the gender-specific factor in the equation.
    const s = gender === 'Male' ? 5 : -161;

    const bmr = (10 * weight) + (6.25 * height) - (5 * ageNum) + s;

    // BMR should be a positive value.
    return bmr > 0 ? bmr : null;
};
