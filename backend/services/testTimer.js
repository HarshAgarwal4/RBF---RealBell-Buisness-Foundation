import TestAttemptModel from '../App/models/testAttempt.js';
import TestModel from '../App/models/test.js';
import { evaluateAttempt } from './testEvaluator.js';

/**
 * Calculate the server deadline for a test attempt
 * @param {Number} durationMinutes - Test duration in minutes
 * @returns {Date} - The deadline timestamp
 */
export function calculateDeadline(durationMinutes) {
  return new Date(Date.now() + durationMinutes * 60 * 1000);
}

/**
 * Check if a test attempt has expired
 * @param {Date} serverDeadline - The attempt's server deadline
 * @returns {Boolean}
 */
export function isExpired(serverDeadline) {
  return new Date() > new Date(serverDeadline);
}

/**
 * Get remaining time in seconds for an attempt
 * @param {Date} serverDeadline
 * @returns {Number} - Remaining seconds (0 if expired)
 */
export function getRemainingSeconds(serverDeadline) {
  const remaining = Math.max(0, Math.floor((new Date(serverDeadline).getTime() - Date.now()) / 1000));
  return remaining;
}

/**
 * Auto-expire stale in_progress attempts.
 * Called periodically or on relevant API calls.
 * Finds all TestAttempt documents with status 'in_progress' and serverDeadline < now,
 * updates them to status 'timed_out', runs evaluation, and returns count.
 */
export async function expireStaleAttempts() {
  const now = new Date();
  const staleAttempts = await TestAttemptModel.find({
    status: 'in_progress',
    serverDeadline: { $lt: now }
  });

  let count = 0;
  for (const attempt of staleAttempts) {
    attempt.status = 'timed_out';
    const test = await TestModel.findById(attempt.test).populate('questions');
    if (test) {
      await evaluateAttempt(attempt, test);
    }
    await attempt.save();
    count++;
  }
  return count;
}
