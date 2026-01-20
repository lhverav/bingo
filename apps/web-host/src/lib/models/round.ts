import mongoose, { Schema, Document, Model } from "mongoose";

export type GamePattern = "linea" | "columna" | "diagonal" | "completo" | "figura_especial";
export type StartMode = "manual" | "automatico";
export type RoundStatus = "configurada" | "en_progreso" | "finalizada";

export interface IRound {
  name: string;
  cardSize: number;
  maxNumber: number;
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number; // in seconds, only if startMode is "automatico"
  status: RoundStatus;
  createdBy: mongoose.Types.ObjectId;
  drawnNumbers: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoundDocument extends IRound, Document {}

const RoundSchema = new Schema<IRoundDocument>(
  {
    name: {
      type: String,
      required: [true, "El nombre de la ronda es requerido"],
      trim: true,
    },
    cardSize: {
      type: Number,
      required: [true, "El tamaño de la carta es requerido"],
      min: [3, "El tamaño mínimo es 3"],
      max: [10, "El tamaño máximo es 10"],
    },
    maxNumber: {
      type: Number,
      required: [true, "El número máximo es requerido"],
      min: [1, "El número máximo debe ser al menos 1"],
    },
    gamePattern: {
      type: String,
      enum: ["linea", "columna", "diagonal", "completo", "figura_especial"],
      required: [true, "El patrón de juego es requerido"],
    },
    startMode: {
      type: String,
      enum: ["manual", "automatico"],
      required: [true, "El modo de inicio es requerido"],
    },
    autoStartDelay: {
      type: Number,
      min: [1, "El tiempo mínimo es 1 segundo"],
    },
    status: {
      type: String,
      enum: ["configurada", "en_progreso", "finalizada"],
      default: "configurada",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drawnNumbers: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Validation: ensure we have enough numbers for the card
RoundSchema.pre("save", function () {
  const totalCells = this.cardSize * this.cardSize;
  if (this.maxNumber < totalCells) {
   throw new Error(`Debe haber al menos ${totalCells} números para una carta de       
  ${this.cardSize}x${this.cardSize}`);
}
});

// Delete cached model if it exists (for hot reload)
if (mongoose.models.Round) {
  delete mongoose.models.Round;
}

const Round: Model<IRoundDocument> = mongoose.model<IRoundDocument>("Round", RoundSchema);

export default Round;
