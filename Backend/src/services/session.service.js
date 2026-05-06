import prisma from '../config/db.js'

/**
 * Book a session for a patient with a specific therapist slot.
 * Marks the slot as isBooked = true, creates the Session record.
 * Phase 2 implementation stub.
 */
export const createSession = async ({ patientId, therapistId, slotId, sessionType }) => {
  throw new Error('createSession service not yet implemented')
}

/**
 * Return a single session by ID, including patient, therapist, and payment data.
 * Phase 2 implementation stub.
 */
export const getSessionById = async (id) => {
  throw new Error('getSessionById service not yet implemented')
}

/**
 * Update a session's status (e.g. CONFIRMED, COMPLETED, CANCELLED).
 * Phase 2 implementation stub.
 */
export const updateStatus = async (id, status) => {
  throw new Error('updateStatus service not yet implemented')
}

/**
 * Return all sessions for a given patient.
 * Phase 2 implementation stub.
 */
export const getSessionsByPatient = async (patientId) => {
  throw new Error('getSessionsByPatient service not yet implemented')
}
