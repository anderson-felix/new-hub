import { IDailyChallenge } from '../challenges';
import { HistoryDataType } from '../shared';
import { IStoreCart } from '../store';

export interface IHubUserMetadata {
  engagement?: HistoryDataType;
  xp?: HistoryDataType;
  redefine_password?: boolean;
  last_access?: number;
  first_access?: number;
  coins?: number;
  kanban?: string;
  daily_challenges?: IDailyChallenge;
  cart?: Record<string, IStoreCart[]>;
  store_interests?: string[];
  chosen_school_group_id?: string | null;
  streak?: number;
  accesses?: number;
  avatar?: any;
  avatar_config?: any;
  unlocked_avatar_items?: string[];
  [key: string]: any;
}
