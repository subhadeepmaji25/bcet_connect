// backend/src/modules/feed/services/feedAccess.service.js
const Connection = require("../../connections/models/Connection");
const { CONNECTION_STATUS } = require("../../connections/constants/connection.constants");
const { VISIBILITY } = require("../constants/feed.constants");

const idsEqual = (a, b) => a && b && a.toString() === b.toString();

const areConnected = async (userId, otherUserId) => {
  if (idsEqual(userId, otherUserId)) return true;
  const connection = await Connection.findOne({
    status: CONNECTION_STATUS.ACTIVE,
    $or: [
      { userA: userId, userB: otherUserId },
      { userA: otherUserId, userB: userId }
    ]
  }).select("_id").lean();
  return Boolean(connection);
};

const canViewPost = async (viewerId, post) => {
  if (!post) return false;
  if (idsEqual(viewerId, post.authorId?._id || post.authorId)) return true;
  if (post.visibility === VISIBILITY.PUBLIC) return true;
  if (post.visibility === VISIBILITY.CONNECTIONS_ONLY) {
    return areConnected(viewerId, post.authorId?._id || post.authorId);
  }
  return false;
};

const filterVisiblePosts = async (viewerId, posts = []) => {
  const decisions = await Promise.all(posts.map((post) => canViewPost(viewerId, post)));
  return posts.filter((_, index) => decisions[index]);
};

module.exports = {
  idsEqual,
  areConnected,
  canViewPost,
  filterVisiblePosts
};
