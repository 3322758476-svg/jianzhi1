import { supabase } from '@/lib/supabase'
import type { Review, ReviewCreate, ReviewUpdate } from '@/types/review'

export const reviewRepository = {
  // 获取评价
  async getReview(reviewId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建评价
  async createReview(reviewData: ReviewCreate): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新评价
  async updateReview(reviewId: string, updates: ReviewUpdate): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 获取用户收到的评价
  async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        jobs (*)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 获取用户给出的评价
  async getUserGivenReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        jobs (*)
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}