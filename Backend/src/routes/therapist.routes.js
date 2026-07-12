import { Router } from 'express';
import auth from '../middleware/auth.js';
import * as therapistController from '../controllers/therapist.controller.js';

const router = Router();

// Self-service profile + availability (auth-gated). MUST be declared before
// '/:id' so "me" isn't captured as a therapist id.
router.get('/me', auth, therapistController.getMyProfile);
router.patch('/me', auth, therapistController.updateMyProfile);
router.get('/me/availability', auth, therapistController.getMyAvailability);
router.put('/me/availability', auth, therapistController.updateMyAvailability);

router.get('/', therapistController.getTherapists);
router.get('/:id', therapistController.getTherapistById);
router.get('/:id/slots', therapistController.getTherapistSlots);

export default router;
