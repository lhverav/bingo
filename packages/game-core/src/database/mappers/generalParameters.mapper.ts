import { GeneralParameters, UpdateGeneralParametersData } from '@bingo/domain';
import { GeneralParametersDocument } from '../schemas/generalParameters.schema';

/**
 * Mapper for GeneralParameters entity <-> GeneralParametersDocument conversion
 * Handles translation between domain and database layers
 */
export class GeneralParametersMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: GeneralParametersDocument): GeneralParameters {
    return {
      id: doc._id.toString(),
      selectionTimeSeconds: doc.selectionTimeSeconds,
      freeCardsDelivered: doc.freeCardsDelivered,
      freeCardsToSelect: doc.freeCardsToSelect,
      maxCardsToBuy: doc.maxCardsToBuy,
      paidCardsToIssue: doc.paidCardsToIssue,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdateGeneralParametersData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.selectionTimeSeconds !== undefined) update.selectionTimeSeconds = data.selectionTimeSeconds;
    if (data.freeCardsDelivered !== undefined) update.freeCardsDelivered = data.freeCardsDelivered;
    if (data.freeCardsToSelect !== undefined) update.freeCardsToSelect = data.freeCardsToSelect;
    if (data.maxCardsToBuy !== undefined) update.maxCardsToBuy = data.maxCardsToBuy;
    if (data.paidCardsToIssue !== undefined) update.paidCardsToIssue = data.paidCardsToIssue;

    return update;
  }
}
