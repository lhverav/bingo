import { connectToDatabase } from "@/lib/mongodb";
import Round, { IRoundDocument, GamePattern, StartMode } from "@/lib/models/round";

export interface CreateRoundData {
  name: string;
  cardSize: number;
  maxNumber: number;
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number;
  createdBy: string;
}

export interface UpdateRoundData {
  name?: string;
  cardSize?: number;
  maxNumber?: number;
  gamePattern?: GamePattern;
  startMode?: StartMode;
  autoStartDelay?: number;
}

export async function createRound(data: CreateRoundData): Promise<IRoundDocument> {
  await connectToDatabase();

  const round = await Round.create({
    ...data,
    status: "configurada",
    drawnNumbers: [],
  });

  return round;
}

export async function getRoundsByUser(userId: string): Promise<IRoundDocument[]> {
  await connectToDatabase();
  return Round.find({ createdBy: userId }).sort({ createdAt: -1 });
}

export async function getAllRounds(): Promise<IRoundDocument[]> {
  await connectToDatabase();
  return Round.find().sort({ createdAt: -1 });
}

export async function getRoundById(id: string): Promise<IRoundDocument | null> {
  await connectToDatabase();
  return Round.findById(id);
}

export async function updateRound(
  id: string,
  data: UpdateRoundData
): Promise<IRoundDocument | null> {
  await connectToDatabase();

  const round = await Round.findById(id);
  if (!round) return null;

  // Only allow editing if round is in "configurada" status
  if (round.status !== "configurada") {
    throw new Error("Solo se pueden editar rondas que no han iniciado");
  }

  return Round.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export async function deleteRound(id: string): Promise<boolean> {
  await connectToDatabase();

  const round = await Round.findById(id);
  if (!round) return false;

  // Only allow deleting if round is in "configurada" status
  if (round.status !== "configurada") {
    throw new Error("Solo se pueden eliminar rondas que no han iniciado");
  }

  await Round.findByIdAndDelete(id);
  return true;
}

export async function startRound(id: string): Promise<IRoundDocument | null> {
  await connectToDatabase();

  const round = await Round.findById(id);
  if (!round) return null;

  if (round.status !== "configurada") {
    throw new Error("Esta ronda ya ha sido iniciada o finalizada");
  }

  return Round.findByIdAndUpdate(
    id,
    { status: "en_progreso" },
    { new: true }
  );
}

export async function endRound(id: string): Promise<IRoundDocument | null> {
  await connectToDatabase();

  return Round.findByIdAndUpdate(
    id,
    { status: "finalizada" },
    { new: true }
  );
}

export async function drawNumber(id: string, number: number): Promise<IRoundDocument | null> {
  await connectToDatabase();

  const round = await Round.findById(id);
  if (!round) return null;

  if (round.status !== "en_progreso") {
    throw new Error("La ronda no está en progreso");
  }

  if (number < 1 || number > round.maxNumber) {
    throw new Error("El número está fuera del rango permitido");
  }

  if (round.drawnNumbers.includes(number)) {
    throw new Error("Este número ya ha sido sacado");
  }

  return Round.findByIdAndUpdate(
    id,
    { $push: { drawnNumbers: number } },
    { new: true }
  );
}
