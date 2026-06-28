// services/messageService.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class MessageService {
  // Send a new message
  static async sendMessage(data) {
    try {
      const response = await axios.post(`${API_URL}/messages`, data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error.response?.data || error.message;
    }
  }

  // Get chat history between two users
  static async getChatHistory(userId, otherUserId, limit = 50, skip = 0) {
    try {
      const response = await axios.get(`${API_URL}/messages`, {
        params: { userId, otherUserId, limit, skip }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error.response?.data || error.message;
    }
  }

  // Mark message as read
  static async markAsRead(messageId, userId) {
    try {
      const response = await axios.put(`${API_URL}/messages`, {
        messageId,
        userId,
        action: 'read'
      });
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error.response?.data || error.message;
    }
  }

  // Mark message as delivered
  static async markAsDelivered(messageId, userId) {
    try {
      const response = await axios.put(`${API_URL}/messages`, {
        messageId,
        userId,
        action: 'delivered'
      });
      return response.data;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw error.response?.data || error.message;
    }
  }

  // Delete message
  static async deleteMessage(messageId, userId, deleteForEveryone = false) {
    try {
      const response = await axios.delete(`${API_URL}/messages`, {
        params: { messageId, userId, deleteForEveryone }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error.response?.data || error.message;
    }
  }

  // Get unread message count
  static async getUnreadCount(userId) {
    try {
      const response = await axios.get(`${API_URL}/messages/unread`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error.response?.data || error.message;
    }
  }

  // Search messages
  static async searchMessages(userId, searchTerm) {
    try {
      const response = await axios.get(`${API_URL}/messages/search`, {
        params: { userId, searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error.response?.data || error.message;
    }
  }
} 

export default MessageService;