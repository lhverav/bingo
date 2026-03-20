import { GeneralParameters, UpdateGeneralParametersData, DEFAULT_GENERAL_PARAMETERS } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { GeneralParametersModel } from '../database/schemas/generalParameters.schema';
import { GeneralParametersMapper } from '../database/mappers/generalParameters.mapper';

/**
 * Repository for GeneralParameters entity
 * Handles all database operations for general parameters
 * Note: There is only one GeneralParameters document in the database
 */
export class GeneralParametersRepository {
  /**
   * Get the general parameters (singleton document)
   * Creates with defaults if doesn't exist
   */
  async get(): Promise<GeneralParameters> {
    await connectToDatabase();
    let doc = await GeneralParametersModel.findOne();

    if (!doc) {
      // Create default parameters if none exist
      doc = await GeneralParametersModel.create(DEFAULT_GENERAL_PARAMETERS);
    }

    return GeneralParametersMapper.toDomain(doc);
  }

  /**
   * Update general parameters
   */
  async update(data: UpdateGeneralParametersData): Promise<GeneralParameters> {
    await connectToDatabase();
    const dbData = GeneralParametersMapper.toUpdateDatabase(data);

    const doc = await GeneralParametersModel.findOneAndUpdate(
      {},
      dbData,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return GeneralParametersMapper.toDomain(doc!);
  }

  /**
   * Reset to default parameters
   */
  async reset(): Promise<GeneralParameters> {
    await connectToDatabase();
    const doc = await GeneralParametersModel.findOneAndUpdate(
      {},
      DEFAULT_GENERAL_PARAMETERS,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return GeneralParametersMapper.toDomain(doc!);
  }
}

// Singleton instance for convenience
export const generalParametersRepository = new GeneralParametersRepository();
