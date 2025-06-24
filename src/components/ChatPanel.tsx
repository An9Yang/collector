import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types'; // Import Article type
import { getAzureOpenAIChatCompletion, ChatMessage } from '../services/aiService';
import { MessageCircle, RotateCcw, Settings } from 'lucide-react';

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
        content: '您好！我是您的文章助手，请问有什么可以帮助您的吗？例如，您可以问我："总结一下最近的文章"或"分析一下当前文章的主要观点"。'
      }
    ]);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。有什么可以帮助您的吗？'
      }
    ]);
    setError(null);
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
          articleInfo += `内容：\n${currentArticle.content}\n`; // 解除内容长度限制
        } else if (currentArticle.summary) {
          articleInfo += `摘要：\n${currentArticle.summary}\n`;
        }
        articleInfo += `\n请优先根据上述文章信息回答用户关于此文章的提问。如果用户的问题与此文章无关，则按常规方式回答。`;
        systemMessageContent = articleInfo;
      } else if (articles && articles.length > 0) {
        // Context: Homepage with list of articles
        let articlesListInfo = '用户当前在他的文章收藏主页。以下是用户收藏的部分文章列表（标题和摘要）：\n\n';
        // 解除文章数量和摘要长度限制
        articles.forEach(article => { 
          articlesListInfo += `标题：${article.title}\n`;
          if (article.summary) {
            articlesListInfo += `摘要：${article.summary}\n`; // 解除摘要长度限制
          }
          articlesListInfo += '\n';
        });
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

      // 解除历史消息数量限制，发送所有消息
      // 注意：这可能会增加API调用成本，但提供完整的上下文
      const finalMessagesForApi = messagesToSendToAI;

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
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Chat Panel Header */}
      <header className="h-[73px] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 助手
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentArticle ? '文章分析模式' : '收藏分析模式'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="清空对话"
          >
            <RotateCcw size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="设置"
          >
            <Settings size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${ 
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>思考中...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg max-w-xs" role="alert">
              <strong className="font-bold">错误: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <textarea
          placeholder={isLoading ? "AI 正在思考中..." : "发送消息... (例如，总结这篇文章)"}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 resize-none text-sm"
          rows={3}
          value={userInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
