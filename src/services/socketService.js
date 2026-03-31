import { io } from 'socket.io-client';

let socket = null;
let queuedEmits = [];
let currentRestaurantId = null;

const playNotificationSound = () => {
  new Audio('/notification.mp3').play().catch(error => {
    console.log("Audio playback was blocked until user interaction.", error);
  });
};

const playKotSound = () => {
  new Audio('/kot-sound.mp3').play().catch(error => {
    console.log("Audio playback was blocked until user interaction.", error);
  });
};

export const socketService = {
  connect(restaurantId) {
    if (socket && socket.connected) return socket; // Already connected
    if (!restaurantId) {
      console.warn("⚠ socketService.connect called without restaurantId");
      return null;
    }

    currentRestaurantId = restaurantId;
    socket = io('https://dineinn-pro-backend.onrender.com', { autoConnect: true });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      socket.emit('join-restaurant-room', restaurantId);

      // Flush queued emits
      queuedEmits.forEach(({ event, payload }) => {
        socket.emit(event, payload);
      });
      queuedEmits = [];
    });

    socket.on('waiter-call', (data) => {
      if (Number(data.restaurant_id) === Number(restaurantId)) {
        console.log(`📢 Waiter call for restaurant ${restaurantId}`);
        playNotificationSound();
      }
    });

    socket.on('new-order-for-kitchen', (data) => {
      if (Number(data.restaurant_id) === Number(restaurantId)) {
        console.log(`📢 New KOT for restaurant ${restaurantId}`);
        playKotSound();
      }
    });

    socket.on('disconnect', () => {
      console.warn('⚠ Socket disconnected.');
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      queuedEmits = [];
    }
  },

  getSocket(restaurantId) {
    if (!socket) {
      console.log("ℹ Socket not connected — auto-connecting...");
      this.connect(restaurantId || currentRestaurantId);
    }
    return socket;
  },

  emit(event, payload) {
    if (socket && socket.connected) {
      socket.emit(event, payload);
    } else {
      console.log(`⏳ Queuing emit until connected: ${event}`);
      queuedEmits.push({ event, payload });
      if (!socket) {
        this.connect(currentRestaurantId);
      }
    }
  }
};
