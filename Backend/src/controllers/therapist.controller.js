import * as therapistService from '../services/therapist.service.js';

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
