export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export interface ReviewCreate {
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
}

export interface ReviewUpdate {
  rating?: number
  comment?: string
}