"""Accommodation Agent - Google Places API Integration

4 Tools:
1. search_accommodations: Search hotels/hostels with Google Places
2. summarize_reviews: AI-powered review summarization
3. compare_booking_prices: Parallel price comparison
4. get_recommended_accommodations: AI personalized recommendations
"""
from .accommodation_agent import agent, AccommodationAgent

__all__ = ['agent', 'AccommodationAgent']
