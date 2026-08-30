import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Utility helper to normalize registration numbers (e.g. "dl 01-ab 1234" -> "DL01AB1234")
export const normalizeRegNumber = (reg?: string | string[] | null): string => {
  if (!reg) return '';
  const str = Array.isArray(reg) ? reg[0] : reg;
  return (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const vehicleSchema = z.object({
  registrationNumber: z.string().min(4).transform((val) => normalizeRegNumber(val)),
  vehicleType: z.enum(['car', 'two_wheeler', 'commercial']),
  make: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  registrationYear: z.number().int().min(1900).max(2100).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).optional(),
  engineNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  ncbPercentage: z.number().min(0).max(50).optional()
});

// GET /api/vehicles - List all vehicles for authenticated user
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        policies: {
          select: {
            id: true,
            policyNumber: true,
            type: true,
            provider: true,
            sumInsured: true,
            premium: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        quotes: {
          select: {
            id: true,
            type: true,
            status: true,
            stage: true,
            createdAt: true
          }
        }
      }
    });

    res.json({ vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/lookup/:registrationNumber - Quick lookup vehicle & policies by registration number
router.get('/lookup/:registrationNumber', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const regParam = normalizeRegNumber(req.params.registrationNumber as string);
    if (!regParam) {
      res.status(400).json({ error: 'Valid vehicle registration number is required' });
      return;
    }

    const currentUserId = req.userId;

    // 1. Search in saved Vehicles model
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        registrationNumber: {
          contains: regParam
        }
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true }
        }
      }
    });

    const isOwner = Boolean(currentUserId && vehicle && vehicle.userId === currentUserId);

    // 2. Fetch matching vehicle policies (only for owner)
    const policies = isOwner ? await prisma.policy.findMany({
      where: {
        userId: currentUserId!,
        OR: [
          { registrationNumber: { contains: regParam } },
          ...(vehicle ? [{ vehicleId: vehicle.id }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        claims: true,
        renewal: true
      }
    }) : [];

    // 3. Fetch matching vehicle quotes (only for owner)
    const quotes = isOwner ? await prisma.quote.findMany({
      where: {
        userId: currentUserId!,
        OR: [
          { registrationNumber: { contains: regParam } },
          ...(vehicle ? [{ vehicleId: vehicle.id }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    }) : [];

    // Strip sensitive user info if not owner
    let safeVehicle: any = null;
    if (vehicle) {
      if (isOwner) {
        safeVehicle = vehicle;
      } else {
        const { user: _ownerUser, ...vehiclePublicDetails } = vehicle;
        safeVehicle = vehiclePublicDetails;
      }
    }

    res.json({
      registrationNumber: regParam,
      vehicleFound: Boolean(vehicle),
      vehicle: safeVehicle,
      policiesCount: policies.length,
      policies,
      quotesCount: quotes.length,
      quotes
    });
  } catch (error) {
    console.error('Error looking up vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/rc-fetch/:registrationNumber - mParivahan Vehicle Details Fetcher
router.get('/rc-fetch/:registrationNumber', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawReg = String(req.params.registrationNumber || '');
    const regParam = normalizeRegNumber(rawReg);

    if (!regParam || regParam.length < 4) {
      res.status(400).json({ error: 'Valid Indian vehicle registration number (e.g. MH02CB1234, DL01AB1234) is required.' });
      return;
    }

    const { getVehicleRcDetails } = await import('../lib/mparivahan');
    const rcDetails = await getVehicleRcDetails(regParam);

    let vehicle = null;
    try {
      vehicle = await prisma.vehicle.findUnique({
        where: { registrationNumber: regParam },
      });

      const userId = req.userId || null;
      if (!vehicle && userId) {
        vehicle = await prisma.vehicle.create({
          data: {
            registrationNumber: regParam,
            vehicleType: rcDetails.vehicleType,
            make: rcDetails.make,
            model: rcDetails.model,
            variant: rcDetails.variant,
            registrationYear: rcDetails.registrationYear,
            fuelType: rcDetails.fuelType,
            engineNumber: rcDetails.engineNumber,
            chassisNumber: rcDetails.chassisNumber,
            userId,
          },
        });
      }
    } catch {
      // Non-fatal if DB is offline
    }

    res.json({
      success: true,
      registrationNumber: regParam,
      rcDetails,
      savedVehicle: vehicle,
    });
  } catch (error) {
    console.error('Error fetching mParivahan vehicle details:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details from mParivahan' });
  }
});

// POST /api/vehicles - Register or update a vehicle
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const payload = vehicleSchema.parse(req.body);

    // Upsert vehicle by registrationNumber
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: payload.registrationNumber },
      update: {
        vehicleType: payload.vehicleType,
        make: payload.make ?? null,
        model: payload.model ?? null,
        variant: payload.variant ?? null,
        registrationYear: payload.registrationYear ?? null,
        fuelType: payload.fuelType ?? null,
        engineNumber: payload.engineNumber ?? null,
        chassisNumber: payload.chassisNumber ?? null,
        ncbPercentage: payload.ncbPercentage ?? null,
        userId
      },
      create: {
        registrationNumber: payload.registrationNumber,
        vehicleType: payload.vehicleType,
        make: payload.make ?? null,
        model: payload.model ?? null,
        variant: payload.variant ?? null,
        registrationYear: payload.registrationYear ?? null,
        fuelType: payload.fuelType ?? null,
        engineNumber: payload.engineNumber ?? null,
        chassisNumber: payload.chassisNumber ?? null,
        ncbPercentage: payload.ncbPercentage ?? 0,
        userId
      }
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid vehicle data' });
      return;
    }
    console.error('Error saving vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
