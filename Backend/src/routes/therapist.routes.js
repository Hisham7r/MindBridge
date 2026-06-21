import { Router } from 'express';
import * as therapistController from '../controllers/therapist.controller.js';

const router = Router();

router.get('/', therapistController.getTherapists);
router.get('/:id', therapistController.getTherapistById);
router.get('/:id/slots', therapistController.getTherapistSlots);

export default router;
