"""
Custom Gemini LLM for local_deep_research integration.
"""

import os
from typing import Any, List, Optional

from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatResult, LLMResult
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseChatModel
# Flatten the list of generations
from langchain_core.outputs import ChatGeneration

from typing_extensions import override
from pydantic import SecretStr
from .env import GEMINI_API_KEY

API_KEY = SecretStr(GEMINI_API_KEY)

class GeminiCustomLLM(BaseChatModel):
    """
    A custom LangChain wrapper for Google's Gemini models.
    """
    model_name: str = "gemini-2.5-pro"
    os.environ["GOOGLE_API_KEY"] = API_KEY.get_secret_value()

    def __init__(self, model_name: str = "gemini-2.5-pro", **kwargs: Any):
        super().__init__(name=model_name, **kwargs)
        self.model_name = model_name
        self._llm = ChatGoogleGenerativeAI(
            model=self.model_name, api_key=API_KEY, **kwargs
        )
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """
        The main method that gets called to generate a response.
        """
        chat_result: LLMResult = self._llm.generate([messages], stop=stop, **kwargs)
        generations_nested = chat_result.generations  # This is a list of lists
        generations = [
            gen for sublist in generations_nested for gen in sublist if isinstance(gen, ChatGeneration)
        ]
        return ChatResult(generations=generations)

    @property
    def _llm_type(self) -> str:
        """Return the type of LLM."""
        return "custom_llm"
