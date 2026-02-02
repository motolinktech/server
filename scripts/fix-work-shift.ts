import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({
  connectionString: `${process.env.DATABASE_URL}`,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const workShifts = await db.workShiftSlot.findMany({});

  const workShiftWithWrongTimezone = workShifts.filter((ws) => {
    const shiftDate = ws.shiftDate;
    if (!shiftDate) return true;

    const hours = shiftDate.getUTCHours();
    return hours === 0;
  });

  console.log(
    "Workshift with wrong timezone count:",
    workShiftWithWrongTimezone.length,
  );

  for (const ws of workShiftWithWrongTimezone) {
    if (!ws.shiftDate) continue;

    const correctedDate = new Date(ws.shiftDate);
    correctedDate.setUTCHours(correctedDate.getUTCHours() + 3);

    await db.workShiftSlot.update({
      where: { id: ws.id },
      data: { shiftDate: correctedDate },
    });

    console.log(
      `Updated work shift ${ws.id}: ${ws.shiftDate.toISOString()} -> ${correctedDate.toISOString()}`,
    );
  }

  console.log(`Updated ${workShiftWithWrongTimezone.length} work shifts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await db.$disconnect();
    } catch (_e) {
      // ignore
    }
  });
