"""Persona Agent - User Persona CRUD Management

4 Tools:
1. create_persona: Create user travel persona
2. get_persona: Read persona from database
3. update_persona: Update persona preferences
4. delete_persona: Delete persona

Database: SQLAlchemy integration
"""
from .persona_agent import agent, PersonaAgent

__all__ = ['agent', 'PersonaAgent']
