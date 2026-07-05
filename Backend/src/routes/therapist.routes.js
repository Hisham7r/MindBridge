import { Router } from 'express';
import auth from '../middleware/auth.js';
import * as therapistController from '../controllers/therapist.controller.js';

const router = Router();

// Self-service profile (auth-gated). MUST be declared before '/:id' so "me"
// isn't captured as a therapist id.
router.get('/me', auth, therapistController.getMyProfile);
router.patch('/me', auth, therapistController.updateMyProfile);

router.get('/', therapistController.getTherapists);
router.get('/:id', therapistController.getTherapistById);
router.get('/:id/slots', therapistController.getTherapistSlots);

export default router;
