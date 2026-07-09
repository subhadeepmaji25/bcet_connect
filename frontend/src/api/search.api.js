import axiosClient from './axiosClient';

/**
 * Perform a user search with various filters.
 * @param {Object} params - Query parameters (q, role, branch, company, passoutYear, etc.)
 */
export const searchUsers = (params) => {
  return axiosClient.get('/search/users', { params });
};

/**
 * Get search suggestions based on keyword.
 * @param {string} q - Keyword
 */
export const searchSuggestions = (q) => {
  return axiosClient.get('/search/suggestions', { params: { q } });
};

/**
 * Get aggregate search statistics.
 */
export const getSearchStats = () => {
  return axiosClient.get('/search/stats');
};

/**
 * Fetch the logged-in user's search profile.
 */
export const getMySearchProfile = () => {
  return axiosClient.get('/search/me');
};

/**
 * Rebuild the logged-in user's search profile.
 */
export const rebuildMySearchProfile = () => {
  return axiosClient.post('/search/rebuild');
};
