export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  user_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  total_votes: number;
}

export interface PollOption {
  id: string;
  option_text: string;
  votes?: number;
  percentage?: number;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
}

export interface VoteData {
  pollId: string;
  optionId: string;
}

export interface PollResult {
  poll: Poll;
  userVote?: string;
  hasVoted: boolean;
}
