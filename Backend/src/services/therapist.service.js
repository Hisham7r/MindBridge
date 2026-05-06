import prisma from '../config/db.js'

/**
 * Return all active therapists with their specializations and languages.
 * Supports optional filtering by track, specialization, language, and fee range.
 * Phase 2 implementation stub.
 */
export const getAllTherapists = async (filters = {}) => {
  throw new Error('getAllTherapists service not yet implemented')
}

/**
 * Return a single therapist profile by ID, including availability slots.
 * Phase 2 implementation stub.
 */
export const getTherapistById = async (id) => {
  throw new Error('getTherapistById service not yet implemented')
}

/**
 * Return available (unbooked) slots for a given therapist.
 * Phase 2 implementation stub.
 */
export const getAvailableSlots = async (therapistId) => {
  throw new Error('getAvailableSlots service not yet implemented')
}

/**
 * Update a therapist's profile fields.
 * Phase 2 implementation stub.
 */
export const updateTherapistProfile = async (id, data) => {
  throw new Error('updateTherapistProfile service not yet implemented')
}
