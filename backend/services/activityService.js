const Activity = require('../models/Activity');

const addActivity = async ({ boardId, taskId = null, actor, action, metadata = {} }) => {
  if (!boardId || !actor || !action) {
    return null;
  }

  const activity = await Activity.create({
    boardId,
    taskId,
    actor,
    action,
    metadata,
  });

  return activity.populate('actor', 'name email avatar');
};

module.exports = { addActivity };
