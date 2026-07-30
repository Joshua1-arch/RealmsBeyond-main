/**
 * shipping.ts
 *
 * Utility helpers for the shipping flow.
 * Real shipping rates are now fetched from Shipbubble (lib/shipbubble.ts).
 * This file only retains lightweight UI helpers.
 */

/**
 * List of Nigerian states for the shipping address form dropdown.
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
].map(name => ({ name }));

/**
 * Calculates volumetric weight from LxWxH dimension string.
 * Standard courier divisor: 5000.
 * Used to pass accurate parcel data to Shipbubble.
 */
export const calculateVolumetricWeight = (dimensions?: string): number => {
  if (!dimensions || typeof dimensions !== 'string') return 0;
  const parts = dimensions.toLowerCase().split('x').map(p => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  return (parts[0] * parts[1] * parts[2]) / 5000;
};

/**
 * Calculates actual and volumetric weights for a set of order items.
 * These values are passed to Shipbubble when requesting rates.
 */
export const calculateOrderWeights = (
  items: { weight?: string; dimensions?: string; quantity: number }[]
) => {
  let totalActualWeight = 0;
  let totalVolumetricWeight = 0;

  items.forEach(item => {
    const qty = item.quantity || 1;
    const weight = parseFloat(item.weight || '0') || 0;
    const volWeight = calculateVolumetricWeight(item.dimensions);

    totalActualWeight += weight * qty;
    totalVolumetricWeight += volWeight * qty;
  });

  return { totalActualWeight, totalVolumetricWeight };
};
