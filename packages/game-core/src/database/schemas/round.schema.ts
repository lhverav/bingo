import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface RoundDocument extends Document {
  // New structure fields
  gameId?: Types.ObjectId;
  order?: number;
  patternId?: Types.ObjectId;

  // Common fields
  name: string;
  status: 'configurada' | 'en_progreso' | 'finalizada' | 'cancelada';
  drawnNumbers: number[];
  createdAt: Date;
  updatedAt: Date;

  // Legacy fields (kept for backward compatibility)
  cardSize?: number;
  minNumber?: number;
  maxNumber?: number;
  gamePattern?: 'linea' | 'columna' | 'diagonal' | 'completo' | 'figura_especial';
  startMode?: 'manual' | 'automatico';
  autoStartDelay?: number;
  createdBy?: Types.ObjectId;
  cardBunchId?: Types.ObjectId;
  cardDelivery?: {
    selectionTimeSeconds: number;
    freeCardsDelivered: number;
    freeCardsToSelect: number;
    freeCardsOnTimeout: number;
  };
}

const RoundSchema = new Schema<RoundDocument>(
  {
    // New structure fields
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
    },
    order: {
      type: Number,
      min: [1, 'El orden debe ser al menos 1'],
    },
    patternId: {
      type: Schema.Types.ObjectId,
      ref: 'Pattern',
    },

    // Common fields
    name: {
      type: String,
      required: [true, 'El nombre de la ronda es requerido'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['configurada', 'en_progreso', 'finalizada', 'cancelada'],
      default: 'configurada',
    },
    drawnNumbers: {
      type: [Number],
      default: [],
    },

    // Legacy fields (kept for backward compatibility)
    cardSize: {
      type: Number,
      min: [3, 'El tamano minimo es 3'],
      max: [10, 'El tamano maximo es 10'],
    },
    minNumber: {
      type: Number,
      min: [1, 'El numero minimo debe ser al menos 1'],
    },
    maxNumber: {
      type: Number,
      min: [1, 'El numero maximo debe ser al menos 1'],
    },
    gamePattern: {
      type: String,
      enum: ['linea', 'columna', 'diagonal', 'completo', 'figura_especial'],
    },
    startMode: {
      type: String,
      enum: ['manual', 'automatico'],
    },
    autoStartDelay: {
      type: Number,
      min: [1, 'El tiempo minimo es 1 segundo'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cardBunchId: {
      type: Schema.Types.ObjectId,
      ref: 'CardBunch',
    },
    cardDelivery: {
      selectionTimeSeconds: {
        type: Number,
        min: [10, 'El tiempo minimo de seleccion es 10 segundos'],
      },
      freeCardsDelivered: {
        type: Number,
        min: [1, 'Debe entregar al menos 1 carton'],
      },
      freeCardsToSelect: {
        type: Number,
        min: [1, 'El jugador debe seleccionar al menos 1 carton'],
      },
      freeCardsOnTimeout: {
        type: Number,
        min: [1, 'Debe entregar al menos 1 carton en timeout'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for new structure
RoundSchema.index({ gameId: 1, order: 1 });
RoundSchema.index({ patternId: 1 });

// Legacy validation (only if using legacy fields)
RoundSchema.pre('save', function () {
  // Only validate legacy fields if they exist
  if (this.cardSize && this.minNumber !== undefined && this.maxNumber !== undefined) {
    const totalCells = this.cardSize * this.cardSize;
    const availableNumbers = this.maxNumber - this.minNumber + 1;
    if (availableNumbers < totalCells) {
      throw new Error(
        `Debe haber al menos ${totalCells} numeros para una carta de ${this.cardSize}x${this.cardSize}`
      );
    }
  }
});

const RoundModel: Model<RoundDocument> =
  mongoose.models.Round || mongoose.model<RoundDocument>('Round', RoundSchema);

export { RoundSchema, RoundModel };
