import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create comment mention notification event
 *
 * @param userId - User who was mentioned
 * @param mentionedByName - Name of the user who mentioned them
 * @param commentPreview - Preview of the comment
 * @param commentUrl - URL to the comment
 * @returns Job ID of the enqueued notification
 */
export async function createCommentMentionNotification(
  userId: string,
  mentionedByName: string,
  commentPreview: string,
  commentUrl: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'activity.comment_mention',
    priority: 'info',
    title: `${mentionedByName} mentioned you`,
    message: commentPreview,
    metadata: {
      actionUrl: commentUrl,
      actionLabel: 'View Comment',
      mentionedByName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'activity',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `comment-mention-${userId}-${Date.now()}`,
    }
  );
}

/**
 * Create task assigned notification event
 *
 * @param userId - User to whom the task was assigned
 * @param assignedByName - Name of the user who assigned the task
 * @param taskTitle - Title of the task
 * @param taskUrl - URL to the task
 * @returns Job ID of the enqueued notification
 */
export async function createTaskAssignedNotification(
  userId: string,
  assignedByName: string,
  taskTitle: string,
  taskUrl: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'activity.task_assigned',
    priority: 'important',
    title: 'New Task Assigned',
    message: `${assignedByName} assigned you: ${taskTitle}`,
    metadata: {
      actionUrl: taskUrl,
      actionLabel: 'View Task',
      assignedByName,
      taskTitle,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'activity',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `task-assigned-${userId}-${Date.now()}`,
    }
  );
}
