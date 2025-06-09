import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types'; // Import Article type
import { getAzureOpenAIChatCompletion, ChatMessage } from '../services/aiService';

interface ChatPanelProps {
  currentArticle: Article | null;
  articles: Article[]; // Add articles prop
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentArticle, articles }) => {
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
    // Optimistically update UI with user's message *before* API call
    // The `messages` state used later for API call will be the one *before* this update.
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      let systemMessageContent: string | null = null;

      if (currentArticle) {
        // Context: Specific article
        let articleInfo = `用户当前正在查看以下文章：\n标题：${currentArticle.title}\n`;
        if (currentArticle.content) {
          articleInfo += `内容：\n${currentArticle.content.substring(0, 3000)}\n`; // Limit content length
        } else if (currentArticle.summary) {
          articleInfo += `摘要：\n${currentArticle.summary}\n`;
        }
        articleInfo += `\n请优先根据上述文章信息回答用户关于此文章的提问。如果用户的问题与此文章无关，则按常规方式回答。`;
        systemMessageContent = articleInfo;
      } else if (articles && articles.length > 0) {
        // Context: Homepage with list of articles
        let articlesListInfo = '用户当前在他的文章收藏主页。以下是用户收藏的部分文章列表（标题和摘要）：\n\n';
        // Limit to first 10 articles and 150 chars for summary to manage context size
        articles.slice(0, 10).forEach(article => { 
          articlesListInfo += `标题：${article.title}\n`;
          if (article.summary) {
            articlesListInfo += `摘要：${article.summary.substring(0, 150)}...\n`; 
          }
          articlesListInfo += '\n';
        });
        if (articles.length > 10) {
          articlesListInfo += `还有 ${articles.length - 10} 篇其他文章未在此列出。\n`;
        }
        articlesListInfo += `请根据这个列表回答用户关于他收藏的文章的问题。`;
        systemMessageContent = articlesListInfo;
      }

      // Prepare messages for API call
      // `messages` state still holds the chat history *before* the current `newUserMessage` was added for display.
      const messagesToSendToAI: ChatMessage[] = [];
      if (systemMessageContent) {
        messagesToSendToAI.push({ role: 'system', content: systemMessageContent });
      }
      // Add historical messages from state (these do NOT include the latest newUserMessage yet, which is correct for history)
      messages.forEach(msg => messagesToSendToAI.push(msg)); 
      // Add the current user message that triggered this call
      messagesToSendToAI.push(newUserMessage);

      // Send only the last N messages (e.g., 10) to keep the payload reasonable.
      // This now correctly includes the system message, history, and current user message in the slice.
      const finalMessagesForApi = messagesToSendToAI.slice(-10);

      const aiResponseContent = await getAzureOpenAIChatCompletion(finalMessagesForApi);
      const aiResponseMessage: ChatMessage = { role: 'assistant', content: aiResponseContent };
      setMessages(prevMessages => [...prevMessages, aiResponseMessage]);

    } catch (err) {
      console.error("Error from AI service:", err);
      const errorMessage = err instanceof Error ? err.message : '与AI服务通信时发生未知错误。';
      setError(errorMessage);
      // Add an error message to the chat display
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
