import { Toast } from '@/components/notifications/ToastSystem';

export interface QueuedNotification extends Omit<Toast, 'id' | 'timestamp'> {
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dedupe?: boolean; // Whether to deduplicate similar notifications
  delay?: number; // Delay before showing (in ms)
}

export interface NotificationQueueConfig {
  maxQueueSize: number;
  processingInterval: number;
  dedupeWindow: number; // Time window for deduplication (in ms)
  priorityWeights: Record<string, number>;
}

class NotificationQueueManager {
  private queue: QueuedNotification[] = [];
  private processing = false;
  private processingTimer: NodeJS.Timeout | null = null;
  private recentNotifications: Map<string, number> = new Map();
  private config: NotificationQueueConfig;

  constructor(config?: Partial<NotificationQueueConfig>) {
    this.config = {
      maxQueueSize: 50,
      processingInterval: 1000,
      dedupeWindow: 5000,
      priorityWeights: { low: 1, medium: 2, high: 3 },
      ...config
    };

    this.startProcessing();
    this.setupCleanup();
  }

  /**
   * Add notification to queue
   */
  public enqueue(notification: QueuedNotification): void {
    // Check for deduplication
    if (notification.dedupe && this.isDuplicate(notification)) {
      console.log('Duplicate notification ignored:', notification.title);
      return;
    }

    // Remove oldest notifications if queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      this.queue.shift();
    }

    // Insert notification based on priority
    this.insertByPriority(notification);

    // Track for deduplication
    if (notification.dedupe) {
      const key = this.getDedupeKey(notification);
      this.recentNotifications.set(key, Date.now());
    }

    console.log(`Notification queued: ${notification.title} (Priority: ${notification.priority})`);
  }

  /**
   * Add multiple notifications to queue
   */
  public enqueueBatch(notifications: QueuedNotification[]): void {
    notifications.forEach(notification => this.enqueue(notification));
  }

  /**
   * Remove notifications by category
   */
  public removeByCategory(category: string): void {
    this.queue = this.queue.filter(notification => notification.category !== category);
  }

  /**
   * Clear all notifications
   */
  public clear(): void {
    this.queue = [];
    this.recentNotifications.clear();
  }

  /**
   * Get queue status
   */
  public getStatus(): {
    queueLength: number;
    processing: boolean;
    nextNotification: QueuedNotification | null;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      nextNotification: this.queue[0] || null
    };
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    this.processingTimer = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
  }

  /**
   * Process next notification in queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const notification = this.queue.shift();
      if (!notification) {
        return;
      }

      // Apply delay if specified
      if (notification.delay && notification.delay > 0) {
        await this.delay(notification.delay);
      }

      // Show notification
      this.showNotification(notification);

      console.log(`Notification processed: ${notification.title}`);
    } catch (error) {
      console.error('Error processing notification:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Show notification using toast system
   */
  private showNotification(notification: QueuedNotification): void {
    if (typeof window !== 'undefined') {
      const toastData: Omit<Toast, 'id' | 'timestamp'> = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        duration: notification.duration,
        persistent: notification.persistent,
        actions: notification.actions
      };

      const event = new CustomEvent('toast-add', { detail: toastData });
      window.dispatchEvent(event);
    }
  }

  /**
   * Insert notification by priority
   */
  private insertByPriority(notification: QueuedNotification): void {
    const weight = this.config.priorityWeights[notification.priority] || 1;
    
    // Find insertion point based on priority
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = this.config.priorityWeights[this.queue[i].priority] || 1;
      if (weight > existingWeight) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, notification);
  }

  /**
   * Check if notification is duplicate
   */
  private isDuplicate(notification: QueuedNotification): boolean {
    const key = this.getDedupeKey(notification);
    const lastSeen = this.recentNotifications.get(key);
    
    if (!lastSeen) {
      return false;
    }

    return Date.now() - lastSeen < this.config.dedupeWindow;
  }

  /**
   * Generate deduplication key
   */
  private getDedupeKey(notification: QueuedNotification): string {
    return `${notification.type}:${notification.title}:${notification.category || 'default'}`;
  }

  /**
   * Setup cleanup for old dedupe entries
   */
  private setupCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.config.dedupeWindow;
      
      for (const [key, timestamp] of this.recentNotifications.entries()) {
        if (timestamp < cutoff) {
          this.recentNotifications.delete(key);
        }
      }
    }, this.config.dedupeWindow);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop processing and cleanup
   */
  public destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    this.clear();
  }
}

// Create singleton instance
export const notificationQueue = new NotificationQueueManager();

// Convenience functions
export const queueNotification = (notification: QueuedNotification) => {
  notificationQueue.enqueue(notification);
};

export const queueSuccess = (
  title: string, 
  message: string, 
  options?: Partial<QueuedNotification>
) => {
  notificationQueue.enqueue({
    type: 'success',
    title,
    message,
    priority: 'medium',
    dedupe: true,
    ...options
  });
};

export const queueError = (
  title: string, 
  message: string, 
  options?: Partial<QueuedNotification>
) => {
  notificationQueue.enqueue({
    type: 'error',
    title,
    message,
    priority: 'high',
    duration: 8000,
    dedupe: true,
    ...options
  });
};

export const queueWarning = (
  title: string, 
  message: string, 
  options?: Partial<QueuedNotification>
) => {
  notificationQueue.enqueue({
    type: 'warning',
    title,
    message,
    priority: 'medium',
    duration: 6000,
    dedupe: true,
    ...options
  });
};

export const queueInfo = (
  title: string, 
  message: string, 
  options?: Partial<QueuedNotification>
) => {
  notificationQueue.enqueue({
    type: 'info',
    title,
    message,
    priority: 'low',
    dedupe: true,
    ...options
  });
};

export default NotificationQueueManager;