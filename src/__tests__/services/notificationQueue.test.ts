import NotificationQueueManager, { 
  notificationQueue, 
  queueNotification,
  queueSuccess,
  queueError,
  queueWarning,
  queueInfo
} from '@/services/notificationQueue';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('NotificationQueueManager', () => {
  let manager: NotificationQueueManager;
  let mockDispatchEvent: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    manager = new NotificationQueueManager({
      processingInterval: 100,
      dedupeWindow: 1000
    });
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
    mockDispatchEvent.mockRestore();
  });

  describe('enqueue', () => {
    it('should add notification to queue', () => {
      const notification = {
        type: 'success' as const,
        title: 'Test',
        message: 'Test message',
        priority: 'medium' as const
      };

      manager.enqueue(notification);

      const status = manager.getStatus();
      expect(status.queueLength).toBe(1);
      expect(status.nextNotification).toEqual(notification);
    });

    it('should insert notifications by priority', () => {
      const lowPriority = {
        type: 'info' as const,
        title: 'Low',
        message: 'Low priority',
        priority: 'low' as const
      };

      const highPriority = {
        type: 'error' as const,
        title: 'High',
        message: 'High priority',
        priority: 'high' as const
      };

      manager.enqueue(lowPriority);
      manager.enqueue(highPriority);

      const status = manager.getStatus();
      expect(status.nextNotification?.title).toBe('High');
    });

    it('should respect max queue size', () => {
      const smallManager = new NotificationQueueManager({ maxQueueSize: 2 });

      for (let i = 1; i <= 3; i++) {
        smallManager.enqueue({
          type: 'info',
          title: `Notification ${i}`,
          message: 'Message',
          priority: 'low'
        });
      }

      const status = smallManager.getStatus();
      expect(status.queueLength).toBe(2);

      smallManager.destroy();
    });

    it('should deduplicate notifications when enabled', () => {
      const notification = {
        type: 'info' as const,
        title: 'Duplicate',
        message: 'Duplicate message',
        priority: 'low' as const,
        dedupe: true
      };

      manager.enqueue(notification);
      manager.enqueue(notification); // Should be ignored

      const status = manager.getStatus();
      expect(status.queueLength).toBe(1);
    });

    it('should not deduplicate different notifications', () => {
      manager.enqueue({
        type: 'info',
        title: 'First',
        message: 'First message',
        priority: 'low',
        dedupe: true
      });

      manager.enqueue({
        type: 'info',
        title: 'Second',
        message: 'Second message',
        priority: 'low',
        dedupe: true
      });

      const status = manager.getStatus();
      expect(status.queueLength).toBe(2);
    });
  });

  describe('processing', () => {
    it('should process notifications in order', async () => {
      const notification = {
        type: 'success' as const,
        title: 'Test',
        message: 'Test message',
        priority: 'medium' as const
      };

      manager.enqueue(notification);

      // Advance timers to trigger processing
      vi.advanceTimersByTime(150);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'toast-add',
          detail: expect.objectContaining({
            type: 'success',
            title: 'Test',
            message: 'Test message'
          })
        })
      );
    });

    it('should handle notification delay', () => {
      const notification = {
        type: 'info' as const,
        title: 'Delayed',
        message: 'Delayed message',
        priority: 'low' as const,
        delay: 500
      };

      manager.enqueue(notification);

      // Advance to processing time but not delay time
      vi.advanceTimersByTime(150);
      expect(mockDispatchEvent).not.toHaveBeenCalled();

      // Advance past delay
      vi.advanceTimersByTime(500);
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it('should not process when already processing', () => {
      const notification1 = {
        type: 'info' as const,
        title: 'First',
        message: 'First message',
        priority: 'low' as const,
        delay: 1000 // Long delay to keep processing busy
      };

      const notification2 = {
        type: 'info' as const,
        title: 'Second',
        message: 'Second message',
        priority: 'low' as const
      };

      manager.enqueue(notification1);
      manager.enqueue(notification2);

      // Start processing first notification
      vi.advanceTimersByTime(150);

      // Second processing cycle should not start
      vi.advanceTimersByTime(100);

      // Only one dispatch should have occurred (after delay)
      vi.advanceTimersByTime(1000);
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('queue management', () => {
    it('should remove notifications by category', () => {
      manager.enqueue({
        type: 'info',
        title: 'Category A',
        message: 'Message A',
        priority: 'low',
        category: 'categoryA'
      });

      manager.enqueue({
        type: 'info',
        title: 'Category B',
        message: 'Message B',
        priority: 'low',
        category: 'categoryB'
      });

      manager.removeByCategory('categoryA');

      const status = manager.getStatus();
      expect(status.queueLength).toBe(1);
      expect(status.nextNotification?.title).toBe('Category B');
    });

    it('should clear all notifications', () => {
      manager.enqueue({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
        priority: 'low'
      });

      manager.enqueue({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
        priority: 'low'
      });

      manager.clear();

      const status = manager.getStatus();
      expect(status.queueLength).toBe(0);
      expect(status.nextNotification).toBeNull();
    });

    it('should provide accurate status', () => {
      const notification = {
        type: 'info' as const,
        title: 'Status Test',
        message: 'Status message',
        priority: 'low' as const
      };

      const status1 = manager.getStatus();
      expect(status1.queueLength).toBe(0);
      expect(status1.processing).toBe(false);
      expect(status1.nextNotification).toBeNull();

      manager.enqueue(notification);

      const status2 = manager.getStatus();
      expect(status2.queueLength).toBe(1);
      expect(status2.nextNotification).toEqual(notification);
    });
  });

  describe('deduplication', () => {
    it('should allow duplicate after dedupe window expires', () => {
      const notification = {
        type: 'info' as const,
        title: 'Duplicate Test',
        message: 'Duplicate message',
        priority: 'low' as const,
        dedupe: true
      };

      manager.enqueue(notification);
      
      // Advance past dedupe window
      vi.advanceTimersByTime(1500);
      
      manager.enqueue(notification); // Should not be ignored now

      const status = manager.getStatus();
      expect(status.queueLength).toBe(2);
    });

    it('should clean up old dedupe entries', () => {
      const notification = {
        type: 'info' as const,
        title: 'Cleanup Test',
        message: 'Cleanup message',
        priority: 'low' as const,
        dedupe: true
      };

      manager.enqueue(notification);

      // Advance past cleanup interval
      vi.advanceTimersByTime(2000);

      // This should trigger cleanup and allow the duplicate
      manager.enqueue(notification);

      const status = manager.getStatus();
      expect(status.queueLength).toBe(2);
    });
  });
});

describe('convenience functions', () => {
  let mockEnqueue: any;

  beforeEach(() => {
    mockEnqueue = vi.spyOn(notificationQueue, 'enqueue').mockImplementation();
  });

  afterEach(() => {
    mockEnqueue.mockRestore();
  });

  it('should call queueNotification', () => {
    const notification = {
      type: 'success' as const,
      title: 'Test',
      message: 'Test message',
      priority: 'medium' as const
    };

    queueNotification(notification);

    expect(mockEnqueue).toHaveBeenCalledWith(notification);
  });

  it('should call queueSuccess with correct defaults', () => {
    queueSuccess('Success Title', 'Success message');

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'success',
      title: 'Success Title',
      message: 'Success message',
      priority: 'medium',
      dedupe: true
    });
  });

  it('should call queueError with correct defaults', () => {
    queueError('Error Title', 'Error message');

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error Title',
      message: 'Error message',
      priority: 'high',
      duration: 8000,
      dedupe: true
    });
  });

  it('should call queueWarning with correct defaults', () => {
    queueWarning('Warning Title', 'Warning message');

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'warning',
      title: 'Warning Title',
      message: 'Warning message',
      priority: 'medium',
      duration: 6000,
      dedupe: true
    });
  });

  it('should call queueInfo with correct defaults', () => {
    queueInfo('Info Title', 'Info message');

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'info',
      title: 'Info Title',
      message: 'Info message',
      priority: 'low',
      dedupe: true
    });
  });

  it('should allow overriding defaults', () => {
    queueSuccess('Title', 'Message', {
      priority: 'high',
      duration: 10000,
      persistent: true,
      dedupe: false
    });

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'success',
      title: 'Title',
      message: 'Message',
      priority: 'high',
      duration: 10000,
      persistent: true,
      dedupe: false
    });
  });
});