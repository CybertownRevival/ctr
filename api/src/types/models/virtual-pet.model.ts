import { Model } from './model';

/** Defines an Club-Member object as stored in the db */
export interface VirtualPet extends Model {
  place_id: number;
  pet_name: string;
  pet_avatar_url: string;
  active: boolean;
  pet_voice_id: number;
  pet_behaviours: string;
}
