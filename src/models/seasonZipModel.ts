/**
 * @deprecated SeasonZip is deprecated and unified with Zip. Use Zip from './zipModel' instead.
 */
import { Zip, type IZip } from './zipModel';

export type ISeasonZip = IZip;
export const SeasonZip = Zip;
export default SeasonZip;
