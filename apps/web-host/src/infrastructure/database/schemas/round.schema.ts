import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Round document interface for Mongoose
 * This extends Document for Mongoose-specific functionality
 */
export interface RoundDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  cardSize: number;
  minNumber: number;
  maxNumber: number;
  gamePattern: 'linea' | 'columna' | 'diagonal' | 'completo' | 'figura_especial';
  startMode: 'manual' | 'automatico';
  autoStartDelay?: number;
  status: 'configurada' | 'en_progreso' | 'finalizada' | 'cancelada';
  createdBy: mongoose.Types.ObjectId;
  drawnNumbers: number[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Round collection
 * Database-specific concerns (validation, indexes, etc.)
 */
const RoundSchema = new Schema<RoundDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la ronda es requerido'],
      trim: true,
    },
    cardSize: {
      type: Number,
      required: [true, 'El tamano de la carta es requerido'],
      min: [3, 'El tamano minimo es 3'],
      max: [10, 'El tamano maximo es 10'],
    },
    minNumber: {
      type: Number,
      required: [true, 'El numero minimo es requerido'],
      min: [1, 'El numero minimo debe ser al menos 1'],
      default: 1,
    },
    maxNumber: {
      type: Number,
      required: [true, 'El numero maximo es requerido'],
      min: [1, 'El numero maximo debe ser al menos 1'],
    },
    gamePattern: {
      type: String,
      enum: ['linea', 'columna', 'diagonal', 'completo', 'figura_especial'],
      required: [true, 'El patron de juego es requerido'],
    },
    startMode: {
      type: String,
      enum: ['manual', 'automatico'],
      required: [true, 'El modo de inicio es requerido'],
    },
    autoStartDelay: {
      type: Number,
      min: [1, 'El tiempo minimo es 1 segundo'],
    },
    status: {
      type: String,
      enum: ['configurada', 'en_progreso', 'finalizada', 'cancelada'],
      default: 'configurada',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
RoundSchema.pre('save', function () {
  const totalCells = this.cardSize * this.cardSize;
  const availableNumbers = this.maxNumber - this.minNumber + 1;
  if (availableNumbers < totalCells) {
    throw new Error(
      `Debe haber al menos ${totalCells} numeros para una carta de ${this.cardSize}x${this.cardSize}`
    );
  }
});

// Handle hot reload in development
if (mongoose.models.Round) {
  delete mongoose.models.Round;
}

const RoundModel: Model<RoundDocument> = mongoose.model<RoundDocument>('Round', RoundSchema);

export { RoundSchema, RoundModel };
