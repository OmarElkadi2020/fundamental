import unittest
from unittest.mock import patch, MagicMock

from langchain_core.messages import HumanMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import SecretStr

from backend.core.use_cases.gemini_llm import GeminiCustomLLM


class TestGeminiCustomLLM(unittest.TestCase):
    @patch("backend.core.use_cases.gemini_llm.ChatGoogleGenerativeAI")
    def test_generate(self, mock_chat_google_genai):
        # Arrange
        mock_llm_instance = MagicMock()
        mock_chat_google_genai.return_value = mock_llm_instance

        expected_chat_result = ChatResult(
            generations=[
                ChatGeneration(message=HumanMessage(content="Test response"))
            ]
        )
        mock_llm_instance.generate.return_value = expected_chat_result

        llm = GeminiCustomLLM(model_name="gemini-2.5-pro")
        messages = [HumanMessage(content="Test prompt")]

        # Act
        result = llm._generate(messages)

        # Assert
        mock_chat_google_genai.assert_called_once_with(model="gemini-2.5-pro", api_key=SecretStr("AIzaSyCnsGV1PaEQ5yAW3ySwaFCoYRZTvsMPX7g"))
        mock_llm_instance.generate.assert_called_once_with([messages], stop=None)
        self.assertEqual(result, expected_chat_result)

    @patch("backend.core.use_cases.gemini_llm.ChatGoogleGenerativeAI")
    def test_llm_type(self, mock_chat_google_genai):
        # Arrange
        llm = GeminiCustomLLM()

        # Act
        llm_type = llm._llm_type

        # Assert
        self.assertEqual(llm_type, "gemini_custom_llm")


if __name__ == "__main__":
    unittest.main()
