import * as therapistService from '../services/therapist.service.js';
import { updateTherapistSchema } from '../validators/therapist.validator.js';

export async function getMyProfile(req, res, next) {
  try {
    const therapist = await therapistService.getMyProfile(req.user.id);
    res.json({ therapist });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const parsed = updateTherapistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const therapist = await therapistService.updateMyProfile(req.user.id, parsed.data);
    res.json({ message: 'Profile updated successfully.', therapist });
  } catch (err) {
    next(err);
  }
}

export async function getTherapists(req, res, next) {
  try {
    const therapists = await therapistService.getTherapists(req.query);
    res.json({ therapists });
  } catch (err) {
    next(err);
  }
}

export async function getTherapistById(req, res, next) {
  try {
    const therapist = await therapistService.getTherapistById(req.params.id);
    res.json({ therapist });
  } catch (err) {
    next(err);
  }
}

export async function getTherapistSlots(req, res, next) {
  try {
    const slots = await therapistService.getTherapistSlots(
      req.params.id,
      req.query.date
    );
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}
