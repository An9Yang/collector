import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types'; // Import Article type
import { getAzureOpenAIChatCompletion, ChatMessage } from '../services/aiService';

interface ChatPanelProps {
  currentArticle: Article | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentArticle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Optional: Add a welcome message or initial system message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: '您好！我是您的文章助手，请问有什么可以帮助您的吗？例如，您可以问我：“总结一下最近的文章”或“分析一下当前文章的主要观点”。'
      }
    ]);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (userInput.trim() === '' || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: userInput.trim() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for the API call - include history
      let newMessages: ChatMessage[] = [...messages, newUserMessage];

      if (currentArticle) {
        let articleInfo = `用户当前正在查看以下文章：\n标题：${currentArticle.title}\n`;
        if (currentArticle.content) {
          articleInfo += `内容：\n${currentArticle.content.substring(0, 3000)}\n`; // Limit content length for context
        } else if (currentArticle.summary) {
          articleInfo += `摘要：\n${currentArticle.summary}\n`;
        }
        articleInfo += `\n请优先根据上述文章信息回答用户关于此文章的提问。如果用户的问题与此文章无关，则按常规方式回答。`;

        const articleContextMessage: ChatMessage = {
          role: 'system',
          content: articleInfo
        };
        // Prepend system message with article context
        // Ensure not to duplicate system messages if one already exists from previous turns for the same article (more advanced)
        // For now, we'll prepend it to the current turn's messages being sent.
        // A more robust approach might involve managing system messages in the chat history.
        newMessages = [articleContextMessage, ...messages, newUserMessage];
      }
      const messagesToSend = newMessages.slice(-10); // Send last 10 messages including new user message and potential system message
      const aiResponseContent = await getAzureOpenAIChatCompletion(messagesToSend);
      const aiResponseMessage: ChatMessage = { role: 'assistant', content: aiResponseContent };
      setMessages(prevMessages => [...prevMessages, aiResponseMessage]);
    } catch (err) {
      console.error("Error from AI service:", err);
      const errorMessage = err instanceof Error ? err.message : '与AI服务通信时发生未知错误。';
      setError(errorMessage);
      // Optionally add an error message to the chat
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `抱歉，我遇到了一些麻烦: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line on Enter
      handleSendMessage();
    }
  };
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700">
      <div className="flex-grow mb-4 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${ 
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg max-w-xs">
              思考中...
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-xs" role="alert">
              <strong className="font-bold">错误: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-auto">
        <textarea
          placeholder={isLoading ? "AI 正在思考中..." : "发送消息... (例如，总结这篇文章)"}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
          rows={3}
          value={userInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={isLoading || userInput.trim() === ''}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
